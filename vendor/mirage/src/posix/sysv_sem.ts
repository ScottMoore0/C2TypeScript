// Mirage POSIX <sys/sem.h> — System V semaphore sets.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<sys/sem.h>:
//       int semget    (key_t key, int nsems, int semflg);
//       int semop     (int semid, struct sembuf *sops, size_t nsops);
//       int semtimedop(int semid, struct sembuf *sops, size_t nsops,
//                      const struct timespec *timeout);
//       int semctl    (int semid, int semnum, int cmd, ...);
//
// BRIDGE: posix-sysv-sem — SysV semaphore sets → SAB-backed Int32Array of
// semaphore counters. semop blocks on Atomics.wait when the requested
// decrement would go negative; semctl(SETVAL/IPC_RMID/GETVAL) work on the
// counter array directly.

const EACCES = 13;
const EAGAIN = 11;
const EEXIST = 17;
const EFBIG  = 27;
const EINVAL = 22;
const ENOENT = 2;
const ENOSPC = 28;
const ETIMEDOUT = 110;
const EIDRM  = 43;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Constants. POSIX §<sys/ipc.h> + §<sys/sem.h>.
// ---------------------------------------------------------------------------

export const IPC_PRIVATE = 0;
export const IPC_CREAT   = 0o1000;
export const IPC_EXCL    = 0o2000;
export const IPC_NOWAIT  = 0o4000;

export const IPC_RMID = 0;
export const IPC_SET  = 1;
export const IPC_STAT = 2;

export const GETVAL  = 12;
export const SETVAL  = 16;
export const GETALL  = 13;
export const SETALL  = 17;
export const GETPID  = 11;
export const GETNCNT = 14;
export const GETZCNT = 15;

export const SEM_UNDO = 0o10000;

const MAX_NSEMS = 1024;

/** struct sembuf — POSIX §<sys/sem.h>. */
export interface sembuf {
  sem_num: number;   // semaphore index in set
  sem_op:  number;   // operation: -n decrement, +n increment, 0 wait-for-zero
  sem_flg: number;   // IPC_NOWAIT | SEM_UNDO
}

/** struct semid_ds — POSIX §<sys/sem.h>. Reduced fields. */
export interface semid_ds {
  sem_perm: { uid: number; gid: number; cuid: number; cgid: number; mode: number; key?: number };
  sem_otime: number;
  sem_ctime: number;
  sem_nsems: number;
}

interface SemSet {
  id: number;
  key: number;
  sab: SharedArrayBuffer;
  values: Int32Array;
  nsems: number;
  removed: boolean;
  ds: semid_ds;
}

const _byId:  Map<number, SemSet> = new Map();
const _byKey: Map<number, SemSet> = new Map();

let _nextId = 1;
let _nextPrivKey = -1;

/** Test-only — wipe state. */
export function _resetSysvSem(): void {
  _byId.clear();
  _byKey.clear();
  _nextId = 1;
  _nextPrivKey = -1;
  errno = 0;
}

/** Test-only — set count. */
export function _semSetCount(): number { return _byId.size; }

/** POSIX semget — IEEE Std 1003.1-2017 §semget. */
export function semget(key: number, nsems: number, semflg: number): number {
  if (nsems < 0 || nsems > MAX_NSEMS) { errno = EINVAL; return -1; }
  let s: SemSet | undefined;
  if (key === IPC_PRIVATE) {
    key = _nextPrivKey--;
  } else {
    s = _byKey.get(key);
    if (s) {
      if ((semflg & IPC_CREAT) && (semflg & IPC_EXCL)) { errno = EEXIST; return -1; }
      if (nsems > 0 && nsems > s.nsems) { errno = EINVAL; return -1; }
      return s.id;
    }
    if (!(semflg & IPC_CREAT)) { errno = ENOENT; return -1; }
  }
  if (nsems === 0) { errno = EINVAL; return -1; }
  let sab: SharedArrayBuffer;
  try {
    sab = new SharedArrayBuffer(nsems * 4);
  } catch { errno = ENOSPC; return -1; }
  const id = _nextId++;
  const values = new Int32Array(sab);
  s = {
    id, key, sab, values, nsems,
    removed: false,
    ds: {
      sem_perm: { uid: 0, gid: 0, cuid: 0, cgid: 0, mode: semflg & 0o777, key },
      sem_otime: 0,
      sem_ctime: Math.floor(Date.now() / 1000),
      sem_nsems: nsems,
    },
  };
  _byId.set(id, s);
  if (key >= 0) _byKey.set(key, s);
  return id;
}

