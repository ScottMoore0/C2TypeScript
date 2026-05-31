// MC-5 / MC-T2-Process: POSIX <unistd.h> + <sys/wait.h> — IEEE Std 1003.1-2017.
//
// Mirage runs translated C programs in a single JS VM. True fork() (which
// duplicates the entire address space as a new OS process) is not
// representable in JS without spawning a Worker + SharedArrayBuffer-backed
// copy of the translated heap. We provide both paths:
//
//   1. A *synchronous pragmatic* fork via `ProcessTable.forkSync(childFn)` —
//      the caller supplies a closure that is executed immediately as the
//      "child" with a new PID, its exit status is captured, and the parent
//      continuation resumes. This is what translated `if (fork() == 0)`
//      blocks map onto when a spec-equivalent Worker bootstrap is
//      infeasible.
//   2. A Worker-thread fork via `ProcessTable.forkWorker(url, argv, env)` —
//      spawns a Node `worker_threads.Worker` running the target program and
//      registers the worker's exit code. Available where `node:worker_threads`
//      and SAB are supported. When unavailable, returns -1.
//
// Both paths share a single `ProcessTable` which allocates PIDs, records
// parent-child relationships, status words, and delivers SIGCHLD when a
// child terminates (into the parent's SignalRegistry if wired).
//
// wait / waitpid / waitid semantics are implemented as non-blocking reaps
// (the only shape that works without true blocking in single-threaded JS).
// `ProcessTable.waitpid(-1, WNOHANG)` is the universal-support case, and
// translated C programs that loop `while (waitpid(-1, &st, 0) > 0)` work
// because every forked child has already reached completion (synchronous
// fork) or its exit was recorded (worker fork) by the time the parent's next
// tick runs.

// ----------------------------------------------------------------------------
// <sys/wait.h> macros — IEEE Std 1003.1-2017.
// Status word layout (Linux ABI, also what musl exposes):
//   bits 0..6   = signal number (if terminated by signal)
//   bit  7      = core dumped flag (ignored)
//   bits 8..15  = exit status (if exited normally)
//   low7 == 0       -> exited normally, WEXITSTATUS = (st >> 8) & 0xff
//   low7 in 1..126  -> terminated by signal WTERMSIG = low7
//   low7 == 0x7f    -> stopped, WSTOPSIG = (st >> 8) & 0xff
//   st == 0xffff    -> continued (for WCONTINUED)
// ----------------------------------------------------------------------------

export function W_EXITCODE(ret: number, sig: number): number {
  return ((ret & 0xff) << 8) | (sig & 0x7f);
}

export function WIFEXITED(status: number): boolean {
  return (status & 0x7f) === 0;
}
export function WEXITSTATUS(status: number): number {
  return (status >> 8) & 0xff;
}
export function WIFSIGNALED(status: number): boolean {
  const low = status & 0x7f;
  return low !== 0 && low !== 0x7f && status !== 0xffff;
}
export function WTERMSIG(status: number): number {
  return status & 0x7f;
}
export function WIFSTOPPED(status: number): boolean {
  return (status & 0xff) === 0x7f;
}
export function WSTOPSIG(status: number): number {
  return (status >> 8) & 0xff;
}
export function WIFCONTINUED(status: number): boolean {
  return status === 0xffff;
}
export function WCOREDUMP(status: number): boolean {
  return (status & 0x80) !== 0;
}

// options for waitpid() — IEEE Std 1003.1-2017 §<sys/wait.h>.
export const WNOHANG    = 1;
export const WUNTRACED  = 2;
export const WCONTINUED = 8;

// idtype_t for waitid() — IEEE Std 1003.1-2017 §waitid.
export const P_ALL  = 0;
export const P_PID  = 1;
export const P_PGID = 2;

// siginfo_t-ish code values for waitid() si_code.
export const CLD_EXITED    = 1;
export const CLD_KILLED    = 2;
export const CLD_DUMPED    = 3;
export const CLD_TRAPPED   = 4;
export const CLD_STOPPED   = 5;
export const CLD_CONTINUED = 6;

/** Throwable used by `exit()` / `_exit()` / `abort()` to unwind the caller. */
export class ProcessExitSignal extends Error {
  constructor(public readonly code: number) {
    super(`process exited with code ${code}`);
    this.name = "ProcessExitSignal";
  }
}

