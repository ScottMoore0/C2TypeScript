// MC-L7-Network: BSD sockets subset for the single-threaded Mirage model.
//
// IEEE Std 1003.1-2017 <sys/socket.h>, <netinet/in.h>, <arpa/inet.h>,
// <netdb.h>.
//
// Implementation model — caveat
// -----------------------------
// Node's socket APIs are fundamentally asynchronous, but the POSIX BSD
// sockets API is synchronous. To keep the Mirage in-process model
// deterministic and fully synchronous (matching the C caller ABI), this
// module implements a self-contained in-memory TCP/UDP loopback:
//
//   * bind() on 127.0.0.1 or :: with port N registers the socket in an
//     in-memory listener registry keyed by "family:addr:port".
//   * connect() synchronously locates a matching listener and establishes
//     a pair of back-to-back byte queues (one for each direction).
//   * accept() dequeues a pending incoming connection synchronously.
//   * send/recv/sendto/recvfrom push/pull bytes to/from the queues.
//
// This matches the subset of behaviour required for translated C programs
// that use sockets to talk to themselves or to another Mirage-hosted
// process in the same JS runtime (unit tests, self-tests, protocol
// round-trips). Connections to real remote hosts are NOT supported in
// this module — a consumer that needs those would layer a Node `net`
// backend on top with a documented async escape hatch (see README).
// Per the plan's guidance, cross-host networking is best-effort and
// may return EAGAIN (documented below).

// --- Constants (Linux ABI values, as exposed by <sys/socket.h>). ---
export const AF_UNSPEC = 0;
export const AF_UNIX   = 1;
export const AF_INET   = 2;
export const AF_INET6  = 10;

export const SOCK_STREAM = 1;
export const SOCK_DGRAM  = 2;
export const SOCK_RAW    = 3;

export const IPPROTO_IP   = 0;
export const IPPROTO_TCP  = 6;
export const IPPROTO_UDP  = 17;

export const SOL_SOCKET = 1;

// setsockopt/getsockopt optnames — IEEE Std 1003.1-2017 <sys/socket.h>.
export const SO_DEBUG      = 1;
export const SO_REUSEADDR  = 2;
export const SO_TYPE       = 3;
export const SO_ERROR      = 4;
export const SO_DONTROUTE  = 5;
export const SO_BROADCAST  = 6;
export const SO_SNDBUF     = 7;
export const SO_RCVBUF     = 8;
export const SO_KEEPALIVE  = 9;
export const SO_OOBINLINE  = 10;
export const SO_LINGER     = 13;
export const SO_REUSEPORT  = 15;

// shutdown(how) — IEEE Std 1003.1-2017 §shutdown.
export const SHUT_RD   = 0;
export const SHUT_WR   = 1;
export const SHUT_RDWR = 2;

// send/recv flags.
export const MSG_PEEK      = 0x02;
export const MSG_DONTWAIT  = 0x40;
export const MSG_WAITALL   = 0x100;

/** Errno values returned by network ops. Positive so callers may compare == N. */
export const ENOTSOCK      = 88;
export const EAFNOSUPPORT  = 97;
export const EADDRINUSE    = 98;
export const EADDRNOTAVAIL = 99;
export const ECONNREFUSED  = 111;
export const ENOTCONN      = 107;
export const EAGAIN        = 11;
export const EINVAL        = 22;
export const ENOSYS        = 38;

/**
 * sockaddr_in / sockaddr_in6 structural model.
 * `family` selects interpretation of `addr`. `addr` stores the presentation
 * form (dotted quad for v4, colon-hex for v6).
 */
export interface SockAddr {
  family: number;
  addr: string;
  port: number;
}

/**
 * struct addrinfo — IEEE Std 1003.1-2017 <netdb.h>.
 * We expose the fields getaddrinfo consumers typically read.
 */
export interface AddrInfo {
  ai_family: number;
  ai_socktype: number;
  ai_protocol: number;
  ai_addr: SockAddr;
  ai_canonname?: string;
}

/** One direction of an established connection — a byte queue. */
class ByteQueue {
  private chunks: Uint8Array[] = [];
  /** Present if the peer called shutdown(WR) or close(). */
  eof = false;

