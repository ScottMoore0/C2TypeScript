// MC-8: MirageOS — the composed virtual operating system.
// Assembles VFS, Environment, Process, I/O, and Clock into one coherent OS.

import { VirtualFileSystem } from "./vfs/vfs.js";
import { Environment } from "./env/environment.js";
import {
  Process, ProcessExitSignal, type SigInfoWait,
  WIFEXITED, WEXITSTATUS, WIFSIGNALED, WTERMSIG, WNOHANG,
  P_ALL, P_PID,
} from "./process/process.js";
import { FileDescriptorTable, FileStream, makePipe, PipeEnd, type Stream } from "./io/streams.js";
import { Clock } from "./clock/clock.js";
import { MmapManager, type MmapRegion, MAP_ANONYMOUS } from "./mmap/mmap.js";
import {
  SignalRegistry, type SignalHandler, type Sigaction, type Itimerval,
  SigSet,
} from "./signal/signal.js";
import {
  NetworkStack, type SockAddr, type AddrInfo, type NetResult,
  getaddrinfo as _getaddrinfo,
} from "./network/network.js";
import {
  type DIR, type Dirent,
  opendirVfs, readdirStream, rewinddir as _rewinddir,
  closedir as _closedir, telldir as _telldir, seekdir as _seekdir,
  scandir as _scandir,
} from "./posix/dirent.js";
import {
  type Stat, statVfs, lstatVfs, makeStat,
} from "./posix/stat.js";
import { F_OK, R_OK, W_OK, X_OK } from "./posix/fs.js";

export class MirageOS {
  readonly vfs: VirtualFileSystem;
  readonly env: Environment;
  readonly process: Process;
  readonly fds: FileDescriptorTable;
  readonly clock: Clock;
  readonly mmap_mgr: MmapManager;
  /** POSIX signals — IEEE Std 1003.1-2017 <signal.h>. */
  readonly signals: SignalRegistry;
  /** BSD sockets loopback stack — IEEE Std 1003.1-2017 <sys/socket.h>. */
  readonly net: NetworkStack;

  /** POSIX umask — IEEE Std 1003.1-2017 §umask. Default 022 like standard shells. */
  private _umask: number = 0o022;

  /** In-memory symlink table keyed by resolved absolute path.
   *  IEEE Std 1003.1-2017 §symlink / §readlink / §lstat. The Mirage VFS
   *  currently has no native symlink node kind, so symlinks are tracked on
   *  the MirageOS object. `stat()` follows; `lstat()` reports S_IFLNK. */
  private _symlinks = new Map<string, string>();

  constructor(opts?: {
    argv?: string[];
    env?: Record<string, string>;
    cwd?: string;
  }) {
    this.vfs = new VirtualFileSystem();
    this.env = new Environment(opts?.env);
    this.process = new Process(opts?.argv);
    this.fds = new FileDescriptorTable();
    this.clock = new Clock();
    this.mmap_mgr = new MmapManager();
    this.signals = new SignalRegistry();
    this.net = new NetworkStack();

    if (opts?.cwd) {
      this.vfs.mkdirp(opts.cwd);
      this.env.chdir(opts.cwd);
    }

    // Create standard directories.
    this.vfs.mkdirp("/tmp");
    this.vfs.mkdirp("/home");
  }

  /** Open a VFS file and return its fd. */
  open(path: string, mode: "r" | "w" | "a" | "rw" = "r"): number {
    const resolved = this.env.resolve(path);
    const stream = new FileStream(this.vfs, resolved, mode);
    return this.fds.open(stream);
  }

  /** Read from fd. Returns bytes read. */
  read(fd: number, count: number): Uint8Array {
    const stream = this.fds.get(fd);
    if (!stream) throw new Error(`bad file descriptor ${fd}`);
    return stream.read(count);
  }

  /** Write to fd. Returns bytes written. */
  write(fd: number, data: string | Uint8Array): number {
    const stream = this.fds.get(fd);
    if (!stream) throw new Error(`bad file descriptor ${fd}`);
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return stream.write(bytes);
  }

  /** Close fd. */
  close(fd: number): void {
    if (!this.fds.close(fd)) throw new Error(`bad file descriptor ${fd}`);
  }

  /** Get stdout output as string. */
  getStdout(): string {
    return this.fds.stdout.getOutput();
  }

  /** Get stderr output as string. */
  getStderr(): string {
    return this.fds.stderr.getOutput();
  }

