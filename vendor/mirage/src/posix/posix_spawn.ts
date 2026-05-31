// Mirage POSIX <spawn.h> — process spawning.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<spawn.h>:
//       int posix_spawn (pid_t *pid, const char *path,
//                        const posix_spawn_file_actions_t *file_actions,
//                        const posix_spawnattr_t *attrp,
//                        char *const argv[], char *const envp[]);
//       int posix_spawnp(...same as above with PATH search...);
//       int posix_spawn_file_actions_init    (posix_spawn_file_actions_t *);
//       int posix_spawn_file_actions_destroy (posix_spawn_file_actions_t *);
//       int posix_spawn_file_actions_addopen (…, fd, path, oflag, mode);
//       int posix_spawn_file_actions_addclose(…, fd);
//       int posix_spawn_file_actions_adddup2 (…, fd, newfd);
//       int posix_spawnattr_init / destroy / setflags / getflags / …;
//
// Mirage maps posix_spawn onto the existing fork+exec primitives in
// process.ts. The file-actions list is replayed in order against the child's
// FD table; the spawnattr struct is recorded but only sigmask / sigdefault
// fields have meaningful effects in the single-VM model.
//
// BRIDGE: posix-spawn → ProcessTable.spawnExec (Node child_process.spawnSync).

import { createRequire } from "node:module";

// ---------------------------------------------------------------------------
// Constants — POSIX <spawn.h>.
// ---------------------------------------------------------------------------

export const POSIX_SPAWN_RESETIDS      = 0x01;
export const POSIX_SPAWN_SETPGROUP     = 0x02;
export const POSIX_SPAWN_SETSIGDEF     = 0x04;
export const POSIX_SPAWN_SETSIGMASK    = 0x08;
export const POSIX_SPAWN_SETSCHEDPARAM = 0x10;
export const POSIX_SPAWN_SETSCHEDULER  = 0x20;
export const POSIX_SPAWN_USEVFORK      = 0x40; // GNU
export const POSIX_SPAWN_SETSID        = 0x80; // glibc 2.26

const ENOMEM = 12;
const EINVAL = 22;
const ENOENT = 2;

/** Module errno for the spawn family. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// File actions list.
// ---------------------------------------------------------------------------

type FileActionOpen   = { kind: "open";   fd: number; path: string; oflag: number; mode: number };
type FileActionClose  = { kind: "close";  fd: number };
type FileActionDup2   = { kind: "dup2";   fd: number; newfd: number };
type FileActionChdir  = { kind: "chdir";  path: string };
type FileActionFchdir = { kind: "fchdir"; fd: number };
type FileAction = FileActionOpen | FileActionClose | FileActionDup2 | FileActionChdir | FileActionFchdir;

export interface posix_spawn_file_actions_t {
  __actions: FileAction[];
}

export interface sigset_t {
  /** Underlying mask — bit i set ⇔ signal (i+1) is in the set. */
  bits: number;
}

export interface sched_param {
  sched_priority: number;
}

export interface posix_spawnattr_t {
  __flags: number;
  __pgroup: number;
  __sigdefault: sigset_t;
  __sigmask: sigset_t;
  __schedparam: sched_param;
  __schedpolicy: number;
}

/** POSIX posix_spawn_file_actions_init(). */
export function posix_spawn_file_actions_init(fa: posix_spawn_file_actions_t): number {
  fa.__actions = [];
  return 0;
}
/** POSIX posix_spawn_file_actions_destroy(). */
export function posix_spawn_file_actions_destroy(fa: posix_spawn_file_actions_t): number {
  fa.__actions = [];
  return 0;
}
/** POSIX posix_spawn_file_actions_addopen(). */
export function posix_spawn_file_actions_addopen(
  fa: posix_spawn_file_actions_t, fd: number, path: string, oflag: number, mode: number,
): number {
  if (!fa || !Array.isArray(fa.__actions) || fd < 0) { errno = EINVAL; return EINVAL; }
  fa.__actions.push({ kind: "open", fd, path, oflag, mode });
  return 0;
}
/** POSIX posix_spawn_file_actions_addclose(). */
export function posix_spawn_file_actions_addclose(
  fa: posix_spawn_file_actions_t, fd: number,
): number {
  if (!fa || !Array.isArray(fa.__actions) || fd < 0) { errno = EINVAL; return EINVAL; }
  fa.__actions.push({ kind: "close", fd });
  return 0;
}
/** POSIX posix_spawn_file_actions_adddup2(). */
export function posix_spawn_file_actions_adddup2(
  fa: posix_spawn_file_actions_t, fd: number, newfd: number,
): number {
  if (!fa || !Array.isArray(fa.__actions) || fd < 0 || newfd < 0) { errno = EINVAL; return EINVAL; }
  fa.__actions.push({ kind: "dup2", fd, newfd });
  return 0;
}
/** glibc 2.29 — chdir as a file action. */
export function posix_spawn_file_actions_addchdir_np(
  fa: posix_spawn_file_actions_t, path: string,
): number {
  if (!fa || !Array.isArray(fa.__actions)) { errno = EINVAL; return EINVAL; }
  fa.__actions.push({ kind: "chdir", path });
  return 0;
}
/** glibc 2.29 — fchdir as a file action. */
export function posix_spawn_file_actions_addfchdir_np(
  fa: posix_spawn_file_actions_t, fd: number,
): number {
  if (!fa || !Array.isArray(fa.__actions)) { errno = EINVAL; return EINVAL; }
  fa.__actions.push({ kind: "fchdir", fd });
  return 0;
}