/** Try one sembuf op. Returns true on success, "again" on would-block,
 *  "removed" if the set was destroyed, or false on hard error. */
function _tryOp(s: SemSet, op: sembuf): true | "again" | "removed" | "error" {
  if (s.removed) return "removed";
  const idx = op.sem_num;
  if (idx < 0 || idx >= s.nsems) { errno = EFBIG; return "error"; }
  const v = Atomics.load(s.values, idx);
  const o = op.sem_op | 0;
  if (o > 0) {
    Atomics.add(s.values, idx, o);
    Atomics.notify(s.values, idx);
    return true;
  }
  if (o === 0) {
    if (v === 0) return true;
    return "again";
  }
  // o < 0: decrement only if v + o >= 0.
  const want = -o;
  if (v >= want) {
    // CAS to commit.
    const r = Atomics.compareExchange(s.values, idx, v, v - want);
    if (r === v) return true;
    return "again"; // retry
  }
  return "again";
}

/** POSIX semop — IEEE Std 1003.1-2017 §semop. */
export function semop(semid: number, sops: sembuf[], nsops: number): number {
  return semtimedopSync(semid, sops, nsops, null);
}

function semtimedopSync(
  semid: number,
  sops: sembuf[],
  nsops: number,
  _timeout: { tv_sec?: number; tv_nsec?: number } | null,
): number {
  const s = _byId.get(semid);
  if (!s) { errno = EINVAL; return -1; }
  if (nsops < 0 || nsops > sops.length) { errno = EINVAL; return -1; }
  // Atomicity: try-all-or-undo. If any op would block in IPC_NOWAIT mode,
  // return EAGAIN immediately. Otherwise we attempt with a small spin and
  // then declare EAGAIN (synchronous JS cannot block).
  const log: { idx: number; delta: number }[] = [];
  for (let i = 0; i < nsops; i++) {
    const op = sops[i];
    let attempts = 0;
    while (true) {
      const r = _tryOp(s, op);
      if (r === true) {
        if (op.sem_op !== 0) log.push({ idx: op.sem_num, delta: op.sem_op | 0 });
        break;
      }
      if (r === "removed") { errno = EIDRM; _undo(s, log); return -1; }
      if (r === "error") { _undo(s, log); return -1; }
      // again
      if (op.sem_flg & IPC_NOWAIT) {
        errno = EAGAIN;
        _undo(s, log);
        return -1;
      }
      // Limited spin — pure JS cannot truly block synchronously without
      // Atomics.wait, which we do briefly to play nicely with multi-isolate
      // setups.
      if (attempts++ > 2) {
        // Wait briefly on the value at this slot, then re-check.
        const waitMs = 5;
        try { Atomics.wait(s.values, op.sem_num, Atomics.load(s.values, op.sem_num), waitMs); }
        catch { /* main thread can't wait */ }
        if (attempts > 5) {
          errno = EAGAIN;
          _undo(s, log);
          return -1;
        }
      }
    }
  }
  s.ds.sem_otime = Math.floor(Date.now() / 1000);
  return 0;
}

function _undo(s: SemSet, log: { idx: number; delta: number }[]): void {
  for (const e of log) {
    Atomics.sub(s.values, e.idx, e.delta);
    Atomics.notify(s.values, e.idx);
  }
}

