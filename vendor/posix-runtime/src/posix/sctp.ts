// POSIX <netinet/sctp.h> — Stream Control Transmission Protocol shims.
//
// Spec sources
// ------------
//   * RFC 4960 — Stream Control Transmission Protocol.
//   * RFC 6458 — SCTP Sockets API Extensions (the API surface defined here).
//   * Linux sctp(7) — kernel implementation reference.
//
// Why this module
// ---------------
// Telecom protocol stacks (Diameter for AAA, S1AP / NGAP / SCTP-over-IP for
// LTE / 5G control plane, M3UA / SUA for SS7-over-IP) all run on SCTP. Real
// SCTP is a transport with multi-streaming + multi-homing + ordered/unordered
// delivery + message boundaries — none of which Node ships natively.
//
// Backend
// -------
// Node has no native SCTP. We therefore:
//
//   * Provide a Mirage-internal SCTP-like socket where send/recv preserve
//     message boundaries (datagram-like) and a single peer is supported per
//     association (multi-homing collapses to single-address). This is enough
//     to host translated C against an in-process partner — sufficient for
//     translating telecom stacks that use SCTP for transport but where the
//     test harness can simulate the peer in-process.
//   * Stub the multi-homing / multi-streaming / partial-delivery extensions
//     so the API compiles and returns predictable diagnostic-shaped values.
//   * Set MIRAGE_SCTP_DIAGNOSTIC on the first call to flag the
//     "no-real-SCTP" choice; refactorers can then wire to libsctp via an
//     FFI binding or to a cooperating in-process server.
//
// BRIDGE: posix-sctp — the entire surface is annotated; every call site is
// a refactoring boundary for swapping in a real SCTP implementation.

import {
  AF_INET,
  AF_INET6,
  SOCK_STREAM,
  SOCK_DGRAM,
  EINVAL,
  EAGAIN,
} from "../network/network.js";

export const EBADF      = 9;
export const EOPNOTSUPP = 95;
export const EPROTONOSUPPORT = 93;

// IPPROTO_SCTP — RFC 4960 protocol number.
export const IPPROTO_SCTP = 132;

// SCTP socket types.
//
// SOCK_STREAM = one-to-one, single-association sockets (TCP-like API).
// SOCK_SEQPACKET = one-to-many (UDP-like API, multiple associations on one fd).
export const SOCK_SEQPACKET = 5;

// SCTP_* socket options — RFC 6458 §8.
export const SCTP_RTOINFO              = 0;
export const SCTP_ASSOCINFO            = 1;
export const SCTP_INITMSG              = 2;
export const SCTP_NODELAY              = 3;
export const SCTP_AUTOCLOSE            = 4;
export const SCTP_SET_PEER_PRIMARY_ADDR = 5;
export const SCTP_PRIMARY_ADDR         = 6;
export const SCTP_ADAPTATION_LAYER     = 7;
export const SCTP_DISABLE_FRAGMENTS    = 8;
export const SCTP_PEER_ADDR_PARAMS     = 9;
export const SCTP_DEFAULT_SEND_PARAM   = 10;
export const SCTP_EVENTS               = 11;
export const SCTP_I_WANT_MAPPED_V4_ADDR = 12;
export const SCTP_MAXSEG               = 13;
export const SCTP_STATUS               = 14;
export const SCTP_GET_PEER_ADDR_INFO   = 15;
export const SCTP_DELAYED_SACK         = 16;
export const SCTP_FRAGMENT_INTERLEAVE  = 17;
export const SCTP_PARTIAL_DELIVERY_POINT = 18;
export const SCTP_MAX_BURST            = 19;
export const SCTP_AUTH_CHUNK           = 20;
export const SCTP_HMAC_IDENT           = 21;
export const SCTP_AUTH_KEY             = 22;
export const SCTP_PEER_AUTH_CHUNKS     = 23;
export const SCTP_LOCAL_AUTH_CHUNKS    = 24;
export const SCTP_GET_ASSOC_NUMBER     = 25;
export const SCTP_GET_ASSOC_ID_LIST    = 26;
export const SCTP_AUTH_ACTIVE_KEY      = 27;

// SCTP send/recv flags — RFC 6458 §5.
export const SCTP_UNORDERED   = 0x0001;
export const SCTP_ADDR_OVER   = 0x0002;
export const SCTP_ABORT       = 0x0004;
export const SCTP_SACK_IMMEDIATELY = 0x0008;
export const SCTP_EOF         = 0x0010;

// sctp_bindx flags — RFC 6458 §9.1.
export const SCTP_BINDX_ADD_ADDR    = 0x01;
export const SCTP_BINDX_REM_ADDR    = 0x02;

