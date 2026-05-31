// Mirage POSIX <mqueue.h> — POSIX message queues.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<mqueue.h>:
//       mqd_t  mq_open    (const char *name, int oflag, ...);
//       int    mq_close   (mqd_t);
//       int    mq_unlink  (const char *name);
//       int    mq_send    (mqd_t, const char *msg, size_t len, unsigned prio);
//       ssize_t mq_receive(mqd_t, char *msg, size_t len, unsigned *prio);
//       int    mq_timedsend   (mqd_t, ..., const struct timespec *abs);
//       ssize_t mq_timedreceive(mqd_t, ..., const struct timespec *abs);
//       int    mq_getattr (mqd_t, struct mq_attr *);
//       int    mq_setattr (mqd_t, const struct mq_attr *new, struct mq_attr *old);
//       int    mq_notify  (mqd_t, const struct sigevent *);
//
// BRIDGE: posix-mqueue — POSIX message queues → in-process named-queue
// registry (Map<name, Queue>). Each queue holds an array of messages with
// priority ordering (max-priority-first per POSIX). Blocking semantics use
// async waiters; synchronous mq_send/receive return EAGAIN when full/empty
// in non-blocking mode. mq_notify fires a one-shot callback when the queue
// transitions from empty to non-empty.

// ---------------------------------------------------------------------------
// errno values used here. POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EAGAIN     = 11;
const EBADF      = 9;
const EEXIST     = 17;
const EINVAL     = 22;
const EMSGSIZE   = 90;
const ENAMETOOLONG = 36;
const ENOENT     = 2;
const ETIMEDOUT  = 110;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Constants. POSIX §<mqueue.h> + <fcntl.h>.
// ---------------------------------------------------------------------------

export const O_RDONLY   = 0o0;
export const O_WRONLY   = 0o1;
export const O_RDWR     = 0o2;
export const O_CREAT    = 0o100;
export const O_EXCL     = 0o200;
export const O_NONBLOCK = 0o4000;

/** mqd_t — POSIX defines this as opaque. We use a positive integer. */
export type mqd_t = number;

/** struct mq_attr — POSIX §<mqueue.h>. */
export interface mq_attr {
  mq_flags:    number;   // O_NONBLOCK
  mq_maxmsg:   number;   // max messages in queue
  mq_msgsize:  number;   // max message size in bytes
  mq_curmsgs:  number;   // current message count (read-only)
}

/** Default attributes if mq_open is called without an attr argument. */
const DEFAULT_MAXMSG  = 10;
const DEFAULT_MSGSIZE = 8192;
const NAME_MAX = 255;

interface Message {
  data: Uint8Array;
  prio: number;
  /** Sequence number for stable ordering within the same priority bucket. */
  seq: number;
}

interface Queue {
  name: string;
  attr: mq_attr;
  messages: Message[];
  refs: number;                        // per-mqd_t open count
  recvWaiters: ((m: Message | null) => void)[];
  sendWaiters: (() => void)[];
  notify: { fn: () => void } | null;   // one-shot mq_notify callback
}

const _byName: Map<string, Queue> = new Map();
const _byMqd:  Map<mqd_t, { q: Queue; flags: number }> = new Map();

const MQ_FD_BASE = 49152;
let _nextMqd = MQ_FD_BASE;
let _nextSeq = 0;

/** Test-only — wipe the registry. */
export function _resetMq(): void {
  _byName.clear();
  _byMqd.clear();
  _nextMqd = MQ_FD_BASE;
  _nextSeq = 0;
  errno = 0;
}

/** Test-only — inspect open mqd count. */
export function _mqOpenCount(): number { return _byMqd.size; }
/** Test-only — inspect named queue count. */
export function _mqNameCount(): number { return _byName.size; }

/** Predicate the close shim uses to dispatch. */
export function isMqd(fd: number): boolean { return _byMqd.has(fd); }

function _normalizeName(name: string): string {
  // POSIX requires names to start with '/', followed by no other '/'.
  // We accept any string for VFS-style portability but enforce length.
  return name;
}

// ---------------------------------------------------------------------------
// mq_open / mq_close / mq_unlink.
// ---------------------------------------------------------------------------