  /** Feed data into stdin. */
  feedStdin(data: string): void {
    this.fds.stdin.feed(data);
  }

  // --- POSIX file operations ---

  /** POSIX access() — IEEE Std 1003.1-2017 §access. Check file accessibility.
   *  `mode` is a bitwise-OR of F_OK / R_OK / W_OK / X_OK. Returns 0 on success,
   *  -1 on failure. In the Mirage VFS every existing file is readable and
   *  writable by the current owner (uid 1000); execute is granted if the
   *  S_IXUSR bit is set on the file. */
  access(path: string, mode: number = F_OK): number {
    try {
      const resolved = this.env.resolve(path);
      const target = this._followSymlink(resolved);
      const s = this.vfs.stat(target);
      if (mode === F_OK) return 0;
      const perm = s.mode & 0o7777;
      // Owner bits — uid 1000 is always the owner in the Mirage model.
      if ((mode & R_OK) && !(perm & 0o400)) return -1;
      if ((mode & W_OK) && !(perm & 0o200)) return -1;
      if ((mode & X_OK) && !(perm & 0o100)) return -1;
      return 0;
    } catch { return -1; }
  }

  /** POSIX lseek() — IEEE Std 1003.1-2017 §lseek.
   *  `whence`: 0 = SEEK_SET, 1 = SEEK_CUR, 2 = SEEK_END (also accepts string aliases).
   *  Returns new offset, or -1 on error (EBADF / ESPIPE for pipes). */
  lseek(fd: number, offset: number, whence: number | "set" | "cur" | "end"): number {
    const stream = this.fds.get(fd);
    if (!stream) return -1;
    const w: "set" | "cur" | "end" =
      whence === 0 || whence === "set" ? "set"
      : whence === 1 || whence === "cur" ? "cur"
      : "end";
    const result = stream.seek(offset, w);
    // If seek returned -1 (e.g. pipe/socket), propagate -1 as ESPIPE.
    if (result < 0) return -1;
    return stream.tell();
  }

  /** POSIX dup() — duplicate file descriptor. */
  dup(oldfd: number): number {
    const stream = this.fds.get(oldfd);
    if (!stream) return -1;
    return this.fds.open(stream);
  }

  /** POSIX dup2() — duplicate fd to specific number. */
  dup2(oldfd: number, newfd: number): number {
    const stream = this.fds.get(oldfd);
    if (!stream) return -1;
    try { this.fds.close(newfd); } catch {}
    return this.fds.openAt(newfd, stream);
  }

  /** POSIX truncate/ftruncate — truncate file. */
  truncate(path: string, length: number): number {
    try {
      const resolved = this.env.resolve(path);
      this.vfs.truncate(resolved, length);
      return 0;
    } catch { return -1; }
  }

  /** POSIX unlink() — remove file. */
  unlink(path: string): number {
    try {
      const resolved = this.env.resolve(path);
      this.vfs.unlink(resolved);
      return 0;
    } catch { return -1; }
  }

  /** POSIX rename() — rename file/directory. */
  rename(oldpath: string, newpath: string): number {
    try {
      this.vfs.rename(this.env.resolve(oldpath), this.env.resolve(newpath));
      return 0;
    } catch { return -1; }
  }

  /** POSIX mkdir() — create directory. */
  mkdir(path: string, mode?: number): number {
    try {
      this.vfs.mkdir(this.env.resolve(path));
      return 0;
    } catch { return -1; }
  }

  /** POSIX rmdir() — IEEE Std 1003.1-2017 §rmdir. Fails with ENOTEMPTY if non-empty. */
  rmdir(path: string): number {
    try {
      this.vfs.rmdir(this.env.resolve(path));
      return 0;
    } catch { return -1; }
  }

  /** POSIX getcwd() — get current working directory. */
  getcwd(): string {
    return this.env.cwd;
  }

  /** POSIX chdir() — change working directory. */
  chdir(path: string): number {
    try {
      this.env.chdir(this.env.resolve(path));
      return 0;
    } catch { return -1; }
  }

  /** Internal: resolve a path through the symlink table (one-level only for
   *  simplicity; cycles are broken after 40 hops per POSIX ELOOP semantics). */
  private _followSymlink(absPath: string): string {
    let cur = absPath;
    for (let i = 0; i < 40; i++) {
      const tgt = this._symlinks.get(cur);
      if (!tgt) return cur;
      cur = tgt.startsWith("/") ? tgt : this.env.resolve(tgt);
    }
    return cur; // ELOOP — give up, let caller stat and fail naturally
  }

