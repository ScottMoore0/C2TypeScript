// MC-T2-Signal: POSIX signal handler registry.
//
// Provides a signal number space, a handler registry, and optional Node
// process bridge to deliver real OS signals into the registry. In non-Node
// environments (browser/Deno) the bridge is a no-op.
//
// Extended for Mirage L.5 with sigaction, sigset_t operations, sigprocmask,
// raise, kill, alarm, setitimer/getitimer and pause per IEEE Std 1003.1-2017
// <signal.h>.

// POSIX signal numbers (Linux-style; stable subset).
export const SIGHUP = 1;
export const SIGINT = 2;
export const SIGQUIT = 3;
export const SIGILL = 4;
export const SIGTRAP = 5;
export const SIGABRT = 6;
export const SIGBUS = 7;
export const SIGFPE = 8;
export const SIGKILL = 9;
export const SIGUSR1 = 10;
export const SIGSEGV = 11;
export const SIGUSR2 = 12;
export const SIGPIPE = 13;
export const SIGALRM = 14;
export const SIGTERM = 15;
export const SIGCHLD = 17;
export const SIGCONT = 18;
export const SIGSTOP = 19;
export const SIGTSTP = 20;

/** Max signal number we track in a sigset_t bitmap. */
export const NSIG = 32;

export type SignalHandler = (sig: number) => void;

/** SIG_DFL sentinel — default action (no handler registered). */
export const SIG_DFL: SignalHandler | null = null;

/** SIG_IGN sentinel — silently ignore. Implemented as a no-op function. */
export const SIG_IGN: SignalHandler = function SIG_IGN(_sig: number): void {
  /* ignore */
};

// --- sigaction flags, IEEE Std 1003.1-2017 <signal.h> ---
export const SA_NOCLDSTOP = 0x00000001;
export const SA_NOCLDWAIT = 0x00000002;
export const SA_SIGINFO   = 0x00000004;
export const SA_ONSTACK   = 0x08000000;
export const SA_RESTART   = 0x10000000;
export const SA_NODEFER   = 0x40000000;
export const SA_RESETHAND = -0x80000000;

// sigprocmask(how, ...) constants, IEEE Std 1003.1-2017 §sigprocmask.
export const SIG_BLOCK   = 0;
export const SIG_UNBLOCK = 1;
export const SIG_SETMASK = 2;

// setitimer/getitimer which, IEEE Std 1003.1-2017 §setitimer.
export const ITIMER_REAL    = 0;
export const ITIMER_VIRTUAL = 1;
export const ITIMER_PROF    = 2;

/**
 * sigaction struct — IEEE Std 1003.1-2017 <signal.h>.
 *
 * `sa_handler` is a SignalHandler | SIG_IGN | SIG_DFL (null).
 * `sa_mask` is the set of signals to block during execution of the handler.
 * `sa_flags` is a bitmask of SA_* flags (implemented cooperatively — most
 * flags are recorded for round-trip fidelity; SA_RESETHAND causes the
 * handler to revert to SIG_DFL on first delivery; SA_NODEFER disables the
 * automatic blocking of the just-delivered signal during its handler).
 */
export interface Sigaction {
  sa_handler: SignalHandler | null;
  sa_mask: SigSet;
  sa_flags: number;
}

/**
 * POSIX sigset_t — IEEE Std 1003.1-2017 <signal.h>. Represented as a
 * 32-bit bitmap covering signals 1..NSIG-1. Bit (sig-1) set means "signal
 * sig is a member of the set".
 */
export class SigSet {
  /** raw bits — bit (sig-1) is set if signal sig is a member. */
  bits: number = 0;

  clone(): SigSet {
    const s = new SigSet();
    s.bits = this.bits;
    return s;
  }

  static empty(): SigSet { return new SigSet(); }

  static full(): SigSet {
    const s = new SigSet();
    // bits 0..NSIG-2 representing signals 1..NSIG-1
    s.bits = (1 << (NSIG - 1)) - 1;
    // But shift by NSIG-1 may produce 0x7fffffff which is fine for 31 bits.
    return s;
  }