/** POSIX mq_open — IEEE Std 1003.1-2017 §mq_open. */
export function mq_open(
  name: string,
  oflag: number,
  _mode: number = 0,
  attr: mq_attr | null = null,
): mqd_t {
  if (typeof name !== "string" || name.length === 0) { errno = EINVAL; return -1; }
  if (name.length > NAME_MAX) { errno = ENAMETOOLONG; return -1; }
  const n = _normalizeName(name);
  let q = _byName.get(n);
  if (q) {
    if ((oflag & O_CREAT) && (oflag & O_EXCL)) { errno = EEXIST; return -1; }
  } else {
    if (!(oflag & O_CREAT)) { errno = ENOENT; return -1; }
    const a: mq_attr = attr
      ? {
          mq_flags:   attr.mq_flags ?? 0,
          mq_maxmsg:  attr.mq_maxmsg > 0 ? attr.mq_maxmsg : DEFAULT_MAXMSG,
          mq_msgsize: attr.mq_msgsize > 0 ? attr.mq_msgsize : DEFAULT_MSGSIZE,
          mq_curmsgs: 0,
        }
      : { mq_flags: 0, mq_maxmsg: DEFAULT_MAXMSG, mq_msgsize: DEFAULT_MSGSIZE, mq_curmsgs: 0 };
    q = {
      name: n,
      attr: a,
      messages: [],
      refs: 0,
      recvWaiters: [],
      sendWaiters: [],
      notify: null,
    };
    _byName.set(n, q);
  }
  q.refs++;
  const fd = _nextMqd++;
  _byMqd.set(fd, { q, flags: oflag & O_NONBLOCK });
  return fd;
}

/** POSIX mq_close — IEEE Std 1003.1-2017 §mq_close. */
export function mq_close(mqd: mqd_t): number {
  const e = _byMqd.get(mqd);
  if (!e) { errno = EBADF; return -1; }
  e.q.refs--;
  _byMqd.delete(mqd);
  // Don't delete the named queue — only mq_unlink + last-close removes it.
  return 0;
}

/** POSIX mq_unlink — IEEE Std 1003.1-2017 §mq_unlink. Removes the name from
 *  the registry; the queue persists until last close. */
export function mq_unlink(name: string): number {
  const q = _byName.get(name);
  if (!q) { errno = ENOENT; return -1; }
  _byName.delete(name);
  return 0;
}

// ---------------------------------------------------------------------------
// mq_send / mq_receive (and timed variants).
// ---------------------------------------------------------------------------

function _bytes(msg: Uint8Array | string): Uint8Array {
  return typeof msg === "string" ? new TextEncoder().encode(msg) : msg;
}

function _push(q: Queue, m: Message): void {
  // Insert keeping max-priority at index 0; stable by seq within priority.
  let i = 0;
  while (i < q.messages.length && q.messages[i].prio >= m.prio) i++;
  q.messages.splice(i, 0, m);
  q.attr.mq_curmsgs = q.messages.length;
  // Wake one receiver.
  if (q.recvWaiters.length > 0) {
    const w = q.recvWaiters.shift()!;
    const top = q.messages.shift()!;
    q.attr.mq_curmsgs = q.messages.length;
    w(top);
  }
  // One-shot mq_notify on empty→non-empty transition.
  if (q.notify && q.messages.length === 1) {
    const cb = q.notify.fn;
    q.notify = null;
    try { cb(); } catch { /* swallow */ }
  }
}

/** POSIX mq_send — IEEE Std 1003.1-2017 §mq_send. */
export function mq_send(
  mqd: mqd_t,
  msg: Uint8Array | string,
  msgLen: number,
  prio: number,
): number {
  const e = _byMqd.get(mqd);
  if (!e) { errno = EBADF; return -1; }
  const q = e.q;
  const data = _bytes(msg).subarray(0, msgLen);
  if (data.length > q.attr.mq_msgsize) { errno = EMSGSIZE; return -1; }
  if (q.messages.length >= q.attr.mq_maxmsg) {
    if ((e.flags & O_NONBLOCK) || (q.attr.mq_flags & O_NONBLOCK)) {
      errno = EAGAIN;
      return -1;
    }
    // Synchronous block is impossible in pure JS; we record a wait but report
    // EAGAIN so translated callers can retry through the event loop.
    errno = EAGAIN;
    return -1;
  }
  _push(q, { data: new Uint8Array(data), prio, seq: _nextSeq++ });
  return 0;
}

