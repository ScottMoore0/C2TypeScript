// Mirage POSIX <sys/msg.h> — System V message queues.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<sys/msg.h>:
//       int     msgget (key_t key, int msgflg);
//       int     msgsnd (int msqid, const void *msgp, size_t msgsz, int msgflg);
//       ssize_t msgrcv (int msqid, void *msgp, size_t msgsz, long msgtyp, int msgflg);
//       int     msgctl (int msqid, int cmd, struct msqid_ds *buf);
//
// BRIDGE: posix-sysv-msg — SysV message queues → in-process named queue
// keyed by integer key, holding type-tagged messages. Selection by msgtyp:
//   * msgtyp == 0   : pop the head message regardless of type.
//   * msgtyp >  0   : pop the first message with mtype == msgtyp.
//   * msgtyp <  0   : pop the first message with mtype <= |msgtyp|, smallest first.
// MSG_NOERROR truncates oversize messages instead of returning E2BIG.

const E2BIG  = 7;
const EAGAIN = 11;
const EEXIST = 17;
const EIDRM  = 43;
const EINVAL = 22;
const ENOENT = 2;
const ENOMSG = 42;
const ENOSPC = 28;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Constants. POSIX §<sys/ipc.h> + §<sys/msg.h>.
// ---------------------------------------------------------------------------

export const IPC_PRIVATE = 0;
export const IPC_CREAT   = 0o1000;
export const IPC_EXCL    = 0o2000;
export const IPC_NOWAIT  = 0o4000;

export const IPC_RMID = 0;
export const IPC_SET  = 1;
export const IPC_STAT = 2;

export const MSG_NOERROR = 0o10000;
export const MSG_EXCEPT  = 0o20000;

const DEFAULT_MAX_BYTES = 16384;

/** struct msgbuf — POSIX §<sys/msg.h>. The translator emits a struct with a
 *  long mtype followed by mtext bytes; we accept either form. */
export interface msgbuf {
  mtype: number;
  mtext: Uint8Array | string;
}

/** struct msqid_ds — POSIX §<sys/msg.h>. Reduced fields. */
export interface msqid_ds {
  msg_perm: { uid: number; gid: number; cuid: number; cgid: number; mode: number; key?: number };
  msg_qnum:   number;   // current message count
  msg_qbytes: number;   // max queue bytes
  msg_lspid:  number;
  msg_lrpid:  number;
  msg_stime:  number;
  msg_rtime:  number;
  msg_ctime:  number;
}

interface Message {
  mtype: number;
  mtext: Uint8Array;
}

interface Queue {
  id: number;
  key: number;
  messages: Message[];
  bytes: number;
  removed: boolean;
  ds: msqid_ds;
}

const _byId:  Map<number, Queue> = new Map();
const _byKey: Map<number, Queue> = new Map();

let _nextId = 1;
let _nextPrivKey = -1;

/** Test-only — wipe state. */
export function _resetSysvMsg(): void {
  _byId.clear();
  _byKey.clear();
  _nextId = 1;
  _nextPrivKey = -1;
  errno = 0;
}

/** Test-only — queue count. */
export function _msgQueueCount(): number { return _byId.size; }

/** POSIX msgget — IEEE Std 1003.1-2017 §msgget. */
export function msgget(key: number, msgflg: number): number {
  let q: Queue | undefined;
  if (key === IPC_PRIVATE) {
    key = _nextPrivKey--;
  } else {
    q = _byKey.get(key);
    if (q) {
      if ((msgflg & IPC_CREAT) && (msgflg & IPC_EXCL)) { errno = EEXIST; return -1; }
      return q.id;
    }
    if (!(msgflg & IPC_CREAT)) { errno = ENOENT; return -1; }
  }
  const id = _nextId++;
  q = {
    id, key,
    messages: [],
    bytes: 0,
    removed: false,
    ds: {
      msg_perm: { uid: 0, gid: 0, cuid: 0, cgid: 0, mode: msgflg & 0o777, key },
      msg_qnum:   0,
      msg_qbytes: DEFAULT_MAX_BYTES,
      msg_lspid:  0,
      msg_lrpid:  0,
      msg_stime:  0,
      msg_rtime:  0,
      msg_ctime:  Math.floor(Date.now() / 1000),
    },
  };
  _byId.set(id, q);
  if (key >= 0) _byKey.set(key, q);
  return id;
}

function _bytes(b: Uint8Array | string): Uint8Array {
  return typeof b === "string" ? new TextEncoder().encode(b) : b;
}

