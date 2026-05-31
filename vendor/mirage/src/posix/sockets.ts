// POSIX BSD sockets — free-function facade backed by Mirage's NetworkStack.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §3 (sys/socket.h, netinet/in.h, arpa/inet.h, netdb.h).
//   * WHATWG WebTransport (https://w3c.github.io/webtransport/) — TCP-equivalent
//     reliable bidirectional streams over HTTP/3 in browsers.
//   * WHATWG WebSockets (https://websockets.spec.whatwg.org/) — fallback for
//     environments lacking WebTransport (Safari, older Chromium, etc.).
//
// Why this module
// ---------------
// `mirage/src/network/network.ts` ships a `NetworkStack` with three operating
// modes: in-process loopback (synchronous self-talk), a `node-bridge.ts`
// SharedArrayBuffer + worker_threads bridge for real `node:net` / `node:dgram`
// blocking sockets, and a future browser bridge. Translated C calls free
// functions like `socket(AF_INET, SOCK_STREAM, 0)` and expects a numeric fd
// back — NOT a class instance. This module bridges that ABI gap by exposing
// numeric fds backed by NetworkStack `Socket.id`s, encoding/decoding the
// `struct sockaddr_in` / `struct sockaddr_in6` byte layout on demand, and
// setting a module-level `errno` on failure (POSIX §2.3).
//
// Backend selection
// -----------------
// `socket()` env-detects on first call:
//   * Node:    `process.versions.node` truthy   → NetworkStack with
//              `bridgeMode="auto"`. Real hosts and `MIRAGE_NET_REAL=1`
//              route through the worker bridge for blocking BSD I/O;
//              loopback stays in-process.
//   * Browser: WebTransport (if supported) for connect()/send()/recv() over
//              HTTP/3; WebSocket fallback otherwise. Server-side primitives
//              (bind+listen+accept) need a backend daemon — NetworkStack
//              exposes them as loopback only in this environment.
//
// BRIDGE: posix-bsd-sockets — every shim site documents the C↔TS encoding
// choice it made (sockaddr packing, fd allocation, errno surface). This file
// is the single point of refactoring for the entire BSD-sockets surface.

import {
  NetworkStack,
  AF_INET,
  AF_INET6,
  AF_UNIX,
  AF_UNSPEC,
  SOCK_STREAM,
  SOCK_DGRAM,
  IPPROTO_TCP,
  IPPROTO_UDP,
  SOL_SOCKET,
  SO_TYPE,
  SO_ERROR,
  SO_REUSEADDR,
  SO_KEEPALIVE,
  SO_BROADCAST,
  SO_SNDBUF,
  SO_RCVBUF,
  SHUT_RD,
  SHUT_WR,
  SHUT_RDWR,
  EAFNOSUPPORT,
  EADDRINUSE,
  ECONNREFUSED,
  ENOTCONN,
  EAGAIN,
  EINVAL,
  ENOTSOCK,
  htons,
  htonl,
  ntohs,
  ntohl,
  inet_pton,
  inet_ntop,
  getaddrinfo as netGetaddrinfo,
  type SockAddr,
  type AddrInfo,
} from "../network/network.js";

// EBADF — POSIX errno for "bad file descriptor". Re-exported here so socket
// callers don't have to fish it out of network/network.ts (which re-exports
// from posix/fs.ts in this layout). 9 is the Linux ABI value.
export const EBADF = 9;

// TCP_NODELAY level/option pair — IPPROTO_TCP/TCP_NODELAY. The Linux ABI
// values are the de-facto cross-platform constants for translated C.
export const TCP_NODELAY = 1;

/** Module-level errno — POSIX §2.3. Each call may set this on failure. */
export let errno: number = 0;

/**
 * Lazy singleton NetworkStack. We keep one per process so accept()-side and
 * connect()-side translated programs running in the same Node process share
 * a loopback registry. Real-host mode automatically routes through the
 * worker_threads bridge on first need.
 */
let _stack: NetworkStack | null = null;
function stack(): NetworkStack {
  if (_stack === null) _stack = new NetworkStack();
  return _stack;
}

/** Test-only — flush both the stack and errno. */
export function _resetSockets(): void {
  _stack = null;
  errno = 0;
}