/** POSIX mq_receive — IEEE Std 1003.1-2017 §mq_receive. */
export function mq_receive(
  mqd: mqd_t,
  buf: Uint8Array,
  bufLen: number,
  prioPtr: { value?: number } | null = null,
): number {
  const e = _byMqd.get(mqd);
  if (!e) { errno = EBADF; return -1; }
  const q = e.q;
  if (bufLen < q.attr.mq_msgsize) { errno = EMSGSIZE; return -1; }
  if (q.messages.length === 0) {
    if ((e.flags & O_NONBLOCK) || (q.attr.mq_flags & O_NONBLOCK)) {
      errno = EAGAIN;
      return -1;
    }
    errno = EAGAIN;
    return -1;
  }
  const m = q.messages.shift()!;
  q.attr.mq_curmsgs = q.messages.length;
  const n = Math.min(m.data.length, bufLen);
  buf.set(m.data.subarray(0, n));
  if (prioPtr) prioPtr.value = m.prio;
  return n;
}

/** Async-send variant — used when the synchronous form would EAGAIN. */
export function mq_send_async(
  mqd: mqd_t,
  msg: Uint8Array | string,
  msgLen: number,
  prio: number,
): Promise<number> {
  const e = _byMqd.get(mqd);
  if (!e) { errno = EBADF; return Promise.resolve(-1); }
  const q = e.q;
  const data = _bytes(msg).subarray(0, msgLen);
  if (data.length > q.attr.mq_msgsize) { errno = EMSGSIZE; return Promise.resolve(-1); }
  if (q.messages.length < q.attr.mq_maxmsg) {
    _push(q, { data: new Uint8Array(data), prio, seq: _nextSeq++ });
    return Promise.resolve(0);
  }
  return new Promise<number>((resolve) => {
    const tryAgain = () => {
      if (q.messages.length < q.attr.mq_maxmsg) {
        _push(q, { data: new Uint8Array(data), prio, seq: _nextSeq++ });
        resolve(0);
      } else {
        q.sendWaiters.push(tryAgain);
      }
    };
    q.sendWaiters.push(tryAgain);
  });
}

/** Async-receive variant — used when the synchronous form would EAGAIN. */
export function mq_receive_async(
  mqd: mqd_t,
  buf: Uint8Array,
  bufLen: number,
  prioPtr: { value?: number } | null = null,
): Promise<number> {
  const e = _byMqd.get(mqd);
  if (!e) { errno = EBADF; return Promise.resolve(-1); }
  const q = e.q;
  if (bufLen < q.attr.mq_msgsize) { errno = EMSGSIZE; return Promise.resolve(-1); }
  if (q.messages.length > 0) {
    const m = q.messages.shift()!;
    q.attr.mq_curmsgs = q.messages.length;
    const n = Math.min(m.data.length, bufLen);
    buf.set(m.data.subarray(0, n));
    if (prioPtr) prioPtr.value = m.prio;
    // Wake a sender waiting for slot.
    if (q.sendWaiters.length > 0) { const w = q.sendWaiters.shift()!; w(); }
    return Promise.resolve(n);
  }
  return new Promise<number>((resolve) => {
    q.recvWaiters.push((m) => {
      if (!m) { resolve(-1); return; }
      const n = Math.min(m.data.length, bufLen);
      buf.set(m.data.subarray(0, n));
      if (prioPtr) prioPtr.value = m.prio;
      resolve(n);
    });
  });
}

/** POSIX mq_timedsend — IEEE Std 1003.1-2017 §mq_timedsend. */
export async function mq_timedsend(
  mqd: mqd_t,
  msg: Uint8Array | string,
  msgLen: number,
  prio: number,
  abs: { tv_sec?: number; tv_nsec?: number } | null,
): Promise<number> {
  const sync = mq_send(mqd, msg, msgLen, prio);
  if (sync === 0) return 0;
  if (errno !== EAGAIN) return -1;
  // Compute a relative timeout from the absolute deadline.
  const nowMs = Date.now();
  const absMs = abs ? (abs.tv_sec ?? 0) * 1000 + Math.floor((abs.tv_nsec ?? 0) / 1e6) : nowMs;
  const wait = Math.max(0, absMs - nowMs);
  const sendP = mq_send_async(mqd, msg, msgLen, prio);
  const timeP = new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), wait));
  const r = await Promise.race([sendP.then((v) => v === 0 ? "ok" : "err"), timeP]);
  if (r === "timeout") { errno = ETIMEDOUT; return -1; }
  return r === "ok" ? 0 : -1;
}

