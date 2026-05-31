// Mirage top-level event loop — Round 32 (event-loop integration).
//
// Goal: give translated C programs that mix blocking and async operations a
// single cooperative scheduler. C code is synchronous; Node's event loop is
// asynchronous. The EventLoop class bridges the two:
//
//   1. addTimer(ms, fn)            — POSIX itimer / setTimeout equivalent.
//   2. addFdWatch(fd, events, fn)  — POSIX poll()/select() fd-readiness.
//   3. addSignal(sig, fn)          — POSIX signal delivery (SIGALRM, SIGINT, ...).
//   4. run(opts) / stop()          — top-level drive.
//
// The loop MUST cooperate with the SharedArrayBuffer + Atomics.wait bridges
// landed in Round 31: when translated C blocks on a socket or pthread, it
// spins on Atomics.wait, which is event-loop-unfriendly. The pump() method
// exposes a synchronous-looking drain that runs due timers and fd callbacks
// inline so blocking code can make progress before returning to the caller.
//
// Specification references:
//   * POSIX.1-2017 <poll.h>, <sys/select.h>, <signal.h>, §setitimer.
//   * Node 'timers', 'net.Socket' readable/writable events.
//   * ECMAScript §27.6 (Job and Job Queues / event loop semantics).
//
// Design constraints:
//   * MUST work in both Node and browser (browser path: no fd-watch backing
//     — poll() degenerates to timer-only).
//   * MUST NOT retain the Node event loop alive on its own (every timer is
//     unref'd on Node).
//   * MUST be cancellable — stop() tears down all timers + fd watches.
//   * Timer ordering: strictly by absolute expiry time, ties broken by
//     insertion order (FIFO), matching POSIX itimer ordering.
//   * Signal integration: addSignal() appends to the Mirage SignalRegistry
//     if one is passed, else installs its own Map-backed dispatcher.

import {
  SignalRegistry, SIGALRM, SIGINT, SIGTERM,
  type SignalHandler,
} from "../signal/signal.js";

// -----------------------------------------------------------------------------
// Event kinds for addFdWatch — mirrors POSIX <poll.h>.
// -----------------------------------------------------------------------------
export const POLLIN  = 0x0001; // data to read
export const POLLPRI = 0x0002; // urgent data
export const POLLOUT = 0x0004; // writable
export const POLLERR = 0x0008; // error
export const POLLHUP = 0x0010; // peer hung up
export const POLLNVAL = 0x0020; // invalid fd

// select() / poll() deadline sentinels.
export const POLL_INFINITE = -1;
export const POLL_POLL_ONLY = 0;

// -----------------------------------------------------------------------------
// Handles returned by add* so callers can cancel.
// -----------------------------------------------------------------------------
export interface TimerHandle {
  readonly id: number;
  cancel(): void;
}

export interface FdWatchHandle {
  readonly id: number;
  cancel(): void;
}

export interface SignalHandle {
  readonly id: number;
  cancel(): void;
}

// -----------------------------------------------------------------------------
// Internal record shapes.
// -----------------------------------------------------------------------------
interface TimerRec {
  id: number;
  fireAt: number;       // absolute epoch-ms.
  intervalMs: number;   // 0 => one-shot.
  fn: () => void;
  cancelled: boolean;
}

interface FdWatchRec {
  id: number;
  fd: number;
  events: number;       // bitmask of POLL* the caller cares about.
  fn: (revents: number) => void;
  cancelled: boolean;
  /** Cached readiness — pump() fills this from the fd-readiness source. */
  revents: number;
}

interface SignalRec {
  id: number;
  sig: number;
  fn: SignalHandler;
  cancelled: boolean;
}

/**
 * Pluggable fd-readiness probe. The default probe returns 0 (no readiness)
 * so poll()/select() with no external backend degenerates to timer-only
 * behaviour. Callers that want real socket or pipe readiness (e.g. Mirage
 * in-process loopback stack, Node bridges) can register a probe.
 *
 * The probe is called each pump() iteration with the list of watched
 * (fd, events) pairs and must return a map of `fd -> revents` bits.
 */
