// Mirage POSIX file locking — fcntl(F_SETLK/F_SETLKW/F_GETLK) + flock(2).
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<fcntl.h>:
//       int fcntl(int fildes, int cmd, ...);
//     Cmds modeled here:
//       F_GETLK   — query lock state.  If the region is unlockable due to a
//                   conflicting lock, l_type / l_whence / l_start / l_len /
//                   l_pid are overwritten with the conflicting lock's
//                   description.  If the region is free, l_type is set to
//                   F_UNLCK and the other fields are unchanged.
//       F_SETLK   — set or clear an advisory lock on the region; if the
//                   request cannot be granted, returns -1 with errno =
//                   EACCES or EAGAIN.
//       F_SETLKW  — same as F_SETLK but blocks until the lock can be granted
//                   (cooperatively here — we use Atomics.wait against a SAB
//                   wakeup word with a small polling fallback).
//
//     `struct flock { short l_type; short l_whence; off_t l_start;
//                     off_t l_len; pid_t l_pid; }`.
//     l_type ∈ { F_RDLCK (shared read lock), F_WRLCK (exclusive write lock),
//                F_UNLCK (unlock) }.
//     l_whence ∈ { SEEK_SET, SEEK_CUR, SEEK_END } — same semantics as lseek.
//     A length of 0 means "to end of file" — POSIX §<fcntl.h>: "If l_len is 0,
//     the lock shall extend to the end of the file (i.e., to the largest
//     possible value)".
//     Locks are advisory and are owned by the process; closing any fd that
//     refers to the same file releases all locks the process holds on that
//     file (POSIX §<fcntl.h> "All locks associated with a file for a given
//     process shall be removed when ... any file descriptor for that file is
//     closed by that process").  We model this by anchoring locks on an
//     "inode key" (the OS-provided path / fd → inode resolver).
//
//   * BSD flock(2) (Linux man-page; not POSIX but ubiquitous):
//       int flock(int fd, int operation);
//     operation ∈ { LOCK_SH (shared), LOCK_EX (exclusive),
//                   LOCK_UN (unlock), LOCK_NB (or'd to make non-blocking) }.
//     flock locks the WHOLE file and is semantically per-OPEN-FILE-DESCRIPTION
//     on Linux (but per-process on classic BSD).  We model the per-process
//     flavour because that is what cooperative-locking userland (mail spools,
//     PID-files, sqlite-rollback-journal-style code) actually depends on.
//
// Process-local model
// -------------------
// The "process" here is the Node.js isolate.  Cross-process file locking
// across multiple Node processes would require a real OS syscall (the `flock`
// npm package wraps fcntl) and is out of scope for the Mirage in-process
// emulation.  This module provides bit-exact semantics for the common
// single-process case where translated C code uses fcntl/flock for
// cooperative locking between threads or sequential code regions, and
// degrades cleanly when used in multi-process scenarios — every cross-process
// caller would simply see no contention.
//
// Blocking semantics
// ------------------
// F_SETLKW (and flock without LOCK_NB) need to block the calling code until
// the conflicting lock is released.  Inside a single Node isolate "block" can
// only mean Atomics.wait on a SAB-backed word — that is what the concurrency
// subproject already standardised for pthread_mutex / pthread_cond / sem_wait
// etc.  We allocate one SAB-backed Int32 wakeup word per inode-key, increment
// (Atomics.add) it on every release, and let blocked waiters Atomics.wait on
// it with a 16 ms polling-fallback timeout so even non-SAB callers eventually
// retry.  This is the same pattern used by file_lock implementations in
// SQLite's WAL/rollback code over POSIX advisory locks.
//
// BRIDGE: posix-file-lock — POSIX advisory record locks + BSD flock →
// per-inode lock list with CAS+Atomics.wait blocking and process-owner
// release-on-close.

// ---------------------------------------------------------------------------
// errno values (POSIX <errno.h>).
// ---------------------------------------------------------------------------
const EBADF  = 9;
const EAGAIN = 11;
const EACCES = 13;
const EINVAL = 22;
const ENOLCK = 37;
const EWOULDBLOCK = EAGAIN; // POSIX permits these to share a value.

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Public constants — IEEE Std 1003.1-2017 §<fcntl.h>.
// ---------------------------------------------------------------------------