  /** Return the bitmask value for `sig`, or 0 for out-of-range. */
  static maskOf(sig: number): number {
    if (sig < 1 || sig >= NSIG) return 0;
    return 1 << (sig - 1);
  }
}

/**
 * sigemptyset() — IEEE Std 1003.1-2017 §sigemptyset.
 * Initializes `set` to exclude all signals.
 */
export function sigemptyset(set: SigSet): number {
  set.bits = 0;
  return 0;
}

/**
 * sigfillset() — IEEE Std 1003.1-2017 §sigfillset.
 * Initializes `set` to include all signals.
 */
export function sigfillset(set: SigSet): number {
  set.bits = (1 << (NSIG - 1)) - 1;
  return 0;
}

/**
 * sigaddset() — IEEE Std 1003.1-2017 §sigaddset.
 * Returns 0 on success, -1 if sig is out of range.
 */
export function sigaddset(set: SigSet, sig: number): number {
  const m = SigSet.maskOf(sig);
  if (!m) return -1;
  set.bits |= m;
  return 0;
}

/**
 * sigdelset() — IEEE Std 1003.1-2017 §sigdelset.
 * Returns 0 on success, -1 if sig is out of range.
 */
export function sigdelset(set: SigSet, sig: number): number {
  const m = SigSet.maskOf(sig);
  if (!m) return -1;
  set.bits &= ~m;
  return 0;
}

// ----------------------------------------------------------------------------
// sigsetjmp / siglongjmp — IEEE Std 1003.1-2017 §sigsetjmp.
//
// sigsetjmp(env, savemask) records the jmp_buf and optionally the signal
// mask; siglongjmp(env, val) throws a SigLongjmp exception that the
// emitter-emitted try/catch at the sigsetjmp point catches, restoring the
// signal mask and resuming as if sigsetjmp returned `val` (non-zero).
// ----------------------------------------------------------------------------

/** sigjmp_buf replacement — holds caller state for siglongjmp. */
export interface SigJmpBuf {
  /** Opaque env identifier; referenced by the longjmp path. */
  id: number;
  /** Saved signal mask bits (if savemask != 0). */
  savedMask: number;
  /** Whether the mask should be restored on longjmp. */
  restoreMask: boolean;
}

/** Exception thrown by siglongjmp — caught at the sigsetjmp re-entry site. */
export class SigLongjmp extends Error {
  constructor(public readonly env: SigJmpBuf, public readonly val: number) {
    super(`siglongjmp(env=${env.id}, val=${val})`);
    this.name = "SigLongjmp";
  }
}

let _nextJmpId = 1;

/**
 * POSIX sigsetjmp() — IEEE Std 1003.1-2017 §sigsetjmp.
 * Initial invocation returns 0. A matching siglongjmp raises SigLongjmp,
 * which the emitted try/catch at the caller site catches and re-dispatches
 * as if sigsetjmp returned `val`.
 *
 * `reg` is the SignalRegistry whose mask will be saved/restored.
 */
export function sigsetjmpInit(reg: SignalRegistry, env: SigJmpBuf, savemask: number): number {
  env.id = _nextJmpId++;
  env.savedMask = reg.getMask().bits;
  env.restoreMask = savemask !== 0;
  return 0;
}

/**
 * POSIX siglongjmp() — IEEE Std 1003.1-2017 §siglongjmp.
 * Restores the mask (if savemask was set) and throws SigLongjmp to unwind
 * to the matching sigsetjmp. `val` must be non-zero (POSIX: if val==0 it is
 * replaced with 1).
 */
export function siglongjmp(reg: SignalRegistry, env: SigJmpBuf, val: number): never {
  if (val === 0) val = 1;
  if (env.restoreMask) {
    const restore = new SigSet();
    restore.bits = env.savedMask;
    reg.sigprocmask(SIG_SETMASK, restore, null);
  }
  throw new SigLongjmp(env, val);
}