/** Reason a child terminated — drives status-word encoding + SIGCHLD si_code. */
export type ExitReason =
  | { kind: "exited";    code: number }
  | { kind: "signaled";  sig:  number }
  | { kind: "stopped";   sig:  number }
  | { kind: "continued" };

export function reasonToStatus(r: ExitReason): number {
  switch (r.kind) {
    case "exited":    return W_EXITCODE(r.code, 0);
    case "signaled":  return (r.sig & 0x7f);
    case "stopped":   return ((r.sig & 0xff) << 8) | 0x7f;
    case "continued": return 0xffff;
  }
}

/** siginfo_t subset that waitid() fills in — POSIX §<sys/wait.h>. */
export interface SigInfoWait {
  si_pid: number;
  si_uid: number;
  si_signo: number;      // always SIGCHLD
  si_status: number;     // exit code or signal
  si_code: number;       // CLD_EXITED | CLD_KILLED | ...
}

/** struct rusage — BSD/Linux <sys/resource.h>. Filled by wait4 / getrusage.
 *  Mirage doesn't track per-process accounting, so all fields are zero. */
export interface RUsage {
  ru_utime: { tv_sec: number; tv_usec: number };
  ru_stime: { tv_sec: number; tv_usec: number };
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

/** Per-process record. */
export interface ProcessRecord {
  pid: number;
  ppid: number;
  argv: string[];
  env: Record<string, string>;
  /** Most-recent exit reason, or null if still running. */
  reason: ExitReason | null;
  /** True once the parent has reaped this process via wait/waitpid/waitid. */
  reaped: boolean;
  /** Worker handle if this record was spawned via forkWorker. */
  worker?: { terminate: () => void };
}

/**
 * Process exit table + PID allocator — shared across all translated-C
 * "processes" in the current JS VM. One per Mirage OS instance.
 */
export class ProcessTable {
  private records: Map<number, ProcessRecord> = new Map();
  private nextPid: number = 2;
  /** Callback delivered when a child's exit record is created (SIGCHLD wire). */
  onChildExit: ((parent: ProcessRecord, child: ProcessRecord) => void) | null = null;

  constructor(private self: ProcessRecord) {
    this.records.set(self.pid, self);
  }

  /** Pseudo-unique PID allocator. POSIX: kernel picks; we use monotonic. */
  allocPid(): number {
    const p = this.nextPid++;
    return p;
  }

  /** Look up a record by PID. */
  get(pid: number): ProcessRecord | null {
    return this.records.get(pid) ?? null;
  }

  /** All recorded (running or zombie) children of `ppid`. */
  childrenOf(ppid: number): ProcessRecord[] {
    const out: ProcessRecord[] = [];
    for (const r of this.records.values()) {
      if (r.ppid === ppid && r.pid !== ppid) out.push(r);
    }
    return out;
  }

  /** The root (self) record. */
  get selfRec(): ProcessRecord { return this.self; }

  /**
   * Pragmatic fork — runs `childFn` synchronously as the child, records
   * its exit reason, and returns two distinct results depending on which
   * "side" sees the return value.
   *
   * In translated C, the caller wires this up as:
   *
   *   const forkCtx = {}; // captures child pid for parent
   *   const isChild = table.forkSync((childPid) => {
   *     // child body runs with childPid recorded
   *   });
   *
   * Returns the child's PID (parent semantics) or 0 (child semantics) via
   * the two-shot return convention: the caller implements both sides with
   * a boolean-gated shape.
   *
   * Returns child pid on success, -1 on failure (e.g. childFn threw before
   * any code ran).
   */
  forkSync(childFn: (childPid: number) => void): number {
    const pid = this.allocPid();
    const child: ProcessRecord = {
      pid,
      ppid: this.self.pid,
      argv: [...this.self.argv],
      env:  { ...this.self.env  },
      reason: null,
      reaped: false,
    };
    this.records.set(pid, child);
    // Swap the table's "self" view to the child for the duration of childFn
    // so that any calls into Process._exit() / exit() / markExited mark the
    // child record, not the parent. Restore on exit.
    const savedSelf = this.self;
    this.self = child;
    try {
      childFn(pid);
      if (child.reason === null) child.reason = { kind: "exited", code: 0 };
    } catch (e) {
      if (e instanceof ProcessExitSignal) {
        child.reason = { kind: "exited", code: e.code };
      } else {
        // Non-exit throw — treat as SIGABRT.
        child.reason = { kind: "signaled", sig: 6 /*SIGABRT*/ };
      }
    } finally {
      this.self = savedSelf;
    }
    if (this.onChildExit) this.onChildExit(this.self, child);
    return pid;
  }