  /** POSIX stat() — IEEE Std 1003.1-2017 §stat.
   *  Follows symlinks. Returns a full struct stat, or null on ENOENT. */
  stat(path: string): Stat | null {
    try {
      const resolved = this.env.resolve(path);
      const target = this._followSymlink(resolved);
      return statVfs(this.vfs, target);
    } catch { return null; }
  }

  /** POSIX lstat() — IEEE Std 1003.1-2017 §lstat.
   *  Like stat() but returns info about the link itself rather than its target.
   *  For paths with no symlink entry this behaves identically to stat(). */
  lstat(path: string): Stat | null {
    try {
      const resolved = this.env.resolve(path);
      const linkTarget = this._symlinks.get(resolved);
      if (linkTarget !== undefined) {
        // Report the symlink itself with S_IFLNK.
        return makeStat(resolved, {
          type: "symlink",
          size: linkTarget.length,
          modified: Date.now(),
          created: Date.now(),
          mode: 0o777,
        });
      }
      return lstatVfs(this.vfs, resolved);
    } catch { return null; }
  }

  /** POSIX fstat() — IEEE Std 1003.1-2017 §fstat. Like stat() but for an fd.
   *  Returns a full struct stat. Pipes and TTYs are reported as S_IFCHR / S_IFIFO. */
  fstat(fd: number): Stat | null {
    const s = this.fds.get(fd);
    if (!s) return null;
    const p = s.path;
    if (!p) {
      // stdin/stdout/stderr/pipes — report as char-special (S_IFCHR).
      const st = makeStat("(fd)", {
        type: "file", size: 0, modified: 0, created: 0, mode: 0o666,
      }, { nlink: 1 });
      st.st_mode = 0o020666;
      return st;
    }
    return this.stat(p);
  }

  /** POSIX readdir() (path-flavour convenience) — returns entry names.
   *  IEEE Std 1003.1-2017 §readdir. For a proper DIR*-based stream, use
   *  opendir/readdirStream/closedir below. */
  readdir(path: string): string[] {
    try {
      const resolved = this.env.resolve(path);
      return this.vfs.readdir(resolved).slice();
    } catch { return []; }
  }

  // ---------------------------------------------------------------------------
  // POSIX <dirent.h> — directory streams. IEEE Std 1003.1-2017.
  // ---------------------------------------------------------------------------

  /** POSIX opendir() — §opendir. Returns DIR* or null on ENOENT/ENOTDIR. */
  opendir(path: string): DIR | null {
    const resolved = this.env.resolve(path);
    const target = this._followSymlink(resolved);
    return opendirVfs(this.vfs, target);
  }

  /** POSIX readdir() (stream-flavour) — §readdir.
   *  Returns the next struct dirent, or null at end-of-stream. */
  readdirStream(dirp: DIR): Dirent | null {
    return readdirStream(dirp);
  }

  /** POSIX rewinddir() — §rewinddir. */
  rewinddir(dirp: DIR): void { _rewinddir(dirp); }

  /** POSIX closedir() — §closedir. Returns 0 on success, -1 on EBADF. */
  closedir(dirp: DIR): number { return _closedir(dirp); }

  /** POSIX telldir() — §telldir. */
  telldir(dirp: DIR): number { return _telldir(dirp); }

  /** POSIX seekdir() — §seekdir. */
  seekdir(dirp: DIR, loc: number): void { _seekdir(dirp, loc); }

  /** POSIX scandir() — §scandir. */
  scandir(
    path: string,
    filter?: (e: Dirent) => boolean,
    compare?: (a: Dirent, b: Dirent) => number,
  ): Dirent[] | null {
    const resolved = this.env.resolve(path);
    return _scandir(this.vfs, this._followSymlink(resolved), filter, compare);
  }

  // ---------------------------------------------------------------------------
  // POSIX <unistd.h> symlink/hardlink/readlink. IEEE Std 1003.1-2017.
  // ---------------------------------------------------------------------------

