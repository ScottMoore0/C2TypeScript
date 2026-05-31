/**
 * POSIX function shims for C-to-TypeScript translation.
 *
 * Each entry maps a POSIX function name to a TypeScript implementation string
 * that can be injected into the translated output. These shims approximate
 * POSIX semantics using Node.js APIs.
 *
 * This file is separate from shim-database.ts to avoid merge conflicts;
 * it can be merged into shim-database later.
 */

export const posixShims: Record<string, string> = {

  // =========================================================================
  // 8A.1: Filesystem — getcwd, chdir, access, unlink, rmdir, mkdir
  // =========================================================================

  getcwd: `function getcwd(): string { return process.cwd(); }`,

  chdir: `function chdir(path: string): number { try { process.chdir(path); return 0; } catch { return -1; } }`,

  access: `function access(path: string, mode: number): number {
  const fs = require('fs');
  try { fs.accessSync(path, mode); return 0; }
  catch (e: any) {
    if (e && e.code === 'ENOENT') errno = 2;
    else if (e && e.code === 'EACCES') errno = 13;
    else errno = 13;
    return -1;
  }
}`,

  unlink: `function unlink(path: string): number {
  const fs = require('fs');
  try { fs.unlinkSync(path); return 0; }
  catch (e: any) {
    if (e && e.code === 'ENOENT') errno = 2;
    else if (e && e.code === 'EISDIR') errno = 21;
    else errno = 13;
    return -1;
  }
}`,

  rmdir: `function rmdir(path: string): number {
  const fs = require('fs');
  try { fs.rmdirSync(path); return 0; }
  catch (e: any) {
    if (e && (e.code === 'ENOTEMPTY' || e.code === 'EEXIST')) errno = 39;
    else if (e && e.code === 'ENOENT') errno = 2;
    else errno = 13;
    return -1;
  }
}`,

  mkdir: `function mkdir(path: string, mode: number = 0o777): number {
  const fs = require('fs');
  try { fs.mkdirSync(path, { mode }); return 0; }
  catch (e: any) {
    if (e && e.code === 'EEXIST') errno = 17;
    else if (e && e.code === 'ENOENT') errno = 2;
    else errno = 13;
    return -1;
  }
}`,

  // =========================================================================
  // 8A.2: Directory traversal — opendir, readdir, closedir
  // =========================================================================

  opendir: `function opendir(path: string): any {
  const fs = require('fs');
  try {
    const entries = fs.readdirSync(path);
    return { _entries: entries, _idx: 0, _path: path };
  } catch { return null; }
}`,

  readdir: `function readdir(dir: any): any {
  if (!dir || dir._idx >= dir._entries.length) return null;
  const name = dir._entries[dir._idx++];
  return { d_name: name };
}`,

  closedir: `function closedir(dir: any): number { return 0; }`,

  // =========================================================================
  // 8A.3: Process info — getpid, getppid, isatty
  // =========================================================================

  getpid: `function getpid(): number { return process.pid; }`,

  getppid: `function getppid(): number { return (process as any).ppid ?? 0; }`,

  isatty: `function isatty(fd: number): number {
  const tty = require('tty');
  if (fd === 0) return tty.isatty(0) ? 1 : 0;
  if (fd === 1) return tty.isatty(1) ? 1 : 0;
  if (fd === 2) return tty.isatty(2) ? 1 : 0;
  return 0;
}`,

  // =========================================================================
  // 8A.4: Timing — sleep, usleep
  // =========================================================================

  sleep: `function sleep(seconds: number): number {
  const start = Date.now();
  while (Date.now() - start < seconds * 1000) { /* busy wait */ }
  return 0;
}`,

  usleep: `function usleep(usec: number): number {
  const start = Date.now();
  const ms = usec / 1000;
  while (Date.now() - start < ms) { /* busy wait */ }
  return 0;
}`,

  // =========================================================================
  // 8B.1: Byte order — htons, htonl, ntohs, ntohl
  // =========================================================================

  htons: `function htons(val: number): number {
  return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
}`,

  htonl: `function htonl(val: number): number {
  return (((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF)) >>> 0;
}`,

  ntohs: `function ntohs(val: number): number { return htons(val); }`,

  ntohl: `function ntohl(val: number): number { return htonl(val); }`,

  // =========================================================================
  // 8B.2: IP address conversion — inet_pton, inet_ntop, inet_addr, inet_ntoa
  // =========================================================================

  inet_pton: `function inet_pton(af: number, src: string, dst: any): number {
  // AF_INET = 2
  if (af === 2) {
    const parts = src.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return 0;
    if (dst && dst.buf) { for (let i = 0; i < 4; i++) dst.buf[dst.off + i] = parts[i]; }
    return 1;
  }
  return 0;
}`,

  inet_ntop: `function inet_ntop(af: number, src: any): string | null {
  if (af === 2) {
    if (src && src.buf) return \`\${src.buf[src.off]}.\${src.buf[src.off+1]}.\${src.buf[src.off+2]}.\${src.buf[src.off+3]}\`;
    return null;
  }
  return null;
}`,

  inet_addr: `function inet_addr(cp: string): number {
  const parts = cp.split('.').map(Number);
  if (parts.length !== 4) return 0xFFFFFFFF;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}`,

  inet_ntoa: `function inet_ntoa(addr: number): string {
  return \`\${(addr >>> 24) & 0xFF}.\${(addr >>> 16) & 0xFF}.\${(addr >>> 8) & 0xFF}.\${addr & 0xFF}\`;
}`,

  // =========================================================================
  // 8B.3: DNS — getaddrinfo, freeaddrinfo, gethostbyname
  // =========================================================================

  getaddrinfo: `function getaddrinfo(node: string | null, service: string | null, hints: any, res: any): number {
  // POSIX §getaddrinfo — IEEE Std 1003.1-2017 <netdb.h>.
  // Synchronous resolver: handles numeric IPv4/IPv6 literals and the loopback
  // alias "localhost". Real DNS requires Node dns.lookup which is async
  // (BLOCKING-EMULATION-PENDING); out of scope for this skeleton.
  const host = typeof node === 'string' ? node : (node && node.buf ? cptr_to_string(node) : null);
  const svc  = typeof service === 'string' ? service : (service && service.buf ? cptr_to_string(service) : null);
  const family   = hints?.ai_family ?? 0;
  const socktype = hints?.ai_socktype ?? 1;
  const protocol = hints?.ai_protocol ?? 0;
  let port = 0;
  if (svc) { const n = Number(svc); if (Number.isInteger(n) && n >= 0 && n < 65536) port = n; else return -2; /* EAI_NONAME */ }
  const out: any[] = [];
  const isIPv4 = (a: string) => /^\\d+\\.\\d+\\.\\d+\\.\\d+$/.test(a);
  const isIPv6 = (a: string) => a.indexOf(':') >= 0;
  const pushV4 = (a: string) => out.push({ ai_family: 2, ai_socktype: socktype, ai_protocol: protocol, ai_addr: { family: 2, sin_family: 2, addr: a, sin_port: port, port }, ai_canonname: host });
  const pushV6 = (a: string) => out.push({ ai_family: 10, ai_socktype: socktype, ai_protocol: protocol, ai_addr: { family: 10, sin_family: 10, addr: a, sin_port: port, port }, ai_canonname: host });
  const h = host ?? (hints && hints.ai_flags && (hints.ai_flags & 1) ? "0.0.0.0" : "127.0.0.1");
  if (h === "localhost") { if (family === 0 || family === 2) pushV4("127.0.0.1"); if (family === 0 || family === 10) pushV6("::1"); }
  else if (isIPv6(h)) { if (family === 0 || family === 10) pushV6(h); }
  else if (isIPv4(h)) { if (family === 0 || family === 2)  pushV4(h); }
  if (out.length === 0) return -2;
  // Link them: res is a pointer-to-pointer; write the head entry.
  if (res) {
    // Treat res as a ref-box { value } or a CPtr; store the array.
    if ('value' in res) res.value = out;
    else if (res.buf) { /* Can't store object into byte buffer — callers that
       read the list should use {value:...} ref-box form from the translator. */
    } else { Object.assign(res, out[0]); res._list = out; }
  }
  return 0;
}`,

  freeaddrinfo: `function freeaddrinfo(res: any): void { /* no-op — GC cleans the list */ }`,

  gethostbyname: `function gethostbyname(name: string): any {
  // POSIX §gethostbyname (obsolescent, retained per XNS 5.2). Loopback only.
  const h = typeof name === 'string' ? name : (name && name.buf ? cptr_to_string(name) : "");
  if (h === "localhost") return { h_name: "localhost", h_aliases: [], h_addrtype: 2, h_length: 4, h_addr_list: [new Uint8Array([127,0,0,1])] };
  if (/^\\d+\\.\\d+\\.\\d+\\.\\d+$/.test(h)) { const p = h.split('.').map(Number); return { h_name: h, h_aliases: [], h_addrtype: 2, h_length: 4, h_addr_list: [new Uint8Array(p)] }; }
  return null;
}`,

  // =========================================================================
  // 8C.1: I/O multiplexing — select, poll, FD_* macros
  // =========================================================================

  select: `function select(nfds: number, readfds: any, writefds: any, exceptfds: any, timeout: any): number {
  /* Approximates Mirage: all in-memory fds are always "ready". Only marks bits
     for fds < nfds that were already set; unknown fds are cleared. */
  let ready = 0;
  for (let fd = 0; fd < nfds; fd++) {
    if (readfds && readfds._bits && readfds._bits.has(fd)) ready++;
    if (writefds && writefds._bits && writefds._bits.has(fd)) ready++;
  }
  /* exceptfds cleared of all bits (no exceptional conditions) */
  if (exceptfds && exceptfds._bits) exceptfds._bits.clear();
  return ready;
}`,

  poll: `function poll(fds: any, nfds: number, timeout: number): number {
  /* POLLIN=0x001 POLLPRI=0x002 POLLOUT=0x004 POLLERR=0x008 POLLHUP=0x010 POLLNVAL=0x020 */
  const reg: Map<number, any> = (globalThis as any).__posix_fdreg ?? new Map();
  let ready = 0;
  const arr = (fds && fds.buf) ? fds.buf : (Array.isArray(fds) ? fds : null);
  if (!arr) return 0;
  for (let i = 0; i < nfds; i++) {
    const entry = Array.isArray(arr) ? arr[i] : arr[i];
    if (!entry) continue;
    const fd = entry.fd ?? -1;
    const events = entry.events ?? 0;
    let revents = 0;
    if (fd < 0) { entry.revents = 0; continue; }
    const isKnown = reg.has(fd) || fd === 0 || fd === 1 || fd === 2;
    if (!isKnown) {
      revents = 0x020; /* POLLNVAL */
    } else {
      if (events & 0x001) revents |= 0x001; /* POLLIN ready */
      if (events & 0x004) revents |= 0x004; /* POLLOUT ready */
    }
    entry.revents = revents;
    if (revents !== 0) ready++;
  }
  return ready;
}`,

  FD_ZERO: `function FD_ZERO(set: any): void { if (set) { set._bits = new Set(); } }`,
  FD_SET: `function FD_SET(fd: number, set: any): void { if (set && set._bits) set._bits.add(fd); }`,
  FD_CLR: `function FD_CLR(fd: number, set: any): void { if (set && set._bits) set._bits.delete(fd); }`,
  FD_ISSET: `function FD_ISSET(fd: number, set: any): boolean { return !!(set && set._bits && set._bits.has(fd)); }`,

  // =========================================================================
  // 8D.1: Signals — signal, raise, kill, sigaction
  // =========================================================================

  signal: `function signal(signum: number, handler: any): any {
  /* signal stub — limited signal support in Node.js */
  return null; /* SIG_DFL */
}`,

  raise: `function raise(sig: number): number {
  process.kill(process.pid, sig);
  return 0;
}`,

  kill: `function kill(pid: number, sig: number): number {
  try { process.kill(pid, sig); return 0; } catch { return -1; }
}`,

  sigaction: `function sigaction(signum: number, act: any, oldact: any): number {
  /* sigaction stub */
  return 0;
}`,

  // =========================================================================
  // 8E.1: File descriptors — dup, dup2, fcntl, creat, fstat, lstat, chmod, umask
  // =========================================================================

  dup: `function dup(fd: number): number {
  /* Allocate lowest available fd >= 3 that aliases the same resource.
     Uses globalThis-shared fd-registry; each entry is {resource, flags}. */
  const reg: Map<number, any> = (globalThis as any).__posix_fdreg ?? ((globalThis as any).__posix_fdreg = new Map());
  const src = reg.get(fd);
  if (src === undefined && fd > 2) { errno = 9; /* EBADF */ return -1; }
  let nfd = 3;
  while (reg.has(nfd)) nfd++;
  reg.set(nfd, src !== undefined ? { ...src } : { resource: { kind: 'std', fd }, flags: 0 });
  return nfd;
}`,

  dup2: `function dup2(oldfd: number, newfd: number): number {
  const reg: Map<number, any> = (globalThis as any).__posix_fdreg ?? ((globalThis as any).__posix_fdreg = new Map());
  const src = reg.get(oldfd);
  if (src === undefined && oldfd > 2) { errno = 9; /* EBADF */ return -1; }
  if (oldfd === newfd) return newfd;
  /* Close newfd if open (silently) */
  reg.delete(newfd);
  reg.set(newfd, src !== undefined ? { ...src } : { resource: { kind: 'std', fd: oldfd }, flags: 0 });
  return newfd;
}`,

  fcntl: `function fcntl(fd: number, cmd: number, ...args: any[]): number {
  /* F_DUPFD=0 F_GETFD=1 F_SETFD=2 F_GETFL=3 F_SETFL=4 F_DUPFD_CLOEXEC=1030 */
  const reg: Map<number, any> = (globalThis as any).__posix_fdreg ?? ((globalThis as any).__posix_fdreg = new Map());
  let entry = reg.get(fd);
  if (!entry && fd >= 0 && fd <= 2) { entry = { resource: { kind: 'std', fd }, flags: 0, fl: 0 }; reg.set(fd, entry); }
  if (!entry) { errno = 9; return -1; }
  const arg = args[0] ?? 0;
  if (cmd === 1) { /* F_GETFD */
    return entry.flags | 0;
  } else if (cmd === 2) { /* F_SETFD */
    entry.flags = arg | 0;
    return 0;
  } else if (cmd === 3) { /* F_GETFL */
    return entry.fl | 0;
  } else if (cmd === 4) { /* F_SETFL */
    entry.fl = arg | 0;
    return 0;
  } else if (cmd === 0 || cmd === 1030) { /* F_DUPFD / F_DUPFD_CLOEXEC */
    let nfd = (arg | 0) < 3 ? 3 : (arg | 0);
    while (reg.has(nfd)) nfd++;
    const copy = { ...entry };
    if (cmd === 1030) copy.flags = (copy.flags | 1); /* FD_CLOEXEC=1 */
    reg.set(nfd, copy);
    return nfd;
  }
  errno = 22; /* EINVAL */
  return -1;
}`,

  creat: `function creat(path: string, mode: number): number {
  const fs = require('fs');
  try { return fs.openSync(path, 'w', mode); } catch { return -1; }
}`,

  fstat: `function fstat(fd: number, buf: any): number {
  const fs = require('fs');
  try {
    /* Resolve through registered fd-registry first; fall back to raw node fd. */
    const reg: Map<number, any> = (globalThis as any).__posix_fdreg ?? new Map();
    const entry = reg.get(fd);
    let nodeFd = fd;
    if (entry && entry.resource && typeof entry.resource.nodeFd === 'number') nodeFd = entry.resource.nodeFd;
    const stat = fs.fstatSync(nodeFd);
    if (buf) { buf.st_size = stat.size; buf.st_mode = stat.mode; buf.st_mtime = Math.floor(stat.mtimeMs / 1000); buf.st_atime = Math.floor(stat.atimeMs / 1000); buf.st_ctime = Math.floor(stat.ctimeMs / 1000); buf.st_uid = stat.uid; buf.st_gid = stat.gid; buf.st_ino = stat.ino; buf.st_nlink = stat.nlink; buf.st_dev = stat.dev; }
    return 0;
  } catch (e: any) { errno = 9; /* EBADF */ return -1; }
}`,

  lstat: `function lstat(path: string, buf: any): number {
  const fs = require('fs');
  try {
    const stat = fs.lstatSync(path);
    if (buf) { buf.st_size = stat.size; buf.st_mode = stat.mode; buf.st_mtime = Math.floor(stat.mtimeMs / 1000); buf.st_atime = Math.floor(stat.atimeMs / 1000); buf.st_ctime = Math.floor(stat.ctimeMs / 1000); buf.st_uid = stat.uid; buf.st_gid = stat.gid; buf.st_ino = stat.ino; buf.st_nlink = stat.nlink; buf.st_dev = stat.dev; }
    return 0;
  } catch { return -1; }
}`,

  stat: `function stat(path: string, buf: any): number {
  const fs = require('fs');
  try {
    const s = fs.statSync(path);
    if (buf) { buf.st_size = s.size; buf.st_mode = s.mode; buf.st_mtime = Math.floor(s.mtimeMs / 1000); buf.st_atime = Math.floor(s.atimeMs / 1000); buf.st_ctime = Math.floor(s.ctimeMs / 1000); buf.st_uid = s.uid; buf.st_gid = s.gid; buf.st_ino = s.ino; buf.st_nlink = s.nlink; buf.st_dev = s.dev; }
    return 0;
  } catch { return -1; }
}`,

  chmod: `function chmod(path: string, mode: number): number {
  const fs = require('fs');
  try { fs.chmodSync(path, mode); return 0; }
  catch (e: any) {
    if (e && e.code === 'ENOENT') errno = 2;
    else errno = 13;
    return -1;
  }
}`,

  umask: `function umask(mask: number): number {
  /* Track umask in module-local store + mirror to process for child processes. */
  const prev = (globalThis as any).__posix_umask ?? 0o022;
  (globalThis as any).__posix_umask = mask & 0o777;
  try { process.umask(mask); } catch {}
  return prev;
}`,

  // =========================================================================
  // 8F.1: Memory mapping — mmap, munmap, mprotect, msync, madvise.
  //       POSIX.1-2017 §3 <sys/mman.h>. See posix-runtime/src/posix/mman.ts for the
  //       Mirage-VFS-aware variant; the shims below are the standalone-Node
  //       fallback used when translated code runs without a mounted VFS.
  // =========================================================================

  // BRIDGE: posix-mmap — POSIX mmap → Uint8Array-backed CPtr {buf, off}.
  // MVP scope per CLAUDE.md / module header in posix-runtime/src/posix/mman.ts:
  //   * MAP_ANONYMOUS: full support (zero-filled buffer).
  //   * MAP_PRIVATE file: full support (read-only-for-program semantics —
  //     writes don't propagate back).
  //   * MAP_SHARED file: read at mmap time, write-back on msync/munmap if
  //     the fd is a real Node fd (legacy code path; MAP_SHARED VFS write-
  //     back deferred per task spec).
  //   * MAP_FIXED: rejected → MAP_FAILED (JS has no address-space control).
  mmap: `function mmap(addr: any, length: number, prot: number, flags: number, fd: number, offset: number): any {
  const MAP_SHARED = 1, MAP_PRIVATE = 2, MAP_FIXED = 0x10, MAP_ANONYMOUS = 0x20;
  /* POSIX §mmap p3: len == 0 ⇒ EINVAL. */
  if (!Number.isFinite(length) || length <= 0) { errno = 22; return null; }
  /* MAP_FIXED requires honouring \`addr\`; we cannot in JS, so fail explicitly
     rather than silently fall back. */
  if ((flags & MAP_FIXED) !== 0) { errno = 22; return null; }
  const buf = new Uint8Array(length);
  const regs: Map<any, any> = (globalThis as any).__posix_mmaps ?? ((globalThis as any).__posix_mmaps = new Map());
  const isAnon = (flags & MAP_ANONYMOUS) !== 0;
  if (!isAnon && fd >= 0) {
    const fs = require('fs');
    try {
      const fdreg: Map<number, any> = (globalThis as any).__posix_fdreg ?? new Map();
      const entry = fdreg.get(fd);
      let nodeFd = fd;
      if (entry && entry.resource && typeof entry.resource.nodeFd === 'number') nodeFd = entry.resource.nodeFd;
      const nodeBuf = Buffer.from(buf.buffer, buf.byteOffset, length);
      fs.readSync(nodeFd, nodeBuf, 0, length, offset);
    } catch { errno = 9; return null; /* MAP_FAILED */ }
  }
  regs.set(buf, { length, fd, offset, flags, prot, shared: (flags & MAP_SHARED) !== 0, anon: isAnon });
  return { buf, off: 0 };
}`,

  // BRIDGE: posix-munmap — POSIX munmap → Map.delete (+ optional MAP_SHARED
  // write-back via fs.writeSync). Calling munmap on an unknown address
  // returns -1 EINVAL per POSIX.
  munmap: `function munmap(addr: any, length: number): number {
  const regs: Map<any, any> = (globalThis as any).__posix_mmaps ?? new Map();
  const key = (addr && addr.buf) ? addr.buf : addr;
  const meta = regs.get(key);
  if (!meta) { errno = 22; /* EINVAL: unknown region */ return -1; }
  /* If MAP_SHARED with a backing fd, flush to disk before releasing. */
  if (meta.shared && !meta.anon && meta.fd >= 0) {
    try {
      const fs = require('fs');
      const fdreg: Map<number, any> = (globalThis as any).__posix_fdreg ?? new Map();
      const entry = fdreg.get(meta.fd);
      let nodeFd = meta.fd;
      if (entry && entry.resource && typeof entry.resource.nodeFd === 'number') nodeFd = entry.resource.nodeFd;
      const nodeBuf = Buffer.from(key.buffer, key.byteOffset, meta.length);
      fs.writeSync(nodeFd, nodeBuf, 0, meta.length, meta.offset);
    } catch {}
  }
  regs.delete(key);
  return 0;
}`,

  // BRIDGE: posix-msync — POSIX msync → fs.writeSync (MAP_SHARED) / no-op.
  msync: `function msync(addr: any, length: number, flags: number): number {
  const regs: Map<any, any> = (globalThis as any).__posix_mmaps ?? new Map();
  const key = (addr && addr.buf) ? addr.buf : addr;
  const meta = regs.get(key);
  if (!meta) { errno = 22; /* EINVAL */ return -1; }
  if (meta.shared && !meta.anon && meta.fd >= 0) {
    try {
      const fs = require('fs');
      const fdreg: Map<number, any> = (globalThis as any).__posix_fdreg ?? new Map();
      const entry = fdreg.get(meta.fd);
      let nodeFd = meta.fd;
      if (entry && entry.resource && typeof entry.resource.nodeFd === 'number') nodeFd = entry.resource.nodeFd;
      const nodeBuf = Buffer.from(key.buffer, key.byteOffset, Math.min(length, meta.length));
      fs.writeSync(nodeFd, nodeBuf, 0, Math.min(length, meta.length), meta.offset);
    } catch (e: any) { errno = 5; /* EIO */ return -1; }
  }
  return 0;
}`,

  // BRIDGE: posix-mprotect — POSIX mprotect → record-only bookkeeping
  // (JS cannot enforce protection bits on direct typed-array access).
  // Updates the prot field in the region record so msync/munmap and any
  // future MmapManager-backed checkAccess wrapper sees the new state.
  mprotect: `function mprotect(addr: any, len: number, prot: number): number {
  const regs: Map<any, any> = (globalThis as any).__posix_mmaps ?? new Map();
  const key = (addr && addr.buf) ? addr.buf : addr;
  const meta = regs.get(key);
  if (!meta) { errno = 22; /* EINVAL */ return -1; }
  /* POSIX: prot is bitwise-OR of PROT_NONE | PROT_READ | PROT_WRITE | PROT_EXEC. */
  const valid = 0 | 1 | 2 | 4;
  if ((prot & ~valid) !== 0) { errno = 22; return -1; }
  meta.prot = prot;
  return 0;
}`,

  // BRIDGE: posix-madvise — POSIX madvise → no-op (advisory hint only).
  // POSIX permits implementations to ignore advice entirely; JS has no
  // kernel to advise. Validates the address corresponds to a tracked region
  // and returns 0; -1 EINVAL otherwise.
  madvise: `function madvise(addr: any, length: number, advice: number): number {
  const regs: Map<any, any> = (globalThis as any).__posix_mmaps ?? new Map();
  const key = (addr && addr.buf) ? addr.buf : addr;
  if (!regs.has(key)) { errno = 22; return -1; }
  return 0;
}`,
  // posix_madvise (POSIX.1-2017 §posix_madvise) is the portable spelling;
  // semantics identical to the Linux madvise above.
  posix_madvise: `function posix_madvise(addr: any, length: number, advice: number): number {
  const regs: Map<any, any> = (globalThis as any).__posix_mmaps ?? new Map();
  const key = (addr && addr.buf) ? addr.buf : addr;
  if (!regs.has(key)) { return 22; /* posix_madvise returns errno directly. */ }
  return 0;
}`,

  // =========================================================================
  // 8F.2: Process control — wait, waitpid, exec*, alarm, pause
  // =========================================================================

  wait: `function wait(status: any): number {
  console.warn("wait: stub called — process control not fully supported");
  return -1;
}`,

  waitpid: `function waitpid(pid: number, status: any, options: number): number {
  console.warn("waitpid: stub called");
  return -1;
}`,

  execv: `function execv(path: string, argv: string[]): number {
  const cp = require('child_process');
  try { cp.execFileSync(path, argv.slice(1), { stdio: 'inherit' }); return 0; } catch { return -1; }
}`,

  execvp: `function execvp(file: string, argv: string[]): number {
  const cp = require('child_process');
  try { cp.execFileSync(file, argv.slice(1), { stdio: 'inherit' }); return 0; } catch { return -1; }
}`,

  execve: `function execve(path: string, argv: string[], envp: string[]): number {
  const cp = require('child_process');
  const env: Record<string, string> = {};
  for (const e of envp) { const [k, ...v] = e.split('='); env[k] = v.join('='); }
  try { cp.execFileSync(path, argv.slice(1), { stdio: 'inherit', env }); return 0; } catch { return -1; }
}`,

  execl: `function execl(path: string, ...args: string[]): number {
  return execv(path, args);
}`,

  execlp: `function execlp(file: string, ...args: string[]): number {
  return execvp(file, args);
}`,

  fork: `function fork(): number {
  console.warn("fork: stub — process forking not supported in Node.js");
  return -1;
}`,

  alarm: `function alarm(seconds: number): number {
  /* alarm stub — approximate via setTimeout */
  if (seconds > 0) setTimeout(() => { process.kill(process.pid, 'SIGALRM'); }, seconds * 1000);
  return 0;
}`,

  pause: `function pause(): number {
  /* pause stub — blocks synchronously (approximate) */
  const start = Date.now();
  while (Date.now() - start < 60000) { /* wait up to 60s */ }
  return -1;
}`,

  // =========================================================================
  // 8G.1: BSD sockets — in-process TCP/UDP loopback
  //
  // IEEE Std 1003.1-2017 <sys/socket.h>, <netinet/in.h>, <netdb.h>.
  // RFC 1122 (Requirements for Internet Hosts — Communication Layers).
  //
  // Implementation model — SYNCHRONOUS IN-PROCESS LOOPBACK.
  // ------------------------------------------------------
  // Node's sockets (net/dgram) are fundamentally ASYNCHRONOUS, and POSIX
  // BSD sockets are SYNCHRONOUS. Translated C code calls e.g. recv() and
  // expects to block until bytes arrive. We cannot emulate true blocking
  // semantics from a Promise-returning Node socket without blocking the
  // event loop (requires SharedArrayBuffer + Atomics.wait on a worker —
  // BLOCKING-EMULATION-PENDING, tracked separately).
  //
  // For this round we implement a self-contained synchronous in-memory
  // TCP/UDP stack on 127.0.0.1/::1 (mirrors the posix-runtime NetworkStack
  // design). Translated C programs that talk to themselves or to another
  // in-process peer (test harnesses, protocol round-trips) work. Real
  // remote-host connections are NOT supported by these shims.
  //
  // The shim state is attached to globalThis so every shim in the same
  // translated module shares one stack.
  // =========================================================================

  __net_stack: `/*__net_stack preamble — shared in-process TCP/UDP loopback state.
  AF_INET=2 AF_INET6=10 SOCK_STREAM=1 SOCK_DGRAM=2 IPPROTO_TCP=6 IPPROTO_UDP=17
  errno values: EAGAIN=11 EINVAL=22 ENOTSOCK=88 EAFNOSUPPORT=97 EADDRINUSE=98
  ECONNREFUSED=111 ENOTCONN=107. */
const __net = (() => {
  const g: any = globalThis as any;
  if (g.__posixRuntime_net) return g.__posixRuntime_net;
  const sockets: Map<number, any> = new Map();
  const listeners: Map<string, any> = new Map();
  const udpBinds: Map<string, any> = new Map();
  const state = { nextId: 3, ephemeral: 49152, sockets, listeners, udpBinds };
  const keyOf = (sa: any) => {
    const host = (sa.addr === "0.0.0.0" || sa.addr === "::") ? "127.0.0.1" : sa.addr;
    return \`\${sa.family}:\${host}:\${sa.port}\`;
  };
  const parseSockAddr = (addr: any): { family: number; addr: string; port: number } | null => {
    // struct sockaddr_in / sockaddr_in6 as emitted by our translator.
    // Accept: {sin_family, sin_port, sin_addr:{s_addr}} plain object; a
    // CPtr view into a contiguous buffer; or an already-parsed SockAddr.
    if (!addr) return null;
    if (typeof addr === 'object' && 'family' in addr && 'addr' in addr && 'port' in addr) return addr;
    if (addr.buf && typeof addr.off === 'number') {
      const dv = new DataView(addr.buf.buffer, addr.buf.byteOffset + addr.off);
      const family = dv.getUint16(0, true);
      if (family === 2) { // AF_INET; sockaddr_in { sa_family:2, sin_port:2 (net BE), sin_addr:4 (net BE) }
        const port = dv.getUint16(2, false);
        const a = addr.buf[addr.off + 4], b = addr.buf[addr.off + 5], c = addr.buf[addr.off + 6], d = addr.buf[addr.off + 7];
        return { family: 2, addr: \`\${a}.\${b}.\${c}.\${d}\`, port };
      }
      return null;
    }
    if (typeof addr === 'object') {
      const family = addr.sin_family ?? addr.sa_family ?? addr.family ?? 2;
      // sin_port is stored in network byte order; htons/ntohs handle the swap
      // at the C source level. We accept either orientation.
      const p = addr.sin_port ?? addr.port ?? 0;
      // sin_addr may be {s_addr: n} (network byte order uint32) or a string.
      let a = addr.addr;
      if (!a && addr.sin_addr) {
        const s = addr.sin_addr.s_addr ?? addr.sin_addr;
        if (typeof s === 'number') {
          // Network byte order uint32 — big-endian decomposition.
          a = \`\${(s >>> 24) & 0xff}.\${(s >>> 16) & 0xff}.\${(s >>> 8) & 0xff}.\${s & 0xff}\`;
        } else {
          a = String(s);
        }
      }
      return { family, addr: a ?? "127.0.0.1", port: p };
    }
    return null;
  };
  const newSock = (family: number, type: number, protocol: number) => {
    const id = state.nextId++;
    const s: any = {
      id, family, type, protocol,
      bound: null as any, listening: false, backlog: 0, pendingAccepts: [] as any[],
      peer: null as any, peerAddr: null as any,
      rxBytes: [] as Uint8Array[], rxEof: false,
      rxDatagrams: [] as any[],
      closed: false, shutWr: false, shutRd: false,
      opts: new Map<number, number>(),
    };
    sockets.set(id, s);
    return s;
  };
  const rxAvail = (s: any): number => { let t = 0; for (const c of s.rxBytes) t += c.length; return t; };
  const rxPull = (s: any, n: number): Uint8Array => {
    if (s.rxBytes.length === 0) return new Uint8Array(0);
    const first = s.rxBytes[0];
    if (first.length <= n) { s.rxBytes.shift(); return first; }
    const head = first.subarray(0, n).slice();
    s.rxBytes[0] = first.subarray(n);
    return head;
  };
  g.__posixRuntime_net = { state, keyOf, parseSockAddr, newSock, rxAvail, rxPull };
  return g.__posixRuntime_net;
})();`,

  socket: `function socket(domain: number, type: number, protocol: number): number {
  // POSIX §socket — IEEE Std 1003.1-2017. Returns fd >= 0 on success, -1 on error.
  if (domain !== 2 && domain !== 10 && domain !== 1) { errno = 97 /* EAFNOSUPPORT */; return -1; }
  if (type !== 1 && type !== 2) { errno = 22 /* EINVAL */; return -1; }
  return __net.newSock(domain, type, protocol).id;
}`,

  bind: `function bind(sockfd: number, addr: any, addrlen: number): number {
  // POSIX §bind — IEEE Std 1003.1-2017.
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88 /* ENOTSOCK */; return -1; }
  const sa = __net.parseSockAddr(addr);
  if (!sa) { errno = 22; return -1; }
  let port = sa.port;
  if (port === 0) port = __net.state.ephemeral++;
  const bound = { family: sa.family, addr: sa.addr, port };
  const k = __net.keyOf(bound);
  if (s.type === 1 /* SOCK_STREAM */) {
    if (__net.state.listeners.has(k)) { errno = 98 /* EADDRINUSE */; return -1; }
  } else if (s.type === 2 /* SOCK_DGRAM */) {
    if (__net.state.udpBinds.has(k)) { errno = 98; return -1; }
    __net.state.udpBinds.set(k, s);
  }
  s.bound = bound;
  return 0;
}`,

  listen: `function listen(sockfd: number, backlog: number): number {
  // POSIX §listen.
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88; return -1; }
  if (s.type !== 1) { errno = 22; return -1; }
  if (!s.bound) { errno = 22; return -1; }
  s.listening = true;
  s.backlog = Math.max(1, backlog);
  __net.state.listeners.set(__net.keyOf(s.bound), s);
  return 0;
}`,

  accept: `function accept(sockfd: number, addr: any, addrlen: any): number {
  // POSIX §accept. In single-threaded JS we cannot truly block; non-blocking
  // semantics are implicit. In-process connect() has already enqueued the
  // accept synchronously, so this resolves immediately for local round-trips.
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88; return -1; }
  if (!s.listening) { errno = 22; return -1; }
  const child = s.pendingAccepts.shift();
  if (!child) { errno = 11 /* EAGAIN */; return -1; }
  // Write peer addr back into sockaddr_in if caller provided one.
  if (addr && child.peerAddr) {
    if (addr.buf) {
      const dv = new DataView(addr.buf.buffer, addr.buf.byteOffset + addr.off);
      dv.setUint16(0, child.peerAddr.family, true);
      dv.setUint16(2, child.peerAddr.port, false);
      const parts = String(child.peerAddr.addr).split('.').map((x: string) => +x);
      for (let i = 0; i < 4; i++) addr.buf[addr.off + 4 + i] = parts[i] || 0;
    } else if (typeof addr === 'object') {
      addr.sin_family = child.peerAddr.family;
      addr.sin_port = child.peerAddr.port;
      addr.addr = child.peerAddr.addr;
    }
  }
  return child.id;
}`,

  connect: `function connect(sockfd: number, addr: any, addrlen: number): number {
  // POSIX §connect.
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88; return -1; }
  const sa = __net.parseSockAddr(addr);
  if (!sa) { errno = 22; return -1; }
  if (s.type === 2 /* SOCK_DGRAM */) { s.peerAddr = { ...sa }; return 0; }
  if (s.type !== 1) { errno = 22; return -1; }
  const listener = __net.state.listeners.get(__net.keyOf(sa));
  if (!listener) { errno = 111 /* ECONNREFUSED */; return -1; }
  if (listener.pendingAccepts.length >= listener.backlog) { errno = 111; return -1; }
  if (!s.bound) {
    s.bound = { family: s.family, addr: s.family === 10 ? "::1" : "127.0.0.1", port: __net.state.ephemeral++ };
  }
  const serverSide = __net.newSock(listener.family, listener.type, listener.protocol);
  serverSide.bound = { ...listener.bound };
  serverSide.peer = s;
  serverSide.peerAddr = { ...s.bound };
  s.peer = serverSide;
  s.peerAddr = { ...sa };
  listener.pendingAccepts.push(serverSide);
  return 0;
}`,

  send: `function send(sockfd: number, buf: any, len: number, flags: number): number {
  // POSIX §send. Returns bytes sent, or -1 on error.
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88; return -1; }
  // Normalise buf → Uint8Array of length 'len'.
  let data: Uint8Array;
  if (buf instanceof Uint8Array) data = buf.subarray(0, len);
  else if (buf && buf.buf) data = buf.buf.subarray(buf.off, buf.off + len);
  else if (typeof buf === 'string') { const enc = new TextEncoder().encode(buf); data = enc.subarray(0, Math.min(len, enc.length)); }
  else if (Array.isArray(buf)) data = new Uint8Array(buf.slice(0, len));
  else { errno = 22; return -1; }
  if (s.type === 1) {
    if (!s.peer || s.shutWr) { errno = 107 /* ENOTCONN */; return -1; }
    s.peer.rxBytes.push(new Uint8Array(data));
    return data.length;
  }
  if (s.type === 2) {
    if (!s.peerAddr) { errno = 107; return -1; }
    return sendto(sockfd, buf, len, flags, s.peerAddr, 0);
  }
  errno = 22; return -1;
}`,

  recv: `function recv(sockfd: number, buf: any, len: number, flags: number): number {
  // POSIX §recv. Returns bytes received, 0 on EOF (peer closed), -1 on error.
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88; return -1; }
  if (s.type === 1) {
    if (!s.peer && __net.rxAvail(s) === 0) {
      if (s.rxEof) return 0;
      errno = 107; return -1;
    }
    const avail = __net.rxAvail(s);
    if (avail === 0) { if (s.rxEof) return 0; errno = 11; return -1; }
    const chunk = __net.rxPull(s, len);
    if (buf && buf.buf) { for (let i = 0; i < chunk.length; i++) buf.buf[buf.off + i] = chunk[i]; }
    else if (buf instanceof Uint8Array) { buf.set(chunk); }
    else if (Array.isArray(buf)) { for (let i = 0; i < chunk.length; i++) buf[i] = chunk[i]; }
    return chunk.length;
  }
  if (s.type === 2) {
    const dg = s.rxDatagrams.shift();
    if (!dg) { errno = 11; return -1; }
    const out = dg.data.length > len ? dg.data.subarray(0, len) : dg.data;
    if (buf && buf.buf) { for (let i = 0; i < out.length; i++) buf.buf[buf.off + i] = out[i]; }
    else if (buf instanceof Uint8Array) { buf.set(out); }
    return out.length;
  }
  errno = 22; return -1;
}`,

  sendto: `function sendto(sockfd: number, buf: any, len: number, flags: number, dest_addr: any, addrlen: number): number {
  // POSIX §sendto (UDP).
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88; return -1; }
  if (s.type !== 2) { errno = 22; return -1; }
  const sa = __net.parseSockAddr(dest_addr);
  if (!sa) { errno = 22; return -1; }
  let data: Uint8Array;
  if (buf instanceof Uint8Array) data = buf.subarray(0, len);
  else if (buf && buf.buf) data = buf.buf.subarray(buf.off, buf.off + len);
  else if (typeof buf === 'string') { const enc = new TextEncoder().encode(buf); data = enc.subarray(0, Math.min(len, enc.length)); }
  else if (Array.isArray(buf)) data = new Uint8Array(buf.slice(0, len));
  else { errno = 22; return -1; }
  if (!s.bound) {
    s.bound = { family: s.family, addr: s.family === 10 ? "::1" : "127.0.0.1", port: __net.state.ephemeral++ };
    __net.state.udpBinds.set(__net.keyOf(s.bound), s);
  }
  const target = __net.state.udpBinds.get(__net.keyOf(sa));
  if (!target) return data.length; /* UDP: silent drop */
  target.rxDatagrams.push({ from: { ...s.bound }, data: new Uint8Array(data) });
  return data.length;
}`,

  recvfrom: `function recvfrom(sockfd: number, buf: any, len: number, flags: number, src_addr: any, addrlen: any): number {
  // POSIX §recvfrom (UDP).
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88; return -1; }
  if (s.type !== 2) { errno = 22; return -1; }
  const dg = s.rxDatagrams.shift();
  if (!dg) { errno = 11; return -1; }
  const out = dg.data.length > len ? dg.data.subarray(0, len) : dg.data;
  if (buf && buf.buf) { for (let i = 0; i < out.length; i++) buf.buf[buf.off + i] = out[i]; }
  else if (buf instanceof Uint8Array) { buf.set(out); }
  if (src_addr) {
    if (src_addr.buf) {
      const dv = new DataView(src_addr.buf.buffer, src_addr.buf.byteOffset + src_addr.off);
      dv.setUint16(0, dg.from.family, true);
      dv.setUint16(2, dg.from.port, false);
      const parts = String(dg.from.addr).split('.').map((x: string) => +x);
      for (let i = 0; i < 4; i++) src_addr.buf[src_addr.off + 4 + i] = parts[i] || 0;
    } else if (typeof src_addr === 'object') {
      src_addr.sin_family = dg.from.family;
      src_addr.sin_port = dg.from.port;
      src_addr.addr = dg.from.addr;
    }
  }
  return out.length;
}`,

  setsockopt: `function setsockopt(sockfd: number, level: number, optname: number, optval: any, optlen: number): number {
  // POSIX §setsockopt. Cooperative: stores opt for later getsockopt readback.
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88; return -1; }
  let v = 0;
  if (typeof optval === 'number') v = optval;
  else if (optval && optval.buf) v = optval.buf[optval.off] | 0;
  else if (optval && typeof optval === 'object' && 'value' in optval) v = +optval.value | 0;
  s.opts.set(optname, v);
  return 0;
}`,

  getsockopt: `function getsockopt(sockfd: number, level: number, optname: number, optval: any, optlen: any): number {
  // POSIX §getsockopt. Synthesises SO_TYPE/SO_ERROR; otherwise returns stored.
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88; return -1; }
  let v = 0;
  if (optname === 3 /* SO_TYPE */) v = s.type;
  else if (optname === 4 /* SO_ERROR */) v = 0;
  else v = s.opts.get(optname) ?? 0;
  if (optval && optval.buf) {
    const dv = new DataView(optval.buf.buffer, optval.buf.byteOffset + optval.off);
    dv.setInt32(0, v, true);
  } else if (optval && typeof optval === 'object' && 'value' in optval) {
    optval.value = v;
  }
  return 0;
}`,

  shutdown: `function shutdown(sockfd: number, how: number): number {
  // POSIX §shutdown.
  const s = __net.state.sockets.get(sockfd);
  if (!s) { errno = 88; return -1; }
  if (how === 0 /* SHUT_RD */ || how === 2 /* SHUT_RDWR */) s.shutRd = true;
  if (how === 1 /* SHUT_WR */ || how === 2) {
    s.shutWr = true;
    if (s.peer) s.peer.rxEof = true;
  }
  return 0;
}`,

  getsockname: `function getsockname(sockfd: number, addr: any, addrlen: any): number {
  // POSIX §getsockname.
  const s = __net.state.sockets.get(sockfd);
  if (!s || !s.bound) { errno = 88; return -1; }
  if (addr && addr.buf) {
    const dv = new DataView(addr.buf.buffer, addr.buf.byteOffset + addr.off);
    dv.setUint16(0, s.bound.family, true);
    dv.setUint16(2, s.bound.port, false);
    const parts = String(s.bound.addr).split('.').map((x: string) => +x);
    for (let i = 0; i < 4; i++) addr.buf[addr.off + 4 + i] = parts[i] || 0;
  } else if (addr && typeof addr === 'object') {
    addr.sin_family = s.bound.family;
    addr.sin_port = s.bound.port;
    addr.addr = s.bound.addr;
  }
  return 0;
}`,

  getpeername: `function getpeername(sockfd: number, addr: any, addrlen: any): number {
  // POSIX §getpeername.
  const s = __net.state.sockets.get(sockfd);
  if (!s || !s.peerAddr) { errno = 88; return -1; }
  if (addr && addr.buf) {
    const dv = new DataView(addr.buf.buffer, addr.buf.byteOffset + addr.off);
    dv.setUint16(0, s.peerAddr.family, true);
    dv.setUint16(2, s.peerAddr.port, false);
    const parts = String(s.peerAddr.addr).split('.').map((x: string) => +x);
    for (let i = 0; i < 4; i++) addr.buf[addr.off + 4 + i] = parts[i] || 0;
  } else if (addr && typeof addr === 'object') {
    addr.sin_family = s.peerAddr.family;
    addr.sin_port = s.peerAddr.port;
    addr.addr = s.peerAddr.addr;
  }
  return 0;
}`,

  close_fd: `function close_fd(fd: number): number {
  const fs = require('fs');
  try { fs.closeSync(fd); return 0; } catch { return -1; }
}`,

  // =========================================================================
  // 8G.2: Dynamic loading — dlopen, dlsym, dlclose, dlerror
  //
  // POSIX.1-2017 <dlfcn.h>:
  //   void *dlopen(const char *file, int mode);   // RTLD_LAZY/NOW/GLOBAL/LOCAL
  //   void *dlsym(void *handle, const char *name);
  //   int   dlclose(void *handle);                // 0 on success
  //   char *dlerror(void);                        // last error, NULL after read
  //
  // BRIDGE: dlfcn-registry — JavaScript modules are statically linked at
  // translation time, so we cannot truly load a shared object at runtime. The
  // lowering below implements a registry shim: a host program (or a
  // pre-translation step) registers a TypeScript module's exports object under
  // a logical "library name" via globalThis.__dlfcn_register(name, exports);
  // dlopen() then returns that registered handle. Unregistered names fail with
  // a recorded error retrievable via dlerror(). RTLD_LAZY/RTLD_NOW/RTLD_GLOBAL/
  // RTLD_LOCAL flag bits are accepted but ignored — JS has no separable lazy/
  // eager binding step. dlerror() follows POSIX semantics: returns the last
  // error string and clears it (next call returns NULL until another call
  // fails). When `filename` is NULL, dlopen returns a pseudo-handle that
  // exposes the global symbol set (per POSIX: "a handle for the main
  // executable"); we model this as the globalThis object so dlsym(NULL_handle,
  // "name") finds top-level translated functions.
  // =========================================================================

  dlopen: `function dlopen(filename: any, flag: number): any {
  // POSIX.1-2017 §dlopen. Registry-backed shim — see BRIDGE: dlfcn-registry.
  const __g: any = globalThis as any;
  if (!__g.__dlfcn_state) {
    __g.__dlfcn_state = { registry: new Map<string, any>(), lastError: null as string | null };
    // Public registration API for hosts / pre-translation glue.
    __g.__dlfcn_register = (name: string, exportsObj: any): void => {
      __g.__dlfcn_state.registry.set(name, exportsObj);
    };
    __g.__dlfcn_unregister = (name: string): void => {
      __g.__dlfcn_state.registry.delete(name);
    };
  }
  const st = __g.__dlfcn_state;
  // POSIX: dlopen(NULL, ...) returns a handle to the main executable.
  if (filename === null || filename === undefined) {
    st.lastError = null;
    return { __dlfcn: true, __name: null, exports: __g };
  }
  const name: string = typeof filename === 'string'
    ? filename
    : (filename && filename.buf ? cptr_to_string(filename) : String(filename));
  // Try exact name, then strip ".so"/".so.N"/".dylib"/".dll" for refactor-friendly lookup.
  let mod = st.registry.get(name);
  if (mod === undefined) {
    const stripped = name.replace(/\\.(so(?:\\.[0-9]+)*|dylib|dll)$/i, '');
    if (stripped !== name) mod = st.registry.get(stripped);
  }
  if (mod === undefined) {
    // Soft-fallback: try Node require() so test harnesses that wire a real
    // .js module by path can use dlopen to pull it in. Failure here is silent
    // (we fall through to the registry-miss error path).
    try {
      const r = (typeof require === 'function') ? require(name) : null;
      if (r) { st.lastError = null; return { __dlfcn: true, __name: name, exports: r }; }
    } catch { /* ignore */ }
    st.lastError = name + ": cannot open shared object: not registered (use globalThis.__dlfcn_register to register a TS module)";
    return null;
  }
  st.lastError = null;
  return { __dlfcn: true, __name: name, exports: mod };
}`,

  dlsym: `function dlsym(handle: any, symbol: any): any {
  // POSIX.1-2017 §dlsym. Looks up \`symbol\` in the handle's exports map.
  // Returns NULL on miss and records an error retrievable via dlerror().
  const __g: any = globalThis as any;
  if (!__g.__dlfcn_state) __g.__dlfcn_state = { registry: new Map(), lastError: null };
  const st = __g.__dlfcn_state;
  const sym: string = typeof symbol === 'string'
    ? symbol
    : (symbol && symbol.buf ? cptr_to_string(symbol) : String(symbol));
  if (handle === null || handle === undefined) {
    st.lastError = "dlsym: handle is NULL";
    return null;
  }
  const exp = handle.exports ?? handle;
  const v = exp ? exp[sym] : undefined;
  if (v === undefined || v === null) {
    st.lastError = "undefined symbol: " + sym;
    return null;
  }
  st.lastError = null;
  return v;
}`,

  dlclose: `function dlclose(handle: any): number {
  // POSIX.1-2017 §dlclose. JS has no real release; returns 0 success
  // unconditionally (registry entries persist for re-open).
  const __g: any = globalThis as any;
  if (__g.__dlfcn_state) __g.__dlfcn_state.lastError = null;
  return 0;
}`,

  dlerror: `function dlerror(): any {
  // POSIX.1-2017 §dlerror. Returns the most recent dlfcn error string and
  // clears it (subsequent calls without a new error return NULL).
  const __g: any = globalThis as any;
  if (!__g.__dlfcn_state) return null;
  const st = __g.__dlfcn_state;
  const e = st.lastError;
  st.lastError = null;
  if (e === null || e === undefined) return null;
  return cptr_from_string(e);
}`,

  // dlfcn flag constants — POSIX.1-2017 <dlfcn.h>. Values are platform-defined;
  // these match common Linux/glibc values. Translated code only branches on
  // them; the runtime ignores the actual values.
  RTLD_LAZY: `const RTLD_LAZY = 0x0001;`,
  RTLD_NOW: `const RTLD_NOW = 0x0002;`,
  RTLD_GLOBAL: `const RTLD_GLOBAL = 0x0100;`,
  RTLD_LOCAL: `const RTLD_LOCAL = 0x0000;`,
  RTLD_NODELETE: `const RTLD_NODELETE = 0x1000;`,
  RTLD_NOLOAD: `const RTLD_NOLOAD = 0x0004;`,
  RTLD_DEFAULT: `const RTLD_DEFAULT: any = null;`,
  RTLD_NEXT: `const RTLD_NEXT: any = (-1);`,

  // =========================================================================
  // 8G.3: Threads — pthread stubs
  // =========================================================================

  pthread_create: `function pthread_create(thread: any, attr: any, start_routine: any, arg: any): number {
  // POSIX.1-2017 §3 pthread_create — single-threaded fallback. Allocates a
  // unique thread id into *thread and stores start_routine's return value in
  // a global retval map keyed by tid for pthread_join to retrieve.
  const __g = (globalThis as any);
  __g.__pthread_next_id = (__g.__pthread_next_id || 0) + 1;
  const __tid = __g.__pthread_next_id;
  if (thread && typeof thread === "object" && "value" in thread) { thread.value = __tid; }
  const __ret = start_routine(arg);
  __g.__pthread_retvals = __g.__pthread_retvals || new Map();
  __g.__pthread_retvals.set(__tid, __ret);
  return 0;
}`,

  pthread_join: `function pthread_join(thread: any, retval: any): number {
  // POSIX.1-2017 §3 pthread_join — reads the retval the matching
  // pthread_create stored in the global map and writes it through *retval.
  const __g = (globalThis as any);
  const __m = __g.__pthread_retvals;
  const __tid = (thread && typeof thread === "object" && "value" in thread) ? thread.value : thread;
  const __r = __m ? __m.get(__tid) : undefined;
  if (retval && typeof retval === "object" && "value" in retval) { retval.value = __r === undefined ? null : __r; }
  if (__m) __m.delete(__tid);
  return 0;
}`,

  pthread_detach: `function pthread_detach(thread: any): number { return 0; }`,

  pthread_self: `function pthread_self(): number { return 0; }`,

  pthread_equal: `function pthread_equal(t1: any, t2: any): number { return t1 === t2 ? 1 : 0; }`,

  pthread_mutex_init: `function pthread_mutex_init(mutex: any, attr: any): number { if (mutex) mutex._locked = false; return 0; }`,
  pthread_mutex_lock: `function pthread_mutex_lock(mutex: any): number { if (mutex) mutex._locked = true; return 0; }`,
  pthread_mutex_unlock: `function pthread_mutex_unlock(mutex: any): number { if (mutex) mutex._locked = false; return 0; }`,
  pthread_mutex_destroy: `function pthread_mutex_destroy(mutex: any): number { return 0; }`,
  pthread_mutex_trylock: `function pthread_mutex_trylock(mutex: any): number { if (mutex && !mutex._locked) { mutex._locked = true; return 0; } return 16; /* EBUSY */ }`,

  // pthread_cond_* / pthread_rwlock_* — wired through shim-database.ts
  // POSIX block to @c2typescript/concurrency. The findShimFull() lookup chain
  // is fullShimImplementations → shimDatabase → posixShims, so the database
  // entry wins; these no-op duplicates are removed.

  pthread_once: `function pthread_once(once_control: any, init_routine: () => void): number {
  // POSIX.1-2017 §3 pthread_once: first call invokes init_routine, subsequent
  // calls are no-ops. Single-threaded fallback uses a global Set keyed on
  // identity. PTHREAD_ONCE_INIT static-init expands to 0 (a primitive number),
  // so once_control may not be a usable identity key. POSIX requires the same
  // init_routine to be paired with the same once_control across all calls
  // (otherwise UB), so init_routine's Function identity is a sound key for
  // the single-threaded fallback. If once_control is an object, prefer it.
  const __g = (globalThis as any);
  __g.__pthread_once_done = __g.__pthread_once_done || new Set();
  const __k = (once_control && typeof once_control === "object") ? once_control : init_routine;
  if (!__g.__pthread_once_done.has(__k)) {
    __g.__pthread_once_done.add(__k);
    init_routine();
  }
  return 0;
}`,

  // pthread_key_create / pthread_key_delete / pthread_setspecific /
  // pthread_getspecific — retired; canonical impls now in shim-database.ts
  // POSIX block, delegating to @c2typescript/concurrency tls* (concurrency/src/tls.ts).

  // =========================================================================
  // 8G.4: Time functions — gettimeofday, clock_gettime, nanosleep, localtime, gmtime, strftime, mktime
  // =========================================================================

  gettimeofday: `function gettimeofday(tv: any, tz: any): number {
  const now = Date.now();
  if (tv) { tv.tv_sec = Math.floor(now / 1000); tv.tv_usec = (now % 1000) * 1000; }
  return 0;
}`,

  clock_gettime: `function clock_gettime(clk_id: number, tp: any): number {
  const now = process.hrtime.bigint();
  if (tp) { tp.tv_sec = Number(now / 1000000000n); tp.tv_nsec = Number(now % 1000000000n); }
  return 0;
}`,

  nanosleep: `function nanosleep(req: any, rem: any): number {
  if (req) {
    const ms = req.tv_sec * 1000 + req.tv_nsec / 1000000;
    const start = Date.now();
    while (Date.now() - start < ms) { /* busy wait */ }
  }
  return 0;
}`,

  time: `function time_posix(tloc: any): number {
  const t = Math.floor(Date.now() / 1000);
  if (tloc && tloc.buf) { tloc.buf[tloc.off] = t; }
  return t;
}`,

  localtime: `function localtime(timer: any): any {
  const t = (typeof timer === 'number') ? timer : (timer && timer.buf ? timer.buf[timer.off] : Math.floor(Date.now() / 1000));
  const d = new Date(t * 1000);
  return { tm_sec: d.getSeconds(), tm_min: d.getMinutes(), tm_hour: d.getHours(), tm_mday: d.getDate(), tm_mon: d.getMonth(), tm_year: d.getFullYear() - 1900, tm_wday: d.getDay(), tm_yday: Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000), tm_isdst: -1 };
}`,

  localtime_r: `function localtime_r(timer: any, result: any): any {
  const tm = localtime(timer);
  Object.assign(result, tm);
  return result;
}`,

  gmtime: `function gmtime(timer: any): any {
  const t = (typeof timer === 'number') ? timer : (timer && timer.buf ? timer.buf[timer.off] : Math.floor(Date.now() / 1000));
  const d = new Date(t * 1000);
  return { tm_sec: d.getUTCSeconds(), tm_min: d.getUTCMinutes(), tm_hour: d.getUTCHours(), tm_mday: d.getUTCDate(), tm_mon: d.getUTCMonth(), tm_year: d.getUTCFullYear() - 1900, tm_wday: d.getUTCDay(), tm_yday: Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000), tm_isdst: 0 };
}`,

  gmtime_r: `function gmtime_r(timer: any, result: any): any {
  const tm = gmtime(timer);
  Object.assign(result, tm);
  return result;
}`,

  mktime: `function mktime(tm: any): number {
  const d = new Date(tm.tm_year + 1900, tm.tm_mon, tm.tm_mday, tm.tm_hour, tm.tm_min, tm.tm_sec);
  return Math.floor(d.getTime() / 1000);
}`,

  strftime: `function strftime(buf: any, maxsize: number, format: string, tm: any): number {
  const d = new Date(tm.tm_year + 1900, tm.tm_mon, tm.tm_mday, tm.tm_hour || 0, tm.tm_min || 0, tm.tm_sec || 0);
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const result = format
    .replace(/%Y/g, String(d.getFullYear()))
    .replace(/%m/g, pad2(d.getMonth() + 1))
    .replace(/%d/g, pad2(d.getDate()))
    .replace(/%H/g, pad2(d.getHours()))
    .replace(/%M/g, pad2(d.getMinutes()))
    .replace(/%S/g, pad2(d.getSeconds()))
    .replace(/%j/g, String(Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)).padStart(3, '0'))
    .replace(/%w/g, String(d.getDay()))
    .replace(/%a/g, ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()])
    .replace(/%b/g, ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()])
    .replace(/%p/g, d.getHours() < 12 ? 'AM' : 'PM')
    .replace(/%Z/g, Intl.DateTimeFormat().resolvedOptions().timeZone)
    .replace(/%n/g, '\\n')
    .replace(/%t/g, '\\t')
    .replace(/%%/g, '%');
  return result.length;
}`,

  difftime: `function difftime(time1: number, time0: number): number { return time1 - time0; }`,

  // =========================================================================
  // Additional POSIX constants
  // =========================================================================

  STDIN_FILENO: `const STDIN_FILENO = 0;`,
  STDOUT_FILENO: `const STDOUT_FILENO = 1;`,
  STDERR_FILENO: `const STDERR_FILENO = 2;`,

  // Access mode constants
  F_OK: `const F_OK = 0;`,
  R_OK: `const R_OK = 4;`,
  W_OK: `const W_OK = 2;`,
  X_OK: `const X_OK = 1;`,

  // Signal constants
  SIGINT: `const SIGINT = 2;`,
  SIGTERM: `const SIGTERM = 15;`,
  SIGKILL: `const SIGKILL = 9;`,
  SIGALRM: `const SIGALRM = 14;`,
  SIGUSR1: `const SIGUSR1 = 10;`,
  SIGUSR2: `const SIGUSR2 = 12;`,

  // mmap constants
  PROT_READ: `const PROT_READ = 1;`,
  PROT_WRITE: `const PROT_WRITE = 2;`,
  PROT_EXEC: `const PROT_EXEC = 4;`,
  MAP_PRIVATE: `const MAP_PRIVATE = 2;`,
  MAP_SHARED: `const MAP_SHARED = 1;`,
  MAP_ANONYMOUS: `const MAP_ANONYMOUS = 0x20;`,
  MAP_FAILED: `const MAP_FAILED = null;`,

  // errno stubs
  errno: `let errno: number = 0;`,
  strerror: `function strerror(errnum: number): any {
  const msgs: Record<number, string> = { 0: 'Success', 1: 'Operation not permitted', 2: 'No such file or directory', 3: 'No such process', 4: 'Interrupted system call', 5: 'I/O error', 9: 'Bad file descriptor', 12: 'Out of memory', 13: 'Permission denied', 17: 'File exists', 22: 'Invalid argument', 28: 'No space left on device' };
  /* C17 §7.24.6.2: strerror returns char* — emitter callers access .buf/.off, so wrap as CPtr. */
  return cptr_from_string(msgs[errnum] ?? 'Unknown error');
}`,
  perror: `function perror(s: string): void {
  console.error(s ? s + ': ' + strerror(errno) : strerror(errno));
}`,

  // pipe
  pipe: `function pipe(pipefd: any): number {
  /* Allocate two fds from a module-local counter (starting at 1000 to avoid
     collision with node fds). A ring buffer keyed on the shared pipe object
     backs the read/write ends. Writes append, reads consume from head. */
  const reg: Map<number, any> = (globalThis as any).__posix_fdreg ?? ((globalThis as any).__posix_fdreg = new Map());
  const g: any = globalThis as any;
  g.__posix_next_pipe_fd = g.__posix_next_pipe_fd ?? 1000;
  const rd = g.__posix_next_pipe_fd++;
  const wr = g.__posix_next_pipe_fd++;
  const buffer: number[] = [];
  const pipeObj = { buffer, closed: false };
  reg.set(rd, { resource: { kind: 'pipe', end: 'r', pipe: pipeObj }, flags: 0, fl: 0, pos: 0 });
  reg.set(wr, { resource: { kind: 'pipe', end: 'w', pipe: pipeObj }, flags: 0, fl: 0, pos: 0 });
  if (pipefd) {
    if (pipefd.buf) { pipefd.buf[pipefd.off] = rd; pipefd.buf[pipefd.off + 1] = wr; }
    else if (Array.isArray(pipefd)) { pipefd[0] = rd; pipefd[1] = wr; }
  }
  return 0;
}`,

  // read/write at fd level
  read_fd: `function read_fd(fd: number, buf: any, count: number): number {
  const fs = require('fs');
  try {
    const b = Buffer.alloc(count);
    const n = fs.readSync(fd, b, 0, count, null);
    if (buf && buf.buf) for (let i = 0; i < n; i++) buf.buf[buf.off + i] = b[i];
    return n;
  } catch { return -1; }
}`,

  write_fd: `function write_fd(fd: number, buf: any, count: number): number {
  const fs = require('fs');
  try {
    let b: Buffer;
    if (buf && buf.buf) b = Buffer.from(buf.buf.slice(buf.off, buf.off + count));
    else if (typeof buf === 'string') b = Buffer.from(buf);
    else b = Buffer.from(String(buf));
    return fs.writeSync(fd, b, 0, Math.min(b.length, count));
  } catch { return -1; }
}`,

  lseek: `function lseek(fd: number, offset: number, whence: number): number {
  /* SEEK_SET=0 SEEK_CUR=1 SEEK_END=2. Tracks per-fd position in the fd-registry. */
  const reg: Map<number, any> = (globalThis as any).__posix_fdreg ?? ((globalThis as any).__posix_fdreg = new Map());
  let entry = reg.get(fd);
  if (!entry) {
    /* Implicit registration for node fds opened via creat/open. */
    entry = { resource: { kind: 'file', nodeFd: fd }, flags: 0, fl: 0, pos: 0 };
    reg.set(fd, entry);
  }
  if (typeof entry.pos !== 'number') entry.pos = 0;
  let newPos = entry.pos;
  if (whence === 0) newPos = offset;
  else if (whence === 1) newPos = entry.pos + offset;
  else if (whence === 2) {
    try {
      const fs = require('fs');
      const nodeFd = (entry.resource && typeof entry.resource.nodeFd === 'number') ? entry.resource.nodeFd : fd;
      const st = fs.fstatSync(nodeFd);
      newPos = st.size + offset;
    } catch { errno = 9; return -1; }
  } else { errno = 22; /* EINVAL */ return -1; }
  if (newPos < 0) { errno = 22; return -1; }
  entry.pos = newPos;
  return newPos;
}`,

  // getenv / setenv / unsetenv
  getenv: `function getenv(name: string): string | null { return process.env[name] ?? null; }`,
  setenv: `function setenv(name: string, value: string, overwrite: number): number { if (overwrite || !(name in process.env)) process.env[name] = value; return 0; }`,
  unsetenv: `function unsetenv(name: string): number { delete process.env[name]; return 0; }`,

  // system
  system: `function system(command: string | null): number {
  if (!command) return 1; /* shell available */
  const cp = require('child_process');
  try { cp.execSync(command, { stdio: 'inherit' }); return 0; } catch (e: any) { return e.status ?? 1; }
}`,

  // exit / _exit / abort / atexit
  _exit: `function _exit(status: number): never { process.exit(status); }`,
  abort: `function abort(): never { process.abort(); }`,
  atexit: `function atexit(func: () => void): number { process.on('exit', func); return 0; }`,
};