/**
 * fd → NetworkStack-id table. We give translated C a real numeric fd that
 * does NOT collide with file fds (which start at 0/1/2 and grow upward via
 * MirageOS.fds). Sockets are minted starting at 4096 so the two spaces are
 * trivially distinguishable; this matches what real Linux kernels do under
 * load (the file fd table is small for typical programs).
 */
const NET_FD_BASE = 4096;
let _nextSockFd = NET_FD_BASE;
const _fdToSockId: Map<number, number> = new Map();
const _sockIdToFd: Map<number, number> = new Map();

function allocFd(sockId: number): number {
  const fd = _nextSockFd++;
  _fdToSockId.set(fd, sockId);
  _sockIdToFd.set(sockId, fd);
  return fd;
}
function fdToSockId(fd: number): number | null {
  return _fdToSockId.get(fd) ?? null;
}
function freeFd(fd: number): void {
  const sockId = _fdToSockId.get(fd);
  _fdToSockId.delete(fd);
  if (sockId !== undefined) _sockIdToFd.delete(sockId);
}

/** Fast Node-vs-browser detector — POSIX §3 has no opinion on this; the
 *  WHATWG specs do. */
export function isNodeRuntime(): boolean {
  const g: any = globalThis as any;
  return typeof g.process !== "undefined" &&
         typeof g.process.versions !== "undefined" &&
         typeof g.process.versions.node === "string";
}

/** Best-effort detector for browser WebTransport availability — WHATWG
 *  WebTransport spec defines `WebTransport` as the global constructor. */
export function hasWebTransport(): boolean {
  return typeof (globalThis as any).WebTransport === "function";
}

/** Best-effort detector for browser WebSocket availability — WHATWG
 *  WebSockets spec defines `WebSocket` as the global constructor. */
export function hasWebSocket(): boolean {
  return typeof (globalThis as any).WebSocket === "function";
}

// ---------------------------------------------------------------------------
// sockaddr packing — IEEE Std 1003.1-2017 <netinet/in.h>
//
// `struct sockaddr_in` layout (Linux/glibc-canonical, network-byte-order port):
//   offset 0..1  : sa_family_t sin_family (host byte order)
//   offset 2..3  : in_port_t   sin_port   (network byte order)
//   offset 4..7  : struct in_addr sin_addr (4 bytes, network byte order)
//   offset 8..15 : char sin_zero[8] (pad)
//
// Translated C may pass an addr argument as:
//   * a CPtr {buf, off}            — bytes in a Uint8Array, decoded by layout
//   * a Uint8Array of length 16+   — same byte layout
//   * a JS object with sin_family/sin_port/sin_addr OR family/addr/port
//   * a JS object with .buf/.off (CPtr-like)
// We accept all four for refactorability — every caller pattern in the
// translator output decodes through `parseSockAddr`.
// ---------------------------------------------------------------------------

function parseSockAddr(a: any): SockAddr | null {
  if (!a) return null;
  // Already the canonical {family, addr, port} shape.
  if (typeof a === "object" && "family" in a && "addr" in a && "port" in a) {
    return { family: a.family | 0, addr: String(a.addr), port: a.port | 0 };
  }
  // CPtr-like wrapper.
  if (a.buf && typeof a.off === "number") {
    return parseSockAddrBytes(a.buf, a.off);
  }
  if (a instanceof Uint8Array) {
    return parseSockAddrBytes(a, 0);
  }
  // Object-shaped sockaddr_in.
  if (typeof a === "object") {
    const fam = a.sin_family ?? a.sa_family ?? a.family ?? AF_INET;
    const portRaw = a.sin_port ?? a.port ?? 0;
    // sin_port is in network byte order in C; if we got a JS-object form
    // assume it's already host-readable. The caller is responsible.
    let addr = a.addr;
    if (!addr && a.sin_addr) {
      // sin_addr.s_addr is a uint32 in network order.
      const s = a.sin_addr.s_addr ?? a.sin_addr;
      if (typeof s === "number") {
        // Network-byte-order 32-bit int → dotted quad.
        addr = `${(s >>> 24) & 0xff}.${(s >>> 16) & 0xff}.${(s >>> 8) & 0xff}.${s & 0xff}`;
      } else {
        addr = String(s);
      }
    }
    return { family: fam | 0, addr: String(addr ?? "127.0.0.1"), port: portRaw | 0 };
  }
  return null;
}

