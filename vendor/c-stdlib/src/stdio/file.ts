// FC-8 / G.1: C stdio file I/O functions.
// C17 §7.21: Input/output — file operations.
//
// Two storage backends are supported:
//   - Node.js fs (default) for real-filesystem paths.
//   - An in-process virtual-file-system overlay (see `mountVfs` below) for
//     paths that match a registered mount prefix. The overlay is used by the
//     test suite and by embedders that don't want to pollute the real FS.
//
// Spec references (ISO/IEC 9899:2018, §7.21):
//   §7.21.1       FILE, EOF, BUFSIZ, FILENAME_MAX, etc.
//   §7.21.4.1     remove
//   §7.21.4.2     rename
//   §7.21.4.3     tmpfile
//   §7.21.4.4     tmpnam
//   §7.21.5.1-.6  fclose, fflush, fopen, freopen, setvbuf, setbuf
//   §7.21.6       printf family (formatted I/O)
//   §7.21.7       fgetc, fputc, fgets, fputs, getc, putc, getchar, putchar,
//                 puts, ungetc
//   §7.21.8       fread, fwrite
//   §7.21.9       fgetpos, fseek, fsetpos, ftell, rewind
//   §7.21.10      clearerr, feof, ferror, perror

import { formatPrintf } from "./printf.js";
import type { CPtr } from "../string/string.js";
import { c_strerror } from "../string/string.js";
import { set_errno, get_errno, ENOENT, EACCES, EBADF, EINVAL, EISDIR } from "../stdlib/stdlib.js";

// ---------------------------------------------------------------------------
// FILE type (C17 §7.21.1)
// ---------------------------------------------------------------------------

/** C17 §7.21.1: FILE stream — object type capable of recording all information
 *  needed to control a stream (position, EOF/error state, buffer state). */
export interface CFile {
  /** Node.js file descriptor, -1 for VFS-backed or memory streams. */
  fd: number;
  /** Backing path (used as the VFS key or the real FS path). */
  path: string;
  /** Current read/write position (§7.21.9.4 ftell return value). */
  pos: number;
  /** Mode string ("r", "w", "a", "rb", "r+", "w+", ...) per §7.21.5.3. */
  mode: string;
  /** End-of-file indicator (§7.21.10.2). */
  eof: boolean;
  /** Error indicator (§7.21.10.3). */
  error: boolean;
  /** Whether the stream is open. */
  open: boolean;
  /** Pushback buffer for ungetc (§7.21.7.10). */
  ungetBuf: number[];
  /** Buffering mode (_IOFBF, _IOLBF, _IONBF) per §7.21.5.5. */
  bufMode: number;
  /** Buffer size (informational on this runtime). */
  bufSize: number;
  /** Which backend owns this stream. */
  backend: "node" | "vfs" | "tty" | "mem";
  /** VFS overlay reference (if backend === "vfs"). */
  vfs?: FileVfs;
  /** Memory-stream state (if backend === "mem"). */
  mem?: MemStream;
  /** Whether this mode permits reading. */
  canRead: boolean;
  /** Whether this mode permits writing. */
  canWrite: boolean;
  /** Whether the mode opens in append-only mode (writes forced to end). */
  append: boolean;
}

// ---------------------------------------------------------------------------
// VFS overlay (L.1 — backing-store abstraction)
// ---------------------------------------------------------------------------

/** Minimal VFS interface compatible with Mirage's `VirtualFileSystem`.
 *  A registered overlay traps all stdio path operations whose path begins
 *  with the mount prefix. See `mountVfs`. */
export interface FileVfs {
  exists(path: string): boolean;
  readFile(path: string): Uint8Array;
  writeFile(path: string, data: Uint8Array): void;
  unlink(path: string): void;
  rename(oldPath: string, newPath: string): void;
}

interface Mount {
  prefix: string;
  vfs: FileVfs;
}

const _mounts: Mount[] = [];

/** Register a VFS overlay for all paths beginning with `prefix`. The most
 *  recently mounted prefix wins on overlap. Returns a handle to unmount.
 *
 *  The overlay is consulted by fopen/remove/rename before the Node fs fallback,
 *  allowing hermetic stdio tests without polluting the real filesystem. */
export function mountVfs(prefix: string, vfs: FileVfs): () => void {
  _mounts.unshift({ prefix, vfs });
  return () => {
    const i = _mounts.findIndex(m => m.prefix === prefix && m.vfs === vfs);
    if (i >= 0) _mounts.splice(i, 1);
  };
}

function findMount(path: string): Mount | null {
  for (const m of _mounts) if (path.startsWith(m.prefix)) return m;
  return null;
}

// Standard streams — always buffered line mode for tty, full-buffer for others.
let _stdout_buf = "";
let _stderr_buf = "";

/** C17 §7.21.1: stdout — standard output stream. */
export const c_stdout: CFile = mkTtyStream(1, "<stdout>", "w", false, true);

/** C17 §7.21.1: stderr — standard error stream (unbuffered by §7.21.3.7). */
export const c_stderr: CFile = mkTtyStream(2, "<stderr>", "w", false, true);

/** C17 §7.21.1: stdin — standard input stream. */
export const c_stdin: CFile = mkTtyStream(0, "<stdin>", "r", true, false);