  push(data: Uint8Array): void {
    if (data.length > 0) this.chunks.push(data.slice());
  }

  /** Read up to `n` bytes. Returns empty array if nothing available. */
  pull(n: number): Uint8Array {
    if (this.chunks.length === 0) return new Uint8Array(0);
    const first = this.chunks[0]!;
    if (first.length <= n) {
      this.chunks.shift();
      return first;
    }
    const head = first.subarray(0, n);
    this.chunks[0] = first.subarray(n);
    return head.slice();
  }

  available(): number {
    let t = 0;
    for (const c of this.chunks) t += c.length;
    return t;
  }
}

/** UDP datagram with origin address for recvfrom. */
interface Datagram {
  from: SockAddr;
  data: Uint8Array;
}

/**
 * Socket — internal record held by the NetworkStack. Exposed through
 * integer fd descriptors allocated by the caller (the network stack
 * does not own fd numbering; that's the FileDescriptorTable's job).
 */
export class Socket {
  readonly id: number;
  readonly family: number;
  readonly type: number;
  readonly protocol: number;

  bound: SockAddr | null = null;
  /** If listening: pending queue of accepted-but-not-yet-accept()'d sockets. */
  listening = false;
  backlog = 0;
  pendingAccepts: Socket[] = [];

  /** For SOCK_STREAM, the peer socket once connected. */
  peer: Socket | null = null;
  peerAddr: SockAddr | null = null;

  /** Incoming byte queue (for SOCK_STREAM) or datagram queue (for SOCK_DGRAM). */
  rxBytes = new ByteQueue();
  rxDatagrams: Datagram[] = [];

  /** Non-blocking flag (set via setNonBlocking / SO_* options). */
  nonBlocking = false;
  /** Socket-level options mirror (opaque integer values). */
  opts: Map<number, number> = new Map();

  /** Set when local end has shutdown(WR) — no more writes. */
  shutWr = false;
  /** Set when local end has shutdown(RD) — no more reads. */
  shutRd = false;
  /** Set on close(). */
  closed = false;

  constructor(id: number, family: number, type: number, protocol: number) {
    this.id = id;
    this.family = family;
    this.type = type;
    this.protocol = protocol;
  }
}

/** Result wrapper — value on success, -1 with .err on failure. */
export interface NetResult {
  ret: number;
  err?: number;
}

/**
 * Bridge mode for the network stack.
 *   "loopback"  : in-process synchronous loopback (round-30 skeleton). Only
 *                 supports 127.0.0.1 / ::1 / 0.0.0.0 / :: self-talk.
 *   "node-sync" : route ops through a Node worker_threads + SharedArrayBuffer
 *                 bridge for true blocking BSD sockets (real TCP/UDP).
 *   "auto"      : per-op decision. Real hosts or MIRAGE_NET_REAL=1 → bridge;
 *                 everything else → loopback. Default.
 */
export type BridgeMode = "loopback" | "node-sync" | "auto";

/**
 * In-memory TCP/UDP loopback stack. One instance per MirageOS.
 *
 * Default behaviour: loopback-only (127.0.0.1, ::1, 0.0.0.0, ::).
 * Opt-in behaviour: call `setBridgeMode("node-sync")` (or set env
 * MIRAGE_NET_REAL=1 with the "auto" default) to route ops through a Node
 * worker that owns real `net.Socket` / `dgram.Socket` instances and uses
 * `SharedArrayBuffer` + `Atomics.wait` to keep the caller's synchronous
 * ABI intact. See ./node-bridge.ts.
 */
export class NetworkStack {
  private nextId = 1;
  private sockets: Map<number, Socket> = new Map();
  /** Listener registry, keyed by "family:addr:port". */
  private listeners: Map<string, Socket> = new Map();
  /** Bound UDP sockets, keyed by "family:addr:port". */
  private udpBinds: Map<string, Socket> = new Map();
  /** Ephemeral port counter for implicit-bind. */
  private ephemeral = 49152;
  /** Bridge mode — controls whether ops go to the in-process loopback or to
   *  the Node worker-thread bridge. */
  private bridgeMode: BridgeMode = "auto";
  /** Maps local fd id → bridge-side fd, for sockets that got offloaded. */
  private bridged: Map<number, number> = new Map();
  /** Cached bridge handle (lazy). */
  private _bridge: any = null;

