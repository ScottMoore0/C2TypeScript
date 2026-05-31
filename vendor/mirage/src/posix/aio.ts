// Mirage POSIX <aio.h> — asynchronous I/O.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<aio.h>:
//       struct aiocb {
//         int             aio_fildes;
//         off_t           aio_offset;
//         volatile void  *aio_buf;
//         size_t          aio_nbytes;
//         int             aio_reqprio;
//         struct sigevent aio_sigevent;
//         int             aio_lio_opcode;
//       };
//       int aio_read   (struct aiocb *);
//       int aio_write  (struct aiocb *);
//       int aio_fsync  (int op, struct aiocb *);
//       int aio_error  (const struct aiocb *);
//       ssize_t aio_return(struct aiocb *);
//       int aio_cancel (int fildes, struct aiocb *);
//       int aio_suspend(const struct aiocb *const list[], int nent,
//                       const struct timespec *timeout);
//       int lio_listio (int mode, struct aiocb *const list[], int nent,
//                       struct sigevent *sig);
//
// Semantics implemented:
//   * Each aio_* call submits a Promise-backed I/O job and stamps the aiocb
//     with bookkeeping fields (`__aio_state`, `__aio_result`, `__aio_errno`).
//   * aio_error returns EINPROGRESS while the job is in flight, 0 on success,
//     or a positive errno on failure.
//   * aio_return harvests the byte count (or -1) and frees the job.
//   * aio_suspend awaits any one of the listed jobs.
//   * aio_cancel marks pending jobs for cancellation; in-flight jobs are
//     reported AIO_NOTCANCELED.
//
// BRIDGE: posix-aio — POSIX async I/O → JS-side completion-tracker queue
// backed by node:fs. Each aiocb carries hidden state fields so the
// translator can pass the same struct between aio_read/aio_error/aio_return
// without per-call buffer marshalling.

import { createRequire } from "node:module";

// ---------------------------------------------------------------------------
// errno values used here. POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EBADF       = 9;
const EINVAL      = 22;
const ECANCELED   = 125;
const EINPROGRESS = 115;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Constants. POSIX §<aio.h>.
// ---------------------------------------------------------------------------

/** lio_listio mode: submit and return without waiting. */
export const LIO_NOWAIT = 1;
/** lio_listio mode: submit and block until all complete. */
export const LIO_WAIT   = 2;
/** lio_listio opcode: skip this entry. */
export const LIO_NOP    = 0;
/** lio_listio opcode: aio_read. */
export const LIO_READ   = 1;
/** lio_listio opcode: aio_write. */
export const LIO_WRITE  = 2;

/** aio_cancel return: all requested operations cancelled. */
export const AIO_CANCELED    = 0;
/** aio_cancel return: at least one in-flight, not cancelled. */
export const AIO_NOTCANCELED = 1;
/** aio_cancel return: no operations to cancel (already done). */
export const AIO_ALLDONE     = 2;

/** aio_fsync op: data sync (matches POSIX O_DSYNC semantics). */
export const O_DSYNC = 0o010000;
/** aio_fsync op: full file sync. */
export const O_SYNC  = 0o4010000;

/** struct aiocb — POSIX §<aio.h>. Translated C code populates the public
 *  fields; the runtime stamps the `__aio_*` shadow fields for bookkeeping. */
export interface aiocb {
  aio_fildes:  number;
  aio_offset:  number;
  aio_buf:     Uint8Array | { buf: Uint8Array; off: number } | null;
  aio_nbytes:  number;
  aio_reqprio?: number;
  aio_sigevent?: any;
  aio_lio_opcode?: number;

  // Shadow state (set by the runtime; not part of POSIX struct shape).
  __aio_state?: "pending" | "done" | "cancelled";
  __aio_result?: number;
  __aio_errno?: number;
  __aio_promise?: Promise<void>;
  __aio_id?: number;
}

// ---------------------------------------------------------------------------
// Per-process job table. Tracks every submitted aiocb so aio_cancel(fd)
// without a specific aiocb can iterate over all jobs for an fd.
// ---------------------------------------------------------------------------

interface Job {
  cb: aiocb;
  fd: number;
  cancelRequested: boolean;
}

const _jobs: Map<number, Job> = new Map();
let _nextJobId = 1;

/** Test-only — reset job table and errno. */
export function _resetAio(): void {
  _jobs.clear();
  _nextJobId = 1;
  errno = 0;
}

/** Test-only — inspect outstanding job count. */
export function _aioJobCount(): number { return _jobs.size; }

/** Detect Node.js so we can pick the real fs path. */
function _isNode(): boolean {
  return typeof (globalThis as any).process !== "undefined" &&
         !!(globalThis as any).process.versions?.node;
}