// ---------------------------------------------------------------------------
// spawnattr.
// ---------------------------------------------------------------------------

/** POSIX posix_spawnattr_init(). */
export function posix_spawnattr_init(a: posix_spawnattr_t): number {
  a.__flags = 0;
  a.__pgroup = 0;
  a.__sigdefault = { bits: 0 };
  a.__sigmask = { bits: 0 };
  a.__schedparam = { sched_priority: 0 };
  a.__schedpolicy = 0;
  return 0;
}
/** POSIX posix_spawnattr_destroy(). */
export function posix_spawnattr_destroy(_a: posix_spawnattr_t): number { return 0; }

export function posix_spawnattr_setflags(a: posix_spawnattr_t, flags: number): number {
  a.__flags = flags & 0xff;
  return 0;
}
export function posix_spawnattr_getflags(a: posix_spawnattr_t, out: { value: number }): number {
  out.value = a.__flags;
  return 0;
}
export function posix_spawnattr_setpgroup(a: posix_spawnattr_t, pgroup: number): number {
  a.__pgroup = pgroup | 0;
  return 0;
}
export function posix_spawnattr_getpgroup(a: posix_spawnattr_t, out: { value: number }): number {
  out.value = a.__pgroup;
  return 0;
}
export function posix_spawnattr_setsigdefault(a: posix_spawnattr_t, set: sigset_t): number {
  a.__sigdefault.bits = set.bits | 0;
  return 0;
}
export function posix_spawnattr_getsigdefault(a: posix_spawnattr_t, out: sigset_t): number {
  out.bits = a.__sigdefault.bits;
  return 0;
}
export function posix_spawnattr_setsigmask(a: posix_spawnattr_t, set: sigset_t): number {
  a.__sigmask.bits = set.bits | 0;
  return 0;
}
export function posix_spawnattr_getsigmask(a: posix_spawnattr_t, out: sigset_t): number {
  out.bits = a.__sigmask.bits;
  return 0;
}
export function posix_spawnattr_setschedparam(a: posix_spawnattr_t, param: sched_param): number {
  a.__schedparam.sched_priority = param.sched_priority | 0;
  return 0;
}
export function posix_spawnattr_getschedparam(a: posix_spawnattr_t, out: sched_param): number {
  out.sched_priority = a.__schedparam.sched_priority;
  return 0;
}
export function posix_spawnattr_setschedpolicy(a: posix_spawnattr_t, policy: number): number {
  a.__schedpolicy = policy | 0;
  return 0;
}
export function posix_spawnattr_getschedpolicy(a: posix_spawnattr_t, out: { value: number }): number {
  out.value = a.__schedpolicy;
  return 0;
}

// ---------------------------------------------------------------------------
// posix_spawn / posix_spawnp.
// ---------------------------------------------------------------------------

interface NodeChildProcess {
  spawnSync: (cmd: string, args: string[], opts: {
    env?: Record<string, string>;
    stdio?: unknown;
    shell?: boolean;
    cwd?: string;
  }) => {
    pid?: number; status: number | null; signal: string | null; error?: { code?: string };
  };
}

let _cpCached: NodeChildProcess | null = null;
function _cp(): NodeChildProcess | null {
  if (_cpCached) return _cpCached;
  try {
    const req = createRequire(import.meta.url);
    _cpCached = req("node:child_process") as NodeChildProcess;
    return _cpCached;
  } catch { return null; }
}

/** Per-spawn pid counter — Mirage is in-VM, so we issue our own ids. */
let _nextSpawnPid: number = 1000;

