// MC-6: Streams and file descriptor table.
// Models stdin/stdout/stderr and file I/O via file descriptors.
// POSIX: open, close, read, write, lseek.

import { VirtualFileSystem, VfsError } from "../vfs/vfs.js";

export type SeekWhence = "set" | "cur" | "end";

export interface Stream {
  read(count: number): Uint8Array;
  write(data: Uint8Array): number;
  seek(offset: number, whence: SeekWhence): number;
  /** Return the current byte offset — POSIX IEEE Std 1003.1-2017 §lseek returns this
   *  when whence=SEEK_CUR and offset=0. */
  tell(): number;
  close(): void;
  isReadable: boolean;
  isWritable: boolean;
  /** Optional VFS path for file-backed streams. `undefined` for pipes, stdio, anon streams. */
  readonly path?: string;
}

/** An in-memory buffer stream (used for stdin). */
export class BufferStream implements Stream {
  private buffer: Uint8Array;
  private pos = 0;
  isReadable = true;
  isWritable = false;

  constructor(data: Uint8Array = new Uint8Array(0)) {
    this.buffer = data;
  }

  read(count: number): Uint8Array {
    const available = Math.min(count, this.buffer.length - this.pos);
    if (available <= 0) return new Uint8Array(0);
    const result = this.buffer.slice(this.pos, this.pos + available);
    this.pos += available;
    return result;
  }

  write(_data: Uint8Array): number { return 0; }

  seek(offset: number, whence: SeekWhence): number {
    if (whence === "set") this.pos = offset;
    else if (whence === "cur") this.pos += offset;
    else this.pos = this.buffer.length + offset;
    this.pos = Math.max(0, Math.min(this.pos, this.buffer.length));
    return this.pos;
  }

  tell(): number { return this.pos; }

  close(): void {}

  /** Feed new data into the buffer (for test injection). */
  feed(data: string | Uint8Array): void {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const newBuf = new Uint8Array(this.buffer.length + bytes.length);
    newBuf.set(this.buffer);
    newBuf.set(bytes, this.buffer.length);
    this.buffer = newBuf;
  }
}

/** A capture stream that records all writes (used for stdout/stderr). */
export class CaptureStream implements Stream {
  private chunks: Uint8Array[] = [];
  isReadable = false;
  isWritable = true;

  read(_count: number): Uint8Array { return new Uint8Array(0); }

  write(data: Uint8Array): number {
    this.chunks.push(data.slice());
    return data.length;
  }

  seek(_offset: number, _whence: SeekWhence): number { return 0; }
  tell(): number { return 0; }
  close(): void {}

  /** Get all captured output as a string. */
  getOutput(): string {
    const total = this.chunks.reduce((s, c) => s + c.length, 0);
    const buf = new Uint8Array(total);
    let off = 0;
    for (const chunk of this.chunks) {
      buf.set(chunk, off);
      off += chunk.length;
    }
    return new TextDecoder().decode(buf);
  }

  /** Get captured output as lines. */
  getLines(): string[] {
    return this.getOutput().split("\n").filter(l => l.length > 0);
  }

  /** Clear captured output. */
  clear(): void {
    this.chunks = [];
  }
}

/** A stream backed by a VFS file. */
export class FileStream implements Stream {
  private pos = 0;
  isReadable: boolean;
  isWritable: boolean;
  readonly path: string;

  constructor(
    private vfs: VirtualFileSystem,
    path: string,
    private mode: "r" | "w" | "a" | "rw"
  ) {
    this.path = path;
    this.isReadable = mode === "r" || mode === "rw";
    this.isWritable = mode === "w" || mode === "a" || mode === "rw";

    if (mode === "w") {
      // Truncate or create — POSIX §open O_WRONLY|O_CREAT|O_TRUNC.
      vfs.writeFile(path, new Uint8Array(0));
    } else if (mode === "a") {
      // Create if doesn't exist; seek to end — POSIX §open O_APPEND|O_CREAT.
      if (!vfs.exists(path)) vfs.writeFile(path, new Uint8Array(0));
      this.pos = vfs.stat(path).size;
    } else if (mode === "r") {
      // POSIX §open: O_RDONLY on a non-existent path fails with ENOENT.
      if (!vfs.exists(path)) {
        throw new VfsError("ENOENT", "no such file or directory", path);
      }
    }
  }