  /** POSIX link() — §link. Create a hard link.
   *  Mirage VFS has no true hard links, so we emulate by copying the file's
   *  bytes. Returns 0 on success, -1 on error. */
  link(oldpath: string, newpath: string): number {
    try {
      const src = this.env.resolve(oldpath);
      const dst = this.env.resolve(newpath);
      if (!this.vfs.isFile(src)) return -1;
      if (this.vfs.exists(dst)) return -1; // EEXIST
      const data = this.vfs.readFile(src);
      this.vfs.writeFile(dst, data);
      return 0;
    } catch { return -1; }
  }

  /** POSIX symlink() — §symlink. Create a symbolic link.
   *  `target` is stored verbatim (POSIX: symlink target is not validated at
   *  creation time). */
  symlink(target: string, linkpath: string): number {
    try {
      const resolved = this.env.resolve(linkpath);
      if (this.vfs.exists(resolved)) return -1; // EEXIST
      if (this._symlinks.has(resolved)) return -1; // EEXIST
      // Create a placeholder file so directory listings include the entry.
      // The symlink table overrides its stat/readlink semantics.
      this.vfs.writeFile(resolved, "");
      this._symlinks.set(resolved, target);
      return 0;
    } catch { return -1; }
  }

  /** POSIX readlink() — §readlink. Reads a symlink target into `buf` (up to
   *  `bufsize` bytes) and returns the number of bytes written (NOT a NUL
   *  terminator). Returns -1 on EINVAL/ENOENT. */
  readlink(path: string, buf?: Uint8Array, bufsize?: number): number {
    const resolved = this.env.resolve(path);
    const target = this._symlinks.get(resolved);
    if (target === undefined) return -1; // EINVAL — not a symlink
    const bytes = new TextEncoder().encode(target);
    if (!buf) return bytes.length;
    const n = Math.min(bufsize ?? buf.length, bytes.length, buf.length);
    buf.set(bytes.subarray(0, n), 0);
    return n;
  }

  /** POSIX readlink() convenience — returns the string target or null. */
  readlinkStr(path: string): string | null {
    const resolved = this.env.resolve(path);
    return this._symlinks.get(resolved) ?? null;
  }

  /** POSIX fchdir() — §fchdir. Change cwd using an fd obtained from opendir()
   *  or open(). Returns 0 on success, -1 on EBADF/ENOTDIR. */
  fchdir(fd: number): number {
    // A DIR* handle's synthetic fd carries its path — but we don't keep a
    // registry on MirageOS. Callers that want fchdir() pass the DIR directly:
    // see fchdirDir(). For file fds (plain open()), resolve via fds.pathOf.
    const p = this.fds.pathOf(fd);
    if (!p) return -1;
    if (!this.vfs.isDirectory(p)) return -1;
    try { this.env.chdir(p); return 0; } catch { return -1; }
  }

  /** Variant of fchdir() that accepts a DIR* handle directly. */
  fchdirDir(dirp: DIR): number {
    if (dirp.closed) return -1;
    if (!this.vfs.isDirectory(dirp.path)) return -1;
    try { this.env.chdir(dirp.path); return 0; } catch { return -1; }
  }

  // --- Environment ---

  /** POSIX getenv() — IEEE Std 1003.1-2017 §getenv. */
  getenv(name: string): string | undefined {
    return this.env.getenv(name);
  }

  /** POSIX setenv() — IEEE Std 1003.1-2017 §setenv. */
  setenv(name: string, value: string): number {
    this.env.setenv(name, value);
    return 0;
  }

  /** POSIX unsetenv() — IEEE Std 1003.1-2017 §unsetenv. */
  unsetenv(name: string): number {
    this.env.unsetenv(name);
    return 0;
  }

  // --- Process ---

  /** POSIX getpid() — get process ID. */
  getpid(): number { return this.process.pid; }

  /** POSIX getppid() — get parent process ID. */
  getppid(): number { return 1; }

  /** POSIX getuid/getgid/geteuid/getegid — user/group IDs. */
  getuid(): number { return 1000; }
  getgid(): number { return 1000; }
  geteuid(): number { return 1000; }
  getegid(): number { return 1000; }

  // --- POSIX <unistd.h> process lifecycle (fork / exec / wait) ---
  // IEEE Std 1003.1-2017 §fork, §exec, §wait.