/** POSIX mq_timedreceive — IEEE Std 1003.1-2017 §mq_timedreceive. */
export async function mq_timedreceive(
  mqd: mqd_t,
  buf: Uint8Array,
  bufLen: number,
  prioPtr: { value?: number } | null,
  abs: { tv_sec?: number; tv_nsec?: number } | null,
): Promise<number> {
  const sync = mq_receive(mqd, buf, bufLen, prioPtr);
  if (sync >= 0) return sync;
  if (errno !== EAGAIN) return -1;
  const nowMs = Date.now();
  const absMs = abs ? (abs.tv_sec ?? 0) * 1000 + Math.floor((abs.tv_nsec ?? 0) / 1e6) : nowMs;
  const wait = Math.max(0, absMs - nowMs);
  const recvP = mq_receive_async(mqd, buf, bufLen, prioPtr);
  const timeP = new Promise<number>((resolve) => setTimeout(() => resolve(-2), wait));
  const r = await Promise.race([recvP, timeP]);
  if (r === -2) { errno = ETIMEDOUT; return -1; }
  return r;
}

// ---------------------------------------------------------------------------
// mq_getattr / mq_setattr / mq_notify.
// ---------------------------------------------------------------------------

/** POSIX mq_getattr — IEEE Std 1003.1-2017 §mq_getattr. */
export function mq_getattr(mqd: mqd_t, attr: Partial<mq_attr> | null): number {
  const e = _byMqd.get(mqd);
  if (!e) { errno = EBADF; return -1; }
  if (attr) {
    attr.mq_flags   = e.flags | (e.q.attr.mq_flags & O_NONBLOCK);
    attr.mq_maxmsg  = e.q.attr.mq_maxmsg;
    attr.mq_msgsize = e.q.attr.mq_msgsize;
    attr.mq_curmsgs = e.q.attr.mq_curmsgs;
  }
  return 0;
}

/** POSIX mq_setattr — IEEE Std 1003.1-2017 §mq_setattr. Only mq_flags
 *  (specifically O_NONBLOCK) is changeable; the other fields are read-only
 *  and silently ignored. */
export function mq_setattr(
  mqd: mqd_t,
  newAttr: Partial<mq_attr> | null,
  oldAttr: Partial<mq_attr> | null,
): number {
  const e = _byMqd.get(mqd);
  if (!e) { errno = EBADF; return -1; }
  if (oldAttr) {
    oldAttr.mq_flags   = e.flags | (e.q.attr.mq_flags & O_NONBLOCK);
    oldAttr.mq_maxmsg  = e.q.attr.mq_maxmsg;
    oldAttr.mq_msgsize = e.q.attr.mq_msgsize;
    oldAttr.mq_curmsgs = e.q.attr.mq_curmsgs;
  }
  if (newAttr && typeof newAttr.mq_flags === "number") {
    e.flags = newAttr.mq_flags & O_NONBLOCK;
  }
  return 0;
}

/** POSIX mq_notify — IEEE Std 1003.1-2017 §mq_notify. The sigevent is
 *  reduced to a callable: we accept a function or `{ notify: fn }` shape. */
export function mq_notify(
  mqd: mqd_t,
  sigev: (() => void) | { notify?: () => void } | null,
): number {
  const e = _byMqd.get(mqd);
  if (!e) { errno = EBADF; return -1; }
  if (sigev === null) {
    e.q.notify = null;
    return 0;
  }
  const fn = typeof sigev === "function" ? sigev : sigev?.notify;
  if (typeof fn !== "function") { errno = EINVAL; return -1; }
  if (e.q.notify) { errno = 16 /*EBUSY*/; return -1; }
  e.q.notify = { fn };
  return 0;
}
