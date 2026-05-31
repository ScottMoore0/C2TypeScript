// Mirage POSIX <sys/uio.h> — vectored (scatter/gather) I/O.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<sys/uio.h>:
//       ssize_t readv  (int fd, const struct iovec *iov, int iovcnt);
//       ssize_t writev (int fd, const struct iovec *iov, int iovcnt);
//   * Linux extensions (preadv / pwritev — POSIX 2008 added pread/pwrite shapes):
//       ssize_t preadv (int fd, const struct iovec *iov, int iovcnt, off_t off);
//       ssize_t pwritev(int fd, const struct iovec *iov, int iovcnt, off_t off);
//
// `struct iovec { void *iov_base; size_t iov_len; }` — one entry per buffer.
// readv/writev act as if a sequence of read()/write() calls had been issued
// over the iovec entries in order, atomically with respect to other writers
// (POSIX §readv: "The data transfers shall occur in the order of the elements
// in the iov array.").
//
// BRIDGE: posix-uio — readv/writev/preadv/pwritev → loop of single
// read/write calls over MirageOS file descriptor table. JavaScript has no
// vectored read/write primitive on `node:fs` or `node:net` (Node's
// fs.read accepts an array of buffers but not via the native iovec ABI),
// so we lower to N single-call iterations. POSIX permits short returns,
// so the loop bails as soon as a single call returns 0 (EOF) or short.
//
// Scope:
//   * fds opened through MirageOS (FileDescriptorTable) — any Stream.
//   * Socket fds (via NET_FD_BASE in posix/sockets.ts) — routed through
//     posix_send / posix_recv loops.
//   * preadv/pwritev preserve the file offset (POSIX §pread: "shall not
//     change the current file position"). We save+restore via lseek(fd,
//     0, SEEK_CUR) → seek-to-off → call → seek-back.

import { MirageOS } from "../os.js";
import {
  send as posix_send,
  recv as posix_recv,
  isSocketFd as posix_is_socket_fd,
} from "./sockets.js";

// ---------------------------------------------------------------------------
// errno values used here. POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EBADF  = 9;
const EINVAL = 22;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

/** Test-only: clear module errno. */
export function _resetUio(): void { errno = 0; }

let _singleton: MirageOS | null = null;
function _os(): MirageOS {
  if (_singleton === null) _singleton = new MirageOS();
  return _singleton;
}

/** Test-only — install a specific OS singleton (also lets the singleton be
 *  shared with other free-function modules that look up the same OS). */
export function _setUioOs(os: MirageOS | null): void {
  _singleton = os;
}

// ---------------------------------------------------------------------------
// iovec parsing — translator may emit iov as:
//   * an Array<{ iov_base: <buf-like>, iov_len: number }>
//   * a single CPtr-like object with .buf/.off pointing at packed iovec records
//     (we model this with iov.value === Array<...> as the canonical refactor
//     target — see the BRIDGE note above).
// ---------------------------------------------------------------------------

interface IoVec {
  iov_base: any;       // CPtr | Uint8Array | Array<number> | string
  iov_len: number;
}

function parseIovArray(iov: any, iovcnt: number): IoVec[] | null {
  if (!iov) return null;
  if (Array.isArray(iov)) {
    return iov.slice(0, iovcnt).map((e) => ({
      iov_base: e.iov_base ?? e.base ?? e[0],
      iov_len: (e.iov_len ?? e.len ?? e[1]) | 0,
    }));
  }
  // Object with .value === Array — the refactorable shape we prefer.
  if (typeof iov === "object" && "value" in iov && Array.isArray(iov.value)) {
    return parseIovArray(iov.value, iovcnt);
  }
  return null;
}

/** Coerce an iov_base into a writable Uint8Array view of `len` bytes. */
function bufView(base: any, len: number): Uint8Array | null {
  if (base instanceof Uint8Array) return base.subarray(0, len);
  if (base && base.buf instanceof Uint8Array && typeof base.off === "number") {
    return base.buf.subarray(base.off, base.off + len);
  }
  if (Array.isArray(base)) {
    // Make a fresh view; caller will copy back.
    return new Uint8Array(base.slice(0, len));
  }
  if (typeof base === "string") {
    return new TextEncoder().encode(base).subarray(0, len);
  }
  return null;
}

/** Copy bytes back into a translator-emitted iov_base after a read. */
function writeBackIovBase(base: any, src: Uint8Array): void {
  if (!base) return;
  if (base instanceof Uint8Array) { base.set(src.subarray(0, Math.min(src.length, base.length))); return; }
  if (base && base.buf instanceof Uint8Array && typeof base.off === "number") {
    for (let i = 0; i < src.length; i++) base.buf[base.off + i] = src[i]!;
    return;
  }
  if (Array.isArray(base)) {
    for (let i = 0; i < src.length; i++) base[i] = src[i]!;
  }
}

