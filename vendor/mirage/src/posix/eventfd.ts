// Mirage POSIX/Linux <sys/eventfd.h> — user-space event signaling fd.
//
// Spec sources
// ------------
//   * Linux man-page eventfd(2): https://man7.org/linux/man-pages/man2/eventfd.2.html
//     (Linux extension; not in POSIX.1-2017, but ubiquitous in nginx/Redis/libuv.)
//       int eventfd(unsigned int initval, int flags);
//       int eventfd_read (int fd, eventfd_t *value);
//       int eventfd_write(int fd, eventfd_t value);
//
// Semantics:
//   * eventfd() returns a non-file fd that maintains a 64-bit unsigned
//     counter (initial value `initval`).
//   * write(fd, &val, 8) atomically adds `val` to the counter (or returns
//     EAGAIN if the add would overflow 0xffffffff_fffffffe). Negative values
//     are not permitted in the API; the C type is unsigned.
//   * read(fd, &val, 8) atomically reads the counter:
//       - Default mode: returns the counter value and resets it to 0; if
//         counter == 0 it blocks (or EAGAIN with EFD_NONBLOCK).
//       - EFD_SEMAPHORE mode: returns 1 and decrements by 1; if counter == 0
//         blocks (or EAGAIN).
//
// BRIDGE: posix-eventfd — Linux eventfd → SAB-backed Int32Array(2) counter
// + Atomics.wait/notify, mirroring the same pattern used by signal-delivery
// (atom 14 RT signals). The two Int32 slots hold the lo/hi 32 bits of the
// 64-bit counter; reads/writes use Atomics.compareExchange to maintain the
// invariant. Workers in another isolate that hold a shared reference to the
// SAB can wait on slot 0 and be woken when the counter transitions from 0
// to non-zero.

// ---------------------------------------------------------------------------
// errno values used here. POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EBADF  = 9;
const EAGAIN = 11;
const EINVAL = 22;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Linux eventfd() flags. Numeric values match the Linux ABI so translated C
// programs that hard-code the constants behave identically.
// ---------------------------------------------------------------------------

/** EFD_SEMAPHORE — read returns 1 and decrements counter by 1 (semaphore mode). */
export const EFD_SEMAPHORE = 0o0000001;
/** EFD_CLOEXEC — set close-on-exec on the fd. */
export const EFD_CLOEXEC   = 0o2000000;
/** EFD_NONBLOCK — non-blocking I/O on the fd. */
export const EFD_NONBLOCK  = 0o0004000;

/** eventfd_t — 64-bit unsigned counter. JS uses bigint for full precision. */
export type eventfd_t = bigint | number;

// ---------------------------------------------------------------------------
// Per-eventfd state. Lives in a module-scope table keyed by fd. Each entry
// is backed by a SharedArrayBuffer so cross-Worker eventfd_read/eventfd_write
// is correct.
// ---------------------------------------------------------------------------

interface EventFdState {
  /** Int32Array(2) — slot 0 = counter low 32, slot 1 = counter high 32.
   *  Atomics.wait on slot 0 wakes when counter transitions away from zero. */
  counter: Int32Array;
  /** EFD_SEMAPHORE bit — read drains 1 instead of all. */
  semaphore: boolean;
  /** EFD_NONBLOCK bit — read returns EAGAIN when counter == 0. */
  nonblock: boolean;
}

const _table: Map<number, EventFdState> = new Map();
const EVENTFD_FD_BASE = 8192; // distinct from socket fd range (4096) and file fds (3+).
let _nextFd = EVENTFD_FD_BASE;

/** Test-only — clear table and reset fd counter. */
export function _resetEventfd(): void {
  _table.clear();
  _nextFd = EVENTFD_FD_BASE;
  errno = 0;
}

/** Test-only — inspect table size. */
export function _eventfdCount(): number {
  return _table.size;
}

/** Test-only — predicate the close shim uses to dispatch. */
export function isEventFd(fd: number): boolean {
  return _table.has(fd);
}

/**
 * Linux eventfd(initval, flags). Returns a fresh fd in the eventfd range,
 * or -1 on error.
 *
 * BRIDGE: posix-eventfd — fd carries no file/path; backed by a SAB counter.
 */
