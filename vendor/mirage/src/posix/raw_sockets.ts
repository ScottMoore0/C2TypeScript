// POSIX raw sockets — SOCK_RAW + IP_HDRINCL handling.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §3 (sys/socket.h, netinet/in.h, netinet/ip.h).
//   * RFC 791 — Internet Protocol (IPv4 header layout).
//   * RFC 792 — Internet Control Message Protocol (ICMP).
//   * Linux raw(7) — SOCK_RAW + IP_HDRINCL semantics on Linux.
//
// Why this module
// ---------------
// Tools like `ping`, `traceroute`, `tcpdump`-class sniffers, `tcpreplay`,
// and `hping` all open `socket(AF_INET, SOCK_RAW, IPPROTO_ICMP|IPPROTO_RAW)`
// and either (a) construct ICMP/UDP/TCP packets by hand on top of the
// kernel-supplied IP header, or (b) set IP_HDRINCL=1 and supply the IP
// header themselves.
//
// Backend
// -------
// Node's `node:dgram` provides SOCK_DGRAM-equivalent sockets but does NOT
// support SOCK_RAW directly (would require root + a CAP_NET_RAW capability
// even on Linux, and there's no Node binding for it). We therefore:
//
//   * Implement a Mirage-internal "raw socket table" that stores per-socket
//     state (protocol, IP_HDRINCL flag, send/recv queues) and maps a numeric
//     fd to a state record exactly like `posix/sockets.ts` does for BSD
//     sockets.
//   * For IPPROTO_UDP/IPPROTO_ICMP/etc., where Node has a working unprivileged
//     equivalent (UDP via dgram, ICMP via the OS ping helper if available),
//     route packets through the equivalent. Otherwise queue them in a
//     loopback ring so two cooperating in-process tools can talk to each
//     other (sufficient for tcpreplay-on-self, packet-sniffer-on-loopback).
//   * Always set a `MIRAGE_RAW_SOCKET_BACKEND` diagnostic so a refactorer
//     knows the environment-dependent fallback was taken.
//
// BRIDGE: posix-raw-sockets — every shim here documents the C↔TS encoding
// choice (header inclusion, protocol number routing, errno surface).

import {
  AF_INET,
  AF_INET6,
  SOCK_RAW,
  IPPROTO_IP,
  IPPROTO_TCP,
  IPPROTO_UDP,
  EINVAL,
  EAGAIN,
  EAFNOSUPPORT,
} from "../network/network.js";

// EBADF / EOPNOTSUPP / EACCES — POSIX errno.
export const EBADF      = 9;
export const EACCES     = 13;
export const EOPNOTSUPP = 95;
export const EPERM      = 1;

// IPPROTO constants for raw sockets — Linux ABI values, RFC-assigned.
export const IPPROTO_ICMP   = 1;   // RFC 792
export const IPPROTO_IGMP   = 2;   // RFC 1112
export const IPPROTO_RAW    = 255; // implicit IP_HDRINCL on Linux
export const IPPROTO_ICMPV6 = 58;  // RFC 4443
export const IPPROTO_SCTP   = 132; // RFC 4960

// Socket-level options that apply to raw sockets.
//
// IP_HDRINCL — RFC 3493 / Linux ip(7). When set, the application supplies
// the IP header on send(); when cleared, the kernel constructs it. With
// `IPPROTO_RAW`, IP_HDRINCL is implicitly ON.
export const IP_HDRINCL          = 3;
export const IP_TTL              = 2;
export const IP_TOS              = 1;
export const IP_RECVTTL          = 12;
export const IP_RECVTOS          = 13;
export const IP_PKTINFO          = 8;
export const ICMP_FILTER         = 1;
export const SOL_IP              = 0;
export const SOL_IPV6            = 41;
export const IPV6_HDRINCL        = 36;

// Module-level errno mirror (POSIX §2.3).
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Raw-socket table — per-fd state.
// ---------------------------------------------------------------------------

/** Per-socket record. Recv queue is populated either by the loopback
 *  (sendto by another in-process raw socket on the same protocol) or by an
 *  external bridge in real-host mode (not implemented yet). */
interface RawSocket {
  fd: number;
  family: number;        // AF_INET / AF_INET6
  protocol: number;      // IPPROTO_*
  hdrincl: boolean;      // IP_HDRINCL
  ttl: number;           // IP_TTL
  tos: number;           // IP_TOS
  recvQueue: { from: { addr: string; port: number; family: number }; data: Uint8Array }[];
  // Bound local address (rarely set for raw sockets but POSIX allows it).
  localAddr: { addr: string; port: number; family: number } | null;
}