/** struct flock l_type values. */
export const F_RDLCK = 0;
export const F_WRLCK = 1;
export const F_UNLCK = 2;

/** fcntl cmd values for the locking subset. Numbers match Linux ABI. */
export const F_GETLK  = 5;
export const F_SETLK  = 6;
export const F_SETLKW = 7;

/** l_whence values — POSIX §<unistd.h>. */
export const SEEK_SET = 0;
export const SEEK_CUR = 1;
export const SEEK_END = 2;

/** flock(2) operation flags. */
export const LOCK_SH = 1;
export const LOCK_EX = 2;
export const LOCK_NB = 4;
export const LOCK_UN = 8;

/** struct flock — IEEE Std 1003.1-2017 §<fcntl.h>. */
export interface flock {
  l_type:   number;
  l_whence: number;
  l_start:  number;
  l_len:    number;
  l_pid:    number;
}

// ---------------------------------------------------------------------------
// Inode key resolver — translated programs hold a Mirage fd; we need to
// derive a stable "inode key" from it so two fds on the same path share a
// lock list.  By default we ask a pluggable resolver (the FdTable in
// MirageOS exposes pathOf(fd)); tests can install a custom resolver.
// ---------------------------------------------------------------------------

/** Resolver: fd → inode-key (string).  Returning null means "unknown fd"
 *  and locking calls return -1/EBADF. */
export type FdInodeResolver = (fd: number) => string | null;

let _resolver: FdInodeResolver = (fd: number): string | null => {
  // Default resolver: treat the fd itself as the inode key.  This keeps the
  // module testable in isolation (each fd is its own file) and is overridden
  // by MirageOS at wiring-time to consult the FdTable.
  if (!Number.isInteger(fd) || fd < 0) return null;
  return `fd:${fd}`;
};

/** Install the inode-key resolver.  MirageOS calls this at construction. */
export function _setInodeResolver(r: FdInodeResolver): void {
  _resolver = r;
}

/** Read the current resolver — primarily for tests. */
export function _getInodeResolver(): FdInodeResolver {
  return _resolver;
}

// ---------------------------------------------------------------------------
// Per-inode lock list.
// ---------------------------------------------------------------------------

interface HeldLock {
  /** Owning "process" id — pid of the holder.  We treat the Mirage isolate
   *  as one process; tests can override `_setOwnerPid` to inject distinct
   *  pids and exercise cross-process conflicts. */
  pid: number;
  /** Originating fd — used by close-releases-locks semantics. */
  fd: number;
  /** F_RDLCK or F_WRLCK. */
  type: number;
  /** Absolute byte offset of the lock region's first byte. */
  start: number;
  /** Length in bytes; Number.MAX_SAFE_INTEGER means "to end of file". */
  len: number;
}

interface LockSet {
  locks: HeldLock[];
  /** Per-inode SAB-backed wakeup word. Each release Atomics.add(+1) and
   *  Atomics.notify; blocked F_SETLKW callers Atomics.wait on this word. */
  wake: Int32Array;
}

const _table: Map<string, LockSet> = new Map();