  /**
   * POSIX fork() — §fork. Pragmatic synchronous emulation: runs `childFn`
   * inline as the child with a newly-allocated PID and returns that PID to
   * the parent. Translated C code patterns of the form `if (fork() == 0)`
   * are expected to adapt to the callback shape via the emitter.
   *
   * This intentionally does NOT create a Worker thread — spec-correct
   * address-space duplication is infeasible in single-VM JS. See
   * forkWorker() for the Worker-thread escape hatch.
   */
  fork(childFn: (childPid: number) => void): number {
    return this.process.fork(childFn);
  }

  /**
   * Worker-thread fork — §fork (best-effort). Spawns a Node worker running
   * `moduleUrl`; records the worker's eventual exit status in the process
   * table. Returns new pid on success, -1 on failure (e.g. non-Node env).
   */
  forkWorker(moduleUrl: string, argv: string[], env: Record<string, string>): number {
    return this.process.table.forkWorker(moduleUrl, argv, env);
  }

  /**
   * POSIX execve() — §exec. In-VM the current call frame cannot literally
   * be replaced, so we delegate to `node:child_process.spawnSync` via the
   * ProcessTable (BRIDGE: POSIX-fork-and-exec). When invoked outside a
   * preceding fork(), the child runs to completion synchronously and the
   * spawned PID is returned. POSIX strictly says exec*() never returns on
   * success — the present shape is the closest honest mapping in single-VM
   * JS and is consistent with the fork-then-exec common case (where the
   * "new image" is the child's whole program).
   *
   * Returns the spawned PID on success, -1 on failure.
   */
  execve(path: string, argv: string[], env: Record<string, string>): number {
    return this.process.table.spawnExec(path, argv, env, /*searchPath*/ false);
  }

  /** POSIX execv — §exec. No PATH search. */
  execv(path: string, argv: string[]): number {
    return this.process.table.spawnExec(path, argv, this.env.getAll(), /*searchPath*/ false);
  }
  /** POSIX execvp — §exec. Search PATH for `file`. */
  execvp(file: string, argv: string[]): number {
    return this.process.table.spawnExec(file, argv, this.env.getAll(), /*searchPath*/ true);
  }
  /** POSIX execl — §exec. Variadic; first vararg is argv[0]. */
  execl(path: string, ...args: string[]): number {
    return this.process.table.spawnExec(path, args, this.env.getAll(), /*searchPath*/ false);
  }

  /**
   * POSIX system(command) — IEEE Std 1003.1-2017 §system.
   * Delegates to ProcessTable.system, which calls /bin/sh -c (POSIX) or
   * cmd /c (Windows) via node:child_process.spawnSync.
   */
  system(command: string | null): number {
    return this.process.table.system(command);
  }

  /** POSIX wait() — §wait. Writes status into statusOut. */
  wait(statusOut: { status?: number } | null): number {
    return this.process.wait(statusOut);
  }

  /** POSIX waitpid() — §waitpid. */
  waitpid(pid: number, statusOut: { status?: number } | null, options: number = 0): number {
    return this.process.waitpid(pid, statusOut, options);
  }

  /** POSIX waitid() — §waitid. */
  waitid(idtype: number, id: number, info: SigInfoWait, options: number): number {
    return this.process.table.waitid(idtype, id, info, options);
  }

  /** BSD/Linux wait4() — waitpid + struct rusage. */
  wait4(pid: number, statusOut: { status?: number } | null, options: number, rusage: import("./process/process.js").RUsage | null): number {
    return this.process.table.wait4(pid, statusOut, options, rusage);
  }

  /** POSIX _exit() — §_exit. */
  _exit(code: number = 0): never {
    return this.process._exit(code);
  }

  /** POSIX sleep() — sleep for seconds. */
  sleep(seconds: number): number {
    // In single-threaded JS, sleep is a no-op (can't block)
    // Real implementation would need async/Atomics.wait
    return 0;
  }

  /** POSIX usleep() — sleep for microseconds. */
  usleep(usec: number): number { return 0; }

  /** POSIX isatty() — check if fd is a terminal. */
  isatty(fd: number): number {
    return (fd <= 2) ? 1 : 0;
  }

  /** POSIX uname() — system identification. */
  uname(): { sysname: string; nodename: string; release: string; version: string; machine: string } {
    return {
      sysname: "Mirage",
      nodename: "localhost",
      release: "1.0.0",
      version: "Mirage Virtual OS",
      machine: "wasm32",
    };
  }