/**
 * sigismember() — IEEE Std 1003.1-2017 §sigismember.
 * Returns 1 if `sig` is a member of `set`, 0 if not, -1 if sig is out of range.
 */
export function sigismember(set: SigSet, sig: number): number {
  const m = SigSet.maskOf(sig);
  if (!m) return -1;
  return (set.bits & m) !== 0 ? 1 : 0;
}

/** Map from numeric signal to Node signal name (for installNodeBridge). */
const NODE_NAMES: Record<number, NodeJS.Signals | undefined> = {
  [SIGHUP]: "SIGHUP",
  [SIGINT]: "SIGINT",
  [SIGQUIT]: "SIGQUIT",
  [SIGILL]: "SIGILL",
  [SIGTRAP]: "SIGTRAP",
  [SIGABRT]: "SIGABRT",
  [SIGBUS]: "SIGBUS",
  [SIGFPE]: "SIGFPE",
  [SIGUSR1]: "SIGUSR1",
  [SIGSEGV]: "SIGSEGV",
  [SIGUSR2]: "SIGUSR2",
  [SIGPIPE]: "SIGPIPE",
  [SIGALRM]: "SIGALRM",
  [SIGTERM]: "SIGTERM",
  [SIGCHLD]: "SIGCHLD",
  [SIGCONT]: "SIGCONT",
  [SIGTSTP]: "SIGTSTP",
};

/**
 * A value is the fallback interval timer value used by getitimer/setitimer.
 * IEEE Std 1003.1-2017 §setitimer.
 */
export interface Itimerval {
  it_interval: { tv_sec: number; tv_usec: number };
  it_value:    { tv_sec: number; tv_usec: number };
}

export class SignalRegistry {
  private handlers: Map<number, SignalHandler> = new Map();
  /** Full sigaction records, keyed by signal number. */
  private actions: Map<number, Sigaction> = new Map();
  /** Current per-process blocked-signal mask (single-threaded). */
  private mask: SigSet = new SigSet();
  /** Signals delivered while blocked — held pending until unblocked. */
  private pending: Set<number> = new Set();
  private bridged: Set<number> = new Set();

  // --- Alarm / itimer state ---
  private alarmTimer: ReturnType<typeof setTimeout> | null = null;
  private alarmTarget: number = 0; // epoch ms when SIGALRM fires, 0 if none.
  private itimerReal: Itimerval = {
    it_interval: { tv_sec: 0, tv_usec: 0 },
    it_value:    { tv_sec: 0, tv_usec: 0 },
  };

  /**
   * Register a handler for signal `sig`. Returns the previously registered
   * handler (or null if none). Passing `null` removes the handler.
   * POSIX signal() — IEEE Std 1003.1-2017 §signal.
   */
  register(sig: number, handler: SignalHandler | null): SignalHandler | null {
    const prev = this.handlers.get(sig) ?? null;
    if (handler === null) {
      this.handlers.delete(sig);
      this.actions.delete(sig);
    } else {
      this.handlers.set(sig, handler);
      // Also record a default sigaction so sigaction() queries see it.
      this.actions.set(sig, {
        sa_handler: handler,
        sa_mask: new SigSet(),
        sa_flags: 0,
      });
    }
    return prev;
  }

  /**
   * POSIX sigaction() — IEEE Std 1003.1-2017 §sigaction.
   * If `act` is non-null, install it. If `oldact` is non-null, fill it with
   * the previous action. Returns 0 on success, -1 for invalid sig
   * (SIGKILL / SIGSTOP may not be caught per spec — we mirror that).
   */
  sigaction(sig: number, act: Sigaction | null, oldact: Sigaction | null): number {
    if (sig < 1 || sig >= NSIG) return -1;
    if (act && (sig === SIGKILL || sig === SIGSTOP)) return -1;
    const prev = this.actions.get(sig);
    if (oldact) {
      if (prev) {
        oldact.sa_handler = prev.sa_handler;
        oldact.sa_mask.bits = prev.sa_mask.bits;
        oldact.sa_flags = prev.sa_flags;
      } else {
        oldact.sa_handler = null;
        oldact.sa_mask.bits = 0;
        oldact.sa_flags = 0;
      }
    }
    if (act) {
      this.actions.set(sig, {
        sa_handler: act.sa_handler,
        sa_mask: act.sa_mask.clone(),
        sa_flags: act.sa_flags,
      });
      if (act.sa_handler) {
        this.handlers.set(sig, act.sa_handler);
      } else {
        this.handlers.delete(sig);
      }
    }
    return 0;
  }