  /**
   * Set the bridge mode. "node-sync" forces every op through the Node worker
   * bridge; "loopback" forces in-process self-talk only; "auto" picks per op.
   * Safe to call at any time; sockets already allocated keep their routing.
   */
  setBridgeMode(mode: BridgeMode): void {
    this.bridgeMode = mode;
  }

  /** Current bridge mode (read by tests). */
  getBridgeMode(): BridgeMode { return this.bridgeMode; }

  /**
   * Decide whether a given socket+target should use the bridge. Policy:
   *   - mode "loopback" → never use the bridge.
   *   - mode "node-sync" → always use the bridge.
   *   - mode "auto"    → use the bridge if address is a real host OR
   *                       MIRAGE_NET_REAL=1 is set, else loopback.
   * This keeps round-30 loopback tests fully deterministic while allowing
   * translated C to reach real hosts when asked.
   */
  private shouldBridge(addr?: SockAddr): boolean {
    if (this.bridgeMode === "loopback") return false;
    if (this.bridgeMode === "node-sync") return true;
    // auto: inspect env and address.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("./node-bridge.js");
      if (mod.realNetEnabled && mod.realNetEnabled()) return true;
      if (addr && mod.isRealHost && mod.isRealHost(addr.addr)) return true;
    } catch { /* node-bridge not available (e.g. browser) */ }
    return false;
  }

  /** Lazy-acquire the shared bridge. Returns null on any load/construct failure. */
  private bridge(): any {
    if (this._bridge) return this._bridge;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("./node-bridge.js");
      this._bridge = mod.getDefaultBridge();
    } catch {
      this._bridge = null;
    }
    return this._bridge;
  }

  // --- Socket creation / management ---

  /**
   * POSIX socket() — IEEE Std 1003.1-2017 §socket.
   * Returns an internal socket id on success, or -1 with errno.
   */
  socket(domain: number, type: number, protocol: number): NetResult {
    if (domain !== AF_INET && domain !== AF_INET6 && domain !== AF_UNIX) {
      return { ret: -1, err: EAFNOSUPPORT };
    }
    if (type !== SOCK_STREAM && type !== SOCK_DGRAM) {
      return { ret: -1, err: EINVAL };
    }
    const id = this.nextId++;
    this.sockets.set(id, new Socket(id, domain, type, protocol));
    // Force-bridge mode: allocate a bridge-side fd eagerly. For "auto" we
    // defer until connect/bind target is known (saves spinning up the
    // worker when translated C just creates a socket and walks away).
    if (this.bridgeMode === "node-sync") {
      const br = this.bridge();
      if (br) {
        const r = type === SOCK_DGRAM ? br.createUdp() : br.createTcp();
        if (r.ret > 0) this.bridged.set(id, r.ret);
      }
    }
    return { ret: id };
  }

  /** Look up a socket by its internal id. */
  get(id: number): Socket | null {
    return this.sockets.get(id) ?? null;
  }

  private keyOf(sa: SockAddr): string {
    // Treat 0.0.0.0 / :: as loopback aliases for the in-process stack.
    const host = (sa.addr === "0.0.0.0" || sa.addr === "::") ? "127.0.0.1" : sa.addr;
    return `${sa.family}:${host}:${sa.port}`;
  }

  /** POSIX bind() — IEEE Std 1003.1-2017 §bind. */
  bind(id: number, addr: SockAddr): NetResult {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    if (s.family !== addr.family) return { ret: -1, err: EAFNOSUPPORT };
    // Bridge path: if the stack is in node-sync / auto-and-real mode, route
    // through the worker. bind() itself decides whether to allocate a
    // bridge-side fd (auto mode, when this looks like real networking).
    if (this.shouldBridge(addr) || this.bridged.has(id)) {
      const br = this.bridge();
      if (br) {
        let bfd = this.bridged.get(id);
        if (bfd == null) {
          const alloc = s.type === SOCK_DGRAM ? br.createUdp() : br.createTcp();
          if (alloc.ret <= 0) return { ret: -1, err: alloc.err ?? EINVAL };
          bfd = alloc.ret;
          this.bridged.set(id, bfd);
        }
        const r = br.bind(bfd, addr);
        if (r.ret === 0) {
          // Cache the bound addr so getsockname() reflects the real bind.
          s.bound = { family: addr.family, addr: addr.addr, port: addr.port };
        }
        return { ret: r.ret, err: r.err };
      }
      // Bridge unavailable — fall through to loopback (Node-missing env).
    }
    // Port 0 → assign ephemeral.
    let port = addr.port;
    if (port === 0) port = this.ephemeral++;
    const bound = { family: addr.family, addr: addr.addr, port };
    const k = this.keyOf(bound);
    if (s.type === SOCK_STREAM) {
      if (this.listeners.has(k)) return { ret: -1, err: EADDRINUSE };
    } else if (s.type === SOCK_DGRAM) {
      if (this.udpBinds.has(k)) return { ret: -1, err: EADDRINUSE };
      this.udpBinds.set(k, s);
    }
    s.bound = bound;
    return { ret: 0 };
  }

  /** POSIX listen() — IEEE Std 1003.1-2017 §listen. */
  listen(id: number, backlog: number): NetResult {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    if (s.type !== SOCK_STREAM) return { ret: -1, err: EINVAL };
    if (!s.bound) return { ret: -1, err: EINVAL };
    // Bridge path — delegate to the worker. The worker's listen() also
    // reports back the actual bound port (when port 0 was used), but we
    // keep s.bound as the authoritative source for getsockname().
    const bfd = this.bridged.get(id);
    if (bfd != null) {
      const br = this.bridge();
      if (br) {
        const r = br.listen(bfd, Math.max(1, backlog));
        if (r.ret === 0) { s.listening = true; s.backlog = Math.max(1, backlog); }
        return { ret: r.ret, err: r.err };
      }
    }
    s.listening = true;
    s.backlog = Math.max(1, backlog);
    this.listeners.set(this.keyOf(s.bound), s);
    return { ret: 0 };
  }

  /**
   * POSIX accept() — IEEE Std 1003.1-2017 §accept.
   * Returns the new socket id on success, or -1 with EAGAIN if non-blocking
   * and no pending connection. In our single-threaded loopback model,
   * connect() has already enqueued the accept before calling accept().
   */
  accept(id: number): { ret: number; err?: number; peer?: SockAddr } {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    if (!s.listening) return { ret: -1, err: EINVAL };
    // Bridge path — blocks until a real peer connects.
    const bfd = this.bridged.get(id);
    if (bfd != null) {
      const br = this.bridge();
      if (br) {
        const r = br.accept(bfd);
        if (r.ret <= 0) return { ret: -1, err: r.err ?? EAGAIN };
        // Mint a local-side id aliased to this bridge fd.
        const childId = this.nextId++;
        const child = new Socket(childId, s.family, s.type, s.protocol);
        child.bound = s.bound ? { ...s.bound } : null;
        child.peerAddr = r.from ?? null;
        this.sockets.set(childId, child);
        this.bridged.set(childId, r.ret);
        return { ret: childId, peer: r.from };
      }
    }
    const child = s.pendingAccepts.shift();
    if (!child) {
      // Non-blocking sockets return EAGAIN immediately; blocking-mode
      // sockets would in a real OS wait. We cannot block in sync JS, so
      // return EAGAIN uniformly — caller may retry / use setImmediate.
      return { ret: -1, err: EAGAIN };
    }
    return { ret: child.id, peer: child.peerAddr ?? undefined };
  }

  /** POSIX connect() — IEEE Std 1003.1-2017 §connect. */
  connect(id: number, addr: SockAddr): NetResult {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    // Bridge path — decide here whether this connect targets a real host.
    if (this.shouldBridge(addr) || this.bridged.has(id)) {
      const br = this.bridge();
      if (br) {
        let bfd = this.bridged.get(id);
        if (bfd == null) {
          const alloc = s.type === SOCK_DGRAM ? br.createUdp() : br.createTcp();
          if (alloc.ret <= 0) return { ret: -1, err: alloc.err ?? EINVAL };
          bfd = alloc.ret;
          this.bridged.set(id, bfd);
        }
        const r = br.connect(bfd, addr);
        if (r.ret === 0) s.peerAddr = { ...addr };
        return { ret: r.ret, err: r.err };
      }
    }
    if (s.type === SOCK_DGRAM) {
      // UDP connect just records the default peer for send().
      s.peerAddr = { ...addr };
      return { ret: 0 };
    }
    if (s.type !== SOCK_STREAM) return { ret: -1, err: EINVAL };
    const listener = this.listeners.get(this.keyOf(addr));
    if (!listener) return { ret: -1, err: ECONNREFUSED };
    if (listener.pendingAccepts.length >= listener.backlog) {
      return { ret: -1, err: ECONNREFUSED };
    }
    // Auto-bind the client to an ephemeral local port.
    if (!s.bound) {
      const locAddr = s.family === AF_INET6 ? "::1" : "127.0.0.1";
      s.bound = { family: s.family, addr: locAddr, port: this.ephemeral++ };
    }
    // Create the server-side socket.
    const serverSide = new Socket(this.nextId++, listener.family, listener.type, listener.protocol);
    serverSide.bound = { ...listener.bound! };
    serverSide.peer = s;
    serverSide.peerAddr = { ...s.bound };
    this.sockets.set(serverSide.id, serverSide);
    s.peer = serverSide;
    s.peerAddr = { family: listener.family, addr: addr.addr, port: addr.port };
    listener.pendingAccepts.push(serverSide);
    return { ret: 0 };
  }

  /** POSIX send() — IEEE Std 1003.1-2017 §send. Returns bytes sent, or -1. */
  send(id: number, data: Uint8Array, _flags: number = 0): NetResult {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    const bfd = this.bridged.get(id);
    if (bfd != null) {
      const br = this.bridge();
      if (br) return br.send(bfd, data);
    }
    if (s.type === SOCK_STREAM) {
      if (!s.peer || s.shutWr) return { ret: -1, err: ENOTCONN };
      s.peer.rxBytes.push(data);
      return { ret: data.length };
    }
    if (s.type === SOCK_DGRAM) {
      if (!s.peerAddr) return { ret: -1, err: ENOTCONN };
      return this.sendto(id, data, 0, s.peerAddr);
    }
    return { ret: -1, err: EINVAL };
  }

  /** POSIX recv() — IEEE Std 1003.1-2017 §recv. */
  recv(id: number, n: number, flags: number = 0): { ret: number; data?: Uint8Array; err?: number } {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    const bfd = this.bridged.get(id);
    if (bfd != null) {
      const br = this.bridge();
      if (br) {
        const r = br.recv(bfd, n);
        return { ret: r.ret, data: r.data, err: r.err };
      }
    }
    if (s.type === SOCK_STREAM) {
      if (!s.peer && !s.rxBytes.available()) {
        // peer closed and buffer empty → EOF (ret=0 per POSIX).
        if (s.rxBytes.eof) return { ret: 0, data: new Uint8Array(0) };
        return { ret: -1, err: ENOTCONN };
      }
      const buf = s.rxBytes.pull(n);
      if (buf.length === 0) {
        if (s.rxBytes.eof) return { ret: 0, data: new Uint8Array(0) };
        return { ret: -1, err: EAGAIN };
      }
      // MSG_PEEK: re-push so next recv sees the same bytes.
      if ((flags & MSG_PEEK) !== 0) {
        const pushed = s.rxBytes;
        const rebuilt = new ByteQueue();
        rebuilt.push(buf);
        // Drain the existing queue behind the peeked chunk.
        while (pushed.available() > 0) rebuilt.push(pushed.pull(pushed.available()));
        s.rxBytes = rebuilt;
      }
      return { ret: buf.length, data: buf };
    }
    if (s.type === SOCK_DGRAM) {
      const dg = s.rxDatagrams.shift();
      if (!dg) return { ret: -1, err: EAGAIN };
      const out = dg.data.length > n ? dg.data.subarray(0, n).slice() : dg.data;
      return { ret: out.length, data: out };
    }
    return { ret: -1, err: EINVAL };
  }

  /** POSIX sendto() — IEEE Std 1003.1-2017 §sendto (UDP). */
  sendto(id: number, data: Uint8Array, _flags: number, addr: SockAddr): NetResult {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    if (s.type !== SOCK_DGRAM) return { ret: -1, err: EINVAL };
    // Bridge path — allocate the bridge-side udp socket on first send.
    if (this.shouldBridge(addr) || this.bridged.has(id)) {
      const br = this.bridge();
      if (br) {
        let bfd = this.bridged.get(id);
        if (bfd == null) {
          const alloc = br.createUdp();
          if (alloc.ret <= 0) return { ret: -1, err: alloc.err ?? EINVAL };
          bfd = alloc.ret;
          this.bridged.set(id, bfd);
          // Implicit ephemeral bind via the bridge too.
          const locAddr = s.family === AF_INET6 ? "::" : "0.0.0.0";
          br.bind(bfd, { family: s.family, addr: locAddr, port: 0 });
        }
        return br.sendto(bfd, data, addr);
      }
    }
    if (!s.bound) {
      // Implicit bind.
      const locAddr = s.family === AF_INET6 ? "::1" : "127.0.0.1";
      s.bound = { family: s.family, addr: locAddr, port: this.ephemeral++ };
      this.udpBinds.set(this.keyOf(s.bound), s);
    }
    const target = this.udpBinds.get(this.keyOf(addr));
    if (!target) {
      // Drop silently per UDP semantics, but report bytes "sent".
      return { ret: data.length };
    }
    target.rxDatagrams.push({ from: { ...s.bound }, data: data.slice() });
    return { ret: data.length };
  }

  /** POSIX recvfrom() — IEEE Std 1003.1-2017 §recvfrom (UDP). */
  recvfrom(id: number, n: number, _flags: number): { ret: number; data?: Uint8Array; from?: SockAddr; err?: number } {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    if (s.type !== SOCK_DGRAM) return { ret: -1, err: EINVAL };
    const bfd = this.bridged.get(id);
    if (bfd != null) {
      const br = this.bridge();
      if (br) {
        const r = br.recvfrom(bfd, n);
        return { ret: r.ret, data: r.data, from: r.from, err: r.err };
      }
    }
    const dg = s.rxDatagrams.shift();
    if (!dg) return { ret: -1, err: EAGAIN };
    const out = dg.data.length > n ? dg.data.subarray(0, n).slice() : dg.data;
    return { ret: out.length, data: out, from: dg.from };
  }

  /** POSIX shutdown() — IEEE Std 1003.1-2017 §shutdown. */
  shutdown(id: number, how: number): NetResult {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    const bfdShut = this.bridged.get(id);
    if (bfdShut != null) {
      const br = this.bridge();
      if (br) return br.shutdown(bfdShut, how);
    }
    if (how === SHUT_RD || how === SHUT_RDWR) s.shutRd = true;
    if (how === SHUT_WR || how === SHUT_RDWR) {
      s.shutWr = true;
      if (s.peer) s.peer.rxBytes.eof = true;
    }
    return { ret: 0 };
  }

  /** POSIX close() on a socket fd (network side). */
  closeSocket(id: number): NetResult {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    const bfdCls = this.bridged.get(id);
    if (bfdCls != null) {
      const br = this.bridge();
      if (br) {
        try { br.closeSocket(bfdCls); } catch { /* best effort */ }
      }
      this.bridged.delete(id);
      this.sockets.delete(id);
      return { ret: 0 };
    }
    s.closed = true;
    if (s.peer) {
      s.peer.rxBytes.eof = true;
      s.peer.peer = null;
    }
    if (s.bound && s.type === SOCK_DGRAM) this.udpBinds.delete(this.keyOf(s.bound));
    if (s.listening && s.bound) this.listeners.delete(this.keyOf(s.bound));
    this.sockets.delete(id);
    return { ret: 0 };
  }

  // --- Options ---

  /** POSIX setsockopt() — IEEE Std 1003.1-2017 §setsockopt. */
  setsockopt(id: number, level: number, optname: number, optval: number): NetResult {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    // Store verbatim; most options are cooperative. level is ignored — we
    // keep a flat map.
    void level;
    s.opts.set(optname, optval);
    return { ret: 0 };
  }

  /** POSIX getsockopt() — IEEE Std 1003.1-2017 §getsockopt. */
  getsockopt(id: number, level: number, optname: number): { ret: number; optval?: number; err?: number } {
    const s = this.sockets.get(id);
    if (!s) return { ret: -1, err: ENOTSOCK };
    void level;
    // Synthesise a few well-known readbacks.
    if (optname === SO_TYPE) return { ret: 0, optval: s.type };
    if (optname === SO_ERROR) return { ret: 0, optval: 0 };
    return { ret: 0, optval: s.opts.get(optname) ?? 0 };
  }

  /** Return the bound local name of a socket (POSIX getsockname). */
  getsockname(id: number): SockAddr | null {
    const s = this.sockets.get(id);
    return s?.bound ?? null;
  }

  /** Return the connected peer name (POSIX getpeername). */
  getpeername(id: number): SockAddr | null {
    const s = this.sockets.get(id);
    return s?.peerAddr ?? null;
  }

  /** Return true if the socket has data available to recv() without blocking. */
  hasReadable(id: number): boolean {
    const s = this.sockets.get(id);
    if (!s) return false;
    if (s.type === SOCK_STREAM) return s.rxBytes.available() > 0 || s.rxBytes.eof;
    if (s.type === SOCK_DGRAM) return s.rxDatagrams.length > 0;
    if (s.listening) return s.pendingAccepts.length > 0;
    return false;
  }
}