export type FdReadinessProbe = (watches: ReadonlyArray<{ fd: number; events: number }>) =>
  ReadonlyMap<number, number> | null | undefined;

/**
 * EventLoop — cooperative top-level scheduler for translated C programs.
 *
 * Lifecycle:
 *   const loop = new EventLoop();
 *   loop.addTimer(...); loop.addFdWatch(...); loop.addSignal(...);
 *   loop.run({ until: ... });
 *
 * Or, for embedded cooperation with Atomics.wait-backed blocking C code:
 *   while (!done) {
 *     loop.pump({ maxMs: 10 });   // drain timers / fd readiness.
 *     // ... C code does its blocking Atomics.wait ...
 *   }
 */
export class EventLoop {
  private timers: Map<number, TimerRec> = new Map();
  private fdWatches: Map<number, FdWatchRec> = new Map();
  private sigWatches: Map<number, SignalRec> = new Map();
  private nextId: number = 1;
  private stopped: boolean = false;
  private running: boolean = false;
  private probe: FdReadinessProbe | null = null;
  private readonly reg: SignalRegistry | null;

  /** Optional binding to a SignalRegistry so addSignal() integrates with
   *  Mirage's sigaction/alarm machinery. If null, signals use a local map. */
  constructor(reg: SignalRegistry | null = null) {
    this.reg = reg;
  }

  /** Register a fd-readiness probe. Replaces any prior probe. */
  setFdReadinessProbe(probe: FdReadinessProbe | null): void {
    this.probe = probe;
  }

  /** Node-style setTimeout/setInterval wrapper. `ms` may be 0 (ASAP). */
  addTimer(ms: number, fn: () => void, opts?: { interval?: number }): TimerHandle {
    const id = this.nextId++;
    const rec: TimerRec = {
      id,
      fireAt: Date.now() + Math.max(0, ms),
      intervalMs: opts?.interval && opts.interval > 0 ? opts.interval : 0,
      fn,
      cancelled: false,
    };
    this.timers.set(id, rec);
    return {
      id,
      cancel: () => {
        rec.cancelled = true;
        this.timers.delete(id);
      },
    };
  }

  /** POSIX poll()-style fd-readiness watcher. `events` is a POLL* bitmask. */
  addFdWatch(fd: number, events: number, fn: (revents: number) => void): FdWatchHandle {
    const id = this.nextId++;
    const rec: FdWatchRec = {
      id, fd, events, fn, cancelled: false, revents: 0,
    };
    this.fdWatches.set(id, rec);
    return {
      id,
      cancel: () => {
        rec.cancelled = true;
        this.fdWatches.delete(id);
      },
    };
  }

  /** POSIX signal()/sigaction() integration. If a SignalRegistry was passed
   *  to the ctor, the handler is installed there; otherwise it's kept local. */
  addSignal(sig: number, fn: SignalHandler): SignalHandle {
    const id = this.nextId++;
    const rec: SignalRec = { id, sig, fn, cancelled: false };
    this.sigWatches.set(id, rec);
    if (this.reg) {
      // Chain onto existing handler so multiple loops on one registry all
      // receive the signal. The registry itself stores one handler per sig;
      // we compose so the new handler calls the prior one after its own work.
      const prev = this.reg.get(sig);
      const composed: SignalHandler = (s) => {
        try { fn(s); } finally { if (prev) prev(s); }
      };
      this.reg.register(sig, composed);
    }
    return {
      id,
      cancel: () => {
        rec.cancelled = true;
        this.sigWatches.delete(id);
      },
    };
  }

  /**
   * Synchronously deliver a signal through this loop. Mirrors raise(sig):
   * fires every non-cancelled SignalRec bound to sig.
   */
  deliverSignal(sig: number): void {
    for (const rec of this.sigWatches.values()) {
      if (rec.cancelled) continue;
      if (rec.sig === sig) {
        try { rec.fn(sig); } catch { /* isolate handler errors */ }
      }
    }
  }