  read(count: number): Uint8Array {
    if (!this.isReadable) return new Uint8Array(0);
    const data = this.vfs.readFile(this.path);
    const available = Math.min(count, data.length - this.pos);
    if (available <= 0) return new Uint8Array(0);
    const result = data.slice(this.pos, this.pos + available);
    this.pos += available;
    return result;
  }

  write(data: Uint8Array): number {
    if (!this.isWritable) return 0;
    const existing = this.vfs.exists(this.path) ? this.vfs.readFile(this.path) : new Uint8Array(0);
    const needed = this.pos + data.length;
    const newData = new Uint8Array(Math.max(existing.length, needed));
    newData.set(existing);
    newData.set(data, this.pos);
    this.vfs.writeFile(this.path, newData);
    this.pos += data.length;
    return data.length;
  }

  seek(offset: number, whence: SeekWhence): number {
    const size = this.vfs.stat(this.path).size;
    if (whence === "set") this.pos = offset;
    else if (whence === "cur") this.pos += offset;
    else this.pos = size + offset;
    this.pos = Math.max(0, this.pos);
    return this.pos;
  }

  tell(): number { return this.pos; }

  close(): void {}
}

/** A pipe stream — POSIX IEEE Std 1003.1-2017 §pipe.
 *  Two ends share a byte buffer; reads from the read-end drain bytes written
 *  at the write-end. In-memory only (no blocking). Reads past EOF return empty. */
export class PipeEnd implements Stream {
  isReadable: boolean;
  isWritable: boolean;
  constructor(
    private buffer: { data: Uint8Array; closed: boolean },
    private kind: "read" | "write",
  ) {
    this.isReadable = kind === "read";
    this.isWritable = kind === "write";
  }
  read(count: number): Uint8Array {
    if (!this.isReadable) return new Uint8Array(0);
    const avail = Math.min(count, this.buffer.data.length);
    if (avail <= 0) return new Uint8Array(0);
    const out = this.buffer.data.slice(0, avail);
    this.buffer.data = this.buffer.data.slice(avail);
    return out;
  }
  write(data: Uint8Array): number {
    if (!this.isWritable) return 0;
    const merged = new Uint8Array(this.buffer.data.length + data.length);
    merged.set(this.buffer.data);
    merged.set(data, this.buffer.data.length);
    this.buffer.data = merged;
    return data.length;
  }
  /** Pipes are not seekable — POSIX IEEE Std 1003.1-2017 §lseek returns ESPIPE. */
  seek(_offset: number, _whence: SeekWhence): number { return -1; }
  tell(): number { return -1; }
  close(): void { this.buffer.closed = true; }
  /** Number of bytes currently queued in the pipe buffer. */
  get available(): number { return this.buffer.data.length; }
}

/** Create a pipe pair: [readEnd, writeEnd]. POSIX IEEE Std 1003.1-2017 §pipe. */
export function makePipe(): [PipeEnd, PipeEnd] {
  const buf = { data: new Uint8Array(0), closed: false };
  return [new PipeEnd(buf, "read"), new PipeEnd(buf, "write")];
}

/** Per-fd flags table. POSIX IEEE Std 1003.1-2017 §fcntl F_GETFD/F_SETFD. */
interface FdFlags {
  /** FD_CLOEXEC — close-on-exec flag (§fcntl). */
  cloexec: boolean;
  /** File status flags (§fcntl F_GETFL/F_SETFL) — O_APPEND, O_NONBLOCK, etc. */
  statusFlags: number;
}

/** fcntl cmd constants. POSIX IEEE Std 1003.1-2017 §<fcntl.h>. */
export const F_DUPFD   = 0;
export const F_GETFD   = 1;
export const F_SETFD   = 2;
export const F_GETFL   = 3;
export const F_SETFL   = 4;
export const F_DUPFD_CLOEXEC = 1030;
export const FD_CLOEXEC = 1;

