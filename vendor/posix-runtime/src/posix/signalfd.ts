// Mirage Linux <sys/signalfd.h> — read signals via a file descriptor.
//
// Spec sources
// ------------
//   * Linux man-page signalfd(2):
//       https://man7.org/linux/man-pages/man2/signalfd.2.html
//     (Linux extension; not POSIX.1-2017 but used by systemd and many
//     custom signal handlers.)
//       int signalfd(int fd, const sigset_t *mask, int flags);
//       read(fd, &si, sizeof(struct signalfd_siginfo)) — drain a queued
//         signal into a signalfd_siginfo struct.
//
// BRIDGE: posix-signalfd — Linux signalfd → consumes the same per-thread
// SAB pending-mask + RT FIFO published by the concurrency subproject's
// signal-delivery module (atom 14 / RT signals). This module DOES NOT
// duplicate the signal-delivery primitives; it polls them through the
// existing public API (signal_slot_get, sigwaitinfo_real-style scan).
//
// Architectural note
// ------------------
// The signal-delivery module lives in the c2typescript/concurrency/ subproject
// (its package name is "concurrency"). Mirage doesn't take a hard
// dependency on it because in many translated programs the concurrency
// runtime is wired only when threads are actually used. So we resolve the
// API at first call, falling back to a tiny in-process queue if the
// concurrency module isn't loadable.

// ---------------------------------------------------------------------------
// errno values used here. POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EBADF  = 9;
const EAGAIN = 11;
const EINVAL = 22;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

/** Linux signalfd flags. */
export const SFD_CLOEXEC  = 0o2000000;
export const SFD_NONBLOCK = 0o0004000;

/** struct signalfd_siginfo subset — Linux <sys/signalfd.h>. */
export interface signalfd_siginfo {
  ssi_signo: number;
  ssi_errno: number;
  ssi_code: number;
  ssi_pid: number;
  ssi_uid: number;
  ssi_fd: number;
  ssi_tid: number;
  ssi_band: number;
  ssi_overrun: number;
  ssi_trapno: number;
  ssi_status: number;
  ssi_int: number;
  ssi_ptr: bigint;
  ssi_utime: bigint;
  ssi_stime: bigint;
  ssi_addr: bigint;
}

// ---------------------------------------------------------------------------
// Per-signalfd state.
// ---------------------------------------------------------------------------

interface SignalFdState {
  /** Mask of signals this fd accepts (bit (sig-1) of word (sig-1)>>5). */
  mask: Uint32Array;
  /** Queue of pending siginfos (delivered into reads). */
  queue: signalfd_siginfo[];
  nonblock: boolean;
}

const _table: Map<number, SignalFdState> = new Map();
const SIGNALFD_FD_BASE = 24576;
let _nextFd = SIGNALFD_FD_BASE;

/** Test-only — clear table. */
export function _resetSignalfd(): void {
  _table.clear();
  _nextFd = SIGNALFD_FD_BASE;
  errno = 0;
}

/** Test-only — inspect table size. */
export function _signalfdCount(): number {
  return _table.size;
}

/** Predicate the close shim uses to dispatch. */
export function isSignalFd(fd: number): boolean {
  return _table.has(fd);
}

// ---------------------------------------------------------------------------
// Lazy resolution of the concurrency signal-delivery API.
// ---------------------------------------------------------------------------

interface SignalDeliveryAPI {
  signal_slot_get: (tid: number) => any;
  signal_current_tid: () => number;
  sigwaitinfo_real: (
    setBits: Uint32Array,
    info_out: { value: any },
  ) => number;
}

let _api: SignalDeliveryAPI | null | undefined; // undefined = not yet resolved.

async function _resolveAPI(): Promise<SignalDeliveryAPI | null> {
  if (_api !== undefined) return _api;
  try {
    // Dynamic import via runtime-resolved string so TypeScript doesn't try
    // to type-check the (optional) cross-subproject dependency at build
    // time. Translated programs that wire concurrency in will hit this
    // path; pure-Mirage tests bypass it via _setSignalDeliveryAPI.
    const modName = "concurrency/dist/signal-delivery.js";
    const mod: any = await (Function("m", "return import(m)") as any)(modName);
    _api = {
      signal_slot_get: mod.signal_slot_get,
      signal_current_tid: mod.signal_current_tid,
      sigwaitinfo_real: mod.sigwaitinfo_real,
    };
  } catch { _api = null; }
  return _api;
}

/** Test-only — install a custom signal-delivery API (for tests that want
 *  to drive signalfd without spinning up the full concurrency subproject). */
export function _setSignalDeliveryAPI(api: SignalDeliveryAPI | null): void {
  _api = api;
}

// ---------------------------------------------------------------------------
// signalfd(fd, mask, flags) — POSIX-shape signal delivery via fd.
// ---------------------------------------------------------------------------

/**
 * Linux signalfd(fd, mask, flags). If `fd == -1`, a new fd is created.
 * Otherwise the existing signalfd's mask is replaced.
 *
 * `mask` is a Uint32Array (sigset_t) — bit (sig-1) of word (sig-1)>>5
 * is set if the signal should be delivered to this fd.
 */