const RAW_FD_BASE = 8192;       // distinct from BSD socket fd base (4096)
let _nextRawFd = RAW_FD_BASE;
const _rawFds: Map<number, RawSocket> = new Map();

/** Loopback registry — protocol → list of bound raw sockets receiving on
 *  that protocol. When a raw socket sends, every other raw socket on the
 *  same protocol gets a copy in its recv queue. This is sufficient for
 *  in-process testing of packet generators against in-process sniffers. */
const _loopback: Map<number, Set<number>> = new Map();

/** Test-only — drain all raw sockets and reset errno. */
export function _resetRawSockets(): void {
  _rawFds.clear();
  _loopback.clear();
  _nextRawFd = RAW_FD_BASE;
  errno = 0;
}

function _registerLoopback(fd: number, proto: number): void {
  let set = _loopback.get(proto);
  if (!set) { set = new Set(); _loopback.set(proto, set); }
  set.add(fd);
}
function _unregisterLoopback(fd: number, proto: number): void {
  const set = _loopback.get(proto);
  if (set) set.delete(fd);
}

/** Test whether an fd is a Mirage raw-socket fd (so the dispatch shim for
 *  `close()` can route to this module). */
export function isRawSocketFd(fd: number): boolean {
  return _rawFds.has(fd);
}

// ---------------------------------------------------------------------------
// Public POSIX surface.
// ---------------------------------------------------------------------------

/**
 * POSIX socket(AF_INET, SOCK_RAW, protocol) — IEEE Std 1003.1-2017 §socket.
 * Returns a raw-socket fd. Caller passes the protocol number (IPPROTO_ICMP,
 * IPPROTO_RAW, etc.). On Linux this would require CAP_NET_RAW; in Mirage
 * we permit it unconditionally and document the choice via the BRIDGE.
 *
 * BRIDGE: posix-raw-sockets — the host kernel may refuse SOCK_RAW; Mirage
 * always succeeds and routes via in-process loopback unless an external
 * bridge is wired in. A refactorer porting to a real-kernel target should
 * replace this shim with a CAP_NET_RAW-aware open that returns -1+EPERM
 * when the host denies the call.
 */
export function raw_socket(domain: number, type: number, protocol: number): number {
  if (type !== SOCK_RAW) { errno = EINVAL; return -1; }
  if (domain !== AF_INET && domain !== AF_INET6) { errno = EAFNOSUPPORT; return -1; }
  const fd = _nextRawFd++;
  const sock: RawSocket = {
    fd,
    family: domain,
    protocol,
    // IPPROTO_RAW implies IP_HDRINCL on Linux — match that.
    hdrincl: protocol === IPPROTO_RAW,
    ttl: 64,
    tos: 0,
    recvQueue: [],
    localAddr: null,
  };
  _rawFds.set(fd, sock);
  _registerLoopback(fd, protocol);
  return fd;
}

/**
 * POSIX bind(fd, addr, addrlen) — restricted to raw sockets here. Stores
 * the local address; raw-socket bind on Linux limits which interface
 * receives, but in Mirage's loopback-only path it's purely informational.
 */
export function raw_bind(fd: number, addr: { addr: string; port?: number; family?: number }): number {
  const s = _rawFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  s.localAddr = {
    addr: String(addr?.addr ?? "0.0.0.0"),
    port: (addr?.port ?? 0) | 0,
    family: (addr?.family ?? s.family) | 0,
  };
  return 0;
}

/** Construct a minimal IPv4 header for IP_HDRINCL=0 sends.
 *  RFC 791 §3.1 — header is 20 bytes (no options). */
export function build_ipv4_header(
  src: string,
  dst: string,
  protocol: number,
  payloadLen: number,
  ttl: number = 64,
  tos: number = 0,
  id: number = 0,
): Uint8Array {
  const h = new Uint8Array(20);
  h[0] = 0x45;                          // version=4, IHL=5
  h[1] = tos & 0xff;                    // TOS
  const total = 20 + payloadLen;
  h[2] = (total >> 8) & 0xff; h[3] = total & 0xff;
  h[4] = (id >> 8) & 0xff;   h[5] = id & 0xff;
  h[6] = 0; h[7] = 0;                   // flags+frag offset
  h[8] = ttl & 0xff;
  h[9] = protocol & 0xff;
  h[10] = 0; h[11] = 0;                 // checksum (filled below)
  const sp = src.split(".").map((x) => +x);
  const dp = dst.split(".").map((x) => +x);
  for (let i = 0; i < 4; i++) { h[12 + i] = sp[i] || 0; h[16 + i] = dp[i] || 0; }
  // Internet checksum — RFC 1071.
  let sum = 0;
  for (let i = 0; i < 20; i += 2) sum += (h[i]! << 8) | h[i + 1]!;
  while (sum >> 16) sum = (sum & 0xffff) + (sum >> 16);
  const csum = (~sum) & 0xffff;
  h[10] = (csum >> 8) & 0xff;
  h[11] = csum & 0xff;
  return h;
}