  /**
   * Worker-thread fork. Spawns a Node worker_threads.Worker running the
   * module at `moduleUrl` with {argv, env} via workerData. Registers an
   * exit listener that stores the status word on the record.
   *
   * Returns the new PID on success. Returns -1 if worker_threads is not
   * available (browser/Deno without the module).
   */
  forkWorker(moduleUrl: string, argv: string[], env: Record<string, string>): number {
    // Dynamic import so non-Node environments don't fail at module-init.
    let WorkerCtor: typeof import("node:worker_threads").Worker | null = null;
    try {
      // Use createRequire fallback — top-level await is not available in CJS
      // downstream. Fall back to globalThis.Worker if present.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const wt = (globalThis as unknown as { require?: (s: string) => unknown }).require?.("node:worker_threads")
        ?? (globalThis as unknown as { __nodeWorkerThreads?: unknown }).__nodeWorkerThreads;
      if (wt && typeof (wt as { Worker?: unknown }).Worker === "function") {
        WorkerCtor = (wt as { Worker: typeof import("node:worker_threads").Worker }).Worker;
      }
    } catch {
      WorkerCtor = null;
    }
    if (!WorkerCtor) {
      return -1;
    }

    const pid = this.allocPid();
    const child: ProcessRecord = {
      pid,
      ppid: this.self.pid,
      argv,
      env,
      reason: null,
      reaped: false,
    };
    this.records.set(pid, child);

    const w = new WorkerCtor(moduleUrl, { workerData: { argv, env, pid } });
    child.worker = { terminate: (): void => { void w.terminate(); } };
    w.on("exit", (code: number): void => {
      if (child.reason === null) child.reason = { kind: "exited", code: code | 0 };
      if (this.onChildExit) this.onChildExit(this.self, child);
    });
    w.on("error", (): void => {
      if (child.reason === null) child.reason = { kind: "signaled", sig: 6 };
    });
    return pid;
  }

  /**
   * POSIX waitpid — IEEE Std 1003.1-2017 §waitpid.
   *
   *   pid == -1  : wait for any child
   *   pid == 0   : wait for any child in the caller's process group (modelled
   *                as "any child" in the single-pgrp Mirage model)
   *   pid  > 0   : wait for that specific child
   *   pid  < -1  : wait for any child in pgid `-pid` — modelled as "any child"
   *
   * Returns child PID on successful reap, 0 if WNOHANG and no exited child,
   * -1 on error (ECHILD / invalid pid). Writes the status word into
   * `statusOut.status` if provided.
   */
  waitpid(
    pid: number,
    statusOut: { status?: number } | null,
    options: number,
  ): number {
    const kids = this.childrenOf(this.self.pid).filter((c) => !c.reaped);
    if (kids.length === 0) return -1;

    const matches = (c: ProcessRecord): boolean => {
      if (pid === -1 || pid === 0 || pid < -1) return true;
      return c.pid === pid;
    };

    const candidates = kids.filter(matches);
    if (candidates.length === 0) return -1;

    // Pick first exited candidate (POSIX says "any one of several" — we
    // choose PID order for determinism).
    const exited = candidates.filter((c) => c.reason !== null).sort((a, b) => a.pid - b.pid);
    if (exited.length === 0) {
      // Nothing has exited yet.
      if (options & WNOHANG) return 0;
      // In the pragmatic single-JS-VM model, we cannot block. Return -1 with
      // an "EAGAIN-equivalent" caller sees. Callers that truly need blocking
      // should use the SAB+Atomics.wait path (future work).
      return 0;
    }

    const reap = exited[0];
    reap.reaped = true;
    if (statusOut) statusOut.status = reasonToStatus(reap.reason!);
    return reap.pid;
  }

  /**
   * POSIX wait — IEEE Std 1003.1-2017 §wait. Equivalent to
   * waitpid(-1, statusOut, 0).
   */
  wait(statusOut: { status?: number } | null): number {
    return this.waitpid(-1, statusOut, 0);
  }