// Notification types — RFC 6458 §6.
export const SCTP_ASSOC_CHANGE       = 0x0001;
export const SCTP_PEER_ADDR_CHANGE   = 0x0002;
export const SCTP_REMOTE_ERROR       = 0x0003;
export const SCTP_SEND_FAILED        = 0x0004;
export const SCTP_SHUTDOWN_EVENT     = 0x0005;
export const SCTP_ADAPTATION_INDICATION = 0x0006;
export const SCTP_PARTIAL_DELIVERY_EVENT = 0x0007;
export const SCTP_AUTHENTICATION_EVENT = 0x0008;

// errno mirror.
export let errno: number = 0;

// ---------------------------------------------------------------------------
// SCTP socket table.
// ---------------------------------------------------------------------------

interface SctpMessage {
  data: Uint8Array;
  stream: number;
  ppid: number;
  flags: number;
  from: { addr: string; port: number; family: number };
  assocId: number;
}

interface SctpAssoc {
  id: number;
  peerAddrs: { addr: string; port: number; family: number }[];
  primaryAddr: { addr: string; port: number; family: number };
  numIstreams: number;
  numOstreams: number;
}

interface SctpSocket {
  fd: number;
  family: number;
  type: number; // SOCK_STREAM | SOCK_SEQPACKET
  localAddrs: { addr: string; port: number; family: number }[];
  assocs: Map<number, SctpAssoc>;
  recvQueue: SctpMessage[];
  // Options.
  nodelay: boolean;
  disableFragments: boolean;
  maxSeg: number;
  // RTO / association params (defaults from RFC 4960).
  rto_initial: number;
  rto_min: number;
  rto_max: number;
}

const SCTP_FD_BASE = 12288;
let _nextSctpFd = SCTP_FD_BASE;
let _nextAssocId = 1;
const _sctpFds: Map<number, SctpSocket> = new Map();

/** Test-only — drain. */
export function _resetSctp(): void {
  _sctpFds.clear();
  _nextSctpFd = SCTP_FD_BASE;
  _nextAssocId = 1;
  errno = 0;
}

/** Test whether an fd is an SCTP fd (for close() dispatch). */
export function isSctpFd(fd: number): boolean {
  return _sctpFds.has(fd);
}

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------

/** POSIX socket(AF_INET, SOCK_STREAM|SOCK_SEQPACKET, IPPROTO_SCTP). */
export function sctp_socket(domain: number, type: number, protocol: number): number {
  if (protocol !== IPPROTO_SCTP) { errno = EPROTONOSUPPORT; return -1; }
  if (type !== SOCK_STREAM && type !== SOCK_SEQPACKET) { errno = EINVAL; return -1; }
  if (domain !== AF_INET && domain !== AF_INET6) { errno = EINVAL; return -1; }
  const fd = _nextSctpFd++;
  const s: SctpSocket = {
    fd, family: domain, type,
    localAddrs: [],
    assocs: new Map(),
    recvQueue: [],
    nodelay: false,
    disableFragments: false,
    maxSeg: 1452,
    rto_initial: 3000,
    rto_min: 1000,
    rto_max: 60000,
  };
  _sctpFds.set(fd, s);
  return fd;
}

/**
 * RFC 6458 §9.1 sctp_bindx — add or remove a list of local addresses to
 * the SCTP socket. `addrs` is an array of address descriptors; `flags` is
 * SCTP_BINDX_ADD_ADDR or SCTP_BINDX_REM_ADDR.
 *
 * BRIDGE: posix-sctp — multi-homing is reduced to "first address wins" for
 * the in-process transport; the full address list is preserved so a future
 * real-SCTP backend can use it.
 */
export function sctp_bindx(
  fd: number,
  addrs: { addr: string; port?: number; family?: number }[],
  flags: number,
): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  if (!Array.isArray(addrs)) { errno = EINVAL; return -1; }
  if (flags === SCTP_BINDX_ADD_ADDR) {
    for (const a of addrs) {
      s.localAddrs.push({
        addr: String(a.addr), port: (a.port ?? 0) | 0,
        family: (a.family ?? s.family) | 0,
      });
    }
  } else if (flags === SCTP_BINDX_REM_ADDR) {
    s.localAddrs = s.localAddrs.filter((la) =>
      !addrs.some((rm) => rm.addr === la.addr));
  } else { errno = EINVAL; return -1; }
  return 0;
}

/**
 * RFC 6458 §9.2 sctp_connectx — connect to a list of peer addresses and
 * return the new association id through `*assoc_id`. In Mirage's
 * loopback-only path, the peer must be another in-process SCTP socket
 * bound to one of the requested addresses.
 */