function _slot(key: string): LockSet {
  let s = _table.get(key);
  if (!s) {
    s = { locks: [], wake: new Int32Array(new SharedArrayBuffer(4)) };
    _table.set(key, s);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Owner pid — the "current process" identifier used for lock ownership and
// l_pid reporting.  Defaults to 1 (Mirage process).  Tests can rotate it.
// ---------------------------------------------------------------------------

let _ownerPid: number = 1;
export function _setOwnerPid(pid: number): void { _ownerPid = pid; }
export function _getOwnerPid(): number { return _ownerPid; }

// ---------------------------------------------------------------------------
// Optional file-size resolver — F_SETLK / F_GETLK with l_whence == SEEK_END
// or l_len == 0 ("to EOF") need to know the file size to compute the
// effective region.  We default to a permissive resolver that returns
// Number.MAX_SAFE_INTEGER (so "to EOF" means "everything"); the wiring layer
// can install a real one.
// ---------------------------------------------------------------------------

export type FdSizeResolver = (fd: number) => number;
let _sizeResolver: FdSizeResolver = (_fd: number) => Number.MAX_SAFE_INTEGER;
export function _setFdSizeResolver(r: FdSizeResolver): void { _sizeResolver = r; }

// ---------------------------------------------------------------------------
// Test-only reset.
// ---------------------------------------------------------------------------
export function _resetFileLock(): void {
  _table.clear();
  _ownerPid = 1;
  errno = 0;
  _resolver = (fd: number): string | null => {
    if (!Number.isInteger(fd) || fd < 0) return null;
    return `fd:${fd}`;
  };
  _sizeResolver = (_fd: number) => Number.MAX_SAFE_INTEGER;
}

/** Test inspector: number of inodes with at least one lock. */
export function _lockTableSize(): number { return _table.size; }

/** Test inspector: snapshot of locks held on `fd`'s inode. */
export function _locksOnFd(fd: number): HeldLock[] {
  const k = _resolver(fd);
  if (!k) return [];
  return [..._table.get(k)?.locks ?? []];
}

// ---------------------------------------------------------------------------
// Helpers — region resolution + overlap + conflict.
// ---------------------------------------------------------------------------

function _resolveRegion(fd: number, fl: flock): { start: number; len: number } | null {
  let base = 0;
  switch (fl.l_whence) {
    case SEEK_SET: base = 0; break;
    case SEEK_CUR: base = 0; break; // We don't track the per-fd file offset.
    case SEEK_END: base = _sizeResolver(fd); break;
    default: return null;
  }
  const start = base + (fl.l_start | 0);
  if (start < 0) return null;
  // l_len == 0 → "to end of file"
  const len = (fl.l_len === 0) ? Math.max(0, Number.MAX_SAFE_INTEGER - start) : fl.l_len;
  if (len < 0) {
    // Negative l_len — POSIX permits this to mean "the bytes preceding
    // l_start by |l_len|".
    const newStart = Math.max(0, start + len);
    return { start: newStart, len: -len };
  }
  return { start, len };
}

function _overlaps(aStart: number, aLen: number, bStart: number, bLen: number): boolean {
  const aEnd = aStart + aLen;
  const bEnd = bStart + bLen;
  return aStart < bEnd && bStart < aEnd;
}

/** Returns the first lock in `set` that conflicts with a request from
 *  `ownerPid` to acquire `wantType` on [start, start+len), or null if none. */
function _firstConflict(set: LockSet, ownerPid: number, wantType: number,
                        start: number, len: number): HeldLock | null {
  for (const l of set.locks) {
    if (!_overlaps(l.start, l.len, start, len)) continue;
    if (l.pid === ownerPid) continue; // Same process: replaces, never conflicts.
    // POSIX rules:
    //   * Two F_RDLCKs from different processes do NOT conflict.
    //   * Anything else (RD vs WR, WR vs RD, WR vs WR) conflicts.
    if (wantType === F_RDLCK && l.type === F_RDLCK) continue;
    return l;
  }
  return null;
}

/** Apply a lock to the set, merging adjacent / replacing overlapping
 *  same-process locks per POSIX semantics. */
function _applyLock(set: LockSet, ownerPid: number, fd: number, type: number,
                    start: number, len: number): void {
  // 1. Remove / split overlapping same-process locks.
  const newList: HeldLock[] = [];
  const end = start + len;
  for (const l of set.locks) {
    if (l.pid !== ownerPid || !_overlaps(l.start, l.len, start, len)) {
      newList.push(l);
      continue;
    }
    // Same-process overlap: split off non-overlapping head/tail of `l`.
    const lEnd = l.start + l.len;
    if (l.start < start) {
      newList.push({ pid: l.pid, fd: l.fd, type: l.type, start: l.start, len: start - l.start });
    }
    if (lEnd > end) {
      newList.push({ pid: l.pid, fd: l.fd, type: l.type, start: end, len: lEnd - end });
    }
  }
  set.locks = newList;

  if (type !== F_UNLCK && len > 0) {
    set.locks.push({ pid: ownerPid, fd, type, start, len });
  }
}

function _wake(set: LockSet): void {
  Atomics.add(set.wake, 0, 1);
  Atomics.notify(set.wake, 0);
}

// ---------------------------------------------------------------------------
// fcntl(F_GETLK / F_SETLK / F_SETLKW) — one entry per cmd value.
// ---------------------------------------------------------------------------

/**
 * Spec: POSIX.1-2017 §<fcntl.h> fcntl(F_GETLK, *flock).  If the region in
 * `*fl` could be locked, sets fl.l_type = F_UNLCK and leaves the other
 * fields unchanged.  Otherwise overwrites fl with the conflicting lock's
 * type/whence/start/len/pid.  Returns 0 on success, -1/EBADF on unknown fd.
 */
export function fcntl_getlk(fd: number, fl: flock | null): number {
  if (!fl) { errno = EINVAL; return -1; }
  const key = _resolver(fd);
  if (!key) { errno = EBADF; return -1; }
  if (fl.l_type !== F_RDLCK && fl.l_type !== F_WRLCK) { errno = EINVAL; return -1; }
  const region = _resolveRegion(fd, fl);
  if (!region) { errno = EINVAL; return -1; }
  const set = _table.get(key);
  if (!set) { fl.l_type = F_UNLCK; return 0; }
  const conflict = _firstConflict(set, _ownerPid, fl.l_type, region.start, region.len);
  if (!conflict) { fl.l_type = F_UNLCK; return 0; }
  fl.l_type   = conflict.type;
  fl.l_whence = SEEK_SET;
  fl.l_start  = conflict.start;
  fl.l_len    = (conflict.len === Number.MAX_SAFE_INTEGER - conflict.start) ? 0 : conflict.len;
  fl.l_pid    = conflict.pid;
  return 0;
}

/**
 * Spec: POSIX.1-2017 §<fcntl.h> fcntl(F_SETLK, *flock) — non-blocking lock
 * acquisition or release.  Returns 0 on success; -1 with errno = EAGAIN /
 * EACCES if a conflicting lock is held.
 */
export function fcntl_setlk(fd: number, fl: flock | null): number {
  if (!fl) { errno = EINVAL; return -1; }
  const key = _resolver(fd);
  if (!key) { errno = EBADF; return -1; }
  if (fl.l_type !== F_RDLCK && fl.l_type !== F_WRLCK && fl.l_type !== F_UNLCK) {
    errno = EINVAL; return -1;
  }
  const region = _resolveRegion(fd, fl);
  if (!region) { errno = EINVAL; return -1; }
  const set = _slot(key);
  if (fl.l_type !== F_UNLCK) {
    const conflict = _firstConflict(set, _ownerPid, fl.l_type, region.start, region.len);
    if (conflict) { errno = EAGAIN; return -1; }
  }
  _applyLock(set, _ownerPid, fd, fl.l_type, region.start, region.len);
  if (fl.l_type === F_UNLCK) _wake(set);
  return 0;
}

/**
 * Spec: POSIX.1-2017 §<fcntl.h> fcntl(F_SETLKW, *flock) — blocking lock
 * acquisition; same as F_SETLK but waits until the conflict clears.
 *
 * BRIDGE: posix-file-lock-blocking — POSIX F_SETLKW → Atomics.wait on the
 * per-inode wake word with a polling fallback timeout, so callers running
 * outside SAB-aware contexts also make forward progress.
 */
export function fcntl_setlkw(fd: number, fl: flock | null,
                             timeout_ms: number = -1): number {
  if (!fl) { errno = EINVAL; return -1; }
  const key = _resolver(fd);
  if (!key) { errno = EBADF; return -1; }
  if (fl.l_type !== F_RDLCK && fl.l_type !== F_WRLCK && fl.l_type !== F_UNLCK) {
    errno = EINVAL; return -1;
  }
  const region = _resolveRegion(fd, fl);
  if (!region) { errno = EINVAL; return -1; }
  const set = _slot(key);
  if (fl.l_type === F_UNLCK) {
    _applyLock(set, _ownerPid, fd, fl.l_type, region.start, region.len);
    _wake(set);
    return 0;
  }
  const deadline = timeout_ms < 0 ? Infinity : Date.now() + timeout_ms;
  while (true) {
    const conflict = _firstConflict(set, _ownerPid, fl.l_type, region.start, region.len);
    if (!conflict) {
      _applyLock(set, _ownerPid, fd, fl.l_type, region.start, region.len);
      return 0;
    }
    const now = Date.now();
    if (now >= deadline) { errno = EAGAIN; return -1; }
    const wait = deadline === Infinity ? 16 : Math.min(16, deadline - now);
    const tok = Atomics.load(set.wake, 0);
    Atomics.wait(set.wake, 0, tok, wait);
  }
}

/**
 * Convenience dispatcher: `fcntl(fd, cmd, arg)` for the locking subset.
 * Translated code that emits a generic fcntl shim can route through here
 * and recover the correct sub-call by `cmd`.
 */
export function fcntl_lock(fd: number, cmd: number, fl: flock | null): number {
  switch (cmd) {
    case F_GETLK:  return fcntl_getlk(fd, fl);
    case F_SETLK:  return fcntl_setlk(fd, fl);
    case F_SETLKW: return fcntl_setlkw(fd, fl);
    default: errno = EINVAL; return -1;
  }
}

// ---------------------------------------------------------------------------
// flock(fd, op) — BSD-style whole-file lock.
// ---------------------------------------------------------------------------

/**
 * Spec: BSD/Linux flock(2) — operation ∈ { LOCK_SH, LOCK_EX, LOCK_UN } with
 * optional |LOCK_NB.  Locks the whole file (offset 0, length to-EOF) for
 * the calling process.  flock and fcntl locks are SEPARATE namespaces on
 * Linux (the kernel maintains them independently) but on classic BSD they
 * are unified.  We model the unified BSD/sqlite-friendly behaviour: a
 * flock and an fcntl lock on the same inode CAN conflict, which is the
 * conservative choice that prevents mis-translated code from violating
 * mutual-exclusion.
 *
 * Returns 0 on success, -1 with errno = EWOULDBLOCK on conflict (when
 * LOCK_NB is set), or with errno = EBADF / EINVAL on bad inputs.
 */
export function flock(fd: number, op: number): number {
  const key = _resolver(fd);
  if (!key) { errno = EBADF; return -1; }
  const nonblock = (op & LOCK_NB) !== 0;
  const base = op & ~LOCK_NB;
  const set = _slot(key);
  if (base === LOCK_UN) {
    // Drop every lock this process holds on this inode.
    set.locks = set.locks.filter(l => !(l.pid === _ownerPid && l.fd === fd));
    _wake(set);
    return 0;
  }
  let want: number;
  switch (base) {
    case LOCK_SH: want = F_RDLCK; break;
    case LOCK_EX: want = F_WRLCK; break;
    default: errno = EINVAL; return -1;
  }
  const start = 0;
  const len = Number.MAX_SAFE_INTEGER;
  while (true) {
    const conflict = _firstConflict(set, _ownerPid, want, start, len);
    if (!conflict) {
      _applyLock(set, _ownerPid, fd, want, start, len);
      return 0;
    }
    if (nonblock) { errno = EWOULDBLOCK; return -1; }
    const tok = Atomics.load(set.wake, 0);
    Atomics.wait(set.wake, 0, tok, 16);
  }
}

// ---------------------------------------------------------------------------
// Release-on-close — POSIX requires that closing any fd a process holds on
// the file releases all of that process's locks on the file.  The wiring
// layer calls this from the close()/closeFd path.
// ---------------------------------------------------------------------------

/**
 * Release every lock held by the current owner pid via `fd` (or via any
 * fd referring to the same inode key, per POSIX close-releases-all
 * semantics).  Returns the number of locks released.
 */
export function fileLockReleaseOnClose(fd: number): number {
  const key = _resolver(fd);
  if (!key) return 0;
  const set = _table.get(key);
  if (!set) return 0;
  const before = set.locks.length;
  set.locks = set.locks.filter(l => l.pid !== _ownerPid);
  const released = before - set.locks.length;
  if (released > 0) _wake(set);
  return released;
}

// ---------------------------------------------------------------------------
// Convenience constructor — translated code commonly needs to fabricate a
// fresh struct flock.
// ---------------------------------------------------------------------------

/** Construct a struct flock with sensible defaults. */
export function makeFlock(opts: Partial<flock> = {}): flock {
  return {
    l_type:   opts.l_type   ?? F_UNLCK,
    l_whence: opts.l_whence ?? SEEK_SET,
    l_start:  opts.l_start  ?? 0,
    l_len:    opts.l_len    ?? 0,
    l_pid:    opts.l_pid    ?? 0,
  };
}

// Suppress unused warnings on imported-only constants.
void ENOLCK;
