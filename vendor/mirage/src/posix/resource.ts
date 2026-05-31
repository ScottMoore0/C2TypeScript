// Mirage POSIX <sys/resource.h> — process resource limits + usage.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<sys/resource.h>:
//       int getrlimit (int resource, struct rlimit *rlim);
//       int setrlimit (int resource, const struct rlimit *rlim);
//       int getrusage (int who,      struct rusage *r_usage);
//       struct rlimit { rlim_t rlim_cur; rlim_t rlim_max; };
//       struct rusage { struct timeval ru_utime, ru_stime; long ru_maxrss; … };
//
// Behaviour
// ---------
//   * Limits are stored in a module-level table keyed by resource id. Default
//     soft = RLIM_INFINITY for everything; max = RLIM_INFINITY. setrlimit
//     enforces soft <= hard and returns -1/EINVAL otherwise.
//   * getrusage uses Node's `process.resourceUsage()` when available (Node
//     ≥ 12); otherwise zero-fills ru_utime / ru_stime.
//   * RLIMIT_NOFILE is honored only as a stored value; the FdTable does not
//     consult it. This mirrors what most translated CLI code expects (they
//     read the value to size buffers).
//
// BRIDGE: posix-resource — POSIX rlimit + rusage → Node process.resourceUsage.

import { createRequire } from "node:module";

// ---------------------------------------------------------------------------
// Resource ids (Linux numbering — most portable code uses these constants).
// ---------------------------------------------------------------------------

export const RLIMIT_CPU      = 0;
export const RLIMIT_FSIZE    = 1;
export const RLIMIT_DATA     = 2;
export const RLIMIT_STACK    = 3;
export const RLIMIT_CORE     = 4;
export const RLIMIT_RSS      = 5;
export const RLIMIT_NPROC    = 6;
export const RLIMIT_NOFILE   = 7;
export const RLIMIT_MEMLOCK  = 8;
export const RLIMIT_AS       = 9;
export const RLIMIT_LOCKS    = 10;
export const RLIMIT_SIGPENDING = 11;
export const RLIMIT_MSGQUEUE = 12;
export const RLIMIT_NICE     = 13;
export const RLIMIT_RTPRIO   = 14;
export const RLIMIT_RTTIME   = 15;
export const RLIM_NLIMITS    = 16;

/** RLIM_INFINITY — represented as Number.MAX_SAFE_INTEGER for JS-friendliness.
 *  Real POSIX uses (rlim_t)-1 == 2^64-1. Translated code that compares
 *  against this constant (vs. RLIM_INFINITY) should use the export. */
export const RLIM_INFINITY = Number.MAX_SAFE_INTEGER;
export const RLIM_SAVED_MAX = RLIM_INFINITY;
export const RLIM_SAVED_CUR = RLIM_INFINITY;

// who-values for getrusage().
export const RUSAGE_SELF     = 0;
export const RUSAGE_CHILDREN = -1;
export const RUSAGE_THREAD   = 1;

// Priority constants (for getpriority/setpriority shape, even if unused).
export const PRIO_PROCESS = 0;
export const PRIO_PGRP    = 1;
export const PRIO_USER    = 2;

const EINVAL = 22;
const EPERM  = 1;

/** Module errno for resource family. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// State.
// ---------------------------------------------------------------------------

export interface rlimit {
  rlim_cur: number;
  rlim_max: number;
}

export interface timeval { tv_sec: number; tv_usec: number; }

export interface rusage {
  ru_utime: timeval;
  ru_stime: timeval;
  ru_maxrss: number;
  ru_ixrss: number;
  ru_idrss: number;
  ru_isrss: number;
  ru_minflt: number;
  ru_majflt: number;
  ru_nswap: number;
  ru_inblock: number;
  ru_oublock: number;
  ru_msgsnd: number;
  ru_msgrcv: number;
  ru_nsignals: number;
  ru_nvcsw: number;
  ru_nivcsw: number;
}

const _limits: Map<number, rlimit> = new Map();

function _defaults(resource: number): rlimit {
  switch (resource) {
    case RLIMIT_NOFILE: return { rlim_cur: 1024, rlim_max: 4096 };
    case RLIMIT_STACK:  return { rlim_cur: 8 * 1024 * 1024, rlim_max: RLIM_INFINITY };
    case RLIMIT_CORE:   return { rlim_cur: 0, rlim_max: RLIM_INFINITY };
    case RLIMIT_NPROC:  return { rlim_cur: 1024, rlim_max: 4096 };
    default:            return { rlim_cur: RLIM_INFINITY, rlim_max: RLIM_INFINITY };
  }
}

/** Test-only: reset all limit overrides + errno. */
export function _resetResource(): void {
  _limits.clear();
  errno = 0;
}

// ---------------------------------------------------------------------------
// getrlimit / setrlimit.
// ---------------------------------------------------------------------------

/** POSIX getrlimit() — fill `rlim` with current soft/hard limits. */
export function getrlimit(resource: number, rlim: rlimit): number {
  if (resource < 0 || resource >= RLIM_NLIMITS) { errno = EINVAL; return -1; }
  const cur = _limits.get(resource) ?? _defaults(resource);
  rlim.rlim_cur = cur.rlim_cur;
  rlim.rlim_max = cur.rlim_max;
  return 0;
}

