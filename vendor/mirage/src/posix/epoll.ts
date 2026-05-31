// Mirage Linux <sys/epoll.h> — Linux event-loop multiplexer.
//
// Spec sources
// ------------
//   * Linux man-page epoll(7), epoll_create(2), epoll_create1(2),
//     epoll_ctl(2), epoll_wait(2), epoll_pwait(2):
//       https://man7.org/linux/man-pages/man7/epoll.7.html
//   * Linux ABI numeric constants from <sys/epoll.h>.
//
//   (epoll is Linux-specific; not in POSIX.1-2017. Critical for nginx,
//   Redis, libuv, libev, memcached, mosquitto — every high-performance
//   single-threaded event-driven server on Linux.)
//
// Surface
// -------
//   int epoll_create (int size);                       // size ignored since 2.6.8
//   int epoll_create1(int flags);                      // EPOLL_CLOEXEC
//   int epoll_ctl    (int epfd, int op, int fd,
//                     struct epoll_event *event);      // ADD / MOD / DEL
//   int epoll_wait   (int epfd, struct epoll_event *events,
//                     int maxevents, int timeout);
//   int epoll_pwait  (int epfd, struct epoll_event *events,
//                     int maxevents, int timeout,
//                     const sigset_t *sigmask);
//
// Semantics:
//   * epoll_create1(EPOLL_CLOEXEC) returns a non-file fd backing a kernel
//     "epoll instance". The instance owns:
//       (a) an interest list — fds the user has registered with EPOLL_CTL_ADD
//       (b) a ready list     — fds whose registered events are currently true
//   * epoll_ctl(EPOLL_CTL_ADD, fd, event) adds fd to the interest list with
//     the requested event mask (EPOLLIN/OUT/HUP/ERR/PRI/ET/ONESHOT/...).
//     EPOLL_CTL_MOD modifies the mask. EPOLL_CTL_DEL removes the fd.
//   * epoll_wait(epfd, &events, maxevents, timeout) drains up to `maxevents`
//     ready entries into the user's array and returns the count. timeout is
//     in milliseconds; -1 = block forever, 0 = poll, >0 = block up to that.
//   * epoll_pwait additionally atomically swaps in `sigmask` for the duration
//     of the wait (we accept the argument but the sig-mask integration is a
//     thin wrapper over the same wait — Mirage's signalfd / signal-delivery
//     module is what actually delivers signals).
//
// BRIDGE: posix-epoll — Linux epoll → JS Map<fd, EpollEvent> + ready-set +
// SAB-backed counter for blocking variants of epoll_wait. Readiness is fed
// from any registered fd source (sockets, eventfd, timerfd, signalfd) via
// the `notifyReady(fd, events)` helper or via an external probe registered
// through `setEpollReadinessProbe()`. Blocking epoll_wait uses an Int32Array
// + Atomics.wait so a worker spinning the SAB sees the wake.

// ---------------------------------------------------------------------------
// errno — POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EBADF   = 9;
const EINVAL  = 22;
const ENOENT  = 2;
const EEXIST  = 17;
const EPERM   = 1;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// epoll_create1 flags. Numeric values match the Linux ABI.
// ---------------------------------------------------------------------------

/** EPOLL_CLOEXEC — set close-on-exec on the new epoll fd. */
export const EPOLL_CLOEXEC = 0o2000000;

// ---------------------------------------------------------------------------
// epoll_ctl op codes. Linux ABI.
// ---------------------------------------------------------------------------

/** EPOLL_CTL_ADD — add fd to the interest list. */
export const EPOLL_CTL_ADD = 1;
/** EPOLL_CTL_DEL — remove fd from the interest list. */
export const EPOLL_CTL_DEL = 2;
/** EPOLL_CTL_MOD — change the event mask of an already-registered fd. */
export const EPOLL_CTL_MOD = 3;

// ---------------------------------------------------------------------------
// Event bits (struct epoll_event::events). Linux ABI numeric values.
// ---------------------------------------------------------------------------