  /**
   * POSIX waitid — IEEE Std 1003.1-2017 §waitid. Extended form that fills a
   * siginfo_t-like object rather than a packed status word.
   *
   * `idtype`: P_ALL | P_PID | P_PGID. For P_ALL, `id` is ignored.
   * Returns 0 on successful reap, -1 on error.
   */
  waitid(
    idtype: number,
    id: number,
    info: SigInfoWait,
    options: number,
  ): number {
    let pidFilter: number;
    if (idtype === P_ALL) pidFilter = -1;
    else if (idtype === P_PID) pidFilter = id;
    else if (idtype === P_PGID) pidFilter = -1; // single-pgrp model
    else return -1;

    const kids = this.childrenOf(this.self.pid).filter((c) => !c.reaped);
    if (kids.length === 0) return -1;
    const matches = (c: ProcessRecord): boolean => pidFilter === -1 ? true : c.pid === pidFilter;
    const exited = kids.filter((c) => matches(c) && c.reason !== null).sort((a, b) => a.pid - b.pid);
    if (exited.length === 0) {
      if (options & WNOHANG) {
        info.si_pid = 0;
        info.si_signo = 0;
        info.si_status = 0;
        info.si_code = 0;
        return 0;
      }
      return 0;
    }
    const reap = exited[0];
    reap.reaped = true;
    const r = reap.reason!;
    info.si_pid = reap.pid;
    info.si_uid = 1000;
    info.si_signo = 17 /*SIGCHLD*/;
    info.si_status = r.kind === "exited" ? r.code : ("sig" in r ? r.sig : 0);
    info.si_code =
      r.kind === "exited"    ? CLD_EXITED   :
      r.kind === "signaled"  ? CLD_KILLED   :
      r.kind === "stopped"   ? CLD_STOPPED  :
      r.kind === "continued" ? CLD_CONTINUED : 0;
    return 0;
  }

  /**
   * BSD/Linux wait4 — extension of waitpid that also fills a `struct rusage`
   * with the child's resource usage. Same return-value rules as waitpid().
   *
   *   pid_t wait4(pid_t pid, int *wstatus, int options, struct rusage *ru);
   *
   * The Mirage VM does not track per-process CPU time / page faults / etc.,
   * so `ru` is filled with zeros — sufficient for translated code that
   * only inspects `ru_utime` / `ru_stime` defensively. BRIDGE: posix-wait4
   * — wait4 → waitpid + zeroed rusage.
   */
  wait4(
    pid: number,
    statusOut: { status?: number } | null,
    options: number,
    rusageOut: RUsage | null,
  ): number {
    const r = this.waitpid(pid, statusOut, options);
    if (rusageOut) {
      rusageOut.ru_utime = { tv_sec: 0, tv_usec: 0 };
      rusageOut.ru_stime = { tv_sec: 0, tv_usec: 0 };
      rusageOut.ru_maxrss = 0;
      rusageOut.ru_ixrss = 0;
      rusageOut.ru_idrss = 0;
      rusageOut.ru_isrss = 0;
      rusageOut.ru_minflt = 0;
      rusageOut.ru_majflt = 0;
      rusageOut.ru_nswap = 0;
      rusageOut.ru_inblock = 0;
      rusageOut.ru_oublock = 0;
      rusageOut.ru_msgsnd = 0;
      rusageOut.ru_msgrcv = 0;
      rusageOut.ru_nsignals = 0;
      rusageOut.ru_nvcsw = 0;
      rusageOut.ru_nivcsw = 0;
    }
    return r;
  }

  /**
   * Mark the current record as exited with `code`. Used by `_exit()` / `exit()`
   * when the process has no parent wait(), and by forkSync when childFn
   * returns normally without explicit exit.
   */
  markExited(rec: ProcessRecord, code: number): void {
    if (rec.reason === null) rec.reason = { kind: "exited", code };
  }

  /**
   * Terminate a child record by signal. Used by kill() cross-process. If
   * the record has a live Worker handle, terminate it.
   */
  terminateBySignal(rec: ProcessRecord, sig: number): void {
    if (rec.reason !== null) return; // already dead
    rec.reason = { kind: "signaled", sig };
    if (rec.worker) try { rec.worker.terminate(); } catch { /* ignore */ }
  }