/** File descriptor table. FDs 0-2 are stdin/stdout/stderr. */
export class FileDescriptorTable {
  private fds = new Map<number, Stream>();
  private flags = new Map<number, FdFlags>();
  private nextFd = 3;

  readonly stdin: BufferStream;
  readonly stdout: CaptureStream;
  readonly stderr: CaptureStream;

  constructor() {
    this.stdin = new BufferStream();
    this.stdout = new CaptureStream();
    this.stderr = new CaptureStream();
    this.fds.set(0, this.stdin);
    this.fds.set(1, this.stdout);
    this.fds.set(2, this.stderr);
    for (let fd = 0; fd <= 2; fd++) this.flags.set(fd, { cloexec: false, statusFlags: 0 });
  }

  /** Open a new file descriptor. Returns the fd number. */
  open(stream: Stream): number {
    const fd = this.nextFd++;
    this.fds.set(fd, stream);
    this.flags.set(fd, { cloexec: false, statusFlags: 0 });
    return fd;
  }

  /** Open at a specific fd number (for dup2). */
  openAt(fd: number, stream: Stream): number {
    this.fds.set(fd, stream);
    this.flags.set(fd, { cloexec: false, statusFlags: 0 });
    if (fd >= this.nextFd) this.nextFd = fd + 1;
    return fd;
  }

  /** Allocate the next free fd >= `minFd` (POSIX IEEE Std 1003.1-2017 §dup semantics). */
  openAtMin(minFd: number, stream: Stream): number {
    let fd = Math.max(minFd, 0);
    while (this.fds.has(fd)) fd++;
    this.fds.set(fd, stream);
    this.flags.set(fd, { cloexec: false, statusFlags: 0 });
    if (fd >= this.nextFd) this.nextFd = fd + 1;
    return fd;
  }

  /** Get the stream for a file descriptor. */
  get(fd: number): Stream | undefined {
    return this.fds.get(fd);
  }

  /** Resolve the VFS path behind an fd (null if the fd isn't file-backed). */
  pathOf(fd: number): string | null {
    const s = this.fds.get(fd);
    if (!s) return null;
    return s.path ?? null;
  }

  /** Return every currently-open fd number. */
  fds_list(): number[] {
    return Array.from(this.fds.keys()).sort((a, b) => a - b);
  }

  /** Check whether an fd is valid. */
  has(fd: number): boolean {
    return this.fds.has(fd);
  }

  /** POSIX fcntl() — IEEE Std 1003.1-2017 §fcntl. Returns -1 on invalid fd. */
  fcntl(fd: number, cmd: number, arg: number = 0): number {
    const f = this.flags.get(fd);
    if (!f) return -1;
    switch (cmd) {
      case F_GETFD: return f.cloexec ? FD_CLOEXEC : 0;
      case F_SETFD: f.cloexec = (arg & FD_CLOEXEC) !== 0; return 0;
      case F_GETFL: return f.statusFlags;
      case F_SETFL: f.statusFlags = arg; return 0;
      case F_DUPFD: {
        const s = this.fds.get(fd);
        if (!s) return -1;
        return this.openAtMin(arg, s);
      }
      case F_DUPFD_CLOEXEC: {
        const s = this.fds.get(fd);
        if (!s) return -1;
        const newFd = this.openAtMin(arg, s);
        const nf = this.flags.get(newFd);
        if (nf) nf.cloexec = true;
        return newFd;
      }
      default: return -1;
    }
  }

  /** Close a file descriptor. */
  close(fd: number): boolean {
    const stream = this.fds.get(fd);
    if (!stream) return false;
    stream.close();
    this.fds.delete(fd);
    this.flags.delete(fd);
    return true;
  }

  /** Write string to stdout. Convenience for printf-like output. */
  writeStdout(text: string): void {
    this.stdout.write(new TextEncoder().encode(text));
  }

  /** Write string to stderr. */
  writeStderr(text: string): void {
    this.stderr.write(new TextEncoder().encode(text));
  }
}