export const EPOLLIN        = 0x00000001;
export const EPOLLPRI       = 0x00000002;
export const EPOLLOUT       = 0x00000004;
export const EPOLLERR       = 0x00000008;
export const EPOLLHUP       = 0x00000010;
export const EPOLLRDNORM    = 0x00000040;
export const EPOLLRDBAND    = 0x00000080;
export const EPOLLWRNORM    = 0x00000100;
export const EPOLLWRBAND    = 0x00000200;
export const EPOLLMSG       = 0x00000400;
export const EPOLLRDHUP     = 0x00002000;
/** EPOLLEXCLUSIVE — wake one waiter only (Linux 4.5+). */
export const EPOLLEXCLUSIVE = 1 << 28;
/** EPOLLWAKEUP — keep system awake (Linux 3.5+, Android suspend). */
export const EPOLLWAKEUP    = 1 << 29;
/** EPOLLONESHOT — disarm after one event. */
export const EPOLLONESHOT   = 1 << 30;
/** EPOLLET — edge-triggered. (We default to level-triggered.) */
export const EPOLLET        = 1 << 31;

// ---------------------------------------------------------------------------
// struct epoll_event — Linux <sys/epoll.h>.
// The Linux kernel ABI packs `events` (uint32) + `data` (union). We model
// `data` as a tagged record so both `data.fd` and `data.u64`/`data.ptr` work.
// ---------------------------------------------------------------------------

/** epoll_data_t — the union {void*; int fd; uint32_t u32; uint64_t u64}. */
export interface epoll_data_t {
  ptr?: bigint | number | null;
  fd?:  number;
  u32?: number;
  u64?: bigint | number;
}

/** struct epoll_event. */
export interface epoll_event {
  events: number;
  data:   epoll_data_t;
}

/** Convenience constructor. */
export function makeEpollEvent(events: number, data: epoll_data_t = {}): epoll_event {
  return { events, data: { ...data } };
}

// ---------------------------------------------------------------------------
// Interest entry — one per (epfd, fd) registration.
// ---------------------------------------------------------------------------

interface InterestEntry {
  /** Event mask the user registered. */
  events: number;
  /** Caller-supplied data echoed back through epoll_wait. */
  data: epoll_data_t;
  /** Currently-ready event mask (subset of events). Set by notifyReady(). */
  ready: number;
  /** Edge-triggered: fire once per readiness transition. */
  edge: boolean;
  /** EPOLLONESHOT — disarm after the first wait drains the entry. */
  oneshot: boolean;
}

interface EpollInstance {
  /** fd-of-interest -> entry. */
  interest: Map<number, InterestEntry>;
  /** SAB-backed counter slot 0 = number of ready entries. Atomics.notify on
   *  this slot wakes blocking waiters. */
  wakeup: Int32Array;
  closed: boolean;
}

const _table: Map<number, EpollInstance> = new Map();
const EPOLL_FD_BASE = 32768; // distinct from socket (4096), eventfd (8192),
                              // signalfd (24576), timerfd (16384).
let _nextFd = EPOLL_FD_BASE;

/** Test-only — clear the table and reset fd counter. */
export function _resetEpoll(): void {
  _table.clear();
  _nextFd = EPOLL_FD_BASE;
  errno = 0;
}

/** Test-only — number of live epoll instances. */
export function _epollCount(): number {
  return _table.size;
}

/** Test-only — number of fds in the interest list of `epfd`. */
export function _epollInterestSize(epfd: number): number {
  const inst = _table.get(epfd);
  return inst ? inst.interest.size : 0;
}

// ---------------------------------------------------------------------------
// Pluggable readiness probe — analogous to event-loop's FdReadinessProbe.
// Called once at the start of each epoll_wait to refresh ready masks for
// every fd in the interest list. Returns a Map<fd, currentEventsMask>.
// ---------------------------------------------------------------------------
export type EpollReadinessProbe = (
  watches: ReadonlyArray<{ fd: number; events: number }>,
) => ReadonlyMap<number, number> | null | undefined;

let _probe: EpollReadinessProbe | null = null;

/** Install a readiness probe shared across all epoll instances. */
export function setEpollReadinessProbe(probe: EpollReadinessProbe | null): void {
  _probe = probe;
}

// ---------------------------------------------------------------------------
// Identification predicate — matches the eventfd / timerfd / signalfd shape.
// ---------------------------------------------------------------------------

export function isEpollFd(fd: number): boolean {
  return _table.has(fd);
}

// ---------------------------------------------------------------------------
// epoll_create — IEEE-style "since 2.6.8 size is ignored, must be > 0".
// ---------------------------------------------------------------------------