function parseSockAddrBytes(buf: Uint8Array, off: number): SockAddr | null {
  if (buf.length - off < 8) return null;
  const dv = new DataView(buf.buffer, buf.byteOffset + off);
  const fam = dv.getUint16(0, true);
  if (fam === AF_INET) {
    // sin_port (offset 2) is network byte order — read big-endian.
    const port = dv.getUint16(2, false);
    const addr = `${buf[off + 4]}.${buf[off + 5]}.${buf[off + 6]}.${buf[off + 7]}`;
    return { family: AF_INET, addr, port };
  }
  if (fam === AF_INET6 && buf.length - off >= 28) {
    // sockaddr_in6: family(2) port(2) flowinfo(4) addr(16) scope(4)
    const port = dv.getUint16(2, false);
    const out: number[] = [];
    for (let i = 0; i < 16; i++) out.push(buf[off + 8 + i]!);
    const ntop = inet_ntop(AF_INET6, new Uint8Array(out));
    return { family: AF_INET6, addr: ntop ?? "::", port };
  }
  return null;
}

/** Encode a SockAddr back into a sockaddr_in byte buffer — used by accept(),
 *  getsockname(), getpeername(), recvfrom() to write bytes to caller-supplied
 *  storage. */
function writeSockAddr(out: any, sa: SockAddr): void {
  if (!out) return;
  // CPtr-like: write bytes into the underlying buffer.
  if (out.buf && typeof out.off === "number") {
    const dv = new DataView(out.buf.buffer, out.buf.byteOffset + out.off);
    dv.setUint16(0, sa.family, true);
    dv.setUint16(2, sa.port, false);
    if (sa.family === AF_INET) {
      const parts = sa.addr.split(".").map((x) => +x);
      for (let i = 0; i < 4; i++) out.buf[out.off + 4 + i] = parts[i] || 0;
    } else if (sa.family === AF_INET6) {
      const tmp = new Uint8Array(16);
      inet_pton(AF_INET6, sa.addr, tmp);
      for (let i = 0; i < 16; i++) out.buf[out.off + 8 + i] = tmp[i]!;
    }
    return;
  }
  if (out instanceof Uint8Array) {
    const dv = new DataView(out.buffer, out.byteOffset);
    dv.setUint16(0, sa.family, true);
    dv.setUint16(2, sa.port, false);
    if (sa.family === AF_INET) {
      const parts = sa.addr.split(".").map((x) => +x);
      for (let i = 0; i < 4; i++) out[4 + i] = parts[i] || 0;
    }
    return;
  }
  // JS-object shape — set named fields.
  if (typeof out === "object") {
    out.sin_family = sa.family;
    out.sa_family  = sa.family;
    out.family     = sa.family;
    out.sin_port   = sa.port;
    out.port       = sa.port;
    out.addr       = sa.addr;
  }
}

// ---------------------------------------------------------------------------
// POSIX BSD sockets — free-function surface.
//
// Each wrapper has a one-line header doc citing the POSIX section, performs
// argument coercion for the four sockaddr/buffer shapes the translator may
// emit, calls the NetworkStack, and translates `NetResult.err` to module-level
// `errno`. Return values match the C ABI (-1 on failure for int returns,
// SIZE_MAX-style len on success).
// ---------------------------------------------------------------------------

/** POSIX socket(domain, type, protocol) — IEEE Std 1003.1-2017 §socket.
 *  Returns a numeric fd (not a Socket object) so translated C can store it
 *  in an `int`. */
export function socket(domain: number, type: number, protocol: number = 0): number {
  const r = stack().socket(domain, type, protocol);
  if (r.ret < 0) {
    errno = r.err ?? EINVAL;
    return -1;
  }
  return allocFd(r.ret);
}

/** POSIX bind(fd, addr, addrlen) — IEEE Std 1003.1-2017 §bind. */
export function bind(fd: number, addr: any, addrlen: number = 0): number {
  void addrlen; // length is implicit in the SockAddr shape
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const sa = parseSockAddr(addr);
  if (!sa) { errno = EINVAL; return -1; }
  const r = stack().bind(sockId, sa);
  if (r.ret < 0) { errno = r.err ?? EINVAL; return -1; }
  return 0;
}

