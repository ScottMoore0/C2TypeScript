// Mirage POSIX <sys/shm.h> — System V shared memory.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<sys/shm.h>:
//       int   shmget (key_t key, size_t size, int shmflg);
//       void *shmat  (int shmid, const void *shmaddr, int shmflg);
//       int   shmdt  (const void *shmaddr);
//       int   shmctl (int shmid, int cmd, struct shmid_ds *buf);
//
// BRIDGE: posix-sysv-shm — SysV shared-memory segments → SharedArrayBuffer
// keyed by integer key. shmget(IPC_PRIVATE) returns a fresh shmid; named
// keys are looked up in a registry. shmat returns a Uint8Array view into
// the SAB (the closest analogue to "void *" in JS); shmdt removes the
// caller's attachment. shmctl(IPC_RMID) marks the segment for destruction;
// it is freed once attachment count reaches zero.

// ---------------------------------------------------------------------------
// errno values used here. POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EACCES  = 13;
const EEXIST  = 17;
const EINVAL  = 22;
const ENOENT  = 2;
const ENOSPC  = 28;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Constants. POSIX §<sys/ipc.h> + §<sys/shm.h>.
// ---------------------------------------------------------------------------

export const IPC_PRIVATE = 0;

export const IPC_CREAT  = 0o1000;
export const IPC_EXCL   = 0o2000;
export const IPC_NOWAIT = 0o4000;

export const IPC_RMID   = 0;
export const IPC_SET    = 1;
export const IPC_STAT   = 2;

export const SHM_RDONLY = 0o10000;
export const SHM_RND    = 0o20000;

/** struct shmid_ds — POSIX §<sys/shm.h>. Reduced fields. */
export interface shmid_ds {
  shm_perm: { uid: number; gid: number; cuid: number; cgid: number; mode: number; key?: number };
  shm_segsz: number;
  shm_atime: number;
  shm_dtime: number;
  shm_ctime: number;
  shm_cpid: number;
  shm_lpid: number;
  shm_nattch: number;
}

interface Segment {
  id: number;
  key: number;
  sab: SharedArrayBuffer;
  view: Uint8Array;
  size: number;
  attachments: Set<Uint8Array>;
  marked: boolean;            // IPC_RMID
  ds: shmid_ds;
}

const _byId:  Map<number, Segment>          = new Map();
const _byKey: Map<number, Segment>          = new Map();
const _attachToSeg: WeakMap<Uint8Array, Segment> = new WeakMap();

let _nextId = 1;
let _nextPrivKey = -1;

/** Test-only — wipe the registry. */
export function _resetSysvShm(): void {
  _byId.clear();
  _byKey.clear();
  _nextId = 1;
  _nextPrivKey = -1;
  errno = 0;
}

/** Test-only — segment count. */
export function _shmSegCount(): number { return _byId.size; }

/** POSIX shmget — IEEE Std 1003.1-2017 §shmget. */
export function shmget(key: number, size: number, shmflg: number): number {
  if (size < 0) { errno = EINVAL; return -1; }
  let seg: Segment | undefined;
  if (key === IPC_PRIVATE) {
    // Always allocate a fresh segment for IPC_PRIVATE.
    key = _nextPrivKey--;
  } else {
    seg = _byKey.get(key);
    if (seg) {
      if ((shmflg & IPC_CREAT) && (shmflg & IPC_EXCL)) { errno = EEXIST; return -1; }
      if (size > 0 && seg.size < size) { errno = EINVAL; return -1; }
      return seg.id;
    }
    if (!(shmflg & IPC_CREAT)) { errno = ENOENT; return -1; }
  }
  if (size === 0) { errno = EINVAL; return -1; }
  let sab: SharedArrayBuffer;
  try {
    sab = new SharedArrayBuffer(size);
  } catch { errno = ENOSPC; return -1; }
  const id = _nextId++;
  const view = new Uint8Array(sab);
  seg = {
    id,
    key,
    sab,
    view,
    size,
    attachments: new Set<Uint8Array>(),
    marked: false,
    ds: {
      shm_perm: { uid: 0, gid: 0, cuid: 0, cgid: 0, mode: shmflg & 0o777, key },
      shm_segsz: size,
      shm_atime: 0,
      shm_dtime: 0,
      shm_ctime: Math.floor(Date.now() / 1000),
      shm_cpid: 0,
      shm_lpid: 0,
      shm_nattch: 0,
    },
  };
  _byId.set(id, seg);
  if (key >= 0) _byKey.set(key, seg);
  return id;
}