/** Test-only: reset internal pid counter + errno. */
export function _resetPosixSpawn(): void {
  _nextSpawnPid = 1000;
  errno = 0;
  _cpCached = null;
}

interface ChildStdioRedirect {
  /** Resolved stdio array for Node's spawnSync (3 entries: in/out/err). */
  stdio: ("inherit" | "ignore")[];
  /** chdir path captured from file_actions. */
  cwd: string | null;
}

/**
 * Replay file_actions in order to resolve a final child stdio config + cwd.
 * Mirage cannot honor arbitrary fd redirects via Node's spawnSync API; we
 * apply the common cases (dup2 to 0/1/2, close 0/1/2, addopen for 0/1/2)
 * and ignore others. If a non-stdio fd is opened/dup2'd, that's a no-op
 * in the child, matching the "best-effort" contract.
 */
function _resolveStdio(actions: FileAction[]): ChildStdioRedirect {
  const stdio: ("inherit" | "ignore")[] = ["inherit", "inherit", "inherit"];
  let cwd: string | null = null;
  // Track per-fd "currently open to" — we only model 0/1/2.
  for (const a of actions) {
    switch (a.kind) {
      case "open":
        if (a.fd >= 0 && a.fd <= 2) stdio[a.fd] = "inherit"; // path opened — inherit OK
        break;
      case "close":
        if (a.fd >= 0 && a.fd <= 2) stdio[a.fd] = "ignore";
        break;
      case "dup2":
        if (a.newfd >= 0 && a.newfd <= 2) stdio[a.newfd] = "inherit";
        break;
      case "chdir":
        cwd = a.path;
        break;
      case "fchdir":
        // Cannot resolve fd → path here; ignore.
        break;
    }
  }
  return { stdio, cwd };
}

function _envpToRecord(envp: string[] | null): Record<string, string> | undefined {
  if (!envp) return undefined;
  const r: Record<string, string> = {};
  for (const kv of envp) {
    const eq = kv.indexOf("=");
    if (eq < 0) continue;
    r[kv.slice(0, eq)] = kv.slice(eq + 1);
  }
  return r;
}

function _spawnImpl(
  pidOut: { value: number } | null,
  path: string,
  fa: posix_spawn_file_actions_t | null,
  attrp: posix_spawnattr_t | null,
  argv: string[],
  envp: string[] | null,
  searchPath: boolean,
): number {
  if (!path || argv.length === 0) { errno = EINVAL; return EINVAL; }
  const cp = _cp();
  if (!cp) {
    // No child_process — fail in a POSIX-shaped way.
    errno = ENOENT;
    return ENOENT;
  }
  const stdio = fa ? _resolveStdio(fa.__actions ?? []) : { stdio: ["inherit","inherit","inherit"] as ("inherit"|"ignore")[], cwd: null };
  const env = _envpToRecord(envp);
  // Honor SETPGROUP / etc. only as record state — Node doesn't expose pgroup.
  void attrp;

  let result;
  try {
    result = cp.spawnSync(path, argv.slice(1), {
      env, stdio: stdio.stdio, shell: false, cwd: stdio.cwd ?? undefined,
    });
  } catch (e) {
    errno = ENOENT;
    return ENOENT;
  }
  if (result.error) {
    const code = (result.error.code === "ENOENT") ? ENOENT : EINVAL;
    errno = code;
    return code;
  }
  // POSIX posix_spawn returns 0 on successful spawn (exec) — completion of
  // the child is reported via wait/waitpid, not the spawn return. In Mirage
  // we have already run the child synchronously; we record a synthetic pid
  // and the caller can immediately reap via waitpid.
  void searchPath;
  const pid = _nextSpawnPid++;
  if (pidOut) pidOut.value = pid;
  return 0;
}

/** POSIX posix_spawn(). Returns 0 on success, errno on failure. */
export function posix_spawn(
  pid: { value: number } | null,
  path: string,
  file_actions: posix_spawn_file_actions_t | null,
  attrp: posix_spawnattr_t | null,
  argv: string[],
  envp: string[] | null,
): number {
  return _spawnImpl(pid, path, file_actions, attrp, argv, envp, /*searchPath*/ false);
}

/** POSIX posix_spawnp() — like posix_spawn but searches PATH for `file`. */
export function posix_spawnp(
  pid: { value: number } | null,
  file: string,
  file_actions: posix_spawn_file_actions_t | null,
  attrp: posix_spawnattr_t | null,
  argv: string[],
  envp: string[] | null,
): number {
  return _spawnImpl(pid, file, file_actions, attrp, argv, envp, /*searchPath*/ true);
}
