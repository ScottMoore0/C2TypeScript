// Mirage POSIX <sys/un.h> — Unix-domain (AF_UNIX) sockets.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<sys/un.h>:
//       struct sockaddr_un {
//         sa_family_t sun_family;   // AF_UNIX
//         char        sun_path[];   // pathname (NUL-terminated)
//       };
//   * IEEE Std 1003.1-2017 §socket / §bind / §connect / §accept — AF_UNIX
//     stream sockets are full POSIX-conformant; abstract namespace sockets
//     (sun_path[0] == '\0') are a Linux extension.
//
// BRIDGE: posix-un — AF_UNIX sockets → Node.js `net.Server` / `net.Socket`
// with the `path` argument. Translated `bind(fd, &sockaddr_un, len)`
// extracts the sun_path string and starts a Node net.Server listening on
// that path; `connect()` opens a net.Socket to the same path; sends and
// receives are buffered through SAB-backed in/out queues.
//
// In environments without `node:net` (browser), AF_UNIX falls back to a
// pure in-process registry keyed by the sun_path string — sufficient for
// loopback IPC tests but not real cross-process communication.

import { AF_UNIX } from "../network/network.js";

// ---------------------------------------------------------------------------
// errno values used here. POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EBADF       = 9;
const EAGAIN      = 11;
const EINVAL      = 22;
const ENOENT      = 2;
const EADDRINUSE  = 98;
const ECONNREFUSED = 111;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

/** Unix-domain socket path-length cap. POSIX requires at least 92; Linux
 *  allows 108. We follow Linux. */
export const UNIX_PATH_MAX = 108;

/** struct sockaddr_un — POSIX §<sys/un.h>. */
export interface sockaddr_un {
  sun_family: number;   // AF_UNIX
  sun_path:   string;   // NUL-terminated pathname, length <= UNIX_PATH_MAX-1
}

// ---------------------------------------------------------------------------
// Per-fd state. Two roles per fd:
//   * "listener" — net.Server instance + accept queue.
//   * "stream"   — net.Socket instance + recv buffer.
// We keep them keyed by an fd number minted from a dedicated range so
// posix/sockets.ts remains untouched (it owns 4096..8191).
// ---------------------------------------------------------------------------

interface UnListenerState {
  kind: "listener";
  path: string;
  server: any;                       // node:net Server | null in browser
  acceptQueue: UnStreamState[];      // pending streams from incoming connects
  acceptWaiters: ((s: UnStreamState | null) => void)[];
}

interface UnStreamState {
  kind: "stream";
  socket: any;                       // node:net Socket | null in browser
  recvBuf: Uint8Array;               // queued inbound bytes
  recvWaiters: ((data: Uint8Array | null) => void)[];
  closed: boolean;
  // For loopback (browser/in-process) mode, track the peer for echo.
  peer: UnStreamState | null;
}

type UnState = UnListenerState | UnStreamState;

const UN_FD_BASE = 32768;
let _nextFd = UN_FD_BASE;
const _table: Map<number, UnState> = new Map();

/** path → UnListenerState — used by connect() to find a server. Mirrors the
 *  filesystem registry that real AF_UNIX uses. */
const _byPath: Map<string, UnListenerState> = new Map();

/** Test-only — wipe the table and the path registry. */
export function _resetUn(): void {
  for (const st of _table.values()) {
    if (st.kind === "listener" && st.server) {
      try { st.server.close(); } catch { /* noop */ }
    } else if (st.kind === "stream" && st.socket) {
      try { st.socket.destroy(); } catch { /* noop */ }
    }
  }
  _table.clear();
  _byPath.clear();
  _nextFd = UN_FD_BASE;
  errno = 0;
}

/** Test-only — inspect table size. */
export function _unCount(): number { return _table.size; }

/** Predicate the close shim uses to dispatch. */
export function isUnFd(fd: number): boolean { return _table.has(fd); }

/** Detect Node.js so we can pick the real-socket path. */
function _isNode(): boolean {
  return typeof (globalThis as any).process !== "undefined" &&
         !!(globalThis as any).process.versions?.node;
}

let _net: any | null | undefined; // undefined = not yet attempted.
function _loadNet(): any | null {
  if (_net !== undefined) return _net;
  if (!_isNode()) { _net = null; return null; }
  try {
    // Use eval to avoid the bundler trying to resolve node:net when this
    // module is imported in a browser build.
    // eslint-disable-next-line no-eval
    _net = (0, eval)("require('node:net')");
  } catch { _net = null; }
  return _net;
}

// ---------------------------------------------------------------------------
// socket(AF_UNIX, SOCK_STREAM, 0) — allocate a fresh fd in the un range.
// ---------------------------------------------------------------------------

/**
 * AF_UNIX socket() — analogue of posix_socket(AF_UNIX, ...). The fd is
 * minted in the un-fd range so the dispatch shim can route it to this
 * module rather than posix/sockets.ts. The "kind" is set by the first
 * bind/listen (becomes "listener") or connect (becomes "stream") call.
 */