  /** POSIX sysconf() — get system configuration values. */
  sysconf(name: number): number {
    const _SC_PAGE_SIZE = 30;
    const _SC_CLK_TCK = 2;
    const _SC_NPROCESSORS_ONLN = 84;
    switch (name) {
      case _SC_PAGE_SIZE: return 4096;
      case _SC_CLK_TCK: return 100;
      case _SC_NPROCESSORS_ONLN: return 1;
      default: return -1;
    }
  }

  // --- L.8 POSIX misc: chmod / umask ---

  /** POSIX chmod() — IEEE Std 1003.1-2017 §chmod.
   *  Masks the requested permission bits against `~umask & 0o7777` — no, per spec
   *  chmod() is NOT masked by umask (that's only for file creation). Apply mode directly. */
  chmod(path: string, mode: number): number {
    try {
      this.vfs.chmod(this.env.resolve(path), mode);
      return 0;
    } catch { return -1; }
  }

  /** POSIX umask() — IEEE Std 1003.1-2017 §umask. Returns previous mask. */
  umask(mask: number): number {
    const prev = this._umask;
    this._umask = mask & 0o777;
    return prev;
  }

  /** Read the current umask without modifying it. */
  getumask(): number {
    return this._umask;
  }

  // --- L.2 extended FD ops ---

  /** POSIX fcntl() — IEEE Std 1003.1-2017 §fcntl. Delegates to FdTable. */
  fcntl(fd: number, cmd: number, arg: number = 0): number {
    return this.fds.fcntl(fd, cmd, arg);
  }

  /** Raw read into a Uint8Array buffer (POSIX read()).
   *  IEEE Std 1003.1-2017 §read. Returns bytes read, 0 at EOF, -1 on EBADF.
   *  If `buf` is provided, bytes are written into it starting at offset 0. */
  readInto(fd: number, buf: Uint8Array, n: number = buf.length): number {
    const stream = this.fds.get(fd);
    if (!stream) return -1;
    const data = stream.read(Math.min(n, buf.length));
    buf.set(data, 0);
    return data.length;
  }

  /** Raw write of a Uint8Array. POSIX IEEE Std 1003.1-2017 §write.
   *  Returns bytes written, or -1 on EBADF. */
  writeFrom(fd: number, buf: Uint8Array, n: number = buf.length): number {
    const stream = this.fds.get(fd);
    if (!stream) return -1;
    const slice = n < buf.length ? buf.subarray(0, n) : buf;
    return stream.write(slice);
  }

  // --- L.1 extra: pipe() ---

  /** POSIX pipe() — IEEE Std 1003.1-2017 §pipe.
   *  Returns [readFd, writeFd] on success, null on failure. */
  pipe(): [number, number] | null {
    const [r, w] = makePipe();
    const rfd = this.fds.open(r);
    const wfd = this.fds.open(w);
    return [rfd, wfd];
  }

  // --- L.3 memory mapping ---

  /** POSIX mmap() — IEEE Std 1003.1-2017 §mmap.
   *  Returns an MmapRegion on success (with .buffer exposing the bytes) or null.
   *  For anonymous mappings, `fd` is ignored. For file-backed mappings, `fd`
   *  must be an open fd whose underlying stream has a `path`. */
  mmap(addr: number | null, len: number, prot: number, flags: number,
       fd: number, offset: number): MmapRegion | null {
    const resolver = { pathOf: (f: number) => this.fds.pathOf(f) };
    if ((flags & MAP_ANONYMOUS) !== 0) {
      return this.mmap_mgr.mmap(addr, len, prot, flags, -1, 0, undefined, undefined);
    }
    return this.mmap_mgr.mmap(addr, len, prot, flags, fd, offset, this.vfs, resolver);
  }

  /** POSIX munmap() — IEEE Std 1003.1-2017 §munmap.
   *  Before unmapping a MAP_SHARED region, flush dirty pages to the backing file. */
  munmap(region: MmapRegion): number {
    // For MAP_SHARED, flush back to VFS via msync before unmapping.
    this.mmap_mgr.msync(region, 0, this.vfs);
    return this.mmap_mgr.munmap(region);
  }

  /** POSIX msync() — IEEE Std 1003.1-2017 §msync. */
  msync(region: MmapRegion, flags: number = 0): number {
    return this.mmap_mgr.msync(region, flags, this.vfs);
  }

  // --- L.6 I/O multiplexing ---