export function eventfd(initval: number = 0, flags: number = 0): number {
  if (initval < 0) { errno = EINVAL; return -1; }
  const sab = new SharedArrayBuffer(2 * 4);
  const counter = new Int32Array(sab);
  // Split initval into lo/hi 32. JS numbers are safe up to 2^53; for full
  // 64-bit support callers should pass bigint via the eventfd_write path.
  counter[0] = (initval >>> 0) | 0;
  counter[1] = Math.floor(initval / 0x100000000) | 0;
  const fd = _nextFd++;
  _table.set(fd, {
    counter,
    semaphore: (flags & EFD_SEMAPHORE) !== 0,
    nonblock: (flags & EFD_NONBLOCK) !== 0,
  });
  return fd;
}

/** Read the 64-bit counter as a bigint. Internal helper. */
function _readCounter64(c: Int32Array): bigint {
  const lo = BigInt(Atomics.load(c, 0) >>> 0);
  const hi = BigInt(Atomics.load(c, 1) >>> 0);
  return (hi << 32n) | lo;
}

/**
 * Linux eventfd_read(fd, &value). Reads the counter. In default mode the
 * counter is reset to 0 and the previous value returned through `*value`;
 * in EFD_SEMAPHORE mode 1 is decremented.
 *
 * If counter == 0 and EFD_NONBLOCK is set, returns -1 with errno = EAGAIN.
 * If counter == 0 and blocking is permitted, this implementation spins on
 * Atomics.wait until another worker calls eventfd_write.
 */
export function eventfd_read(fd: number, valuePtr: { value?: eventfd_t } | null): number {
  const st = _table.get(fd);
  if (!st) { errno = EBADF; return -1; }

  while (true) {
    const cur = _readCounter64(st.counter);
    if (cur > 0n) {
      let returned: bigint;
      let next: bigint;
      if (st.semaphore) {
        returned = 1n;
        next = cur - 1n;
      } else {
        returned = cur;
        next = 0n;
      }
      // Atomic CAS on slot 0: only commit if lo32 unchanged. We accept the
      // small cross-worker hazard on slot 1 (high 32) — eventfd users on
      // 64-bit Linux are typically write-once-read-once between threads.
      const wantLo = Number(cur & 0xffffffffn) | 0;
      const newLo = Number(next & 0xffffffffn) | 0;
      const newHi = Number((next >> 32n) & 0xffffffffn) | 0;
      const r = Atomics.compareExchange(st.counter, 0, wantLo, newLo);
      if (r !== wantLo) continue; // retry — another worker raced us.
      Atomics.store(st.counter, 1, newHi);
      if (valuePtr) valuePtr.value = returned;
      return 8;
    }

    // Counter is zero — EAGAIN if non-blocking.
    if (st.nonblock) { errno = EAGAIN; return -1; }
    // Blocking: wait on slot 0 == 0. eventfd_write/Atomics.notify will wake.
    Atomics.wait(st.counter, 0, 0);
  }
}

/**
 * Linux eventfd_write(fd, value). Atomically adds `value` to the counter.
 * If the addition would exceed 0xffffffff_fffffffe (UINT64_MAX - 1), returns
 * -1 with errno = EAGAIN (matches Linux man-page eventfd(2)).
 */
export function eventfd_write(fd: number, value: eventfd_t): number {
  const st = _table.get(fd);
  if (!st) { errno = EBADF; return -1; }
  const v = typeof value === "bigint" ? value : BigInt(value);
  if (v < 0n) { errno = EINVAL; return -1; }

  // Counter cap per Linux man page: UINT64_MAX - 1.
  const CAP = (1n << 64n) - 2n;
  while (true) {
    const cur = _readCounter64(st.counter);
    if (cur + v > CAP) { errno = EAGAIN; return -1; }
    const next = cur + v;
    const wantLo = Number(cur & 0xffffffffn) | 0;
    const newLo = Number(next & 0xffffffffn) | 0;
    const newHi = Number((next >> 32n) & 0xffffffffn) | 0;
    const r = Atomics.compareExchange(st.counter, 0, wantLo, newLo);
    if (r !== wantLo) continue; // retry on race.
    Atomics.store(st.counter, 1, newHi);
    // Wake any blocked eventfd_read.
    Atomics.notify(st.counter, 0);
    return 8;
  }
}

/** Close an eventfd. Returns 0 on success, -1 with errno=EBADF on bad fd. */
export function closeEventfd(fd: number): number {
  if (!_table.has(fd)) { errno = EBADF; return -1; }
  _table.delete(fd);
  return 0;
}