function mkTtyStream(fd: number, path: string, mode: string, canRead: boolean, canWrite: boolean): CFile {
  // Use literal values here to avoid a temporal dead zone reference to _IOFBF
  // constants, which are declared later in this file.
  return {
    fd, path, pos: 0, mode,
    eof: false, error: false, open: true,
    ungetBuf: [], bufMode: fd === 2 ? 2 /* _IONBF */ : 1 /* _IOLBF */, bufSize: 4096,
    backend: "tty", canRead, canWrite, append: false,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import * as _fs from "node:fs";
function getFs(): typeof _fs {
  return _fs;
}

function cptrToString(ptr: CPtr | null): string {
  if (!ptr) return "";
  let end = ptr.off;
  while (end < ptr.buf.length && ptr.buf[end] !== 0) end++;
  return new TextDecoder().decode(ptr.buf.subarray(ptr.off, end));
}

function stringToCptr(dst: CPtr, str: string, maxLen?: number): void {
  const bytes = new TextEncoder().encode(str);
  const len = maxLen !== undefined ? Math.min(bytes.length, maxLen - 1) : bytes.length;
  for (let i = 0; i < len; i++) dst.buf[dst.off + i] = bytes[i]!;
  dst.buf[dst.off + len] = 0;
}

/** Parse a C mode string (§7.21.5.3) into normalized flags. */
function parseMode(mode: string): { read: boolean; write: boolean; append: boolean; truncate: boolean; binary: boolean; update: boolean } {
  const binary = mode.includes("b");
  const update = mode.includes("+");
  const base = mode.replace(/[b+x]/g, "");
  // §7.21.5.3 modes:
  //  "r"  — open for reading. File must exist.
  //  "w"  — open/create for writing, truncate.
  //  "a"  — open/create for writing, append.
  //  "r+" — reading and writing. File must exist.
  //  "w+" — reading and writing, truncate/create.
  //  "a+" — reading and writing (appending).
  switch (base) {
    case "r": return { read: true,  write: update, append: false, truncate: false,  binary, update };
    case "w": return { read: update, write: true,  append: false, truncate: true,  binary, update };
    case "a": return { read: update, write: true,  append: true,  truncate: false, binary, update };
    default:  return { read: true,  write: false, append: false, truncate: false, binary, update };
  }
}

// ---------------------------------------------------------------------------
// File open/close (C17 §7.21.5)
// ---------------------------------------------------------------------------

/** C17 §7.21.5.3: fopen — open the file whose name is the string pointed to by
 *  `filename`, and associates a stream with it. On failure returns NULL and
 *  sets errno (§7.5). */
export function c_fopen(filename: string | CPtr, mode: string | CPtr): CFile | null {
  const path = typeof filename === "string" ? filename : cptrToString(filename as CPtr);
  const modeStr = typeof mode === "string" ? mode : cptrToString(mode as CPtr);
  const m = parseMode(modeStr);

  // Try VFS overlay first.
  const mount = findMount(path);
  if (mount) {
    const exists = mount.vfs.exists(path);
    if (!exists && !m.write) { set_errno(ENOENT); return null; }
    // "r" requires existence; "w" truncates; "a" creates if missing.
    if (!exists) {
      try { mount.vfs.writeFile(path, new Uint8Array(0)); }
      catch { set_errno(EACCES); return null; }
    } else if (m.truncate) {
      try { mount.vfs.writeFile(path, new Uint8Array(0)); }
      catch { set_errno(EACCES); return null; }
    }
    let pos = 0;
    if (m.append && exists) {
      try { pos = mount.vfs.readFile(path).length; } catch { pos = 0; }
    }
    return {
      fd: -1, path, pos, mode: modeStr,
      eof: false, error: false, open: true,
      ungetBuf: [], bufMode: _IOFBF, bufSize: 4096,
      backend: "vfs", vfs: mount.vfs,
      canRead: m.read, canWrite: m.write, append: m.append,
    };
  }

  // Real filesystem (Node fs).
  try {
    const flag = resolveMode(modeStr);
    const fd = getFs().openSync(path, flag);
    let pos = 0;
    if (m.append) {
      try { pos = getFs().fstatSync(fd).size; } catch { /* ignore */ }
    }
    return {
      fd, path, pos, mode: modeStr,
      eof: false, error: false, open: true,
      ungetBuf: [], bufMode: _IOFBF, bufSize: 4096,
      backend: "node",
      canRead: m.read, canWrite: m.write, append: m.append,
    };
  } catch (e: any) {
    // Map Node fs errors to C errno values.
    const code = e?.code;
    if (code === "ENOENT") set_errno(ENOENT);
    else if (code === "EACCES" || code === "EPERM") set_errno(EACCES);
    else if (code === "EISDIR") set_errno(EISDIR);
    else set_errno(EINVAL);
    return null;
  }
}

function resolveMode(mode: string): string {
  // §7.21.5.3: "b" flag disables CRLF translation; no-op in this runtime.
  const m = mode.replace(/b/g, "");
  switch (m) {
    case "r":  return "r";
    case "w":  return "w";
    case "a":  return "a";
    case "r+": return "r+";
    case "w+": return "w+";
    case "a+": return "a+";
    default:   return "r";
  }
}

/** C17 §7.21.5.4: freopen — close the stream, then open the named file
 *  associated with the given stream. Returns `stream` on success, NULL on
 *  failure. */
export function c_freopen(filename: string | CPtr, mode: string | CPtr, stream: CFile): CFile | null {
  c_fclose(stream);
  const result = c_fopen(filename, mode);
  if (result) {
    Object.assign(stream, result);
    return stream;
  }
  return null;
}

/** C17 §7.21.5.1: fclose — close the stream, flushing any buffered output.
 *  Returns 0 on success, EOF (-1) on failure. */
export function c_fclose(stream: CFile): number {
  if (!stream || !stream.open) return -1;
  try {
    c_fflush(stream);
    if (stream.backend === "node" && stream.fd > 2) {
      getFs().closeSync(stream.fd);
    }
    stream.open = false;
    return 0;
  } catch {
    stream.error = true;
    return -1;
  }
}

/** C17 §7.21.5.2: fflush — if `stream` points to an output stream, causes any
 *  unwritten buffered data to be delivered. If `stream` is a null pointer,
 *  fflush performs this for all streams. Returns 0 on success, EOF on failure. */
export function c_fflush(stream: CFile | null): number {
  if (!stream) {
    // Flush all standard streams.
    if (_stdout_buf) { process.stdout.write(_stdout_buf); _stdout_buf = ""; }
    if (_stderr_buf) { process.stderr.write(_stderr_buf); _stderr_buf = ""; }
    return 0;
  }
  if (stream.fd === 1) {
    if (_stdout_buf) { process.stdout.write(_stdout_buf); _stdout_buf = ""; }
    return 0;
  }
  if (stream.fd === 2) {
    if (_stderr_buf) { process.stderr.write(_stderr_buf); _stderr_buf = ""; }
    return 0;
  }
  try {
    if (stream.backend === "node" && stream.fd > 2) getFs().fsyncSync(stream.fd);
    return 0;
  } catch { stream.error = true; return -1; }
}

// ---------------------------------------------------------------------------
// Block I/O (C17 §7.21.8)
// ---------------------------------------------------------------------------

/** Read up to `n` bytes starting at `pos` from a VFS-backed file. */
function vfsReadAt(stream: CFile, pos: number, n: number): Uint8Array {
  try {
    const all = stream.vfs!.readFile(stream.path);
    const end = Math.min(pos + n, all.length);
    if (pos >= all.length) return new Uint8Array(0);
    return all.slice(pos, end);
  } catch { stream.error = true; return new Uint8Array(0); }
}

/** Write `data` at `pos` into a VFS-backed file (expanding if needed). */
function vfsWriteAt(stream: CFile, pos: number, data: Uint8Array): number {
  try {
    let current: Uint8Array;
    try { current = stream.vfs!.readFile(stream.path); } catch { current = new Uint8Array(0); }
    const end = pos + data.length;
    const out = new Uint8Array(Math.max(current.length, end));
    out.set(current);
    out.set(data, pos);
    stream.vfs!.writeFile(stream.path, out);
    return data.length;
  } catch { stream.error = true; return 0; }
}

/** C17 §7.21.8.1: fread — read up to `count` elements of size `size` from the
 *  stream into the array pointed to by `ptr`. Returns the number of elements
 *  successfully read. If a read error occurs, the error indicator is set; if
 *  end-of-file is encountered, the EOF indicator is set. */
export function c_fread(ptr: CPtr | any, size: number, count: number, stream: CFile): number {
  if (!stream || !stream.open || !stream.canRead) { if (stream) stream.error = true; return 0; }
  if (size <= 0 || count <= 0) return 0;
  const total = size * count;
  let writeIdx = 0;
  const dst = (b: number) => {
    if (ptr?.buf && typeof ptr.off === "number") ptr.buf[ptr.off + writeIdx] = b;
    else if (ptr instanceof Uint8Array) ptr[writeIdx] = b;
    else if (Buffer.isBuffer(ptr)) ptr[writeIdx] = b;
    else if (Array.isArray(ptr)) ptr[writeIdx] = b;
    writeIdx++;
  };

  // Drain ungetBuf first (§7.21.7.10: ungetc pushes to the logical input stream).
  while (stream.ungetBuf.length > 0 && writeIdx < total) {
    dst(stream.ungetBuf.pop()!);
  }

  const remaining = total - writeIdx;
  if (remaining <= 0) return Math.floor(writeIdx / size);

  if (stream.backend === "vfs") {
    const bytes = vfsReadAt(stream, stream.pos, remaining);
    for (let i = 0; i < bytes.length; i++) dst(bytes[i]!);
    stream.pos += bytes.length;
    if (bytes.length < remaining) stream.eof = true;
    return Math.floor(writeIdx / size);
  }

  if (stream.backend === "mem") {
    const mem = stream.mem!;
    // POSIX fmemopen: reads past end return a short count and set EOF.
    const available = Math.max(0, mem.dataLen - stream.pos);
    const toRead = Math.min(remaining, available);
    for (let i = 0; i < toRead; i++) dst(mem.buf[stream.pos + i]!);
    stream.pos += toRead;
    if (toRead < remaining) stream.eof = true;
    return Math.floor(writeIdx / size);
  }

  if (stream.backend === "tty") {
    // stdin on Node is not synchronously readable in a portable way; treat as EOF.
    stream.eof = true;
    return Math.floor(writeIdx / size);
  }

  try {
    const buf = Buffer.alloc(remaining);
    const n = getFs().readSync(stream.fd, buf, 0, remaining, stream.pos);
    for (let i = 0; i < n; i++) dst(buf[i]!);
    stream.pos += n;
    if (n < remaining) stream.eof = true;
    return Math.floor(writeIdx / size);
  } catch { stream.error = true; return Math.floor(writeIdx / size); }
}

/** C17 §7.21.8.2: fwrite — write up to `count` elements of size `size` from
 *  the array pointed to by `ptr` to the stream. Returns the number of elements
 *  successfully written (0..count). On write error, sets the error indicator. */
export function c_fwrite(ptr: CPtr | any, size: number, count: number, stream: CFile): number {
  if (!stream || !stream.open || !stream.canWrite) { if (stream) stream.error = true; return 0; }
  if (size <= 0 || count <= 0) return 0;
  const total = size * count;

  // Materialize `data` without trusting ptr.buf.byteLength for size.
  const data = new Uint8Array(total);
  if (ptr?.buf) {
    for (let i = 0; i < total; i++) data[i] = ptr.buf[ptr.off + i]! & 0xFF;
  } else if (typeof ptr === "string") {
    const enc = new TextEncoder().encode(ptr);
    data.set(enc.subarray(0, Math.min(total, enc.length)));
  } else if (ptr instanceof Uint8Array) {
    data.set(ptr.subarray(0, Math.min(total, ptr.length)));
  } else if (Buffer.isBuffer(ptr)) {
    data.set(ptr.subarray(0, Math.min(total, ptr.length)));
  } else if (Array.isArray(ptr)) {
    for (let i = 0; i < total; i++) data[i] = (ptr[i] ?? 0) & 0xFF;
  }

  if (stream.backend === "tty") {
    const sink = stream.fd === 2 ? process.stderr : process.stdout;
    try { sink.write(Buffer.from(data)); return count; }
    catch { stream.error = true; return 0; }
  }

  if (stream.backend === "vfs") {
    const pos = stream.append ? (() => { try { return stream.vfs!.readFile(stream.path).length; } catch { return 0; } })() : stream.pos;
    const n = vfsWriteAt(stream, pos, data);
    stream.pos = pos + n;
    return Math.floor(n / size);
  }

  if (stream.backend === "mem") {
    const mem = stream.mem!;
    const writePos = stream.append ? mem.dataLen : stream.pos;
    let written = 0;
    if (mem.growable) {
      // open_memstream: buffer grows; update user-visible *buf / *size pointers.
      if (writePos + data.length > mem.buf.length) {
        const cap = Math.max(mem.buf.length * 2, writePos + data.length + 1);
        const next = new Uint8Array(cap);
        next.set(mem.buf.subarray(0, mem.dataLen));
        mem.buf = next;
      }
      mem.buf.set(data, writePos);
      written = data.length;
      if (writePos + written > mem.dataLen) mem.dataLen = writePos + written;
      // open_memstream keeps a trailing null after the current data length.
      if (mem.dataLen < mem.buf.length) mem.buf[mem.dataLen] = 0;
      // Sync user-visible pointers (POSIX: updated on fflush/fclose; we update
      // eagerly so callers observe current contents without an explicit flush).
      if (mem.bufRef) mem.bufRef.value = { buf: mem.buf, off: 0 };
      if (mem.sizeRef) mem.sizeRef.value = mem.dataLen;
    } else {
      // fmemopen: fixed-size buffer. Short write at buffer boundary.
      const cap = mem.buf.length;
      const room = Math.max(0, cap - writePos);
      const toWrite = Math.min(data.length, room);
      for (let i = 0; i < toWrite; i++) mem.buf[writePos + i] = data[i]!;
      written = toWrite;
      if (writePos + written > mem.dataLen) mem.dataLen = writePos + written;
      // §POSIX fmemopen: if mode includes w/a, a null byte is written at the
      // current position when there is room.
      if (mem.nullTerminated && mem.dataLen < cap) mem.buf[mem.dataLen] = 0;
    }
    stream.pos = writePos + written;
    return Math.floor(written / size);
  }

  try {
    const buf = Buffer.from(data);
    const n = getFs().writeSync(stream.fd, buf, 0, total, stream.pos);
    stream.pos += n;
    return Math.floor(n / size);
  } catch { stream.error = true; return 0; }
}

// ---------------------------------------------------------------------------
// Character/string I/O (C17 §7.21.7)
// ---------------------------------------------------------------------------

/** C17 §7.21.7.1: fgetc — read the next character as an unsigned char
 *  converted to int. Returns EOF (-1) on end-of-file or error. */
export function c_fgetc(stream: CFile): number {
  if (!stream || !stream.open || !stream.canRead) { if (stream) stream.error = true; return -1; }
  if (stream.ungetBuf.length > 0) return stream.ungetBuf.pop()!;
  const one = new Uint8Array(1);
  const n = c_fread(one, 1, 1, stream);
  if (n === 0) return -1;
  return one[0]!;
}

/** C17 §7.21.7.3: fputc — write the character `c` (converted to unsigned char)
 *  to the stream. Returns the character written, or EOF on error. */
export function c_fputc(c: number, stream: CFile): number {
  if (!stream || !stream.open || !stream.canWrite) { if (stream) stream.error = true; return -1; }
  const byte = c & 0xFF;
  const one = new Uint8Array([byte]);
  const n = c_fwrite(one, 1, 1, stream);
  if (n !== 1) return -1;
  return byte;
}

/** C17 §7.21.7.5: getc — equivalent to fgetc (may be a macro). */
export const c_getc = c_fgetc;

/** C17 §7.21.7.7: putc — equivalent to fputc (may be a macro). */
export const c_putc = c_fputc;

/** C17 §7.21.7.10: ungetc — push `c` back onto the input stream. At least one
 *  character of pushback is guaranteed. Returns `c` on success, EOF if `c` is
 *  EOF or the pushback cannot occur. Clears the EOF flag. */
export function c_ungetc(c: number, stream: CFile): number {
  if (!stream || c === -1) return -1;
  stream.ungetBuf.push(c & 0xFF);
  stream.eof = false;
  // §7.21.7.10: file position indicator for a binary stream is decremented;
  // for a text stream the value is unspecified until all pushed chars are read.
  if (stream.pos > 0) stream.pos--;
  return c & 0xFF;
}

/** C17 §7.21.7.2: fgets — read at most n-1 characters into `s`, stopping at
 *  newline (inclusive) or EOF. Null-terminates. Returns `s` on success, NULL
 *  if no characters read (EOF with empty buffer) or on error. */
export function c_fgets(s: CPtr, n: number, stream: CFile): CPtr | null {
  if (!stream || !stream.open || n <= 0) return null;
  let i = 0;
  while (i < n - 1) {
    const ch = c_fgetc(stream);
    if (ch === -1) {
      if (i === 0) return null; // EOF/error with no data read.
      break;
    }
    s.buf[s.off + i] = ch;
    i++;
    if (ch === 0x0A) break; // newline included per spec.
  }
  s.buf[s.off + i] = 0;
  return s;
}

/** C17 §7.21.7.4: fputs — write the string pointed to by `s` to the stream.
 *  The terminating null is not written. Returns a nonnegative value on success,
 *  EOF on error. */
export function c_fputs(s: CPtr | string, stream: CFile): number {
  if (!stream || !stream.open || !stream.canWrite) { if (stream) stream.error = true; return -1; }
  const str = typeof s === "string" ? s : cptrToString(s as CPtr);
  const bytes = new TextEncoder().encode(str);
  const n = c_fwrite(bytes, 1, bytes.length, stream);
  return n === bytes.length ? 0 : -1;
}

// ---------------------------------------------------------------------------
// File positioning (C17 §7.21.9)
// ---------------------------------------------------------------------------

/** Seek origin constants (§7.21.9.2). */
export const SEEK_SET = 0;
export const SEEK_CUR = 1;
export const SEEK_END = 2;

/** C17 §7.21.9.2: fseek — set the file position indicator for the stream.
 *  For a binary stream the new position is `offset` bytes from `whence`.
 *  Returns 0 on success, nonzero on failure. Also clears the EOF indicator. */
export function c_fseek(stream: CFile, offset: number, whence: number): number {
  if (!stream || !stream.open) return -1;
  // Seeking discards any pushed-back characters (§7.21.7.10 ¶3).
  stream.ungetBuf.length = 0;
  try {
    let newPos: number;
    if (whence === SEEK_SET) newPos = offset;
    else if (whence === SEEK_CUR) newPos = stream.pos + offset;
    else if (whence === SEEK_END) {
      let size = 0;
      if (stream.backend === "node") size = getFs().fstatSync(stream.fd).size;
      else if (stream.backend === "vfs") { try { size = stream.vfs!.readFile(stream.path).length; } catch { size = 0; } }
      else if (stream.backend === "mem") size = stream.mem!.dataLen;
      newPos = size + offset;
    } else { set_errno(EINVAL); return -1; }
    if (newPos < 0) { set_errno(EINVAL); return -1; }
    stream.pos = newPos;
    stream.eof = false;
    return 0;
  } catch { return -1; }
}

/** C17 §7.21.9.4: ftell — obtain the current value of the file position
 *  indicator for the stream. Returns -1L on failure. */
export function c_ftell(stream: CFile): number {
  if (!stream) return -1;
  return stream.pos;
}

/** C17 §7.21.9.5: rewind — set the file position indicator to the beginning
 *  of the file and clear the error indicator. */
export function c_rewind(stream: CFile): void {
  if (!stream) return;
  stream.pos = 0;
  stream.eof = false;
  stream.error = false;
  stream.ungetBuf.length = 0;
}

/** C17 §7.21.9.1: fgetpos — store the current value of the file position
 *  indicator into the object pointed to by `pos`. Returns 0 on success. */
export function c_fgetpos(stream: CFile, pos: { value: number }): number {
  if (!stream) return -1;
  pos.value = stream.pos;
  return 0;
}

/** C17 §7.21.9.3: fsetpos — set the file position indicator to the value
 *  previously stored by fgetpos. Returns 0 on success. */
export function c_fsetpos(stream: CFile, pos: { value: number }): number {
  if (!stream) return -1;
  stream.pos = pos.value;
  stream.eof = false;
  stream.ungetBuf.length = 0;
  return 0;
}

// ---------------------------------------------------------------------------
// Error handling (C17 §7.21.10)
// ---------------------------------------------------------------------------

/** C17 §7.21.10.1: clearerr — clear the end-of-file and error indicators. */
export function c_clearerr(stream: CFile): void {
  if (!stream) return;
  stream.eof = false;
  stream.error = false;
}

/** C17 §7.21.10.2: feof — return nonzero iff the end-of-file indicator is set. */
export function c_feof(stream: CFile): number {
  return stream?.eof ? 1 : 0;
}

/** C17 §7.21.10.3: ferror — return nonzero iff the error indicator is set. */
export function c_ferror(stream: CFile): number {
  return stream?.error ? 1 : 0;
}

/** C17 §7.21.10.4: perror — write a short message to stderr of the form
 *  "<s>: <strerror(errno)>\n" (just strerror if `s` is null/empty). */
export function c_perror(s: string | CPtr | null): void {
  const prefix = s == null ? "" : (typeof s === "string" ? s : cptrToString(s as CPtr));
  const msg = c_strerror(get_errno());
  if (prefix) process.stderr.write(`${prefix}: ${msg}\n`);
  else process.stderr.write(`${msg}\n`);
}

// ---------------------------------------------------------------------------
// Formatted file I/O (C17 §7.21.6)
// ---------------------------------------------------------------------------

/** C17 §7.21.6.1: fprintf — formatted output to `stream`. Returns the number
 *  of characters transmitted, or a negative value on error. */
export function c_fprintf(stream: CFile, fmt: string | CPtr, ...args: unknown[]): number {
  if (!stream || !stream.open || !stream.canWrite) { if (stream) stream.error = true; return -1; }
  const fmtStr = typeof fmt === "string" ? fmt : cptrToString(fmt as any);
  const result = formatPrintf(fmtStr, args);
  const data = new TextEncoder().encode(result);
  const n = c_fwrite(data, 1, data.length, stream);
  return n === data.length ? result.length : -1;
}

/** C17 §7.21.6.3: printf — formatted output to stdout. */
export function c_printf(fmt: string | CPtr, ...args: unknown[]): number {
  return c_fprintf(c_stdout, fmt, ...args);
}

// ---------------------------------------------------------------------------
// File operations (C17 §7.21.4)
// ---------------------------------------------------------------------------

/** C17 §7.21.4.4: tmpnam — generate a string that is a valid file name and
 *  not the name of an existing file. If `s` is non-null, also copy into `s`. */
export function c_tmpnam(s: CPtr | null): string {
  const name = `/tmp/tmpnam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (s && s.buf) {
    for (let i = 0; i < name.length && i < s.buf.length - s.off - 1; i++) {
      s.buf[s.off + i] = name.charCodeAt(i);
    }
    s.buf[s.off + Math.min(name.length, s.buf.length - s.off - 1)] = 0;
  }
  return name;
}

/** C17 §7.21.4.1: remove — cause the file named `filename` to be no longer
 *  accessible. Returns 0 on success, nonzero on failure. */
export function c_remove(filename: string | CPtr): number {
  const path = typeof filename === "string" ? filename : cptrToString(filename as CPtr);
  const mount = findMount(path);
  if (mount) {
    try { mount.vfs.unlink(path); return 0; }
    catch { set_errno(ENOENT); return -1; }
  }
  try { getFs().unlinkSync(path); return 0; }
  catch { set_errno(ENOENT); return -1; }
}

/** C17 §7.21.4.2: rename — change the name of the file from `oldname` to
 *  `newname`. Returns 0 on success, nonzero on failure. */
export function c_rename(oldname: string | CPtr, newname: string | CPtr): number {
  const oldPath = typeof oldname === "string" ? oldname : cptrToString(oldname as CPtr);
  const newPath = typeof newname === "string" ? newname : cptrToString(newname as CPtr);
  const oldMount = findMount(oldPath);
  const newMount = findMount(newPath);
  if (oldMount && oldMount === newMount) {
    try { oldMount.vfs.rename(oldPath, newPath); return 0; }
    catch { set_errno(ENOENT); return -1; }
  }
  if (oldMount || newMount) {
    // Cross-backend rename: fall back to copy+unlink semantics.
    try {
      const data = oldMount ? oldMount.vfs.readFile(oldPath) : getFs().readFileSync(oldPath);
      if (newMount) newMount.vfs.writeFile(newPath, new Uint8Array(data));
      else getFs().writeFileSync(newPath, Buffer.from(data));
      if (oldMount) oldMount.vfs.unlink(oldPath);
      else getFs().unlinkSync(oldPath);
      return 0;
    } catch { set_errno(ENOENT); return -1; }
  }
  try { getFs().renameSync(oldPath, newPath); return 0; }
  catch { set_errno(ENOENT); return -1; }
}

/** C17 §7.21.4.3: tmpfile — create a temporary binary file opened for update
 *  ("wb+") that is automatically removed when closed or at program end. */
export function c_tmpfile(): CFile | null {
  const tmpPath = `${process.env.TMPDIR || process.env.TEMP || "/tmp"}/ctmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return c_fopen(tmpPath, "w+b");
}

// ---------------------------------------------------------------------------
// Simple I/O (C17 §7.21.7)
// ---------------------------------------------------------------------------

/** C17 §7.21.7.9: puts — write `s` followed by a newline to stdout. */
export function c_puts(s: string | CPtr): number {
  const str = typeof s === "string" ? s : cptrToString(s as CPtr);
  process.stdout.write(str + "\n");
  return 0;
}

/** C17 §7.21.7.6: putchar — write one character to stdout. */
export function c_putchar(c: number): number {
  process.stdout.write(String.fromCharCode(c & 0xFF));
  return c & 0xFF;
}

/** C17 §7.21.7.6: getchar — read one character from stdin. Non-interactive
 *  in this runtime; returns EOF. */
export function c_getchar(): number { return -1; }

// ---------------------------------------------------------------------------
// Buffering (C17 §7.21.5.5 / §7.21.5.6)
// ---------------------------------------------------------------------------

/** §7.21.5.5: _IOFBF — full buffering. */
export const _IOFBF = 0;
/** §7.21.5.5: _IOLBF — line buffering. */
export const _IOLBF = 1;
/** §7.21.5.5: _IONBF — no buffering. */
export const _IONBF = 2;

/** C17 §7.21.5.6: setbuf — equivalent to `setvbuf(stream, buf, _IOFBF, BUFSIZ)`
 *  if buf != NULL, or `setvbuf(stream, NULL, _IONBF, 0)` otherwise. */
export function c_setbuf(stream: CFile, buf: CPtr | null): void {
  c_setvbuf(stream, buf, buf ? _IOFBF : _IONBF, 4096);
}

/** C17 §7.21.5.5: setvbuf — set buffering mode. Must be called after the
 *  stream is opened but before any other operation is performed.
 *  `mode` must be one of _IOFBF, _IOLBF, _IONBF — otherwise return nonzero. */
export function c_setvbuf(stream: CFile, _buf: CPtr | null, mode: number, size: number): number {
  if (!stream) return -1;
  if (mode !== _IOFBF && mode !== _IOLBF && mode !== _IONBF) { set_errno(EINVAL); return -1; }
  stream.bufMode = mode;
  stream.bufSize = size > 0 ? size : 4096;
  return 0;
}

// ---------------------------------------------------------------------------
// Variadic printf family (C17 §7.21.6.8–§7.21.6.12)
// ---------------------------------------------------------------------------

/** C17 §7.21.6.8: vfprintf — equivalent to fprintf with a va_list argument. */
export function c_vfprintf(stream: CFile, fmt: string, args: unknown[]): number {
  return c_fprintf(stream, fmt, ...args);
}

/** C17 §7.21.6.10: vprintf — equivalent to printf with a va_list argument. */
export function c_vprintf(fmt: string, args: unknown[]): number {
  return c_fprintf(c_stdout, fmt, ...args);
}

/** C17 §7.21.6.12: vsprintf — equivalent to sprintf with a va_list argument. */
export function c_vsprintf(buf: CPtr, fmt: string, args: unknown[]): number {
  const result = formatPrintf(fmt, args);
  stringToCptr(buf, result);
  return result.length;
}

/** C17 §7.21.6.11: vsnprintf — equivalent to snprintf with a va_list argument. */
export function c_vsnprintf(buf: CPtr, n: number, fmt: string, args: unknown[]): number {
  const result = formatPrintf(fmt, args);
  if (n > 0) stringToCptr(buf, result, n);
  return result.length;
}

// ---------------------------------------------------------------------------
// Formatted input (C17 §7.21.6.2 / §7.21.6.7)
// ---------------------------------------------------------------------------

import { sscanf as _sscanfInternal } from "./scanf.js";

/** C17 §7.21.6.7: sscanf variant that accepts a CPtr string in addition to a
 *  JS string. Returns the number of input items successfully assigned, or EOF
 *  (-1) if an input failure occurs before any conversion. */
export function c_sscanf(s: string | CPtr, fmt: string | CPtr, ...outs: Array<{ value: unknown } | null>): number {
  const input = typeof s === "string" ? s : cptrToString(s as CPtr);
  const fmtStr = typeof fmt === "string" ? fmt : cptrToString(fmt as CPtr);
  const r = _sscanfInternal(input, fmtStr);
  for (let i = 0; i < r.values.length && i < outs.length; i++) {
    const slot = outs[i];
    if (slot) slot.value = r.values[i];
  }
  return r.count;
}

/** C17 §7.21.6.2: fscanf — formatted input from a stream. Consumes bytes from
 *  the current position forward and returns the number of input items matched. */
export function c_fscanf(stream: CFile, fmt: string | CPtr, ...outs: Array<{ value: unknown } | null>): number {
  if (!stream || !stream.open || !stream.canRead) return -1;
  // Read remaining bytes into a string and delegate to sscanf. We then advance
  // the stream position by however many bytes sscanf consumed.
  let rest: Uint8Array;
  if (stream.backend === "vfs") rest = vfsReadAt(stream, stream.pos, 1 << 20);
  else if (stream.backend === "node") {
    try {
      const stat = getFs().fstatSync(stream.fd);
      const n = Math.max(0, stat.size - stream.pos);
      const buf = Buffer.alloc(n);
      getFs().readSync(stream.fd, buf, 0, n, stream.pos);
      rest = new Uint8Array(buf.buffer, buf.byteOffset, n);
    } catch { stream.error = true; return -1; }
  } else { stream.eof = true; return -1; }

  const text = new TextDecoder().decode(rest);
  const fmtStr = typeof fmt === "string" ? fmt : cptrToString(fmt as CPtr);
  const { count, values, consumed } = sscanfWithConsumed(text, fmtStr);
  for (let i = 0; i < values.length && i < outs.length; i++) {
    const slot = outs[i];
    if (slot) slot.value = values[i];
  }
  stream.pos += consumed;
  if (consumed === 0 && rest.length === 0) { stream.eof = true; return -1; }
  return count;
}

/** Internal: variant of sscanf that also reports how many input bytes were
 *  consumed (for fscanf position tracking). */
export function sscanfWithConsumed(input: string, fmt: string): { count: number; values: unknown[]; consumed: number } {
  const values: unknown[] = [];
  let pos = 0, fi = 0;
  while (fi < fmt.length && pos <= input.length) {
    if (fmt[fi] === "%") {
      fi++;
      while (fi < fmt.length && fmt[fi]! >= "0" && fmt[fi]! <= "9") fi++;
      while (fi < fmt.length && "hlLzjt".includes(fmt[fi]!)) fi++;
      const spec = fmt[fi++];
      while (pos < input.length && /\s/.test(input[pos]!)) pos++;
      let m: RegExpMatchArray | null = null;
      switch (spec) {
        case "d": case "i":
          m = input.slice(pos).match(/^[+-]?\d+/);
          if (!m) return { count: values.length, values, consumed: pos };
          values.push(parseInt(m[0], 10));
          pos += m[0].length; break;
        case "u":
          m = input.slice(pos).match(/^\d+/);
          if (!m) return { count: values.length, values, consumed: pos };
          values.push(parseInt(m[0], 10) >>> 0);
          pos += m[0].length; break;
        case "x": case "X":
          m = input.slice(pos).match(/^(?:0[xX])?[0-9a-fA-F]+/);
          if (!m) return { count: values.length, values, consumed: pos };
          values.push(parseInt(m[0], 16));
          pos += m[0].length; break;
        case "o":
          m = input.slice(pos).match(/^[0-7]+/);
          if (!m) return { count: values.length, values, consumed: pos };
          values.push(parseInt(m[0], 8));
          pos += m[0].length; break;
        case "f": case "e": case "g":
          m = input.slice(pos).match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
          if (!m) return { count: values.length, values, consumed: pos };
          values.push(parseFloat(m[0]));
          pos += m[0].length; break;
        case "s":
          m = input.slice(pos).match(/^\S+/);
          if (!m) return { count: values.length, values, consumed: pos };
          values.push(m[0]);
          pos += m[0].length; break;
        case "c":
          if (pos >= input.length) return { count: values.length, values, consumed: pos };
          values.push(input[pos]); pos++; break;
        case "%":
          if (input[pos] !== "%") return { count: values.length, values, consumed: pos };
          pos++; break;
        default:
          return { count: values.length, values, consumed: pos };
      }
    } else if (fmt[fi] === " ") {
      fi++;
      while (pos < input.length && /\s/.test(input[pos]!)) pos++;
    } else {
      if (input[pos] !== fmt[fi]) return { count: values.length, values, consumed: pos };
      fi++; pos++;
    }
  }
  return { count: values.length, values, consumed: pos };
}

/** C17 §7.21.6.13: vfscanf — fscanf with a va_list-like argument array. */
export function c_vfscanf(stream: CFile, fmt: string, outs: Array<{ value: unknown } | null>): number {
  return c_fscanf(stream, fmt, ...outs);
}

/** C17 §7.21.6.15: vsscanf — sscanf with a va_list-like argument array. */
export function c_vsscanf(s: string | CPtr, fmt: string, outs: Array<{ value: unknown } | null>): number {
  return c_sscanf(s, fmt, ...outs);
}

// ---------------------------------------------------------------------------
// POSIX.1-2017 memory-backed streams
//   fmemopen(buf, size, mode)       §XSH.3 fmemopen
//   open_memstream(&buf, &size)     §XSH.3 open_memstream
// Both return a FILE* that reads/writes an in-memory buffer.
// ---------------------------------------------------------------------------

/** Mutable memory-stream state. See fmemopen / open_memstream. */
export interface MemStream {
  /** Backing buffer. For fmemopen this is user-supplied (fixed size); for
   *  open_memstream it grows dynamically. */
  buf: Uint8Array;
  /** Logical end-of-data within buf (<= buf.length). */
  dataLen: number;
  /** True for open_memstream (grow-on-write); false for fmemopen. */
  growable: boolean;
  /** True if writes should maintain a trailing '\0' (fmemopen in w/a mode). */
  nullTerminated: boolean;
  /** Caller-visible output pointer (open_memstream's first arg). */
  bufRef?: { value: CPtr };
  /** Caller-visible size pointer (open_memstream's second arg). */
  sizeRef?: { value: number };
}

let _memStreamSeq = 0;

/** POSIX.1-2017 fmemopen — open a stream backed by a fixed-size memory region.
 *
 *  `buf` may be null, in which case a buffer of `size` bytes is allocated
 *  internally. Mode follows fopen §7.21.5.3 with the POSIX extensions:
 *    "r"/"r+" — initial position 0; reads stop at dataLen (= strnlen or size).
 *    "w"/"w+" — initial position 0; dataLen = 0; write places trailing '\0'.
 *    "a"/"a+" — initial position = strnlen(buf, size); writes forced to end.
 */
export function c_fmemopen(buf: CPtr | null, size: number, mode: string | CPtr): CFile | null {
  const modeStr = typeof mode === "string" ? mode : cptrToString(mode as CPtr);
  const m = parseMode(modeStr);
  if (size <= 0) { set_errno(EINVAL); return null; }

  // Allocate backing store or adopt caller buffer.
  let backing: Uint8Array;
  if (buf === null) {
    backing = new Uint8Array(size);
  } else {
    // Use a VIEW over the caller's buffer so writes are visible to the caller.
    backing = new Uint8Array(buf.buf.buffer, buf.buf.byteOffset + buf.off, size);
  }

  // Compute initial dataLen per POSIX rules.
  let dataLen = size;
  if (m.truncate) {
    // w/w+: dataLen = 0; place trailing null if possible.
    dataLen = 0;
    if (size > 0) backing[0] = 0;
  } else if (buf !== null) {
    // r/r+/a/a+: dataLen = strnlen(buf, size).
    let i = 0;
    while (i < size && backing[i] !== 0) i++;
    dataLen = i;
  }
  const initialPos = m.append ? dataLen : 0;

  const mem: MemStream = {
    buf: backing,
    dataLen,
    growable: false,
    nullTerminated: m.write, // maintain trailing '\0' when writes are permitted
  };

  return {
    fd: -1, path: `<fmemopen#${++_memStreamSeq}>`, pos: initialPos, mode: modeStr,
    eof: false, error: false, open: true,
    ungetBuf: [], bufMode: _IOFBF, bufSize: size,
    backend: "mem", mem,
    canRead: m.read, canWrite: m.write, append: m.append,
  };
}

/** POSIX.1-2017 open_memstream — open an output stream whose buffer grows as
 *  needed. `bufRef.value` and `sizeRef.value` are updated after each flush (we
 *  update eagerly) so the caller observes the current buffer pointer and the
 *  current data length.
 *
 *  The stream operates in write-only mode ("w"). On fclose the underlying
 *  buffer remains valid and a trailing '\0' is maintained (not counted in
 *  size).
 */
export function c_open_memstream(
  bufRef: { value: CPtr },
  sizeRef: { value: number }
): CFile | null {
  const initial = new Uint8Array(128);
  initial[0] = 0;
  const mem: MemStream = {
    buf: initial,
    dataLen: 0,
    growable: true,
    nullTerminated: true,
    bufRef, sizeRef,
  };
  // Initialize caller-visible pointers to an empty string.
  bufRef.value = { buf: initial, off: 0 };
  sizeRef.value = 0;

  return {
    fd: -1, path: `<open_memstream#${++_memStreamSeq}>`, pos: 0, mode: "w+",
    eof: false, error: false, open: true,
    ungetBuf: [], bufMode: _IOFBF, bufSize: 128,
    backend: "mem", mem,
    canRead: false, canWrite: true, append: false,
  };
}