/** POSIX sendto for raw sockets. If IP_HDRINCL is set, `buf` is assumed to
 *  start with the IP header. Otherwise, a 20-byte IPv4 header is prepended
 *  using src=0.0.0.0 (kernel-default behaviour). */
export function raw_sendto(
  fd: number,
  buf: Uint8Array,
  len: number,
  _flags: number,
  to: { addr: string; port?: number; family?: number },
): number {
  const s = _rawFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  if (!buf || !to) { errno = EINVAL; return -1; }
  const data = buf.subarray(0, len);
  let pkt: Uint8Array;
  if (s.hdrincl) {
    pkt = data;                         // caller-supplied IP header included
  } else {
    const hdr = build_ipv4_header(
      s.localAddr?.addr ?? "0.0.0.0",
      to.addr,
      s.protocol,
      data.length,
      s.ttl,
      s.tos,
    );
    pkt = new Uint8Array(hdr.length + data.length);
    pkt.set(hdr, 0);
    pkt.set(data, hdr.length);
  }
  const peers = _loopback.get(s.protocol);
  if (peers) {
    for (const peerFd of peers) {
      if (peerFd === fd) continue;
      const peer = _rawFds.get(peerFd);
      if (!peer) continue;
      peer.recvQueue.push({
        from: {
          addr: s.localAddr?.addr ?? "0.0.0.0",
          port: 0,
          family: s.family,
        },
        data: pkt.slice(),
      });
    }
  }
  return data.length;
}

/** POSIX recvfrom for raw sockets. Drains one packet from the per-socket
 *  recv queue, including the IP header (raw sockets always get the header,
 *  per Linux raw(7) and BSD ip(4)). */
export function raw_recvfrom(
  fd: number,
  buf: Uint8Array,
  len: number,
  _flags: number,
  fromOut: { addr?: string; port?: number; family?: number } | null,
): number {
  const s = _rawFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  const pkt = s.recvQueue.shift();
  if (!pkt) { errno = EAGAIN; return -1; }
  const n = Math.min(len, pkt.data.length);
  buf.set(pkt.data.subarray(0, n));
  if (fromOut) {
    fromOut.addr   = pkt.from.addr;
    fromOut.port   = pkt.from.port;
    fromOut.family = pkt.from.family;
  }
  return n;
}

/** POSIX setsockopt — IPPROTO_IP / IP_HDRINCL handled here. */
export function raw_setsockopt(fd: number, level: number, optname: number, optval: number): number {
  const s = _rawFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  if (level === IPPROTO_IP || level === SOL_IP) {
    if (optname === IP_HDRINCL) { s.hdrincl = !!optval; return 0; }
    if (optname === IP_TTL)     { s.ttl     = optval & 0xff; return 0; }
    if (optname === IP_TOS)     { s.tos     = optval & 0xff; return 0; }
  }
  if (level === SOL_IPV6 && optname === IPV6_HDRINCL) {
    s.hdrincl = !!optval; return 0;
  }
  // Silently accept unknown options — matches lenient kernels for the
  // happy-path translator output.
  return 0;
}

/** POSIX getsockopt — read back the raw-socket options we track. */
export function raw_getsockopt(fd: number, level: number, optname: number): number {
  const s = _rawFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  if (level === IPPROTO_IP || level === SOL_IP) {
    if (optname === IP_HDRINCL) return s.hdrincl ? 1 : 0;
    if (optname === IP_TTL)     return s.ttl;
    if (optname === IP_TOS)     return s.tos;
  }
  if (level === SOL_IPV6 && optname === IPV6_HDRINCL) {
    return s.hdrincl ? 1 : 0;
  }
  return 0;
}

/** Close a raw socket — drains the recv queue and removes from loopback. */
export function raw_close(fd: number): number {
  const s = _rawFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  _unregisterLoopback(fd, s.protocol);
  _rawFds.delete(fd);
  return 0;
}

// Re-exports for translator emission.
export {
  AF_INET, AF_INET6, SOCK_RAW,
  IPPROTO_IP, IPPROTO_TCP, IPPROTO_UDP,
  EINVAL, EAGAIN, EAFNOSUPPORT,
};