let _fs: any | null | undefined;
function _loadFs(): any | null {
  if (_fs !== undefined) return _fs;
  if (!_isNode()) { _fs = null; return null; }
  try {
    // createRequire works under both ESM and CJS at runtime.
    const req = createRequire(import.meta.url);
    _fs = req("node:fs");
  } catch {
    try {
      // eslint-disable-next-line no-eval
      _fs = (0, eval)("require('node:fs')");
    } catch { _fs = null; }
  }
  return _fs;
}

/** Extract the writable Uint8Array view from an aiocb buffer field. */
function _bufView(buf: aiocb["aio_buf"]): Uint8Array | null {
  if (!buf) return null;
  if (buf instanceof Uint8Array) return buf;
  if (typeof (buf as any).buf !== "undefined" &&
      typeof (buf as any).off === "number") {
    const u = (buf as any).buf as Uint8Array;
    const off = (buf as any).off as number;
    return u.subarray(off);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Job lifecycle helpers.
// ---------------------------------------------------------------------------

function _initJob(cb: aiocb, fd: number): number {
  const id = _nextJobId++;
  cb.__aio_id = id;
  cb.__aio_state = "pending";
  cb.__aio_errno = EINPROGRESS;
  cb.__aio_result = -1;
  _jobs.set(id, { cb, fd, cancelRequested: false });
  return id;
}

function _attachPromise(cb: aiocb, id: number, p: Promise<void>): void {
  cb.__aio_promise = p;
  // Reap from the table when the promise settles.
  p.then(() => { _jobs.delete(id); });
}

function _settle(cb: aiocb, errnoVal: number, result: number): void {
  if (cb.__aio_state === "cancelled") return;
  cb.__aio_state = "done";
  cb.__aio_errno = errnoVal;
  cb.__aio_result = result;
}

function _submitRead(cb: aiocb, fd: number): Promise<void> {
  const view = _bufView(cb.aio_buf);
  if (!view) {
    _settle(cb, EINVAL, -1);
    return Promise.resolve();
  }
  const fs = _loadFs();
  if (!fs) {
    _settle(cb, EBADF, -1);
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    fs.read(fd, view, 0, cb.aio_nbytes, cb.aio_offset, (err: any, bytesRead: number) => {
      if (err) {
        _settle(cb, typeof err.errno === "number" ? Math.abs(err.errno) : EBADF, -1);
      } else {
        _settle(cb, 0, bytesRead);
      }
      resolve();
    });
  });
}

function _submitWrite(cb: aiocb, fd: number): Promise<void> {
  const view = _bufView(cb.aio_buf);
  if (!view) {
    _settle(cb, EINVAL, -1);
    return Promise.resolve();
  }
  const fs = _loadFs();
  if (!fs) {
    _settle(cb, EBADF, -1);
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    fs.write(fd, view, 0, cb.aio_nbytes, cb.aio_offset, (err: any, bytesWritten: number) => {
      if (err) {
        _settle(cb, typeof err.errno === "number" ? Math.abs(err.errno) : EBADF, -1);
      } else {
        _settle(cb, 0, bytesWritten);
      }
      resolve();
    });
  });
}

function _submitFsync(cb: aiocb, fd: number, op: number): Promise<void> {
  const fs = _loadFs();
  if (!fs) {
    _settle(cb, EBADF, -1);
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const cb2 = (err: any) => {
      if (err) {
        _settle(cb, typeof err.errno === "number" ? Math.abs(err.errno) : EBADF, -1);
      } else {
        _settle(cb, 0, 0);
      }
      resolve();
    };
    if (op === O_DSYNC) fs.fdatasync(fd, cb2);
    else fs.fsync(fd, cb2);
  });
}

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------

/** POSIX aio_read — IEEE Std 1003.1-2017 §aio_read. Submits an async read.
 *  Returns 0 on successful submission, -1 on error. */
export function aio_read(cb: aiocb | null): number {
  if (!cb) { errno = EINVAL; return -1; }
  if (typeof cb.aio_fildes !== "number" || cb.aio_fildes < 0) { errno = EBADF; return -1; }
  const id = _initJob(cb, cb.aio_fildes);
  const p = _submitRead(cb, cb.aio_fildes);
  _attachPromise(cb, id, p);
  return 0;
}

/** POSIX aio_write — IEEE Std 1003.1-2017 §aio_write. */
export function aio_write(cb: aiocb | null): number {
  if (!cb) { errno = EINVAL; return -1; }
  if (typeof cb.aio_fildes !== "number" || cb.aio_fildes < 0) { errno = EBADF; return -1; }
  const id = _initJob(cb, cb.aio_fildes);
  const p = _submitWrite(cb, cb.aio_fildes);
  _attachPromise(cb, id, p);
  return 0;
}