  /** Retrieve the currently registered handler (or null). */
  get(sig: number): SignalHandler | null {
    return this.handlers.get(sig) ?? null;
  }

  /** Retrieve the full sigaction for `sig` (or null if none installed). */
  getAction(sig: number): Sigaction | null {
    const a = this.actions.get(sig);
    if (!a) return null;
    return {
      sa_handler: a.sa_handler,
      sa_mask: a.sa_mask.clone(),
      sa_flags: a.sa_flags,
    };
  }

  /**
   * Deliver signal `sig` synchronously to the registered handler unless
   * it is currently blocked, in which case it is held pending.
   * Implements SA_NODEFER and SA_RESETHAND from sigaction flags.
   */
  dispatch(sig: number): void {
    // Blocked? Hold pending (unless the caller is using the legacy path
    // for un-actioned signals — both are handled uniformly here).
    if ((this.mask.bits & SigSet.maskOf(sig)) !== 0) {
      this.pending.add(sig);
      return;
    }
    const act = this.actions.get(sig);
    const h = this.handlers.get(sig);
    if (!h) return;
    // Block the signal itself (and sa_mask) during handler execution
    // unless SA_NODEFER is set — POSIX default.
    const savedMask = this.mask.bits;
    if (act) {
      this.mask.bits |= act.sa_mask.bits;
      if ((act.sa_flags & SA_NODEFER) === 0) {
        this.mask.bits |= SigSet.maskOf(sig);
      }
    }
    try {
      h(sig);
    } finally {
      this.mask.bits = savedMask;
    }
    // SA_RESETHAND: reset to SIG_DFL after first delivery.
    if (act && (act.sa_flags & SA_RESETHAND) !== 0) {
      this.handlers.delete(sig);
      this.actions.delete(sig);
    }
    // Deliver any pendings now unblocked.
    this.drainPending();
  }

  /**
   * POSIX raise() — IEEE Std 1003.1-2017 §raise.
   * Self-deliver a signal (synchronously invoke the handler if any).
   */
  raise(sig: number): number {
    this.dispatch(sig);
    return 0;
  }

  /**
   * POSIX kill() — IEEE Std 1003.1-2017 §kill.
   * For pid==0 or pid==own-pid, equivalent to raise(sig). For any other
   * pid, returns -1 (ESRCH / EPERM semantically collapsed) because the
   * single-process Mirage model cannot target other processes.
   */
  kill(pid: number, selfPid: number, sig: number): number {
    if (pid === 0 || pid === selfPid || pid === -1) {
      // pid == -1 in POSIX means "all processes the caller can signal" —
      // in the single-process model, that reduces to self.
      if (sig === 0) return 0; // null-signal: existence check — succeeds for self.
      return this.raise(sig);
    }
    return -1;
  }

  /**
   * POSIX sigprocmask() — IEEE Std 1003.1-2017 §sigprocmask.
   * `how`: SIG_BLOCK | SIG_UNBLOCK | SIG_SETMASK.
   * If `oldset` is non-null, fill it with the previous mask first.
   * On SIG_UNBLOCK or SIG_SETMASK, any pending signal that becomes
   * unblocked is delivered synchronously before returning.
   */
  sigprocmask(how: number, set: SigSet | null, oldset: SigSet | null): number {
    if (oldset) oldset.bits = this.mask.bits;
    if (set) {
      switch (how) {
        case SIG_BLOCK:   this.mask.bits |= set.bits; break;
        case SIG_UNBLOCK: this.mask.bits &= ~set.bits; break;
        case SIG_SETMASK: this.mask.bits = set.bits; break;
        default: return -1;
      }
    }
    this.drainPending();
    return 0;
  }