// ---------------------------------------------------------------------------
// readv / writev / preadv / pwritev — POSIX §<sys/uio.h>.
// ---------------------------------------------------------------------------

/** POSIX readv(fd, iov, iovcnt) — IEEE Std 1003.1-2017 §readv. */
export function readv(fd: number, iov: any, iovcnt: number): number {
  if (iovcnt < 0) { errno = EINVAL; return -1; }
  const vecs = parseIovArray(iov, iovcnt);
  if (!vecs) { errno = EINVAL; return -1; }

  // Socket fd — fall through to posix_recv loop.
  if (posix_is_socket_fd(fd)) {
    let total = 0;
    for (const v of vecs) {
      if (v.iov_len <= 0) continue;
      const tmp = new Uint8Array(v.iov_len);
      const n = posix_recv(fd, tmp, v.iov_len, 0);
      if (n < 0) { if (total === 0) { errno = EBADF; return -1; } return total; }
      writeBackIovBase(v.iov_base, tmp.subarray(0, n));
      total += n;
      if (n < v.iov_len) break; // short read — POSIX permits this on a single call.
    }
    return total;
  }

  // File-stream fd — drive MirageOS.readInto.
  const os = _os();
  if (!os.fds.has(fd)) { errno = EBADF; return -1; }
  let total = 0;
  for (const v of vecs) {
    if (v.iov_len <= 0) continue;
    const tmp = new Uint8Array(v.iov_len);
    let n: number;
    try {
      n = os.readInto(fd, tmp, v.iov_len);
    } catch { errno = EBADF; return total === 0 ? -1 : total; }
    if (n <= 0) break;
    writeBackIovBase(v.iov_base, tmp.subarray(0, n));
    total += n;
    if (n < v.iov_len) break;
  }
  return total;
}

/** POSIX writev(fd, iov, iovcnt) — IEEE Std 1003.1-2017 §writev. */
export function writev(fd: number, iov: any, iovcnt: number): number {
  if (iovcnt < 0) { errno = EINVAL; return -1; }
  const vecs = parseIovArray(iov, iovcnt);
  if (!vecs) { errno = EINVAL; return -1; }

  if (posix_is_socket_fd(fd)) {
    let total = 0;
    for (const v of vecs) {
      if (v.iov_len <= 0) continue;
      const view = bufView(v.iov_base, v.iov_len);
      if (!view) { errno = EINVAL; return total === 0 ? -1 : total; }
      const n = posix_send(fd, view, view.length, 0);
      if (n < 0) { if (total === 0) { errno = EBADF; return -1; } return total; }
      total += n;
      if (n < view.length) break;
    }
    return total;
  }

  const os = _os();
  if (!os.fds.has(fd)) { errno = EBADF; return -1; }
  let total = 0;
  for (const v of vecs) {
    if (v.iov_len <= 0) continue;
    const view = bufView(v.iov_base, v.iov_len);
    if (!view) { errno = EINVAL; return total === 0 ? -1 : total; }
    let n: number;
    try {
      n = os.write(fd, view);
    } catch { errno = EBADF; return total === 0 ? -1 : total; }
    if (n <= 0) break;
    total += n;
    if (n < view.length) break;
  }
  return total;
}

/** Linux-extension preadv(fd, iov, iovcnt, offset) — POSIX 2008 + Linux. */
export function preadv(fd: number, iov: any, iovcnt: number, offset: number): number {
  // Save current offset, seek to `offset`, call readv, seek back.
  const os = _os();
  if (posix_is_socket_fd(fd)) { errno = EINVAL; return -1; } // sockets are not seekable
  if (!os.fds.has(fd)) { errno = EBADF; return -1; }
  const saved = os.lseek(fd, 0, "cur");
  os.lseek(fd, offset, "set");
  const r = readv(fd, iov, iovcnt);
  os.lseek(fd, saved, "set");
  return r;
}

/** Linux-extension pwritev(fd, iov, iovcnt, offset) — POSIX 2008 + Linux. */
export function pwritev(fd: number, iov: any, iovcnt: number, offset: number): number {
  const os = _os();
  if (posix_is_socket_fd(fd)) { errno = EINVAL; return -1; }
  if (!os.fds.has(fd)) { errno = EBADF; return -1; }
  const saved = os.lseek(fd, 0, "cur");
  os.lseek(fd, offset, "set");
  const r = writev(fd, iov, iovcnt);
  os.lseek(fd, saved, "set");
  return r;
}

/** struct iovec — exposed for translator emission. */
export interface iovec {
  iov_base: any;
  iov_len: number;
}
