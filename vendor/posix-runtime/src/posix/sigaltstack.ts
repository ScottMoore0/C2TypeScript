// POSIX sigaltstack — alternate-signal-stack tracking.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §sigaltstack.
//   * SUSv4 §<signal.h> (struct sigaltstack / stack_t).
//   * GNU sigsegv documentation (libsigsegv) — primary real-world consumer
//     for stack-overflow handling on POSIX hosts.
//
// Why this module
// ---------------
// Stack-overflow-detection code (libsigsegv, GNU SMOB, custom stack guards
// in tracing-GC implementations) installs a SIGSEGV handler and arranges for
// it to run on a small stack-of-its-own — otherwise the signal handler hits
// the same exhausted stack that triggered SIGSEGV.
//
// JS doesn't have per-signal stacks. The runtime concurrency layer
// (c2typescript/concurrency) routes Worker-side signals through a shared
// pending-mask; signal handlers run on the JS stack. There is no way to
// honour `ss_sp` semantically.
//
// We therefore:
//
//   * Track per-thread current/old `stack_t` records so getter calls
//     (`sigaltstack(NULL, &oss)`) return the last-set value verbatim.
//   * Validate the request against POSIX rules (SS_ONSTACK | SS_DISABLE,
//     ss_size >= MINSIGSTKSZ).
//   * Return success — translated code that depends on sigaltstack for
//     correctness needs to swap this shim for an FFI-backed real
//     sigaltstack on a POSIX host. The BRIDGE marker on every entry
//     point makes that swap surgical.
//
// BRIDGE: posix-sigaltstack — observation/tracking only; no real stack
// switching. Refactor target: link against host libc on a real POSIX
// kernel and forward to the real sigaltstack(2).

export const EINVAL = 22;
export const EFAULT = 14;
export const EPERM  = 1;
export const ENOMEM = 12;

/** SS_ONSTACK / SS_DISABLE — Linux ABI values, defined by SUSv4. */
export const SS_ONSTACK = 1;
export const SS_DISABLE = 2;

/** MINSIGSTKSZ / SIGSTKSZ — POSIX-mandated minimum stack sizes for
 *  signal handlers. Linux x86-64 values. */
export const MINSIGSTKSZ = 2048;
export const SIGSTKSZ    = 8192;

/** struct sigaltstack / stack_t — POSIX <signal.h>. */
export interface stack_t {
  ss_sp: any;        // pointer-shaped argument (CPtr / Uint8Array / address)
  ss_flags: number;  // SS_ONSTACK | SS_DISABLE | 0
  ss_size: number;   // bytes
}

export let errno: number = 0;

/** Per-thread current alt-stack. Keyed by tid as reported by the
 *  concurrency layer (defaults to 1 for the main thread when imported in
 *  isolation). We never read tid from outside this module — it's tracked
 *  internally so this module is self-contained. */
const _altStacks: Map<number, stack_t> = new Map();
let _currentTid: number = 1;

/** Test-only setter for the active tid (in lieu of a concurrency import,
 *  which would create a circular dep with posix-runtime/index.ts). */
export function _setSigaltstackTid(tid: number): void {
  _currentTid = tid | 0;
}

export function _resetSigaltstack(): void {
  _altStacks.clear();
  _currentTid = 1;
  errno = 0;
}

/**
 * POSIX sigaltstack(ss, oss) — IEEE Std 1003.1-2017 §sigaltstack.
 *
 * If `ss` is non-null, sets the alt stack to `*ss` (after validation).
 * If `oss` is non-null, writes the previous alt stack to `*oss`.
 *
 * Returns 0 on success, -1 on failure with errno set.
 *
 * Validation (POSIX):
 *   * `ss_flags` may be 0 or SS_DISABLE; any other value → EINVAL.
 *   * If !SS_DISABLE and ss_size < MINSIGSTKSZ → ENOMEM.
 *   * If currently SS_ONSTACK (signal handler running on alt stack) → EPERM.
 *
 * BRIDGE: posix-sigaltstack — bookkeeping only. The "currently SS_ONSTACK"
 * check is a stub: Mirage's signal delivery never sets SS_ONSTACK because
 * JS doesn't switch stacks.
 */
export function sigaltstack(
  ss: stack_t | null | undefined,
  oss: { value: stack_t } | stack_t | null | undefined,
): number {
  // Capture old value for `oss` BEFORE we mutate.
  const prev = _altStacks.get(_currentTid) ?? {
    ss_sp: null, ss_flags: SS_DISABLE, ss_size: 0,
  };
  if (oss !== null && oss !== undefined) {
    if (typeof oss === "object" && "value" in oss) {
      (oss as { value: stack_t }).value = { ...prev };
    } else {
      const o = oss as stack_t;
      o.ss_sp    = prev.ss_sp;
      o.ss_flags = prev.ss_flags;
      o.ss_size  = prev.ss_size;
    }
  }
  if (ss !== null && ss !== undefined) {
    const flags = ss.ss_flags | 0;
    // Allowed flag bits: 0 or SS_DISABLE.
    if (flags !== 0 && flags !== SS_DISABLE) { errno = EINVAL; return -1; }
    if ((flags & SS_DISABLE) === 0) {
      if ((ss.ss_size | 0) < MINSIGSTKSZ) { errno = ENOMEM; return -1; }
    }
    _altStacks.set(_currentTid, {
      ss_sp:    ss.ss_sp ?? null,
      ss_flags: flags,
      ss_size:  ss.ss_size | 0,
    });
  }
  return 0;
}

/** Diagnostic accessor — returns the currently configured alt stack for
 *  the active tid (or a SS_DISABLE record if none). */
export function _currentSigaltstack(): stack_t {
  return _altStacks.get(_currentTid) ?? {
    ss_sp: null, ss_flags: SS_DISABLE, ss_size: 0,
  };
}