/** POSIX msgsnd — IEEE Std 1003.1-2017 §msgsnd. */
export function msgsnd(
  msqid: number,
  msgp: msgbuf,
  msgsz: number,
  msgflg: number,
): number {
  const q = _byId.get(msqid);
  if (!q) { errno = EINVAL; return -1; }
  if (q.removed) { errno = EIDRM; return -1; }
  if (!msgp || typeof msgp.mtype !== "number") { errno = EINVAL; return -1; }
  if (msgp.mtype <= 0) { errno = EINVAL; return -1; }
  const data = _bytes(msgp.mtext).subarray(0, msgsz);
  if (q.bytes + data.length > q.ds.msg_qbytes) {
    if (msgflg & IPC_NOWAIT) { errno = EAGAIN; return -1; }
    errno = EAGAIN;
    return -1;
  }
  q.messages.push({ mtype: msgp.mtype, mtext: new Uint8Array(data) });
  q.bytes += data.length;
  q.ds.msg_qnum = q.messages.length;
  q.ds.msg_stime = Math.floor(Date.now() / 1000);
  return 0;
}

/** POSIX msgrcv — IEEE Std 1003.1-2017 §msgrcv. Returns the byte count
 *  copied into msgp.mtext, or -1 on error. */
export function msgrcv(
  msqid: number,
  msgp: msgbuf,
  msgsz: number,
  msgtyp: number,
  msgflg: number,
): number {
  const q = _byId.get(msqid);
  if (!q) { errno = EINVAL; return -1; }
  if (q.removed) { errno = EIDRM; return -1; }
  if (!msgp) { errno = EINVAL; return -1; }
  let idx = -1;
  if (msgtyp === 0) {
    if (q.messages.length > 0) idx = 0;
  } else if (msgtyp > 0) {
    if (msgflg & MSG_EXCEPT) {
      idx = q.messages.findIndex((m) => m.mtype !== msgtyp);
    } else {
      idx = q.messages.findIndex((m) => m.mtype === msgtyp);
    }
  } else {
    // msgtyp < 0: smallest mtype <= |msgtyp|.
    const cap = -msgtyp;
    let bestI = -1;
    let bestT = Infinity;
    for (let i = 0; i < q.messages.length; i++) {
      const m = q.messages[i];
      if (m.mtype <= cap && m.mtype < bestT) { bestT = m.mtype; bestI = i; }
    }
    idx = bestI;
  }
  if (idx < 0) {
    if (msgflg & IPC_NOWAIT) { errno = ENOMSG; return -1; }
    errno = ENOMSG;
    return -1;
  }
  const m = q.messages.splice(idx, 1)[0];
  q.bytes -= m.mtext.length;
  q.ds.msg_qnum = q.messages.length;
  q.ds.msg_rtime = Math.floor(Date.now() / 1000);
  if (m.mtext.length > msgsz) {
    if (msgflg & MSG_NOERROR) {
      msgp.mtype = m.mtype;
      msgp.mtext = m.mtext.subarray(0, msgsz);
      return msgsz;
    }
    // Re-enqueue and report E2BIG (POSIX-spec: message stays in queue).
    q.messages.unshift(m);
    q.bytes += m.mtext.length;
    q.ds.msg_qnum = q.messages.length;
    errno = E2BIG;
    return -1;
  }
  msgp.mtype = m.mtype;
  msgp.mtext = m.mtext;
  return m.mtext.length;
}

/** POSIX msgctl — IEEE Std 1003.1-2017 §msgctl. */
export function msgctl(msqid: number, cmd: number, buf: Partial<msqid_ds> | null): number {
  const q = _byId.get(msqid);
  if (!q) { errno = EINVAL; return -1; }
  switch (cmd) {
    case IPC_RMID:
      q.removed = true;
      _byId.delete(q.id);
      if (q.key >= 0) _byKey.delete(q.key);
      return 0;
    case IPC_STAT:
      if (!buf) { errno = EINVAL; return -1; }
      Object.assign(buf, {
        msg_perm:   { ...q.ds.msg_perm },
        msg_qnum:   q.ds.msg_qnum,
        msg_qbytes: q.ds.msg_qbytes,
        msg_lspid:  q.ds.msg_lspid,
        msg_lrpid:  q.ds.msg_lrpid,
        msg_stime:  q.ds.msg_stime,
        msg_rtime:  q.ds.msg_rtime,
        msg_ctime:  q.ds.msg_ctime,
      });
      return 0;
    case IPC_SET:
      if (!buf) { errno = EINVAL; return -1; }
      if (buf.msg_perm) {
        if (typeof buf.msg_perm.uid === "number")  q.ds.msg_perm.uid = buf.msg_perm.uid;
        if (typeof buf.msg_perm.gid === "number")  q.ds.msg_perm.gid = buf.msg_perm.gid;
        if (typeof buf.msg_perm.mode === "number") q.ds.msg_perm.mode = buf.msg_perm.mode;
      }
      if (typeof buf.msg_qbytes === "number") q.ds.msg_qbytes = buf.msg_qbytes;
      q.ds.msg_ctime = Math.floor(Date.now() / 1000);
      return 0;
    default:
      errno = EINVAL;
      return -1;
  }
}
