// POSIX sigwait family — wraps concurrency/signal-delivery for Mirage callers.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §sigwait, §sigwaitinfo, §sigtimedwait.
//   * SUSv4 §<signal.h> (struct siginfo_t, sigset_t).
//
// Why this module
// ---------------
// The concurrency runtime (`c2typescript/concurrency/src/signal-delivery.ts`)
// implements `sigwait_real`, `sigwaitinfo_real`, `sigtimedwait_real` against
// a SharedArrayBuffer-backed pending mask. Mirage's translator-emitted output
// expects to import these as `sigwait` / `sigwaitinfo` / `sigtimedwait` from
// the OS shim layer.
//
// This module:
//   * Lazy-imports the concurrency signal-delivery API (so Mirage-only
//     translated programs without concurrency don't fail at load).
//   * Coerces the C `sigset_t *` argument (which the translator emits as a
//     CPtr or Uint8Array) into the Uint32Array shape that the concurrency
//     side expects.
//   * Coerces the `siginfo_t *` and `int *sig` outputs back into whatever
//     ref-shape the translator emitted (`{value: ...}` ref-box or CPtr-
//     into-bytes).
//   * Sets module-level `errno` on failure, matching POSIX §2.3.
//
// BRIDGE: posix-sigwait — the entire surface dispatches to the concurrency
// runtime; in environments without it (browser without SharedArrayBuffer,
// etc.) we fall back to a best-effort polling stub that returns EAGAIN /
// EINVAL as appropriate.

export const EAGAIN = 11;
export const EINVAL = 22;
export const EINTR  = 4;

/** Number of words in a sigset_t — concurrency uses 2 (64 signals + RT). */
const PENDING_MASK_WORDS = 2;

export let errno: number = 0;

/** struct siginfo_t — POSIX <signal.h>. */
export interface siginfo_t {
  si_signo: number;
  si_code: number;
  si_value: { sival_int: number; sival_ptr: any };
}

// ---------------------------------------------------------------------------
// Lazy resolution of the concurrency signal-delivery API.
// ---------------------------------------------------------------------------

interface SigwaitAPI {
  sigwait_real:        (setBits: Uint32Array, sig_out: { value: number }) => number;
  sigwaitinfo_real:    (setBits: Uint32Array, info_out: { value: siginfo_t }) => number;
  sigtimedwait_real:   (setBits: Uint32Array, info_out: { value: siginfo_t }, timeout_ms: number) => number;
}

let _api: SigwaitAPI | null | undefined;

/** Test-only — install a custom API (or null to force the fallback path). */
export function _setSigwaitAPI(api: SigwaitAPI | null): void {
  _api = api;
}

export function _resetSigwait(): void {
  _api = undefined;
  errno = 0;
}

async function _resolveAPI(): Promise<SigwaitAPI | null> {
  if (_api !== undefined) return _api;
  try {
    const modName = "concurrency/dist/signal-delivery.js";
    const mod: any = await (Function("m", "return import(m)") as any)(modName);
    _api = {
      sigwait_real:      mod.sigwait_real,
      sigwaitinfo_real:  mod.sigwaitinfo_real,
      sigtimedwait_real: mod.sigtimedwait_real,
    };
  } catch { _api = null; }
  return _api;
}

/** Synchronous best-effort accessor — most translated callers will already
 *  have the concurrency module loaded by the time the first sigwait fires. */
function _apiSync(): SigwaitAPI | null {
  if (_api === undefined) {
    try {
      const req = (globalThis as any).require;
      if (typeof req === "function") {
        const mod = req("concurrency/dist/signal-delivery.js");
        _api = {
          sigwait_real:      mod.sigwait_real,
          sigwaitinfo_real:  mod.sigwaitinfo_real,
          sigtimedwait_real: mod.sigtimedwait_real,
        };
      } else {
        _api = null;
      }
    } catch { _api = null; }
  }
  return _api ?? null;
}