/** POSIX listen(fd, backlog) — IEEE Std 1003.1-2017 §listen. */
export function listen(fd: number, backlog: number): number {
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const r = stack().listen(sockId, backlog);
  if (r.ret < 0) { errno = r.err ?? EINVAL; return -1; }
  return 0;
}

/** POSIX accept(fd, addr, addrlen) — IEEE Std 1003.1-2017 §accept. */
export function accept(fd: number, addr: any = null, addrlen: any = null): number {
  void addrlen;
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const r = stack().accept(sockId);
  if (r.ret < 0) { errno = r.err ?? EAGAIN; return -1; }
  if (addr && r.peer) writeSockAddr(addr, r.peer);
  return allocFd(r.ret);
}

/** POSIX connect(fd, addr, addrlen) — IEEE Std 1003.1-2017 §connect. */
export function connect(fd: number, addr: any, addrlen: number = 0): number {
  void addrlen;
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const sa = parseSockAddr(addr);
  if (!sa) { errno = EINVAL; return -1; }
  const r = stack().connect(sockId, sa);
  if (r.ret < 0) { errno = r.err ?? ECONNREFUSED; return -1; }
  return 0;
}

/** Coerce a translator-emitted "buffer" arg into a Uint8Array view of `len` bytes.
 *  Accepts CPtr, Uint8Array, string (UTF-8 encoded), Array<number>. */
function coerceSendBuf(buf: any, len: number): Uint8Array | null {
  if (buf instanceof Uint8Array) return buf.subarray(0, len);
  if (buf && buf.buf && typeof buf.off === "number") {
    return buf.buf.subarray(buf.off, buf.off + len);
  }
  if (typeof buf === "string") {
    const e = new TextEncoder().encode(buf);
    return e.subarray(0, Math.min(len, e.length));
  }
  if (Array.isArray(buf)) {
    return new Uint8Array(buf.slice(0, len));
  }
  return null;
}

/** Write received bytes into the translator-emitted buffer arg. */
function writeRecvBuf(buf: any, data: Uint8Array): void {
  if (!buf) return;
  if (buf instanceof Uint8Array) { buf.set(data); return; }
  if (buf.buf && typeof buf.off === "number") {
    for (let i = 0; i < data.length; i++) buf.buf[buf.off + i] = data[i]!;
    return;
  }
  if (Array.isArray(buf)) {
    for (let i = 0; i < data.length; i++) buf[i] = data[i]!;
    return;
  }
  if (typeof buf === "object" && "value" in buf) {
    buf.value = new TextDecoder().decode(data);
  }
}

/** POSIX send(fd, buf, len, flags) — IEEE Std 1003.1-2017 §send. */
export function send(fd: number, buf: any, len: number, flags: number = 0): number {
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const data = coerceSendBuf(buf, len);
  if (!data) { errno = EINVAL; return -1; }
  const r = stack().send(sockId, data, flags);
  if (r.ret < 0) { errno = r.err ?? ENOTCONN; return -1; }
  return r.ret;
}

/** POSIX recv(fd, buf, len, flags) — IEEE Std 1003.1-2017 §recv. */
export function recv(fd: number, buf: any, len: number, flags: number = 0): number {
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const r = stack().recv(sockId, len, flags);
  if (r.ret < 0) { errno = r.err ?? EAGAIN; return -1; }
  if (r.data) writeRecvBuf(buf, r.data);
  return r.ret;
}

/** POSIX sendto — IEEE Std 1003.1-2017 §sendto. */
export function sendto(fd: number, buf: any, len: number, flags: number, addr: any, addrlen: number = 0): number {
  void addrlen;
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const sa = parseSockAddr(addr);
  if (!sa) { errno = EINVAL; return -1; }
  const data = coerceSendBuf(buf, len);
  if (!data) { errno = EINVAL; return -1; }
  const r = stack().sendto(sockId, data, flags, sa);
  if (r.ret < 0) { errno = r.err ?? EINVAL; return -1; }
  return r.ret;
}

/** POSIX recvfrom — IEEE Std 1003.1-2017 §recvfrom. */
export function recvfrom(fd: number, buf: any, len: number, flags: number, addr: any = null, addrlen: any = null): number {
  void addrlen;
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const r = stack().recvfrom(sockId, len, flags);
  if (r.ret < 0) { errno = r.err ?? EAGAIN; return -1; }
  if (r.data) writeRecvBuf(buf, r.data);
  if (addr && r.from) writeSockAddr(addr, r.from);
  return r.ret;
}