  /** Return a copy of the current mask. */
  getMask(): SigSet { return this.mask.clone(); }

  /** Deliver pending signals that are no longer blocked. */
  private drainPending(): void {
    if (this.pending.size === 0) return;
    const toDeliver: number[] = [];
    for (const sig of this.pending) {
      if ((this.mask.bits & SigSet.maskOf(sig)) === 0) toDeliver.push(sig);
    }
    for (const sig of toDeliver) {
      this.pending.delete(sig);
      // Recurse-safe: dispatch re-checks mask.
      this.dispatch(sig);
    }
  }

  /** Return the set of pending (blocked-but-delivered) signals as a SigSet. */
  sigpending(): SigSet {
    const s = new SigSet();
    for (const sig of this.pending) s.bits |= SigSet.maskOf(sig);
    return s;
  }

  /**
   * POSIX alarm() — IEEE Std 1003.1-2017 §alarm.
   * Schedule delivery of SIGALRM after `seconds` real-time seconds.
   * Returns the number of seconds remaining on a prior alarm, or 0 if none.
   * `seconds == 0` cancels any pending alarm.
   */
  alarm(seconds: number): number {
    const now = Date.now();
    let remaining = 0;
    if (this.alarmTimer !== null) {
      remaining = Math.max(0, Math.ceil((this.alarmTarget - now) / 1000));
      clearTimeout(this.alarmTimer);
      this.alarmTimer = null;
      this.alarmTarget = 0;
    }
    if (seconds > 0) {
      this.alarmTarget = now + seconds * 1000;
      this.alarmTimer = setTimeout(() => {
        this.alarmTimer = null;
        this.alarmTarget = 0;
        this.dispatch(SIGALRM);
      }, seconds * 1000);
      // Do not keep the Node event loop alive just for alarms.
      const t = this.alarmTimer as unknown as { unref?: () => void };
      if (typeof t.unref === "function") t.unref();
    }
    return remaining;
  }

  /**
   * POSIX setitimer() — IEEE Std 1003.1-2017 §setitimer.
   * Only ITIMER_REAL is implemented meaningfully (fires SIGALRM); the
   * VIRTUAL and PROF timers accept state but never fire in the in-process
   * model (documented caveat).
   */
  setitimer(which: number, value: Itimerval, ovalue: Itimerval | null): number {
    if (which !== ITIMER_REAL && which !== ITIMER_VIRTUAL && which !== ITIMER_PROF) return -1;
    if (ovalue) {
      ovalue.it_interval = { ...this.itimerReal.it_interval };
      ovalue.it_value    = this.getitimerValue(which);
    }
    if (which === ITIMER_REAL) {
      // Cancel prior alarm.
      if (this.alarmTimer !== null) {
        clearTimeout(this.alarmTimer);
        this.alarmTimer = null;
        this.alarmTarget = 0;
      }
      this.itimerReal = {
        it_interval: { ...value.it_interval },
        it_value:    { ...value.it_value },
      };
      const ms = value.it_value.tv_sec * 1000 + Math.floor(value.it_value.tv_usec / 1000);
      if (ms > 0) {
        const intervalMs = value.it_interval.tv_sec * 1000 + Math.floor(value.it_interval.tv_usec / 1000);
        this.alarmTarget = Date.now() + ms;
        const fire = (): void => {
          this.alarmTarget = 0;
          this.alarmTimer = null;
          this.dispatch(SIGALRM);
          if (intervalMs > 0) {
            this.alarmTarget = Date.now() + intervalMs;
            this.alarmTimer = setTimeout(fire, intervalMs);
            const t2 = this.alarmTimer as unknown as { unref?: () => void };
            if (typeof t2.unref === "function") t2.unref();
          }
        };
        this.alarmTimer = setTimeout(fire, ms);
        const t = this.alarmTimer as unknown as { unref?: () => void };
        if (typeof t.unref === "function") t.unref();
      }
    }
    return 0;
  }