/** Linux epoll_create — Linux 2.6, deprecated in favour of epoll_create1. */
export function epoll_create(size: number): number {
  if (size <= 0) { errno = EINVAL; return -1; }
  return _create(0);
}

/** Linux epoll_create1 — flags accepts EPOLL_CLOEXEC. */
export function epoll_create1(flags: number): number {
  if ((flags & ~EPOLL_CLOEXEC) !== 0) { errno = EINVAL; return -1; }
  return _create(flags);
}

function _create(_flags: number): number {
  const fd = ++_nextFd;
  // SharedArrayBuffer used so cross-Worker code can wait on the same epfd.
  const sab = new SharedArrayBuffer(4);
  const wakeup = new Int32Array(sab);
  const inst: EpollInstance = {
    interest: new Map(),
    wakeup,
    closed: false,
  };
  _table.set(fd, inst);
  return fd;
}

/** Close an epfd. Releases the interest list and wakes any blocked waiter. */
export function closeEpoll(fd: number): number {
  const inst = _table.get(fd);
  if (!inst) { errno = EBADF; return -1; }
  inst.closed = true;
  inst.interest.clear();
  // Wake every blocked waiter so epoll_wait can return EBADF.
  Atomics.store(inst.wakeup, 0, -1);
  Atomics.notify(inst.wakeup, 0);
  _table.delete(fd);
  return 0;
}

// ---------------------------------------------------------------------------
// epoll_ctl — register / modify / remove fds.
// ---------------------------------------------------------------------------

/** Linux epoll_ctl. */
export function epoll_ctl(
  epfd: number,
  op: number,
  fd: number,
  event: epoll_event | null,
): number {
  const inst = _table.get(epfd);
  if (!inst || inst.closed) { errno = EBADF; return -1; }
  if (epfd === fd) { errno = EINVAL; return -1; }

  switch (op) {
    case EPOLL_CTL_ADD: {
      if (!event) { errno = EINVAL; return -1; }
      if (inst.interest.has(fd)) { errno = EEXIST; return -1; }
      inst.interest.set(fd, {
        events: event.events,
        data: { ...event.data },
        ready: 0,
        edge: (event.events & EPOLLET) !== 0,
        oneshot: (event.events & EPOLLONESHOT) !== 0,
      });
      return 0;
    }
    case EPOLL_CTL_MOD: {
      if (!event) { errno = EINVAL; return -1; }
      const entry = inst.interest.get(fd);
      if (!entry) { errno = ENOENT; return -1; }
      entry.events = event.events;
      entry.data = { ...event.data };
      entry.edge = (event.events & EPOLLET) !== 0;
      entry.oneshot = (event.events & EPOLLONESHOT) !== 0;
      // Mask any retained `ready` bits down to the new mask.
      entry.ready = entry.ready & (entry.events | EPOLLERR | EPOLLHUP);
      return 0;
    }
    case EPOLL_CTL_DEL: {
      if (!inst.interest.has(fd)) { errno = ENOENT; return -1; }
      inst.interest.delete(fd);
      return 0;
    }
    default:
      errno = EINVAL;
      return -1;
  }
}

// ---------------------------------------------------------------------------
// notifyReady — internal hook for fd sources (sockets, eventfd, timerfd, ...)
// to push a readiness transition into every epoll instance watching the fd.
// ---------------------------------------------------------------------------

/** Push a readiness mask for `fd` into every epoll instance watching it. */
export function notifyReady(fd: number, mask: number): void {
  if (mask === 0) return;
  for (const inst of _table.values()) {
    if (inst.closed) continue;
    const entry = inst.interest.get(fd);
    if (!entry) continue;
    // Always-on bits (EPOLLERR/EPOLLHUP) propagate even if not in mask.
    const want = entry.events | EPOLLERR | EPOLLHUP;
    const masked = mask & want;
    if (masked === 0) continue;
    entry.ready |= masked;
    // Wake one blocked waiter (epoll_wait uses Atomics.wait on slot 0).
    Atomics.add(inst.wakeup, 0, 1);
    Atomics.notify(inst.wakeup, 0, 1);
  }
}

/** Clear all readiness for `fd` across every instance — used when the fd
 *  becomes un-ready (e.g. the socket buffer drains below the watermark). */