/** POSIX shmat — IEEE Std 1003.1-2017 §shmat. */
export function shmat(shmid: number, _shmaddr: any, shmflg: number): Uint8Array | -1 {
  const seg = _byId.get(shmid);
  if (!seg) { errno = EINVAL; return -1 as const; }
  // Read-only attachment is a logical flag; we still hand back the same SAB
  // view since JS lacks a per-view const qualifier.
  void shmflg;
  // Each attachment is a fresh Uint8Array view so shmdt can identify it.
  const view = new Uint8Array(seg.sab);
  seg.attachments.add(view);
  _attachToSeg.set(view, seg);
  seg.ds.shm_nattch = seg.attachments.size;
  seg.ds.shm_atime = Math.floor(Date.now() / 1000);
  return view;
}

/** POSIX shmdt — IEEE Std 1003.1-2017 §shmdt. */
export function shmdt(addr: Uint8Array | any): number {
  if (!(addr instanceof Uint8Array)) { errno = EINVAL; return -1; }
  const seg = _attachToSeg.get(addr);
  if (!seg || !seg.attachments.has(addr)) { errno = EINVAL; return -1; }
  seg.attachments.delete(addr);
  seg.ds.shm_nattch = seg.attachments.size;
  seg.ds.shm_dtime = Math.floor(Date.now() / 1000);
  if (seg.marked && seg.attachments.size === 0) {
    _byId.delete(seg.id);
    if (seg.key >= 0) _byKey.delete(seg.key);
  }
  return 0;
}

/** POSIX shmctl — IEEE Std 1003.1-2017 §shmctl. */
export function shmctl(shmid: number, cmd: number, buf: Partial<shmid_ds> | null): number {
  const seg = _byId.get(shmid);
  if (!seg) { errno = EINVAL; return -1; }
  switch (cmd) {
    case IPC_RMID:
      seg.marked = true;
      if (seg.attachments.size === 0) {
        _byId.delete(seg.id);
        if (seg.key >= 0) _byKey.delete(seg.key);
      }
      return 0;
    case IPC_STAT:
      if (!buf) { errno = EINVAL; return -1; }
      Object.assign(buf, {
        shm_perm:  { ...seg.ds.shm_perm },
        shm_segsz: seg.ds.shm_segsz,
        shm_atime: seg.ds.shm_atime,
        shm_dtime: seg.ds.shm_dtime,
        shm_ctime: seg.ds.shm_ctime,
        shm_cpid:  seg.ds.shm_cpid,
        shm_lpid:  seg.ds.shm_lpid,
        shm_nattch: seg.ds.shm_nattch,
      });
      return 0;
    case IPC_SET:
      if (!buf) { errno = EINVAL; return -1; }
      if (buf.shm_perm) {
        if (typeof buf.shm_perm.uid === "number")  seg.ds.shm_perm.uid = buf.shm_perm.uid;
        if (typeof buf.shm_perm.gid === "number")  seg.ds.shm_perm.gid = buf.shm_perm.gid;
        if (typeof buf.shm_perm.mode === "number") seg.ds.shm_perm.mode = buf.shm_perm.mode;
      }
      seg.ds.shm_ctime = Math.floor(Date.now() / 1000);
      return 0;
    default:
      errno = EINVAL;
      return -1;
  }
}

// Re-export EACCES so tests can validate permission paths uniformly.
export { EACCES };