/** POSIX semtimedop — IEEE Std 1003.1-2017 §semtimedop. */
export async function semtimedop(
  semid: number,
  sops: sembuf[],
  nsops: number,
  timeout: { tv_sec?: number; tv_nsec?: number } | null,
): Promise<number> {
  // Try synchronously first.
  const sync = semtimedopSync(semid, sops, nsops, null);
  if (sync === 0) return 0;
  if (errno !== EAGAIN) return -1;
  if (!timeout) return -1;
  const totalMs = (timeout.tv_sec ?? 0) * 1000 + Math.floor((timeout.tv_nsec ?? 0) / 1e6);
  const deadline = Date.now() + totalMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, Math.min(10, deadline - Date.now())));
    const r2 = semtimedopSync(semid, sops, nsops, null);
    if (r2 === 0) return 0;
    if (errno !== EAGAIN) return -1;
  }
  errno = ETIMEDOUT;
  return -1;
}

/** POSIX semctl — IEEE Std 1003.1-2017 §semctl. */
export function semctl(
  semid: number,
  semnum: number,
  cmd: number,
  arg?: number | number[] | Partial<semid_ds> | null,
): number {
  const s = _byId.get(semid);
  if (!s) { errno = EINVAL; return -1; }
  switch (cmd) {
    case IPC_RMID: {
      s.removed = true;
      _byId.delete(s.id);
      if (s.key >= 0) _byKey.delete(s.key);
      // Wake any waiters across the set.
      for (let i = 0; i < s.nsems; i++) Atomics.notify(s.values, i);
      return 0;
    }
    case IPC_STAT: {
      if (typeof arg !== "object" || !arg) { errno = EINVAL; return -1; }
      const a = arg as Partial<semid_ds>;
      a.sem_perm  = { ...s.ds.sem_perm };
      a.sem_otime = s.ds.sem_otime;
      a.sem_ctime = s.ds.sem_ctime;
      a.sem_nsems = s.ds.sem_nsems;
      return 0;
    }
    case IPC_SET: {
      if (typeof arg !== "object" || !arg) { errno = EINVAL; return -1; }
      const a = arg as Partial<semid_ds>;
      if (a.sem_perm) {
        if (typeof a.sem_perm.uid === "number")  s.ds.sem_perm.uid = a.sem_perm.uid;
        if (typeof a.sem_perm.gid === "number")  s.ds.sem_perm.gid = a.sem_perm.gid;
        if (typeof a.sem_perm.mode === "number") s.ds.sem_perm.mode = a.sem_perm.mode;
      }
      s.ds.sem_ctime = Math.floor(Date.now() / 1000);
      return 0;
    }
    case GETVAL: {
      if (semnum < 0 || semnum >= s.nsems) { errno = EFBIG; return -1; }
      return Atomics.load(s.values, semnum);
    }
    case SETVAL: {
      if (semnum < 0 || semnum >= s.nsems) { errno = EFBIG; return -1; }
      const v = typeof arg === "number" ? arg : 0;
      Atomics.store(s.values, semnum, v | 0);
      Atomics.notify(s.values, semnum);
      return 0;
    }
    case GETALL: {
      if (Array.isArray(arg)) {
        for (let i = 0; i < s.nsems; i++) arg[i] = Atomics.load(s.values, i);
      }
      return 0;
    }
    case SETALL: {
      if (!Array.isArray(arg)) { errno = EINVAL; return -1; }
      for (let i = 0; i < s.nsems && i < arg.length; i++) {
        Atomics.store(s.values, i, arg[i] | 0);
        Atomics.notify(s.values, i);
      }
      return 0;
    }
    case GETPID:
    case GETNCNT:
    case GETZCNT:
      return 0;
    default:
      errno = EINVAL;
      return -1;
  }
}

// Re-export EACCES so tests can validate permission paths uniformly.
export { EACCES };
