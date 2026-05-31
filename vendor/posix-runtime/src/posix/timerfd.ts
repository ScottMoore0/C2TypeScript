// Mirage Linux <sys/timerfd.h> — POSIX-extension timer file descriptors.
//
// Spec sources
// ------------
//   * Linux man-page timerfd_create(2):
//       https://man7.org/linux/man-pages/man2/timerfd_create.2.html
//     (Linux extension; not POSIX.1-2017 but used by systemd, libuv,
//     scheduled job runners, Tokio etc.)
//       int timerfd_create (int clockid, int flags);
//       int timerfd_settime(int fd, int flags,
//                           const struct itimerspec *new_value,
//                           struct itimerspec *old_value);
//       int timerfd_gettime(int fd, struct itimerspec *curr_value);
//
// Semantics:
//   * timerfd_create returns an fd that produces events when its timer
//     expires.
//   * timerfd_settime arms the timer with `it_value` (initial expiration)
//     and `it_interval` (subsequent period; 0 = one-shot).
//   * read(fd, &buf, 8) returns the number of expirations as a uint64; in
//     blocking mode it blocks until the timer fires at least once.
//
// BRIDGE: posix-timerfd — Linux timerfd → SAB-backed expiration counter
// + Node.js setTimeout/setInterval-driven Atomics.notify, matching the
// eventfd pattern. read on the timerfd dequeues and returns the expiration
// count.

import { eventfd, eventfd_read, eventfd_write, EFD_NONBLOCK, isEventFd, _resetEventfd } from "./eventfd.js";
void _resetEventfd; void isEventFd; // referenced for symmetry; consumers use the timerfd table.

// ---------------------------------------------------------------------------
// errno values used here. POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EBADF  = 9;
const EINVAL = 22;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Linux clockid_t values used by timerfd_create. Numeric values match the
// Linux ABI for cross-platform translated C correctness.
// ---------------------------------------------------------------------------

export const CLOCK_REALTIME           = 0;
export const CLOCK_MONOTONIC          = 1;
export const CLOCK_BOOTTIME           = 7;
export const CLOCK_REALTIME_ALARM     = 8;
export const CLOCK_BOOTTIME_ALARM     = 9;

// timerfd_create flags
export const TFD_CLOEXEC   = 0o2000000;
export const TFD_NONBLOCK  = 0o0004000;

// timerfd_settime flags
export const TFD_TIMER_ABSTIME    = 1 << 0;
export const TFD_TIMER_CANCEL_ON_SET = 1 << 1;

/** struct timespec — POSIX §<time.h>. */
export interface timespec {
  tv_sec:  number;
  tv_nsec: number;
}

/** struct itimerspec — POSIX §<time.h>. */
export interface itimerspec {
  it_interval: timespec;
  it_value:    timespec;
}

// ---------------------------------------------------------------------------
// Per-timerfd state. We back the expiration counter with the eventfd module
// (it already has the SAB+Atomics.wait machinery + read-clears-counter
// behaviour timerfd needs). We keep timerfd-specific metadata (the active
// Node timer handle, current itimerspec) on the side.
// ---------------------------------------------------------------------------

interface TimerFdState {
  evfd: number;                       // backing eventfd
  clockid: number;
  // Active Node setTimeout / setInterval handle (or null when disarmed).
  initialHandle: any;
  intervalHandle: any;
  // Current itimerspec (so timerfd_gettime can return it).
  spec: itimerspec;
  // Wall-clock timestamp (ms) when the most-recent arming happened — used
  // by timerfd_gettime to compute remaining time.
  armedAt: number;
}

const _table: Map<number, TimerFdState> = new Map();
const TIMERFD_FD_BASE = 16384;
let _nextFd = TIMERFD_FD_BASE;

/** Test-only — clear table and disarm any active timers. */
export function _resetTimerfd(): void {
  for (const st of _table.values()) {
    if (st.initialHandle !== null) { try { clearTimeout(st.initialHandle); } catch { /* noop */ } }
    if (st.intervalHandle !== null) { try { clearInterval(st.intervalHandle); } catch { /* noop */ } }
  }
  _table.clear();
  _nextFd = TIMERFD_FD_BASE;
  errno = 0;
}

/** Test-only — inspect table size. */
export function _timerfdCount(): number {
  return _table.size;
}

/** Predicate the close shim uses to dispatch. */
export function isTimerFd(fd: number): boolean {
  return _table.has(fd);
}

/** Read backing eventfd of a timerfd — for tests / debug. */
export function _timerfdEventFd(fd: number): number | null {
  return _table.get(fd)?.evfd ?? null;
}

// ---------------------------------------------------------------------------
// timerfd_create — returns a fresh fd, the timer is initially disarmed.
// ---------------------------------------------------------------------------

/** Linux timerfd_create(clockid, flags). Returns a fresh fd. */
export function timerfd_create(clockid: number, flags: number = 0): number {
  // We don't actually distinguish between clock sources (Mirage Clock is one
  // monotonic+real source); we record clockid for round-trip. Flags map to
  // the eventfd flag bits.
  const evflags = (flags & TFD_NONBLOCK) ? EFD_NONBLOCK : 0;
  const evfd = eventfd(0, evflags);
  if (evfd < 0) { errno = EINVAL; return -1; }
  const fd = _nextFd++;
  _table.set(fd, {
    evfd,
    clockid,
    initialHandle: null,
    intervalHandle: null,
    spec: {
      it_interval: { tv_sec: 0, tv_nsec: 0 },
      it_value:    { tv_sec: 0, tv_nsec: 0 },
    },
    armedAt: 0,
  });
  return fd;
}