// ---------------------------------------------------------------------------
// sigset_t coercion. The translator emits `const sigset_t *set` as either
// a CPtr {buf, off} pointing into a 16-byte sigset_t, a Uint8Array of length
// 16, a Uint32Array of length 4 (or 2), or a JS object with `.bits` /
// `.value`. We accept all of them and project to a 2-word Uint32Array.
// ---------------------------------------------------------------------------

function coerceSigset(set: any): Uint32Array | null {
  if (!set) return null;
  if (set instanceof Uint32Array) {
    if (set.length >= PENDING_MASK_WORDS) return set.subarray(0, PENDING_MASK_WORDS);
    const out = new Uint32Array(PENDING_MASK_WORDS);
    out.set(set);
    return out;
  }
  if (set instanceof Uint8Array) {
    const dv = new DataView(set.buffer, set.byteOffset);
    const out = new Uint32Array(PENDING_MASK_WORDS);
    for (let i = 0; i < PENDING_MASK_WORDS && (i + 1) * 4 <= set.byteLength; i++) {
      out[i] = dv.getUint32(i * 4, true);
    }
    return out;
  }
  if (set.buf && typeof set.off === "number") {
    const buf: Uint8Array = set.buf;
    const dv = new DataView(buf.buffer, buf.byteOffset + set.off);
    const out = new Uint32Array(PENDING_MASK_WORDS);
    for (let i = 0; i < PENDING_MASK_WORDS && (i + 1) * 4 + set.off <= buf.byteLength; i++) {
      out[i] = dv.getUint32(i * 4, true);
    }
    return out;
  }
  if (Array.isArray(set)) {
    const out = new Uint32Array(PENDING_MASK_WORDS);
    for (let i = 0; i < Math.min(set.length, PENDING_MASK_WORDS); i++) out[i] = set[i] >>> 0;
    return out;
  }
  // Object form with `.bits` / `.value`.
  if (typeof set === "object") {
    const bits = set.bits ?? set.value ?? set.__bits;
    if (bits instanceof Uint32Array) return bits.subarray(0, PENDING_MASK_WORDS);
    if (Array.isArray(bits)) {
      const out = new Uint32Array(PENDING_MASK_WORDS);
      for (let i = 0; i < Math.min(bits.length, PENDING_MASK_WORDS); i++) out[i] = bits[i] >>> 0;
      return out;
    }
    if (typeof bits === "number") {
      const out = new Uint32Array(PENDING_MASK_WORDS);
      out[0] = bits >>> 0;
      return out;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public POSIX surface.
// ---------------------------------------------------------------------------

/**
 * POSIX sigwait(set, sig) — IEEE Std 1003.1-2017 §sigwait.
 * Returns 0 on success and writes the accepted signal number through `*sig`.
 * Returns a positive errno value on failure (NOT -1; sigwait is unusual).
 */
export function sigwait(set: any, sig_out: { value: number } | null): number {
  const bits = coerceSigset(set);
  if (!bits) return EINVAL;
  if (!sig_out) return EINVAL;
  const api = _apiSync();
  if (!api) return EINVAL;
  return api.sigwait_real(bits, sig_out);
}

/**
 * POSIX sigwaitinfo(set, info) — IEEE Std 1003.1-2017 §sigwaitinfo.
 * Returns the signal number on success, -1 on failure with errno set.
 */
export function sigwaitinfo(set: any, info_out: { value: siginfo_t } | null): number {
  const bits = coerceSigset(set);
  if (!bits) { errno = EINVAL; return -1; }
  const api = _apiSync();
  if (!api) { errno = EINVAL; return -1; }
  const target = info_out ?? { value: { si_signo: 0, si_code: 0, si_value: { sival_int: 0, sival_ptr: null } } };
  const r = api.sigwaitinfo_real(bits, target);
  if (r < 0) { errno = -r; return -1; }
  return r;
}

/**
 * POSIX sigtimedwait(set, info, timeout) — IEEE Std 1003.1-2017 §sigtimedwait.
 * Returns the signal number on success, -1 on EAGAIN (timeout) / EINTR.
 *
 * `timeout` may be a struct timespec ({tv_sec, tv_nsec}), a number (ms), or
 * null (infinite). Negative values mean infinite.
 */
export function sigtimedwait(
  set: any,
  info_out: { value: siginfo_t } | null,
  timeout: { tv_sec?: number; tv_nsec?: number } | number | null,
): number {
  const bits = coerceSigset(set);
  if (!bits) { errno = EINVAL; return -1; }
  const api = _apiSync();
  if (!api) { errno = EINVAL; return -1; }

  let timeout_ms: number;
  if (timeout === null || timeout === undefined) {
    timeout_ms = -1;
  } else if (typeof timeout === "number") {
    timeout_ms = timeout;
  } else if (typeof timeout === "object") {
    const sec = (timeout.tv_sec  ?? 0) | 0;
    const ns  = (timeout.tv_nsec ?? 0) | 0;
    timeout_ms = sec * 1000 + Math.floor(ns / 1_000_000);
  } else {
    timeout_ms = -1;
  }

  const target = info_out ?? { value: { si_signo: 0, si_code: 0, si_value: { sival_int: 0, sival_ptr: null } } };
  const r = api.sigtimedwait_real(bits, target, timeout_ms);
  if (r < 0) { errno = -r; return -1; }
  return r;
}

// ---------------------------------------------------------------------------
// sigset_t helpers (sigemptyset / sigfillset / sigaddset / sigdelset /
// sigismember). These are operationally tiny but the translator emits them
// against the same sigset_t shape, so we provide them here for consistency.
// ---------------------------------------------------------------------------

/** Allocate a 2-word Uint32Array sigset_t. */
export function alloc_sigset(): Uint32Array {
  return new Uint32Array(PENDING_MASK_WORDS);
}

/** POSIX sigemptyset — IEEE Std 1003.1-2017 §sigemptyset. */
export function sigemptyset(set: any): number {
  const bits = coerceSigset(set);
  if (!bits) return -1;
  for (let i = 0; i < bits.length; i++) bits[i] = 0;
  return 0;
}

/** POSIX sigfillset — IEEE Std 1003.1-2017 §sigfillset. */
export function sigfillset(set: any): number {
  const bits = coerceSigset(set);
  if (!bits) return -1;
  for (let i = 0; i < bits.length; i++) bits[i] = 0xffffffff;
  return 0;
}

/** POSIX sigaddset — IEEE Std 1003.1-2017 §sigaddset. */
export function sigaddset(set: any, signo: number): number {
  if (signo < 1 || signo > PENDING_MASK_WORDS * 32) return -1;
  const bits = coerceSigset(set);
  if (!bits) return -1;
  bits[(signo - 1) >>> 5]! |= 1 << ((signo - 1) & 31);
  return 0;
}

/** POSIX sigdelset — IEEE Std 1003.1-2017 §sigdelset. */
export function sigdelset(set: any, signo: number): number {
  if (signo < 1 || signo > PENDING_MASK_WORDS * 32) return -1;
  const bits = coerceSigset(set);
  if (!bits) return -1;
  bits[(signo - 1) >>> 5]! &= ~(1 << ((signo - 1) & 31));
  return 0;
}

/** POSIX sigismember — IEEE Std 1003.1-2017 §sigismember. */
export function sigismember(set: any, signo: number): number {
  if (signo < 1 || signo > PENDING_MASK_WORDS * 32) return -1;
  const bits = coerceSigset(set);
  if (!bits) return -1;
  return (bits[(signo - 1) >>> 5]! & (1 << ((signo - 1) & 31))) ? 1 : 0;
}

/** Async variant of _resolveAPI for callers that can await. */
export async function _ensureSigwaitAPI(): Promise<SigwaitAPI | null> {
  return _resolveAPI();
}