// --- Byte-order / address presentation helpers ---
// IEEE Std 1003.1-2017 <arpa/inet.h>.

/** htonl — host to network long. JS numbers are effectively big-endian on
 *  the wire; we swap to the 32-bit big-endian representation. */
export function htonl(x: number): number {
  return (
    ((x & 0xff) << 24) |
    ((x & 0xff00) << 8) |
    ((x >>> 8) & 0xff00) |
    ((x >>> 24) & 0xff)
  ) >>> 0;
}

/** htons — host to network short. */
export function htons(x: number): number {
  return (((x & 0xff) << 8) | ((x >>> 8) & 0xff)) & 0xffff;
}

/** ntohl — inverse of htonl (bitwise identical transformation). */
export function ntohl(x: number): number { return htonl(x); }

/** ntohs — inverse of htons. */
export function ntohs(x: number): number { return htons(x); }

/**
 * inet_pton — IEEE Std 1003.1-2017 §inet_pton.
 * Parses a presentation-form address into an array of bytes. Returns:
 *  1 on success (out is filled), 0 if src is not a valid address, -1 for
 *  unsupported family.
 */
export function inet_pton(af: number, src: string, out: Uint8Array): number {
  if (af === AF_INET) {
    const parts = src.split(".");
    if (parts.length !== 4) return 0;
    for (let i = 0; i < 4; i++) {
      const n = Number(parts[i]);
      if (!Number.isInteger(n) || n < 0 || n > 255 || parts[i]!.length === 0) return 0;
      out[i] = n;
    }
    return 1;
  }
  if (af === AF_INET6) {
    // Accept the common forms: full, ::, ::1, embedded v4 (a:b:c:d:e:f:1.2.3.4).
    const s = src;
    if (s.length === 0) return 0;
    // Split at "::" at most once.
    let head = "", tail = "";
    const dd = s.indexOf("::");
    if (dd >= 0) {
      head = s.substring(0, dd);
      tail = s.substring(dd + 2);
      if (tail.indexOf("::") >= 0) return 0;
    } else {
      head = s;
    }
    const expand = (seg: string): number[] => {
      if (seg.length === 0) return [];
      const parts = seg.split(":");
      const nums: number[] = [];
      for (const p of parts) {
        if (p.length === 0 || p.length > 4) return [-1];
        const n = parseInt(p, 16);
        if (Number.isNaN(n) || n < 0 || n > 0xffff) return [-1];
        nums.push(n);
      }
      return nums;
    };
    const hNums = expand(head);
    const tNums = expand(tail);
    if (hNums[0] === -1 || tNums[0] === -1) return 0;
    const total = hNums.length + tNums.length;
    if (total > 8) return 0;
    if (dd < 0 && total !== 8) return 0;
    const fill = 8 - total;
    const all = [...hNums, ...Array(fill).fill(0), ...tNums];
    for (let i = 0; i < 8; i++) {
      out[i * 2]     = (all[i] >>> 8) & 0xff;
      out[i * 2 + 1] = all[i] & 0xff;
    }
    return 1;
  }
  return -1;
}