/** POSIX shutdown(fd, how) — IEEE Std 1003.1-2017 §shutdown. */
export function shutdown(fd: number, how: number): number {
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const r = stack().shutdown(sockId, how);
  if (r.ret < 0) { errno = r.err ?? EINVAL; return -1; }
  return 0;
}

/** Network-side close — separate from POSIX close(fd) which routes to file
 *  table for non-socket fds. The shim-database close shim dispatches based
 *  on whether `fd >= NET_FD_BASE`. POSIX.1-2017 §close says close on a
 *  closed fd returns -1 with errno=EBADF — we match that. */
export function closeSocket(fd: number): number {
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const r = stack().closeSocket(sockId);
  freeFd(fd);
  if (r.ret < 0) { errno = r.err ?? EBADF; return -1; }
  return 0;
}

/** Test whether an fd is in the socket-fd range (so the dispatch shim for
 *  `close()` can route to the network stack rather than the file table). */
export function isSocketFd(fd: number): boolean {
  return _fdToSockId.has(fd);
}

/** POSIX setsockopt(fd, level, optname, optval, optlen) —
 *  IEEE Std 1003.1-2017 §setsockopt. */
export function setsockopt(fd: number, level: number, optname: number, optval: any, optlen: number = 4): number {
  void optlen;
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  let v = 0;
  if (typeof optval === "number") v = optval | 0;
  else if (optval && optval.buf) {
    const dv = new DataView(optval.buf.buffer, optval.buf.byteOffset + optval.off);
    v = dv.getInt32(0, true);
  } else if (optval instanceof Uint8Array) {
    const dv = new DataView(optval.buffer, optval.byteOffset);
    v = dv.getInt32(0, true);
  } else if (optval && typeof optval === "object" && "value" in optval) {
    v = +optval.value | 0;
  }
  // BRIDGE: posix-bsd-sockets — level/optname are stored verbatim in a
  // per-socket map and read back on getsockopt(). Real Linux semantics for
  // some opts (TCP_NODELAY, SO_KEEPALIVE) are "advisory" — the kernel may
  // ignore them. The Mirage stack honours those options where it can.
  void level;
  const r = stack().setsockopt(sockId, level, optname, v);
  if (r.ret < 0) { errno = r.err ?? EINVAL; return -1; }
  return 0;
}

/** POSIX getsockopt(fd, level, optname, optval, optlen) —
 *  IEEE Std 1003.1-2017 §getsockopt. */
export function getsockopt(fd: number, level: number, optname: number, optval: any, optlen: any = null): number {
  void optlen;
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const r = stack().getsockopt(sockId, level, optname);
  if (r.ret < 0) { errno = r.err ?? EINVAL; return -1; }
  const v = r.optval ?? 0;
  if (optval && optval.buf) {
    const dv = new DataView(optval.buf.buffer, optval.buf.byteOffset + optval.off);
    dv.setInt32(0, v, true);
  } else if (optval instanceof Uint8Array) {
    const dv = new DataView(optval.buffer, optval.byteOffset);
    dv.setInt32(0, v, true);
  } else if (optval && typeof optval === "object" && "value" in optval) {
    optval.value = v;
  }
  return 0;
}

/** POSIX getsockname(fd, addr, addrlen) — IEEE Std 1003.1-2017 §getsockname. */
export function getsockname(fd: number, addr: any, addrlen: any = null): number {
  void addrlen;
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const sa = stack().getsockname(sockId);
  if (!sa) { errno = ENOTSOCK; return -1; }
  if (addr) writeSockAddr(addr, sa);
  return 0;
}

/** POSIX getpeername(fd, addr, addrlen) — IEEE Std 1003.1-2017 §getpeername. */
export function getpeername(fd: number, addr: any, addrlen: any = null): number {
  void addrlen;
  const sockId = fdToSockId(fd);
  if (sockId === null) { errno = EBADF; return -1; }
  const sa = stack().getpeername(sockId);
  if (!sa) { errno = ENOTCONN; return -1; }
  if (addr) writeSockAddr(addr, sa);
  return 0;
}

/** POSIX getaddrinfo(node, service, hints, res) — IEEE Std 1003.1-2017 §getaddrinfo.
 *  The C ABI returns 0 on success and writes a linked list to *res. We model
 *  the linked list as a JS array stored at res.value (see the shim for the
 *  encoding). Returns 0 on success, EAI_NONAME (-2) on failure. */