export function signalfd(fd: number, mask: Uint32Array | null, flags: number = 0): number {
  if (!mask || mask.length < 2) { errno = EINVAL; return -1; }
  if (fd < 0) {
    const newFd = _nextFd++;
    _table.set(newFd, {
      mask: new Uint32Array(mask),
      queue: [],
      nonblock: (flags & SFD_NONBLOCK) !== 0,
    });
    return newFd;
  }
  const st = _table.get(fd);
  if (!st) { errno = EBADF; return -1; }
  st.mask = new Uint32Array(mask);
  st.nonblock = (flags & SFD_NONBLOCK) !== 0;
  return fd;
}

/**
 * Read a single signalfd_siginfo from the fd. In blocking mode polls the
 * underlying signal-delivery API until a matching signal arrives; in
 * non-blocking mode returns -1 with errno = EAGAIN.
 *
 * Returns the number of bytes consumed (sizeof(signalfd_siginfo) on
 * success) or -1 on error.
 */
export function signalfd_read(fd: number, infoPtr: { value?: signalfd_siginfo } | null): number {
  const st = _table.get(fd);
  if (!st) { errno = EBADF; return -1; }

  // Drain from the local queue first.
  if (st.queue.length > 0) {
    const info = st.queue.shift()!;
    if (infoPtr) infoPtr.value = info;
    return 128; // sizeof(signalfd_siginfo) on Linux is 128.
  }

  // Try the concurrency API synchronously — sigwaitinfo_real on a worker
  // would block, which we want only when the fd is blocking. For non-
  // blocking, we just probe and return EAGAIN.
  if (_api && _api.sigwaitinfo_real) {
    const out: { value: any } = { value: null };
    if (st.nonblock) {
      // Non-blocking: scan only — in absence of a non-blocking sigwait we
      // return EAGAIN if the local queue is empty.
      errno = EAGAIN;
      return -1;
    }
    const r = _api.sigwaitinfo_real(st.mask, out);
    if (r < 0) { errno = EAGAIN; return -1; }
    const sigInfo = out.value;
    const sfdInfo: signalfd_siginfo = {
      ssi_signo: sigInfo?.si_signo ?? r,
      ssi_errno: 0,
      ssi_code:  sigInfo?.si_code ?? 0,
      ssi_pid:   0,
      ssi_uid:   0,
      ssi_fd:    0,
      ssi_tid:   0,
      ssi_band:  0,
      ssi_overrun: 0,
      ssi_trapno:  0,
      ssi_status:  0,
      ssi_int:   sigInfo?.si_value?.sival_int ?? 0,
      ssi_ptr:   0n,
      ssi_utime: 0n,
      ssi_stime: 0n,
      ssi_addr:  0n,
    };
    if (infoPtr) infoPtr.value = sfdInfo;
    return 128;
  }

  // No concurrency API and queue empty → EAGAIN.
  errno = EAGAIN;
  return -1;
}

/** Test/dev-only — manually inject a queued signalfd_siginfo into an fd's
 *  queue. Useful when the concurrency subproject isn't wired and a test
 *  wants to verify the shape of the read path. */
export function _injectSignal(fd: number, info: Partial<signalfd_siginfo> & { ssi_signo: number }): number {
  const st = _table.get(fd);
  if (!st) return -1;
  // Filter by mask.
  const sig = info.ssi_signo;
  const w = (sig - 1) >>> 5;
  const b = 1 << ((sig - 1) & 31);
  if (w >= st.mask.length || (st.mask[w]! & b) === 0) return 0;
  const full: signalfd_siginfo = {
    ssi_signo: info.ssi_signo,
    ssi_errno: info.ssi_errno ?? 0,
    ssi_code:  info.ssi_code ?? 0,
    ssi_pid:   info.ssi_pid ?? 0,
    ssi_uid:   info.ssi_uid ?? 0,
    ssi_fd:    info.ssi_fd ?? 0,
    ssi_tid:   info.ssi_tid ?? 0,
    ssi_band:  info.ssi_band ?? 0,
    ssi_overrun: info.ssi_overrun ?? 0,
    ssi_trapno:  info.ssi_trapno ?? 0,
    ssi_status:  info.ssi_status ?? 0,
    ssi_int:   info.ssi_int ?? 0,
    ssi_ptr:   info.ssi_ptr ?? 0n,
    ssi_utime: info.ssi_utime ?? 0n,
    ssi_stime: info.ssi_stime ?? 0n,
    ssi_addr:  info.ssi_addr ?? 0n,
  };
  st.queue.push(full);
  return 1;
}

/** Resolve the concurrency API on demand. Test setup may call this to
 *  await module load, but routine usage works synchronously via
 *  _setSignalDeliveryAPI or _injectSignal. */
export async function _ensureSignalDeliveryLoaded(): Promise<boolean> {
  return (await _resolveAPI()) !== null;
}

/** Close a signalfd. Returns 0 on success, -1 with errno=EBADF on bad fd. */
export function closeSignalfd(fd: number): number {
  if (!_table.has(fd)) { errno = EBADF; return -1; }
  _table.delete(fd);
  return 0;
}