  // -------------------------------------------------------------------------
  // child_process bridges — POSIX exec*/system via Node `node:child_process`.
  //
  // BRIDGE: POSIX-fork-and-exec → Node child_process.spawnSync.
  //
  // True POSIX fork() (CoW address-space duplication) is not representable in
  // JavaScript: the language has no construct for "duplicate the entire VM
  // and resume both copies". The translator therefore treats the *common
  // codebase pattern* `pid = fork(); if (pid == 0) execvp(...);` (i.e.
  // fork-then-exec) as a single compound operation that maps onto Node's
  // synchronous spawn. Programs that rely on CoW state-sharing (e.g. PostgreSQL
  // shared-memory segments inherited across fork) will need additional
  // bridging via SharedArrayBuffer-backed structures; the present helpers
  // cover the spawn-subprocess subset that suffices for compiler driver
  // tools, build orchestrators, shell utilities, and `system()` calls.
  //
  // Per POSIX.1-2017 §exec, on success exec*() does not return; on failure it
  // returns -1 and sets errno. Our spawnSync-backed shape returns the child's
  // exit status (0 on success) so translated callers in the compound
  // fork-then-exec pattern can sequence wait/waitpid against it. A pure
  // exec*() call without preceding fork() will run the child to completion
  // synchronously and then propagate its status as the return value — this
  // diverges from the POSIX "process image is replaced and never returns"
  // contract but is the only honest mapping available in single-VM JS.
  // -------------------------------------------------------------------------

  /**
   * Look up `node:child_process` lazily so non-Node environments don't fail
   * at module-init.
   */
  private _loadChildProcess(): typeof import("node:child_process") | null {
    try {
      const cp = (globalThis as unknown as { require?: (s: string) => unknown }).require?.("node:child_process")
        ?? (globalThis as unknown as { __nodeChildProcess?: unknown }).__nodeChildProcess;
      if (cp && typeof (cp as { spawnSync?: unknown }).spawnSync === "function") {
        return cp as typeof import("node:child_process");
      }
    } catch { /* fallthrough */ }
    return null;
  }

  /**
   * Spawn a child process, wait for it, and record its exit reason on a new
   * ProcessRecord. POSIX.1-2017 §exec compound bridge.
   *
   * Returns the new pid on success, -1 on failure (no child_process module,
   * spawn errno, etc.).
   */
  spawnExec(
    file: string,
    argv: string[],
    env: Record<string, string> | null,
    searchPath: boolean,
  ): number {
    const cp = this._loadChildProcess();
    if (!cp) return -1;
    const pid = this.allocPid();
    const child: ProcessRecord = {
      pid,
      ppid: this.self.pid,
      argv: [...argv],
      env: env ? { ...env } : { ...this.self.env },
      reason: null,
      reaped: false,
    };
    this.records.set(pid, child);
    try {
      // POSIX execvp searches PATH; execv/execve do not. Node's spawnSync
      // honours PATH iff the file is bare (no path separator) and shell
      // is false — the default.
      const result = cp.spawnSync(file, argv.slice(1), {
        env: child.env,
        stdio: "inherit",
        shell: false,
        // execvp PATH-search: Node already does this for bare filenames.
        // For execv/execve (non-search), we require an absolute or
        // relative path; if the caller passes a bare name with searchPath
        // = false, Node will still search PATH — we accept that as a
        // benign over-approximation.
      });
      if (result.error) {
        child.reason = { kind: "exited", code: 127 /*ENOENT-ish*/ };
        if (this.onChildExit) this.onChildExit(this.self, child);
        return -1;
      }
      if (result.signal) {
        // signal name → number; default SIGTERM (15) if unknown.
        const sigMap: Record<string, number> = {
          SIGHUP: 1, SIGINT: 2, SIGQUIT: 3, SIGILL: 4, SIGTRAP: 5,
          SIGABRT: 6, SIGBUS: 7, SIGFPE: 8, SIGKILL: 9, SIGSEGV: 11,
          SIGPIPE: 13, SIGALRM: 14, SIGTERM: 15,
        };
        child.reason = { kind: "signaled", sig: sigMap[result.signal] ?? 15 };
      } else {
        child.reason = { kind: "exited", code: (result.status ?? 0) | 0 };
      }
    } catch (e) {
      child.reason = { kind: "exited", code: 127 };
    }
    if (this.onChildExit) this.onChildExit(this.self, child);
    return pid;
  }