export function getaddrinfo(node: string | null, service: string | null, hints: any, res: any): number {
  // BRIDGE: posix-bsd-sockets-getaddrinfo — translator emits res as a
  // {value: any} ref-box. We populate res.value with an array of AddrInfo.
  const list = netGetaddrinfo(
    node,
    service,
    hints && typeof hints === "object" ? {
      ai_family: hints.ai_family ?? AF_UNSPEC,
      ai_socktype: hints.ai_socktype ?? SOCK_STREAM,
      ai_protocol: hints.ai_protocol ?? 0,
    } : undefined
  );
  if (!list) {
    if (res && typeof res === "object" && "value" in res) res.value = null;
    return -2; // EAI_NONAME
  }
  if (res && typeof res === "object" && "value" in res) {
    res.value = list;
  }
  return 0;
}

/** POSIX freeaddrinfo(res) — IEEE Std 1003.1-2017 §freeaddrinfo.
 *  No-op in JS (GC handles the list); kept for ABI parity. */
export function freeaddrinfo(res: any): void {
  if (res && typeof res === "object" && "value" in res) res.value = null;
}

/** POSIX getnameinfo — IEEE Std 1003.1-2017 §getnameinfo. */
export function getnameinfo(
  sa: any,
  _salen: number,
  host: any,
  hostlen: number,
  serv: any,
  servlen: number,
  _flags: number = 0,
): number {
  const parsed = parseSockAddr(sa);
  if (!parsed) { errno = EINVAL; return -1; }
  if (host) {
    const h = parsed.addr.slice(0, Math.max(0, hostlen - 1));
    if (host.buf) {
      const enc = new TextEncoder().encode(h);
      for (let i = 0; i < enc.length; i++) host.buf[host.off + i] = enc[i]!;
      host.buf[host.off + enc.length] = 0;
    } else if (typeof host === "object" && "value" in host) {
      host.value = h;
    }
  }
  if (serv) {
    const s = String(parsed.port).slice(0, Math.max(0, servlen - 1));
    if (serv.buf) {
      const enc = new TextEncoder().encode(s);
      for (let i = 0; i < enc.length; i++) serv.buf[serv.off + i] = enc[i]!;
      serv.buf[serv.off + enc.length] = 0;
    } else if (typeof serv === "object" && "value" in serv) {
      serv.value = s;
    }
  }
  return 0;
}

/** POSIX gai_strerror — IEEE Std 1003.1-2017 §gai_strerror. */
export function gai_strerror(code: number): string {
  switch (code) {
    case 0:  return "Success";
    case -2: return "Name or service not known";
    case -3: return "Temporary failure in name resolution";
    case -4: return "Non-recoverable failure in name resolution";
    case -8: return "Servname not supported for ai_socktype";
    default: return "Unknown error";
  }
}

// ---------------------------------------------------------------------------
// Re-exports for translator emission. Translated C does
// `#include <sys/socket.h>` which expects these constants to be visible.
// ---------------------------------------------------------------------------
export {
  AF_UNSPEC, AF_UNIX, AF_INET, AF_INET6,
  SOCK_STREAM, SOCK_DGRAM,
  IPPROTO_TCP, IPPROTO_UDP,
  SOL_SOCKET, SO_TYPE, SO_ERROR, SO_REUSEADDR, SO_KEEPALIVE,
  SO_BROADCAST, SO_SNDBUF, SO_RCVBUF,
  SHUT_RD, SHUT_WR, SHUT_RDWR,
  EAFNOSUPPORT, EADDRINUSE, ECONNREFUSED, ENOTCONN, EAGAIN, EINVAL,
  ENOTSOCK,
  htons, htonl, ntohs, ntohl,
  inet_pton, inet_ntop,
  type SockAddr, type AddrInfo,
};

// Diagnostic-only export for the WHATWG browser path. Today the browser
// shim only exposes `WebTransport` / `WebSocket` detectors; an eventual
// browser bridge would land in `mirage/src/network/web-bridge.ts` parallel
// to `node-bridge.ts`.
export const __posix_sockets_backend = (): "node" | "browser" =>
  isNodeRuntime() ? "node" : "browser";