export function un_socket(): number {
  const fd = _nextFd++;
  // Stash a placeholder stream record; bind/listen converts to listener.
  _table.set(fd, {
    kind: "stream",
    socket: null,
    recvBuf: new Uint8Array(0),
    recvWaiters: [],
    closed: false,
    peer: null,
  });
  return fd;
}

/** Decode a sockaddr_un argument from the four representational shapes the
 *  translator may emit (mirrors parseSockAddr in posix/sockets.ts). */
function _parseSunPath(addr: any): string | null {
  if (!addr) return null;
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    if (typeof addr.sun_path === "string") return addr.sun_path;
    if (typeof addr.path === "string") return addr.path;
    // CPtr-like {buf, off} — sun_family u16, then NUL-terminated pathname.
    if (addr.buf instanceof Uint8Array && typeof addr.off === "number") {
      const buf = addr.buf;
      const off = addr.off;
      // Skip 2 bytes of sun_family.
      let end = off + 2;
      while (end < buf.length && buf[end] !== 0) end++;
      return new TextDecoder().decode(buf.subarray(off + 2, end));
    }
    if (addr instanceof Uint8Array) {
      let end = 2;
      while (end < addr.length && addr[end] !== 0) end++;
      return new TextDecoder().decode(addr.subarray(2, end));
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// bind(fd, &sockaddr_un) — start listening on the given path.
// ---------------------------------------------------------------------------

/** AF_UNIX bind() — analogue of posix_bind for sockaddr_un. */
export function un_bind(fd: number, addr: any): number {
  const st = _table.get(fd);
  if (!st || st.kind !== "stream") { errno = EBADF; return -1; }
  const path = _parseSunPath(addr);
  if (!path) { errno = EINVAL; return -1; }
  if (_byPath.has(path)) { errno = EADDRINUSE; return -1; }
  const listener: UnListenerState = {
    kind: "listener",
    path,
    server: null,
    acceptQueue: [],
    acceptWaiters: [],
  };
  _table.set(fd, listener);
  _byPath.set(path, listener);
  return 0;
}

// ---------------------------------------------------------------------------
// listen(fd, backlog) — create the underlying net.Server.
// ---------------------------------------------------------------------------

export function un_listen(fd: number, _backlog: number = 16): number {
  const st = _table.get(fd);
  if (!st || st.kind !== "listener") { errno = EBADF; return -1; }
  const net = _loadNet();
  if (net) {
    try {
      st.server = net.createServer((sock: any) => {
        const peer: UnStreamState = {
          kind: "stream",
          socket: sock,
          recvBuf: new Uint8Array(0),
          recvWaiters: [],
          closed: false,
          peer: null,
        };
        sock.on("data", (chunk: Buffer) => {
          const u8 = new Uint8Array(chunk);
          if (peer.recvWaiters.length > 0) {
            const w = peer.recvWaiters.shift()!;
            w(u8);
            return;
          }
          const merged = new Uint8Array(peer.recvBuf.length + u8.length);
          merged.set(peer.recvBuf);
          merged.set(u8, peer.recvBuf.length);
          peer.recvBuf = merged;
        });
        sock.on("close", () => { peer.closed = true; });
        // Hand off to whoever's accept()ing.
        if (st.acceptWaiters.length > 0) {
          const w = st.acceptWaiters.shift()!;
          w(peer);
        } else {
          st.acceptQueue.push(peer);
        }
      });
      st.server.listen(st.path);
    } catch { errno = EADDRINUSE; return -1; }
  }
  // In-process / browser fallback: nothing to do here — connect() walks _byPath.
  return 0;
}

// ---------------------------------------------------------------------------
// accept(fd) — return a fresh fd for the next incoming connection.
// ---------------------------------------------------------------------------

/** AF_UNIX accept() — synchronous variant. Returns -1 with EAGAIN if no
 *  pending connection in the in-process fallback. The Node-backed path
 *  uses a brief sync-poll via setTimeout-yield (callers wanting true async
 *  should use un_accept_async). */
export function un_accept(fd: number): number {
  const st = _table.get(fd);
  if (!st || st.kind !== "listener") { errno = EBADF; return -1; }
  const peer = st.acceptQueue.shift();
  if (!peer) { errno = EAGAIN; return -1; }
  const newFd = _nextFd++;
  _table.set(newFd, peer);
  return newFd;
}

/** Async accept — resolves with the new fd, or -1 on close. */
export function un_accept_async(fd: number): Promise<number> {
  const st = _table.get(fd);
  if (!st || st.kind !== "listener") { errno = EBADF; return Promise.resolve(-1); }
  const peer = st.acceptQueue.shift();
  if (peer) {
    const newFd = _nextFd++;
    _table.set(newFd, peer);
    return Promise.resolve(newFd);
  }
  return new Promise<number>((resolve) => {
    st.acceptWaiters.push((p) => {
      if (!p) { resolve(-1); return; }
      const newFd = _nextFd++;
      _table.set(newFd, p);
      resolve(newFd);
    });
  });
}

// ---------------------------------------------------------------------------
// connect(fd, &sockaddr_un) — connect a stream fd to a listener path.
// ---------------------------------------------------------------------------

export function un_connect(fd: number, addr: any): number {
  const st = _table.get(fd);
  if (!st || st.kind !== "stream") { errno = EBADF; return -1; }
  const path = _parseSunPath(addr);
  if (!path) { errno = EINVAL; return -1; }

  const net = _loadNet();
  const listener = _byPath.get(path);
  if (net && listener && listener.server) {
    try {
      st.socket = net.createConnection(path);
      st.socket.on("data", (chunk: Buffer) => {
        const u8 = new Uint8Array(chunk);
        if (st.recvWaiters.length > 0) {
          const w = st.recvWaiters.shift()!;
          w(u8);
          return;
        }
        const merged = new Uint8Array(st.recvBuf.length + u8.length);
        merged.set(st.recvBuf);
        merged.set(u8, st.recvBuf.length);
        st.recvBuf = merged;
      });
      st.socket.on("close", () => { st.closed = true; });
      return 0;
    } catch { errno = ECONNREFUSED; return -1; }
  }

  // In-process loopback path.
  if (!listener) { errno = ENOENT; return -1; }
  // Build a paired peer stream representing the server side.
  const serverSide: UnStreamState = {
    kind: "stream",
    socket: null,
    recvBuf: new Uint8Array(0),
    recvWaiters: [],
    closed: false,
    peer: st,
  };
  st.peer = serverSide;
  if (listener.acceptWaiters.length > 0) {
    const w = listener.acceptWaiters.shift()!;
    w(serverSide);
  } else {
    listener.acceptQueue.push(serverSide);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// send / recv / close.
// ---------------------------------------------------------------------------

/** AF_UNIX send() — write bytes on a connected stream fd. */
export function un_send(fd: number, data: Uint8Array | string): number {
  const st = _table.get(fd);
  if (!st || st.kind !== "stream") { errno = EBADF; return -1; }
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  if (st.socket) {
    st.socket.write(Buffer.from(bytes));
    return bytes.length;
  }
  // Loopback path — push into the peer's recvBuf.
  if (st.peer) {
    if (st.peer.recvWaiters.length > 0) {
      const w = st.peer.recvWaiters.shift()!;
      w(new Uint8Array(bytes));
    } else {
      const merged = new Uint8Array(st.peer.recvBuf.length + bytes.length);
      merged.set(st.peer.recvBuf);
      merged.set(bytes, st.peer.recvBuf.length);
      st.peer.recvBuf = merged;
    }
    return bytes.length;
  }
  errno = EAGAIN;
  return -1;
}

/** AF_UNIX recv() — pull up to `len` bytes off the recv buffer. Returns
 *  the number of bytes read; 0 on orderly close; -1 with EAGAIN if empty
 *  and the fd is non-blocking-equivalent (we never block synchronously). */
export function un_recv(fd: number, buf: Uint8Array, len: number): number {
  const st = _table.get(fd);
  if (!st || st.kind !== "stream") { errno = EBADF; return -1; }
  if (st.recvBuf.length === 0) {
    if (st.closed) return 0;
    errno = EAGAIN;
    return -1;
  }
  const n = Math.min(len, st.recvBuf.length);
  buf.set(st.recvBuf.subarray(0, n));
  st.recvBuf = st.recvBuf.subarray(n);
  return n;
}

/** Async recv — resolves when data is available or 0 on close. */
export function un_recv_async(fd: number, len: number): Promise<Uint8Array> {
  const st = _table.get(fd);
  if (!st || st.kind !== "stream") return Promise.resolve(new Uint8Array(0));
  if (st.recvBuf.length > 0) {
    const n = Math.min(len, st.recvBuf.length);
    const out = st.recvBuf.subarray(0, n).slice();
    st.recvBuf = st.recvBuf.subarray(n);
    return Promise.resolve(out);
  }
  if (st.closed) return Promise.resolve(new Uint8Array(0));
  return new Promise<Uint8Array>((resolve) => {
    st.recvWaiters.push((data) => resolve(data ?? new Uint8Array(0)));
  });
}

/** AF_UNIX close() — release fd, server, or socket. */
export function un_close(fd: number): number {
  const st = _table.get(fd);
  if (!st) { errno = EBADF; return -1; }
  if (st.kind === "listener") {
    if (st.server) try { st.server.close(); } catch { /* noop */ }
    _byPath.delete(st.path);
  } else {
    if (st.socket) try { st.socket.destroy(); } catch { /* noop */ }
    st.closed = true;
    // Wake any blocked recvers.
    for (const w of st.recvWaiters) w(null);
    st.recvWaiters = [];
  }
  _table.delete(fd);
  return 0;
}

// Re-export AF_UNIX so translated <sys/un.h> lookups work standalone.
export { AF_UNIX };