/** POSIX setrlimit() — install new soft/hard limits, enforcing soft<=hard. */
export function setrlimit(resource: number, rlim: rlimit): number {
  if (resource < 0 || resource >= RLIM_NLIMITS) { errno = EINVAL; return -1; }
  if (!rlim) { errno = EINVAL; return -1; }
  if (rlim.rlim_cur > rlim.rlim_max) { errno = EINVAL; return -1; }
  const prev = _limits.get(resource) ?? _defaults(resource);
  // Unprivileged code can't raise hard limit.
  if (rlim.rlim_max > prev.rlim_max) { errno = EPERM; return -1; }
  _limits.set(resource, { rlim_cur: rlim.rlim_cur, rlim_max: rlim.rlim_max });
  return 0;
}

// ---------------------------------------------------------------------------
// getrusage.
// ---------------------------------------------------------------------------

interface NodeProc {
  resourceUsage?: () => {
    userCPUTime: number; systemCPUTime: number; maxRSS: number;
    sharedMemorySize: number; unsharedDataSize: number; unsharedStackSize: number;
    minorPageFault: number; majorPageFault: number; swappedOut: number;
    fsRead: number; fsWrite: number; ipcSent: number; ipcReceived: number;
    signalsCount: number; voluntaryContextSwitches: number;
    involuntaryContextSwitches: number;
  };
}

function _zeroRusage(r: rusage): void {
  r.ru_utime = { tv_sec: 0, tv_usec: 0 };
  r.ru_stime = { tv_sec: 0, tv_usec: 0 };
  r.ru_maxrss = 0; r.ru_ixrss = 0; r.ru_idrss = 0; r.ru_isrss = 0;
  r.ru_minflt = 0; r.ru_majflt = 0; r.ru_nswap = 0;
  r.ru_inblock = 0; r.ru_oublock = 0;
  r.ru_msgsnd = 0; r.ru_msgrcv = 0;
  r.ru_nsignals = 0;
  r.ru_nvcsw = 0; r.ru_nivcsw = 0;
}

/** POSIX getrusage(who, r_usage) — fill rusage from Node process counters. */
export function getrusage(who: number, r_usage: rusage): number {
  if (who !== RUSAGE_SELF && who !== RUSAGE_CHILDREN && who !== RUSAGE_THREAD) {
    errno = EINVAL; return -1;
  }
  if (!r_usage) { errno = EINVAL; return -1; }
  _zeroRusage(r_usage);
  const proc = (globalThis as unknown as { process?: NodeProc }).process;
  if (!proc || typeof proc.resourceUsage !== "function") return 0;

  // Node's resourceUsage reports CPU time in microseconds. RUSAGE_CHILDREN
  // would require child-process accounting which Node doesn't track —
  // we report self's values for simplicity.
  try {
    const ru = proc.resourceUsage!();
    r_usage.ru_utime = { tv_sec: Math.floor(ru.userCPUTime / 1_000_000), tv_usec: ru.userCPUTime % 1_000_000 };
    r_usage.ru_stime = { tv_sec: Math.floor(ru.systemCPUTime / 1_000_000), tv_usec: ru.systemCPUTime % 1_000_000 };
    r_usage.ru_maxrss = ru.maxRSS;
    r_usage.ru_ixrss = ru.sharedMemorySize;
    r_usage.ru_idrss = ru.unsharedDataSize;
    r_usage.ru_isrss = ru.unsharedStackSize;
    r_usage.ru_minflt = ru.minorPageFault;
    r_usage.ru_majflt = ru.majorPageFault;
    r_usage.ru_nswap = ru.swappedOut;
    r_usage.ru_inblock = ru.fsRead;
    r_usage.ru_oublock = ru.fsWrite;
    r_usage.ru_msgsnd = ru.ipcSent;
    r_usage.ru_msgrcv = ru.ipcReceived;
    r_usage.ru_nsignals = ru.signalsCount;
    r_usage.ru_nvcsw = ru.voluntaryContextSwitches;
    r_usage.ru_nivcsw = ru.involuntaryContextSwitches;
  } catch {
    // If Node's API throws, leave the zero-filled struct in place.
  }
  return 0;
}

// ---------------------------------------------------------------------------
// getpriority / setpriority — stub but POSIX-shaped.
// ---------------------------------------------------------------------------

const _prio: Map<string, number> = new Map();
function _key(which: number, who: number): string { return `${which}:${who}`; }

/** POSIX getpriority(which, who). Returns the nice value (0 by default). */
export function getpriority(which: number, who: number): number {
  if (which !== PRIO_PROCESS && which !== PRIO_PGRP && which !== PRIO_USER) {
    errno = EINVAL; return -1;
  }
  return _prio.get(_key(which, who)) ?? 0;
}

/** POSIX setpriority(which, who, prio). */
export function setpriority(which: number, who: number, prio: number): number {
  if (which !== PRIO_PROCESS && which !== PRIO_PGRP && which !== PRIO_USER) {
    errno = EINVAL; return -1;
  }
  if (prio < -20) prio = -20;
  if (prio > 19) prio = 19;
  _prio.set(_key(which, who), prio);
  return 0;
}