  /** POSIX select() — IEEE Std 1003.1-2017 §select.
   *  In the in-memory VFS, regular files and live pipes are always ready; invalid
   *  fds are silently dropped from the result sets. Returns total-ready count, or -1 on error.
   *  Side-effects: mutates the passed-in sets to contain only ready fds (spec behaviour). */
  select(
    nfds: number,
    readfds: Set<number> | null,
    writefds: Set<number> | null,
    exceptfds: Set<number> | null,
    _timeout: { sec: number; usec: number } | null = null,
  ): number {
    let ready = 0;
    const filter = (set: Set<number> | null, kind: "r" | "w"): void => {
      if (!set) return;
      const out: number[] = [];
      for (const fd of set) {
        if (fd < 0 || fd >= nfds) continue;
        const s = this.fds.get(fd);
        if (!s) continue;
        if (kind === "r" && !s.isReadable) continue;
        if (kind === "w" && !s.isWritable) continue;
        // Regular files and writable ends are always ready in the in-memory VFS.
        out.push(fd);
      }
      set.clear();
      for (const fd of out) set.add(fd);
      ready += out.length;
    };
    filter(readfds, "r");
    filter(writefds, "w");
    // Exception set: never ready in the in-memory VFS — POSIX allows this.
    if (exceptfds) exceptfds.clear();
    return ready;
  }

  /** POSIX poll() — IEEE Std 1003.1-2017 §poll.
   *  `fds`: array of {fd, events} — events is a bitmask (POLLIN=1, POLLOUT=4).
   *  Sets each entry's `revents` to the subset that is ready, and returns
   *  the count of entries with nonzero revents. Invalid fds get revents=POLLNVAL (32). */
  poll(
    fds: Array<{ fd: number; events: number; revents?: number }>,
    _timeout: number = 0,
  ): number {
    const POLLIN = 1, POLLOUT = 4, POLLERR = 8, POLLNVAL = 32;
    let n = 0;
    for (const p of fds) {
      p.revents = 0;
      const s = this.fds.get(p.fd);
      if (!s) { p.revents = POLLNVAL; n++; continue; }
      if ((p.events & POLLIN) && s.isReadable) p.revents |= POLLIN;
      if ((p.events & POLLOUT) && s.isWritable) p.revents |= POLLOUT;
      if (p.revents !== 0) n++;
    }
    return n;
  }

  // --- L.5 Signals (IEEE Std 1003.1-2017 <signal.h>) ---

  /** POSIX signal() — IEEE Std 1003.1-2017 §signal. */
  signal(sig: number, handler: SignalHandler | null): SignalHandler | null {
    return this.signals.register(sig, handler);
  }

  /** POSIX sigaction() — IEEE Std 1003.1-2017 §sigaction. */
  sigaction(sig: number, act: Sigaction | null, oldact: Sigaction | null): number {
    return this.signals.sigaction(sig, act, oldact);
  }

  /** POSIX raise() — IEEE Std 1003.1-2017 §raise. */
  raise(sig: number): number {
    return this.signals.raise(sig);
  }

  /** POSIX kill() — IEEE Std 1003.1-2017 §kill. */
  kill(pid: number, sig: number): number {
    return this.signals.kill(pid, this.process.pid, sig);
  }

  /** POSIX sigprocmask() — IEEE Std 1003.1-2017 §sigprocmask. */
  sigprocmask(how: number, set: SigSet | null, oldset: SigSet | null): number {
    return this.signals.sigprocmask(how, set, oldset);
  }

  /** POSIX sigpending() — IEEE Std 1003.1-2017 §sigpending. */
  sigpending(): SigSet {
    return this.signals.sigpending();
  }

  /** POSIX sigsuspend() — IEEE Std 1003.1-2017 §sigsuspend. */
  sigsuspend(mask: SigSet): number {
    return this.signals.sigsuspend(mask);
  }

  /** POSIX alarm() — IEEE Std 1003.1-2017 §alarm. */
  alarm(seconds: number): number {
    return this.signals.alarm(seconds);
  }

  /** POSIX setitimer() — IEEE Std 1003.1-2017 §setitimer. */
  setitimer(which: number, value: Itimerval, ovalue: Itimerval | null): number {
    return this.signals.setitimer(which, value, ovalue);
  }

  /** POSIX getitimer() — IEEE Std 1003.1-2017 §getitimer. */
  getitimer(which: number, value: Itimerval): number {
    return this.signals.getitimer(which, value);
  }