  /**
   * POSIX system(command) — IEEE Std 1003.1-2017 §system. Runs `command`
   * via the host shell. Returns:
   *   - command == null  : non-zero iff a shell is available (always 1 here)
   *   - command != null  : a status word encodable by the wait macros
   *                        (WIFEXITED + WEXITSTATUS for normal exit,
   *                        WIFSIGNALED + WTERMSIG for signal termination).
   */
  system(command: string | null): number {
    if (command === null) return 1; // shell available
    const cp = this._loadChildProcess();
    if (!cp) return -1;
    try {
      // POSIX system() invokes /bin/sh -c <command>; on Windows, cmd /c.
      const isWin = (globalThis as unknown as { process?: { platform?: string } }).process?.platform === "win32";
      const result = isWin
        ? cp.spawnSync("cmd", ["/c", command], { stdio: "inherit", env: this.self.env })
        : cp.spawnSync("/bin/sh", ["-c", command], { stdio: "inherit", env: this.self.env });
      if (result.error) return -1;
      if (result.signal) {
        const sigMap: Record<string, number> = {
          SIGHUP: 1, SIGINT: 2, SIGQUIT: 3, SIGILL: 4, SIGABRT: 6,
          SIGKILL: 9, SIGSEGV: 11, SIGPIPE: 13, SIGTERM: 15,
        };
        return reasonToStatus({ kind: "signaled", sig: sigMap[result.signal] ?? 15 });
      }
      return reasonToStatus({ kind: "exited", code: (result.status ?? 0) | 0 });
    } catch {
      return -1;
    }
  }
}

/**
 * The Mirage in-process `Process` facade — a thin wrapper around the table's
 * self record for backwards compatibility with existing code.
 */
export class Process {
  readonly pid: number;
  ppid: number = 1;
  argv: string[] = [];
  env: Record<string, string> = {};
  exitCode: number = 0;
  exited: boolean = false;
  readonly table: ProcessTable;

  constructor(argv?: string[], env?: Record<string, string>, pid: number = 1) {
    this.pid = pid;
    if (argv) this.argv = [...argv];
    if (env)  this.env  = { ...env };
    const selfRec: ProcessRecord = {
      pid,
      ppid: this.ppid,
      argv: this.argv,
      env:  this.env,
      reason: null,
      reaped: false,
    };
    this.table = new ProcessTable(selfRec);
  }

  /** Get argc (argument count). */
  get argc(): number {
    return this.argv.length;
  }

  /**
   * Terminate the process — POSIX exit() (§exit).
   * Throws `ProcessExitSignal` so translated C `exit(n)` unwinds the caller.
   */
  exit(code: number = 0): never {
    this.exitCode = code;
    this.exited = true;
    this.table.markExited(this.table.selfRec, code);
    throw new ProcessExitSignal(code);
  }

  /**
   * POSIX _exit() — §_exit. Same behaviour as exit() in the Mirage model
   * (no atexit handlers to skip). Provided as a distinct entry-point so
   * translated code calling `_exit()` binds correctly.
   */
  _exit(code: number = 0): never { return this.exit(code); }

  /** POSIX abort() — §abort. Raises SIGABRT (signal 6), terminates with 134. */
  abort(): never {
    this.exitCode = 134; // SIGABRT default
    this.exited = true;
    this.table.markExited(this.table.selfRec, 134);
    throw new ProcessExitSignal(134);
  }

  /** Reset process state (for tests). */
  reset(): void {
    this.exitCode = 0;
    this.exited = false;
    this.table.selfRec.reason = null;
  }

  /** Fork the current process — see ProcessTable.forkSync for semantics.
   *  Returns the child PID (parent's view) to the caller. Child code runs
   *  synchronously inside childFn. */
  fork(childFn: (childPid: number) => void): number {
    return this.table.forkSync(childFn);
  }

  /** POSIX waitpid convenience — delegates to the table. */
  waitpid(pid: number, statusOut: { status?: number } | null, options: number = 0): number {
    return this.table.waitpid(pid, statusOut, options);
  }

  /** POSIX wait convenience. */
  wait(statusOut: { status?: number } | null): number {
    return this.table.wait(statusOut);
  }
}