export function clearReady(fd: number, mask: number = 0xffffffff): void {
  for (const inst of _table.values()) {
    const entry = inst.interest.get(fd);
    if (!entry) continue;
    entry.ready &= ~mask;
  }
}

// ---------------------------------------------------------------------------
// epoll_wait — drain ready entries.
// ---------------------------------------------------------------------------

/** Linux epoll_wait. `timeout` in ms: -1 = block forever, 0 = poll, >0 = up to. */
export function epoll_wait(
  epfd: number,
  events: epoll_event[],
  maxevents: number,
  timeout: number,
): number {
  const inst = _table.get(epfd);
  if (!inst || inst.closed) { errno = EBADF; return -1; }
  if (maxevents <= 0) { errno = EINVAL; return -1; }

  const deadline = timeout < 0 ? Infinity : Date.now() + timeout;

  // Always probe once at entry so freshly-pushed Node readiness is visible.
  _refreshReady(inst);

  // Fast path — any ready entries already?
  let n = _drain(inst, events, maxevents);
  if (n > 0) return n;
  if (timeout === 0) return 0;

  // Slow path — Atomics.wait until either (a) somebody calls notifyReady,
  // (b) close fires, or (c) timeout elapses. Each notifyReady increments
  // wakeup; we sample, then re-drain.
  while (n === 0 && Date.now() < deadline && !inst.closed) {
    const remaining = deadline === Infinity ? Infinity : Math.max(0, deadline - Date.now());
    const expected = Atomics.load(inst.wakeup, 0);
    // Atomics.wait requires a non-negative timeout (Infinity is allowed).
    Atomics.wait(inst.wakeup, 0, expected, remaining);
    _refreshReady(inst);
    n = _drain(inst, events, maxevents);
  }
  return n;
}

/** Linux epoll_pwait — sigmask param accepted but signal masking is delegated
 *  to the host's signal-delivery module (Mirage's signalfd/concurrency). */
export function epoll_pwait(
  epfd: number,
  events: epoll_event[],
  maxevents: number,
  timeout: number,
  _sigmask: Uint32Array | null,
): number {
  return epoll_wait(epfd, events, maxevents, timeout);
}

// ---------------------------------------------------------------------------
// Internal helpers.
// ---------------------------------------------------------------------------

function _refreshReady(inst: EpollInstance): void {
  if (!_probe || inst.interest.size === 0) return;
  const snapshot: { fd: number; events: number }[] = [];
  for (const [fd, entry] of inst.interest) {
    snapshot.push({ fd, events: entry.events });
  }
  let probed: ReadonlyMap<number, number> | null | undefined;
  try { probed = _probe(snapshot); } catch { probed = null; }
  if (!probed) return;
  for (const [fd, mask] of probed) {
    const entry = inst.interest.get(fd);
    if (!entry) continue;
    const want = entry.events | EPOLLERR | EPOLLHUP;
    entry.ready |= (mask & want);
  }
}

function _drain(inst: EpollInstance, out: epoll_event[], maxevents: number): number {
  let n = 0;
  // Reset the wakeup counter so subsequent waits sample a fresh value.
  Atomics.store(inst.wakeup, 0, 0);
  // Iterate in registration order. Linux gives no specific ordering guarantee
  // but tests expect deterministic order, so insertion order is safe.
  for (const [fd, entry] of inst.interest) {
    if (n >= maxevents) break;
    if (entry.ready === 0) continue;
    out[n] = {
      events: entry.ready,
      data: { ...entry.data, fd: entry.data.fd ?? fd },
    };
    n++;
    if (entry.oneshot) {
      // EPOLLONESHOT: the entry stays in the interest list but is disarmed
      // until epoll_ctl(EPOLL_CTL_MOD) re-arms it.
      entry.events = 0;
      entry.ready  = 0;
    } else if (entry.edge) {
      // Edge-triggered: only fire once per transition. Caller must consume.
      entry.ready = 0;
    } else {
      // Level-triggered: keep `ready` so re-poll without consumption refires.
      // Caller is expected to drain the underlying fd; if the probe says it's
      // still ready next iteration, ready will be re-set.
      // For tests that don't run a probe, we clear so the same readiness
      // doesn't get redelivered indefinitely.
      if (!_probe) entry.ready = 0;
    }
  }
  return n;
}