function _tsToMs(ts: timespec): number {
  return ts.tv_sec * 1000 + ts.tv_nsec / 1_000_000;
}

function _msToTs(ms: number): timespec {
  const sec = Math.floor(ms / 1000);
  const nsec = Math.floor((ms - sec * 1000) * 1_000_000);
  return { tv_sec: sec, tv_nsec: nsec };
}

function _disarm(st: TimerFdState): void {
  if (st.initialHandle !== null) {
    try { clearTimeout(st.initialHandle); } catch { /* noop */ }
    st.initialHandle = null;
  }
  if (st.intervalHandle !== null) {
    try { clearInterval(st.intervalHandle); } catch { /* noop */ }
    st.intervalHandle = null;
  }
}

/**
 * Linux timerfd_settime(fd, flags, new_value, old_value). Arms or disarms
 * the timer. If `new_value->it_value` is zero the timer is disarmed; else
 * the timer is armed with that initial duration and (if it_interval is
 * non-zero) re-arms with that period after each expiration.
 *
 * BRIDGE: posix-timerfd — uses Node's setTimeout/setInterval; each fire
 * does eventfd_write(1) on the backing counter.
 */
export function timerfd_settime(
  fd: number,
  flags: number,
  new_value: itimerspec | null,
  old_value: itimerspec | null = null,
): number {
  const st = _table.get(fd);
  if (!st) { errno = EBADF; return -1; }
  if (!new_value) { errno = EINVAL; return -1; }

  // Capture current spec into old_value if requested.
  if (old_value) {
    old_value.it_interval = { tv_sec: st.spec.it_interval.tv_sec, tv_nsec: st.spec.it_interval.tv_nsec };
    old_value.it_value    = { tv_sec: st.spec.it_value.tv_sec,    tv_nsec: st.spec.it_value.tv_nsec    };
  }

  _disarm(st);
  st.spec = {
    it_interval: { tv_sec: new_value.it_interval.tv_sec | 0, tv_nsec: new_value.it_interval.tv_nsec | 0 },
    it_value:    { tv_sec: new_value.it_value.tv_sec    | 0, tv_nsec: new_value.it_value.tv_nsec    | 0 },
  };

  // Disarm path: it_value == 0.
  if (st.spec.it_value.tv_sec === 0 && st.spec.it_value.tv_nsec === 0) {
    return 0;
  }

  let initialMs = _tsToMs(st.spec.it_value);
  if (flags & TFD_TIMER_ABSTIME) {
    // Absolute time — convert to relative against current time.
    initialMs = Math.max(0, initialMs - Date.now());
  }
  initialMs = Math.max(1, initialMs); // setTimeout floor

  st.armedAt = Date.now();

  // Arm initial fire.
  st.initialHandle = setTimeout(() => {
    eventfd_write(st.evfd, 1);
    st.initialHandle = null;
    // If interval > 0, arm periodic.
    const intervalMs = _tsToMs(st.spec.it_interval);
    if (intervalMs > 0) {
      st.intervalHandle = setInterval(() => {
        eventfd_write(st.evfd, 1);
      }, intervalMs);
      // Don't pin Node event loop alive when the only ref is a Mirage timer.
      try { (st.intervalHandle as any).unref?.(); } catch { /* noop */ }
    }
  }, initialMs);
  try { (st.initialHandle as any).unref?.(); } catch { /* noop */ }
  return 0;
}

/**
 * Linux timerfd_gettime(fd, curr_value). Writes the current arming state
 * into `curr_value`: it_interval is the period, it_value is the time
 * remaining until the next expiration (zero if disarmed).
 */
export function timerfd_gettime(fd: number, curr_value: itimerspec | null): number {
  const st = _table.get(fd);
  if (!st) { errno = EBADF; return -1; }
  if (!curr_value) { errno = EINVAL; return -1; }

  // Compute remaining for the initial fire (if armed via setTimeout).
  let remainingMs = 0;
  if (st.initialHandle !== null) {
    const elapsed = Date.now() - st.armedAt;
    const initialMs = _tsToMs(st.spec.it_value);
    remainingMs = Math.max(0, initialMs - elapsed);
  } else if (st.intervalHandle !== null) {
    // Periodic fire next — we don't track exact time-to-next; approximate
    // as the interval.
    remainingMs = _tsToMs(st.spec.it_interval);
  }

  curr_value.it_interval = { tv_sec: st.spec.it_interval.tv_sec, tv_nsec: st.spec.it_interval.tv_nsec };
  curr_value.it_value    = _msToTs(remainingMs);
  return 0;
}

/**
 * Read the expiration counter. Returns the number of expirations since the
 * last read (matches the Linux read() semantics on a timerfd: the counter
 * is reset to 0).
 */
export function timerfd_read(fd: number): bigint {
  const st = _table.get(fd);
  if (!st) { errno = EBADF; return -1n; }
  const out: { value?: bigint | number } = {};
  const r = eventfd_read(st.evfd, out);
  if (r < 0) return -1n;
  return typeof out.value === "bigint" ? out.value : BigInt(out.value ?? 0);
}

/** Close a timerfd. Returns 0 on success, -1 with errno=EBADF on bad fd. */
export function closeTimerfd(fd: number): number {
  const st = _table.get(fd);
  if (!st) { errno = EBADF; return -1; }
  _disarm(st);
  _table.delete(fd);
  return 0;
}