/**
 * inet_ntop — IEEE Std 1003.1-2017 §inet_ntop.
 * Formats a raw address (4 or 16 bytes) into presentation form.
 * Returns the string, or null if af is unsupported or src is too short.
 */
export function inet_ntop(af: number, src: Uint8Array): string | null {
  if (af === AF_INET) {
    if (src.length < 4) return null;
    return `${src[0]}.${src[1]}.${src[2]}.${src[3]}`;
  }
  if (af === AF_INET6) {
    if (src.length < 16) return null;
    const parts: string[] = [];
    for (let i = 0; i < 16; i += 2) {
      parts.push(((src[i]! << 8) | src[i + 1]!).toString(16));
    }
    // Collapse the longest run of zeroes per RFC 5952.
    let bestStart = -1, bestLen = 0;
    let curStart = -1, curLen = 0;
    for (let i = 0; i < 8; i++) {
      if (parts[i] === "0") {
        if (curStart < 0) { curStart = i; curLen = 1; } else curLen++;
        if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
      } else { curStart = -1; curLen = 0; }
    }
    if (bestLen >= 2) {
      const pre = parts.slice(0, bestStart).join(":");
      const post = parts.slice(bestStart + bestLen).join(":");
      return `${pre}::${post}`;
    }
    return parts.join(":");
  }
  return null;
}