  /**
   * Pump a single iteration: fire all due timers, probe fd readiness once,
   * and deliver any fd callbacks that fired. Returns the number of callbacks
   * that ran this pump. Does NOT wait for future work to become ready.
   *
   * Use this from inside synchronous C code that blocks on Atomics.wait —
   * call pump() between wait iterations so timers and fd callbacks get a
   * chance to run without needing a real Node event-loop turn.
   */
  pump(opts: { maxMs?: number } = {}): number {
    let ran = 0;
    const deadline = opts.maxMs !== undefined ? Date.now() + opts.maxMs : Infinity;

    // 1. Fire expired timers.
    const now = Date.now();
    const due: TimerRec[] = [];
    for (const rec of this.timers.values()) {
      if (rec.cancelled) continue;
      if (rec.fireAt <= now) due.push(rec);
    }
    // POSIX ordering: by fireAt asc, ties by id asc (insertion order).
    due.sort((a, b) => (a.fireAt - b.fireAt) || (a.id - b.id));
    for (const rec of due) {
      if (rec.cancelled) continue;
      try { rec.fn(); } catch { /* isolate */ }
      ran++;
      if (rec.intervalMs > 0) {
        rec.fireAt = Date.now() + rec.intervalMs;
      } else {
        this.timers.delete(rec.id);
      }
      if (Date.now() >= deadline) return ran;
    }

    // 2. Probe fd readiness.
    if (this.probe && this.fdWatches.size > 0) {
      const snapshot: { fd: number; events: number }[] = [];
      for (const rec of this.fdWatches.values()) {
        if (rec.cancelled) continue;
        snapshot.push({ fd: rec.fd, events: rec.events });
      }
      let readiness: ReadonlyMap<number, number> | null | undefined;
      try { readiness = this.probe(snapshot); } catch { readiness = null; }
      if (readiness && readiness.size > 0) {
        for (const rec of this.fdWatches.values()) {
          if (rec.cancelled) continue;
          const r = readiness.get(rec.fd);
          if (r === undefined) continue;
          // Mask by requested events, but POLLERR/POLLHUP/POLLNVAL always pass.
          const always = POLLERR | POLLHUP | POLLNVAL;
          const masked = (r & (rec.events | always));
          if (masked === 0) continue;
          rec.revents = masked;
          try { rec.fn(masked); } catch { /* isolate */ }
          ran++;
          if (Date.now() >= deadline) return ran;
        }
      }
    }

    return ran;
  }

  /**
   * Drive the loop until `stop()` is called, an optional `until` predicate
   * returns true, or `timeoutMs` elapses. Returns when the loop is idle AND
   * one of the stop conditions is met.
   *
   * This is a cooperative run: each iteration is a pump() + a short sleep
   * (backoff up to 10ms or the nearest timer deadline, whichever is sooner).
   * Callers that want microsecond-precision timers should prefer pump()
   * from within their own tight loop.
   */
  run(opts: { until?: () => boolean; timeoutMs?: number; maxIterations?: number } = {}): void {
    this.running = true;
    this.stopped = false;
    const runDeadline = opts.timeoutMs !== undefined ? Date.now() + opts.timeoutMs : Infinity;
    let iter = 0;
    try {
      while (!this.stopped) {
        if (opts.until && opts.until()) break;
        if (Date.now() >= runDeadline) break;
        if (opts.maxIterations !== undefined && iter >= opts.maxIterations) break;

        this.pump();

        if (this.timers.size === 0 && this.fdWatches.size === 0) break;

        // Compute sleep-until: min timer deadline, capped at 10ms.
        let nextFire = Date.now() + 10;
        for (const rec of this.timers.values()) {
          if (rec.cancelled) continue;
          if (rec.fireAt < nextFire) nextFire = rec.fireAt;
        }
        const waitMs = Math.max(0, Math.min(10, nextFire - Date.now()));
        if (waitMs > 0) this.sleepSync(waitMs);
        iter++;
      }
    } finally {
      this.running = false;
    }
  }