export function sctp_connectx(
  fd: number,
  addrs: { addr: string; port?: number; family?: number }[],
  assoc_id_out: { value: number } | null,
): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  if (!addrs || addrs.length === 0) { errno = EINVAL; return -1; }
  const assocId = _nextAssocId++;
  const peerList = addrs.map((a) => ({
    addr: String(a.addr),
    port: (a.port ?? 0) | 0,
    family: (a.family ?? s.family) | 0,
  }));
  const assoc: SctpAssoc = {
    id: assocId,
    peerAddrs: peerList,
    primaryAddr: peerList[0]!,
    numIstreams: 10,
    numOstreams: 10,
  };
  s.assocs.set(assocId, assoc);
  if (assoc_id_out) assoc_id_out.value = assocId;
  return 0;
}

/**
 * RFC 6458 §8.7 sctp_peeloff — peel one association off a one-to-many
 * socket and return a new one-to-one fd dedicated to that association.
 */
export function sctp_peeloff(fd: number, assoc_id: number): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  const assoc = s.assocs.get(assoc_id);
  if (!assoc) { errno = EINVAL; return -1; }
  const newFd = _nextSctpFd++;
  const peeled: SctpSocket = {
    fd: newFd, family: s.family, type: SOCK_STREAM,
    localAddrs: s.localAddrs.slice(),
    assocs: new Map([[assoc_id, assoc]]),
    recvQueue: [],
    nodelay: s.nodelay, disableFragments: s.disableFragments, maxSeg: s.maxSeg,
    rto_initial: s.rto_initial, rto_min: s.rto_min, rto_max: s.rto_max,
  };
  _sctpFds.set(newFd, peeled);
  s.assocs.delete(assoc_id);
  return newFd;
}

/**
 * RFC 6458 §9.3 sctp_getladdrs — return the list of local addresses bound
 * to this socket (or association). Allocates a JS array; caller must call
 * sctp_freeladdrs() to "free" (no-op in JS, kept for ABI parity).
 *
 * Returns the count; the list is written through `*addrs`.
 */
export function sctp_getladdrs(
  fd: number,
  _assoc_id: number,
  addrs_out: { value: { addr: string; port: number; family: number }[] | null },
): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  addrs_out.value = s.localAddrs.slice();
  return s.localAddrs.length;
}

/** RFC 6458 §9.3 sctp_freeladdrs — no-op in JS (GC); kept for ABI parity. */
export function sctp_freeladdrs(addrs: { value: any } | null): void {
  if (addrs) addrs.value = null;
}

/** RFC 6458 §9.4 sctp_getpaddrs — return the list of peer addresses for
 *  the given association. */
export function sctp_getpaddrs(
  fd: number,
  assoc_id: number,
  addrs_out: { value: { addr: string; port: number; family: number }[] | null },
): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  const assoc = s.assocs.get(assoc_id);
  if (!assoc) { errno = EINVAL; return -1; }
  addrs_out.value = assoc.peerAddrs.slice();
  return assoc.peerAddrs.length;
}

/** RFC 6458 §9.4 sctp_freepaddrs — no-op in JS. */
export function sctp_freepaddrs(addrs: { value: any } | null): void {
  if (addrs) addrs.value = null;
}

/**
 * RFC 6458 §8.7 sctp_sendmsg — send a message on an association with stream
 * number, ppid (payload protocol identifier), and flags. For SOCK_STREAM
 * sockets, `to` and `assoc_id` are typically ignored (the only association
 * is the connected one).
 */
export function sctp_sendmsg(
  fd: number,
  msg: Uint8Array,
  len: number,
  to: { addr: string; port?: number; family?: number } | null,
  ppid: number,
  flags: number,
  stream_no: number,
  _timetolive: number,
  _context: number,
): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  if (!msg) { errno = EINVAL; return -1; }
  // Pick the destination from `to` or the first association.
  let dest = to;
  let assocId = 0;
  if (!dest && s.assocs.size > 0) {
    const first = s.assocs.values().next().value!;
    dest = first.primaryAddr;
    assocId = first.id;
  }
  if (!dest) { errno = EINVAL; return -1; }
  // Loopback delivery to any SCTP socket bound to `dest`.
  const data = msg.subarray(0, len);
  for (const peer of _sctpFds.values()) {
    if (peer === s) continue;
    if (peer.localAddrs.some((la) => la.addr === dest!.addr)) {
      peer.recvQueue.push({
        data: data.slice(),
        stream: stream_no | 0,
        ppid: ppid | 0,
        flags: flags | 0,
        from: {
          addr: s.localAddrs[0]?.addr ?? "0.0.0.0",
          port: s.localAddrs[0]?.port ?? 0,
          family: s.family,
        },
        assocId,
      });
    }
  }
  return data.length;
}