/**
 * getaddrinfo — IEEE Std 1003.1-2017 §getaddrinfo.
 *
 * In-process synchronous resolver. Accepts numeric addresses (always) and a
 * short list of well-known hostnames (localhost, 0.0.0.0). Real DNS would
 * require Node's `dns.lookup`, which is asynchronous and therefore outside
 * the sync ABI of this module — documented as best-effort.
 * Returns the list of addrinfo entries on success, or null on failure.
 */
export function getaddrinfo(
  node: string | null,
  service: string | null,
  hints?: Partial<AddrInfo>,
): AddrInfo[] | null {
  const family = hints?.ai_family ?? AF_UNSPEC;
  const socktype = hints?.ai_socktype ?? SOCK_STREAM;
  const protocol = hints?.ai_protocol ?? 0;
  let port = 0;
  if (service) {
    const n = Number(service);
    if (Number.isInteger(n) && n >= 0 && n < 65536) port = n;
    else return null; // service-name lookup not implemented.
  }
  const out: AddrInfo[] = [];
  const host = node ?? (hints && "AI_PASSIVE" in hints ? "0.0.0.0" : "127.0.0.1");
  const tryV4 = (addr: string): void => {
    const buf = new Uint8Array(4);
    if (inet_pton(AF_INET, addr, buf) === 1) {
      out.push({
        ai_family: AF_INET,
        ai_socktype: socktype,
        ai_protocol: protocol,
        ai_addr: { family: AF_INET, addr, port },
        ai_canonname: node ?? undefined,
      });
    }
  };
  const tryV6 = (addr: string): void => {
    const buf = new Uint8Array(16);
    if (inet_pton(AF_INET6, addr, buf) === 1) {
      out.push({
        ai_family: AF_INET6,
        ai_socktype: socktype,
        ai_protocol: protocol,
        ai_addr: { family: AF_INET6, addr, port },
        ai_canonname: node ?? undefined,
      });
    }
  };
  if (host === "localhost") {
    if (family === AF_UNSPEC || family === AF_INET)  tryV4("127.0.0.1");
    if (family === AF_UNSPEC || family === AF_INET6) tryV6("::1");
  } else if (host.indexOf(":") >= 0) {
    if (family === AF_UNSPEC || family === AF_INET6) tryV6(host);
  } else {
    if (family === AF_UNSPEC || family === AF_INET)  tryV4(host);
  }
  return out.length > 0 ? out : null;
}