  /** POSIX pause() — IEEE Std 1003.1-2017 §pause.
   *  Single-threaded model: cooperative best-effort — see SignalRegistry.pause(). */
  pause(): number {
    return this.signals.pause();
  }

  // --- L.7 BSD sockets (IEEE Std 1003.1-2017 <sys/socket.h>) ---

  /** POSIX socket() — IEEE Std 1003.1-2017 §socket. Returns sockfd or -1. */
  socket(domain: number, type: number, protocol: number): number {
    const r = this.net.socket(domain, type, protocol);
    return r.ret;
  }

  /** POSIX bind() — IEEE Std 1003.1-2017 §bind. */
  bind(sockfd: number, addr: SockAddr): number {
    return this.net.bind(sockfd, addr).ret;
  }

  /** POSIX listen() — IEEE Std 1003.1-2017 §listen. */
  listen(sockfd: number, backlog: number): number {
    return this.net.listen(sockfd, backlog).ret;
  }

  /** POSIX accept() — IEEE Std 1003.1-2017 §accept.
   *  Returns new socket id, or -1 with EAGAIN (single-threaded model). */
  accept(sockfd: number): { fd: number; peer?: SockAddr } {
    const r = this.net.accept(sockfd);
    return { fd: r.ret, peer: r.peer };
  }

  /** POSIX connect() — IEEE Std 1003.1-2017 §connect. */
  connect(sockfd: number, addr: SockAddr): number {
    return this.net.connect(sockfd, addr).ret;
  }

  /** POSIX send() — IEEE Std 1003.1-2017 §send. */
  sendSocket(sockfd: number, data: Uint8Array, flags: number = 0): number {
    return this.net.send(sockfd, data, flags).ret;
  }

  /** POSIX recv() — IEEE Std 1003.1-2017 §recv. */
  recvSocket(sockfd: number, n: number, flags: number = 0): { ret: number; data?: Uint8Array } {
    const r = this.net.recv(sockfd, n, flags);
    return { ret: r.ret, data: r.data };
  }

  /** POSIX sendto() — IEEE Std 1003.1-2017 §sendto. */
  sendto(sockfd: number, data: Uint8Array, flags: number, addr: SockAddr): number {
    return this.net.sendto(sockfd, data, flags, addr).ret;
  }

  /** POSIX recvfrom() — IEEE Std 1003.1-2017 §recvfrom. */
  recvfrom(sockfd: number, n: number, flags: number = 0): { ret: number; data?: Uint8Array; from?: SockAddr } {
    const r = this.net.recvfrom(sockfd, n, flags);
    return { ret: r.ret, data: r.data, from: r.from };
  }

  /** POSIX shutdown() — IEEE Std 1003.1-2017 §shutdown. */
  shutdownSocket(sockfd: number, how: number): number {
    return this.net.shutdown(sockfd, how).ret;
  }

  /** POSIX close() specialised for socket fds (network stack). */
  closeSocket(sockfd: number): number {
    return this.net.closeSocket(sockfd).ret;
  }

  /** POSIX setsockopt() — IEEE Std 1003.1-2017 §setsockopt. */
  setsockopt(sockfd: number, level: number, optname: number, optval: number): number {
    return this.net.setsockopt(sockfd, level, optname, optval).ret;
  }

  /** POSIX getsockopt() — IEEE Std 1003.1-2017 §getsockopt. */
  getsockopt(sockfd: number, level: number, optname: number): { ret: number; optval?: number } {
    const r = this.net.getsockopt(sockfd, level, optname);
    return { ret: r.ret, optval: r.optval };
  }

  /** POSIX getsockname() — IEEE Std 1003.1-2017 §getsockname. */
  getsockname(sockfd: number): SockAddr | null {
    return this.net.getsockname(sockfd);
  }

  /** POSIX getpeername() — IEEE Std 1003.1-2017 §getpeername. */
  getpeername(sockfd: number): SockAddr | null {
    return this.net.getpeername(sockfd);
  }

  /** POSIX getaddrinfo() — IEEE Std 1003.1-2017 §getaddrinfo. */
  getaddrinfo(
    node: string | null, service: string | null, hints?: Partial<AddrInfo>,
  ): AddrInfo[] | null {
    return _getaddrinfo(node, service, hints);
  }

  /** Reset the entire OS state. */
  reset(): void {
    this.process.reset();
    this.fds.stdout.clear();
    this.fds.stderr.clear();
    this.signals.clear();
  }
}