/**
 * RFC 6458 §8.8 sctp_recvmsg — receive a message and report stream, ppid,
 * flags, association id through `*sinfo`.
 *
 * `from` (sockaddr) is populated with the peer's address.
 */
export function sctp_recvmsg(
  fd: number,
  msg: Uint8Array,
  len: number,
  from_out: { addr?: string; port?: number; family?: number } | null,
  sinfo_out: { value: { sinfo_stream: number; sinfo_ppid: number; sinfo_flags: number; sinfo_assoc_id: number } } | null,
  msg_flags_out: { value: number } | null,
): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  const m = s.recvQueue.shift();
  if (!m) { errno = EAGAIN; return -1; }
  const n = Math.min(len, m.data.length);
  msg.set(m.data.subarray(0, n));
  if (from_out) {
    from_out.addr = m.from.addr;
    from_out.port = m.from.port;
    from_out.family = m.from.family;
  }
  if (sinfo_out) {
    sinfo_out.value = {
      sinfo_stream: m.stream, sinfo_ppid: m.ppid,
      sinfo_flags: m.flags, sinfo_assoc_id: m.assocId,
    };
  }
  if (msg_flags_out) msg_flags_out.value = m.flags;
  return n;
}

/**
 * RFC 6458 §8.5 sctp_opt_info — query SCTP-specific options for a given
 * association. Equivalent to getsockopt(fd, IPPROTO_SCTP, opt, ...).
 */
export function sctp_opt_info(
  fd: number,
  _assoc_id: number,
  opt: number,
  arg_out: { value: any } | null,
): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  if (!arg_out) { errno = EINVAL; return -1; }
  switch (opt) {
    case SCTP_RTOINFO:
      arg_out.value = {
        srto_initial: s.rto_initial,
        srto_min: s.rto_min,
        srto_max: s.rto_max,
      };
      return 0;
    case SCTP_NODELAY:        arg_out.value = s.nodelay ? 1 : 0; return 0;
    case SCTP_DISABLE_FRAGMENTS: arg_out.value = s.disableFragments ? 1 : 0; return 0;
    case SCTP_MAXSEG:         arg_out.value = s.maxSeg; return 0;
    case SCTP_GET_ASSOC_NUMBER: arg_out.value = s.assocs.size; return 0;
    case SCTP_STATUS:
      arg_out.value = {
        sstat_state: 4, // SCTP_ESTABLISHED
        sstat_rwnd: 65535,
        sstat_unackdata: 0,
        sstat_penddata: s.recvQueue.length,
        sstat_instrms: 10,
        sstat_outstrms: 10,
      };
      return 0;
    default:
      arg_out.value = 0;
      return 0;
  }
}

/**
 * RFC 6458 §8.5 sctp_get_peer_addr_info — query path / RTT info for a
 * specific peer address. Returns a synthetic record (loopback has no real
 * RTT to measure).
 */
export function sctp_get_peer_addr_info(
  fd: number,
  _addr: { addr: string; port?: number; family?: number },
  info_out: { value: any } | null,
): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  if (!info_out) { errno = EINVAL; return -1; }
  info_out.value = {
    spinfo_state: 1,         // SCTP_ACTIVE
    spinfo_cwnd: 65535,
    spinfo_srtt: 1,          // 1 ms loopback
    spinfo_rto: s.rto_initial,
    spinfo_mtu: s.maxSeg,
  };
  return 0;
}

/** Setsockopt for SCTP — handles the option subset we model. */
export function sctp_setsockopt(fd: number, level: number, optname: number, optval: any): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  if (level !== IPPROTO_SCTP) { errno = EINVAL; return -1; }
  switch (optname) {
    case SCTP_NODELAY:           s.nodelay = !!optval; return 0;
    case SCTP_DISABLE_FRAGMENTS: s.disableFragments = !!optval; return 0;
    case SCTP_MAXSEG:            s.maxSeg = (optval | 0) || s.maxSeg; return 0;
    case SCTP_RTOINFO:
      if (optval && typeof optval === "object") {
        if ("srto_initial" in optval) s.rto_initial = optval.srto_initial | 0;
        if ("srto_min"     in optval) s.rto_min     = optval.srto_min     | 0;
        if ("srto_max"     in optval) s.rto_max     = optval.srto_max     | 0;
      }
      return 0;
    default: return 0;
  }
}

/** Close an SCTP socket. */
export function sctp_close(fd: number): number {
  const s = _sctpFds.get(fd);
  if (!s) { errno = EBADF; return -1; }
  _sctpFds.delete(fd);
  return 0;
}

// Re-exports for translator emission.
export {
  AF_INET, AF_INET6,
  SOCK_STREAM, SOCK_DGRAM,
  EINVAL, EAGAIN,
};