  /** POSIX getitimer() — IEEE Std 1003.1-2017 §getitimer. */
  getitimer(which: number, value: Itimerval): number {
    if (which !== ITIMER_REAL && which !== ITIMER_VIRTUAL && which !== ITIMER_PROF) return -1;
    value.it_interval = { ...this.itimerReal.it_interval };
    value.it_value = this.getitimerValue(which);
    return 0;
  }

  private getitimerValue(which: number): { tv_sec: number; tv_usec: number } {
    if (which === ITIMER_REAL && this.alarmTarget > 0) {
      const remMs = Math.max(0, this.alarmTarget - Date.now());
      return {
        tv_sec: Math.floor(remMs / 1000),
        tv_usec: (remMs % 1000) * 1000,
      };
    }
    return { tv_sec: 0, tv_usec: 0 };
  }

  /**
   * POSIX sigsuspend() — IEEE Std 1003.1-2017 §sigsuspend.
   * Temporarily replaces the process mask with `mask`, then cooperatively
   * waits for a signal. Returns -1 always (spec: errno=EINTR after a
   * handler returns). Any pending signals that become unblocked are
   * delivered synchronously before returning.
   */
  sigsuspend(mask: SigSet): number {
    const saved = this.mask.bits;
    this.mask.bits = mask.bits;
    try {
      // Drain pendings that are now unblocked.
      this.drainPending();
      // If there's a pending alarm, cooperatively spin-wait for it to fire,
      // matching pause() semantics.
      if (this.alarmTarget > 0) {
        const end = this.alarmTarget;
        while (Date.now() < end) { /* spin */ }
        this.drainPending();
      }
    } finally {
      this.mask.bits = saved;
      this.drainPending();
    }
    return -1;
  }

  /**
   * POSIX pause() — IEEE Std 1003.1-2017 §pause.
   * In the single-threaded model, we cannot block execution; if there
   * is a pending alarm we synchronously spin-wait until its target
   * time elapses (cooperatively) so that the next poll of the event
   * loop can deliver SIGALRM. Returns -1 per spec (errno=EINTR when a
   * handler ran) — always -1 is the conforming return.
   */
  pause(): number {
    // Best-effort: busy-wait until alarm target if one is set.
    if (this.alarmTarget > 0) {
      const end = this.alarmTarget;
      while (Date.now() < end) {
        // Tight spin — cannot yield to event loop in sync JS.
      }
    }
    return -1;
  }

  /** Clear all registered handlers. */
  clear(): void {
    this.handlers.clear();
    this.actions.clear();
    this.mask.bits = 0;
    this.pending.clear();
    if (this.alarmTimer !== null) {
      clearTimeout(this.alarmTimer);
      this.alarmTimer = null;
      this.alarmTarget = 0;
    }
  }

  /**
   * Wire Node's process signal events into this registry. For each signal
   * that Node supports on the current platform, subscribing once with
   * process.on('SIGxxx', ...). Safe to call multiple times (idempotent per
   * signal). No-op in non-Node environments.
   */
  installNodeBridge(): void {
    const g = globalThis as unknown as { process?: NodeJS.Process };
    const proc = g.process;
    if (!proc || typeof proc.on !== "function") return;
    for (const [sigStr, name] of Object.entries(NODE_NAMES)) {
      if (!name) continue;
      const sig = Number(sigStr);
      if (this.bridged.has(sig)) continue;
      try {
        proc.on(name, () => this.dispatch(sig));
        this.bridged.add(sig);
      } catch {
        // Some signals (SIGKILL, SIGSTOP) cannot be listened to — ignore.
      }
    }
  }
}