/** POSIX aio_fsync — IEEE Std 1003.1-2017 §aio_fsync. */
export function aio_fsync(op: number, cb: aiocb | null): number {
  if (!cb) { errno = EINVAL; return -1; }
  if (typeof cb.aio_fildes !== "number" || cb.aio_fildes < 0) { errno = EBADF; return -1; }
  const id = _initJob(cb, cb.aio_fildes);
  const p = _submitFsync(cb, cb.aio_fildes, op);
  _attachPromise(cb, id, p);
  return 0;
}

/** POSIX aio_error — IEEE Std 1003.1-2017 §aio_error. Returns:
 *    EINPROGRESS  — operation has not completed yet.
 *    0            — completed successfully.
 *    >0           — completed with this errno.
 */
export function aio_error(cb: aiocb | null): number {
  if (!cb) return EINVAL;
  return cb.__aio_errno ?? EINVAL;
}

/** POSIX aio_return — IEEE Std 1003.1-2017 §aio_return. Returns the byte
 *  count (or -1) and consumes the result. Calling aio_return twice on the
 *  same aiocb yields -1 on the second call (POSIX leaves it undefined; we
 *  pick the safe path). */
export function aio_return(cb: aiocb | null): number {
  if (!cb) { errno = EINVAL; return -1; }
  if (cb.__aio_state !== "done" && cb.__aio_state !== "cancelled") {
    errno = EINVAL;
    return -1;
  }
  const r = cb.__aio_result ?? -1;
  // Mark consumed.
  cb.__aio_state = undefined;
  cb.__aio_result = undefined;
  cb.__aio_errno = undefined;
  return r;
}

/** POSIX aio_cancel — IEEE Std 1003.1-2017 §aio_cancel. */
export function aio_cancel(fildes: number, cb: aiocb | null): number {
  let any = false;
  let inflight = false;
  for (const job of _jobs.values()) {
    if (job.fd !== fildes) continue;
    if (cb && job.cb !== cb) continue;
    any = true;
    if (job.cb.__aio_state === "pending") {
      job.cb.__aio_state = "cancelled";
      job.cb.__aio_errno = ECANCELED;
      job.cb.__aio_result = -1;
      // We can only mark; the underlying fs.read/write callback still fires.
      // It will see state === "cancelled" via _settle and not overwrite.
      inflight = true;
    }
  }
  if (!any) return AIO_ALLDONE;
  return inflight ? AIO_NOTCANCELED : AIO_CANCELED;
}

/** POSIX aio_suspend — IEEE Std 1003.1-2017 §aio_suspend. Waits for one of
 *  the listed jobs to complete (or `timeout` to elapse). Promise-based since
 *  there is no synchronous wait primitive in JS. */
export async function aio_suspend(
  list: (aiocb | null)[],
  _timeout: { tv_sec?: number; tv_nsec?: number } | null = null,
): Promise<number> {
  const promises: Promise<void>[] = [];
  for (const cb of list) {
    if (!cb) continue;
    if (cb.__aio_state === "done" || cb.__aio_state === "cancelled") return 0;
    if (cb.__aio_promise) promises.push(cb.__aio_promise);
  }
  if (promises.length === 0) return 0;
  const timeoutMs = _timeout
    ? (_timeout.tv_sec ?? 0) * 1000 + Math.floor((_timeout.tv_nsec ?? 0) / 1e6)
    : 0;
  if (timeoutMs > 0) {
    const t = new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), timeoutMs));
    const r = await Promise.race([
      Promise.race(promises).then(() => "done"),
      t,
    ]);
    if (r === "timeout") { errno = EINPROGRESS; return -1; }
    return 0;
  }
  await Promise.race(promises);
  return 0;
}

/** POSIX lio_listio — IEEE Std 1003.1-2017 §lio_listio. */
export async function lio_listio(
  mode: number,
  list: (aiocb | null)[],
  _nent: number,
  _sig: any = null,
): Promise<number> {
  if (mode !== LIO_NOWAIT && mode !== LIO_WAIT) { errno = EINVAL; return -1; }
  const promises: Promise<void>[] = [];
  for (const cb of list) {
    if (!cb) continue;
    const op = cb.aio_lio_opcode ?? LIO_NOP;
    if (op === LIO_NOP) continue;
    if (op === LIO_READ) {
      if (aio_read(cb) < 0) return -1;
    } else if (op === LIO_WRITE) {
      if (aio_write(cb) < 0) return -1;
    } else {
      errno = EINVAL;
      return -1;
    }
    if (cb.__aio_promise) promises.push(cb.__aio_promise);
  }
  if (mode === LIO_WAIT && promises.length > 0) {
    await Promise.all(promises);
  }
  return 0;
}