  /** Request the loop to stop after the current pump completes. */
  stop(): void {
    this.stopped = true;
  }

  /** True while inside a run() call. */
  isRunning(): boolean { return this.running; }

  /**
   * Tear down: cancel every registered timer, fd watch, and signal binding.
   * Safe to call after stop() to release resources immediately.
   */
  shutdown(): void {
    this.stopped = true;
    for (const rec of this.timers.values()) rec.cancelled = true;
    this.timers.clear();
    for (const rec of this.fdWatches.values()) rec.cancelled = true;
    this.fdWatches.clear();
    for (const rec of this.sigWatches.values()) rec.cancelled = true;
    this.sigWatches.clear();
    this.probe = null;
  }

  /** Snapshot for diagnostics / tests. */
  stats(): { timers: number; fdWatches: number; signals: number } {
    return {
      timers: this.timers.size,
      fdWatches: this.fdWatches.size,
      signals: this.sigWatches.size,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers.
  // ---------------------------------------------------------------------------

  /**
   * Synchronous sleep for `ms` milliseconds. Uses Atomics.wait on a throwaway
   * SharedArrayBuffer when available (Node main thread + worker threads) so
   * the event loop cooperates with Round-31 blocking bridges. Falls back to
   * a spin-loop in environments without SAB (bare browser main thread).
   */
  private sleepSync(ms: number): void {
    if (ms <= 0) return;
    const g = globalThis as { SharedArrayBuffer?: SharedArrayBufferConstructor; Atomics?: typeof Atomics };
    if (g.SharedArrayBuffer && g.Atomics && typeof g.Atomics.wait === "function") {
      try {
        const sab = new g.SharedArrayBuffer(4);
        const ia = new Int32Array(sab);
        g.Atomics.wait(ia, 0, 0, ms);
        return;
      } catch {
        /* fall through to spin */
      }
    }
    const end = Date.now() + ms;
    while (Date.now() < end) { /* spin */ }
  }
}

// -----------------------------------------------------------------------------
// Module-level default loop — translated C code that doesn't explicitly build
// a loop can import this and route poll()/select() through it. Lazy init.
// -----------------------------------------------------------------------------

let _defaultLoop: EventLoop | null = null;

/** Lazy accessor for the process-wide default EventLoop. */
export function getDefaultEventLoop(): EventLoop {
  if (_defaultLoop === null) _defaultLoop = new EventLoop();
  return _defaultLoop;
}

/** Test-only: clear the default loop. */
export function _resetDefaultEventLoop(): void {
  if (_defaultLoop !== null) _defaultLoop.shutdown();
  _defaultLoop = null;
}

// -----------------------------------------------------------------------------
// POSIX poll() / select() convenience routing. These are standalone helpers
// that translated C code can call instead of the inline shim in
// self-modifying-loop.ts. They route fd-readiness through the default event
// loop's FdReadinessProbe so a single pluggable backend services all poll/
// select calls in a TU.
//
// NOTE: the inline shims in self-modifying-loop.ts remain — they keep the
// zero-import translated TS self-contained. These helpers are for translated
// code that opts into the posix-runtime event-loop explicitly (e.g. via
// `import { pollViaLoop } from 'posix-runtime';`).
// -----------------------------------------------------------------------------

/**
 * POSIX poll(fds, nfds, timeout) routed through the default event loop.
 * `fds[i]` is `{ fd, events, revents }` (numeric members).
 *
 * Timeout semantics (POSIX.1-2017 <poll.h>):
 *   * timeout > 0 : block at most `timeout` ms.
 *   * timeout == 0: no wait (poll-only).
 *   * timeout < 0 : infinite wait.
 */
export function pollViaLoop(
  fds: Array<{ fd: number; events: number; revents: number }>,
  nfds: number,
  timeout: number,
): number {
  const loop = getDefaultEventLoop();
  const deadline = timeout < 0 ? Infinity : Date.now() + timeout;
  let ready = 0;
  // Set all revents=0 first per POSIX.
  for (let i = 0; i < nfds; i++) {
    if (fds[i]) fds[i].revents = 0;
  }
  // Drive the probe until something is ready or deadline hits.
  do {
    loop.pump();
    // Ask probe directly (synchronous readiness check).
    // We synthesise a one-shot probe call via pump by injecting temporary
    // watches, collecting their revents, then tearing them down.
    const handles: FdWatchHandle[] = [];
    const hits = new Map<number, number>();
    for (let i = 0; i < nfds; i++) {
      const f = fds[i];
      if (!f) continue;
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      const h = loop.addFdWatch(f.fd, f.events, (rev) => { hits.set(f.fd, rev); });
      handles.push(h);
    }
    loop.pump();
    for (let i = 0; i < nfds; i++) {
      const f = fds[i];
      if (!f) continue;
      const r = hits.get(f.fd);
      if (r !== undefined && r !== 0) {
        f.revents = r;
        ready++;
      }
    }
    for (const h of handles) h.cancel();
    if (ready > 0) return ready;
    if (Date.now() >= deadline) return 0;
    // Sleep briefly before next probe.
    const waitMs = Math.max(0, Math.min(10, deadline - Date.now()));
    if (waitMs > 0) {
      const g = globalThis as { SharedArrayBuffer?: SharedArrayBufferConstructor; Atomics?: typeof Atomics };
      if (g.SharedArrayBuffer && g.Atomics && typeof g.Atomics.wait === "function") {
        try {
          const sab = new g.SharedArrayBuffer(4);
          g.Atomics.wait(new Int32Array(sab), 0, 0, waitMs);
        } catch { /* fall through */ }
      }
    }
  } while (Date.now() < deadline);
  return 0;
}

/**
 * POSIX select() routed through the default event loop. Returns the number
 * of fds ready across read/write/except sets.
 *
 * `readfds`/`writefds`/`exceptfds` may be null. When non-null they should
 * expose `.bits` (bitmask over fd numbers 0..nfds-1) per the inline fd_set
 * shape used by the translated runtime.
 */
export function selectViaLoop(
  nfds: number,
  readfds: { bits: number } | null,
  writefds: { bits: number } | null,
  exceptfds: { bits: number } | null,
  timeout: { tv_sec: number; tv_usec: number } | null,
): number {
  const timeoutMs = timeout === null
    ? -1
    : timeout.tv_sec * 1000 + Math.floor((timeout.tv_usec ?? 0) / 1000);
  const fds: Array<{ fd: number; events: number; revents: number }> = [];
  for (let fd = 0; fd < nfds; fd++) {
    let events = 0;
    if (readfds && ((readfds.bits >>> fd) & 1)) events |= POLLIN;
    if (writefds && ((writefds.bits >>> fd) & 1)) events |= POLLOUT;
    if (exceptfds && ((exceptfds.bits >>> fd) & 1)) events |= POLLPRI;
    if (events !== 0) fds.push({ fd, events, revents: 0 });
  }
  const n = pollViaLoop(fds, fds.length, timeoutMs);
  // Project revents back into the bitmasks.
  if (readfds) readfds.bits = 0;
  if (writefds) writefds.bits = 0;
  if (exceptfds) exceptfds.bits = 0;
  for (const f of fds) {
    if (f.revents & POLLIN && readfds) readfds.bits |= (1 << f.fd);
    if (f.revents & POLLOUT && writefds) writefds.bits |= (1 << f.fd);
    if (f.revents & POLLPRI && exceptfds) exceptfds.bits |= (1 << f.fd);
  }
  return n;
}

// -----------------------------------------------------------------------------
// Aliases so callers that think in ECMAScript §27.6 terms have a familiar
// nomenclature: a "job" is a microtask queued on the default loop.
// -----------------------------------------------------------------------------

/** Queue a microtask-like callback on the default loop (0-ms timer). */
export function queueLoopJob(fn: () => void): TimerHandle {
  return getDefaultEventLoop().addTimer(0, fn);
}
