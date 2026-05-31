// Mirage Linux <sys/sendfile.h> — zero-copy file-to-socket transfer.
//
// Spec sources
// ------------
//   * Linux man-page sendfile(2):
//       https://man7.org/linux/man-pages/man2/sendfile.2.html
//     (Linux extension; not POSIX.1-2017 but ubiquitous in nginx, varnish,
//     Apache mod_proxy, Cloudflare's open-source stack.)
//       ssize_t sendfile(int out_fd, int in_fd, off_t *offset, size_t count);
//
// Semantics:
//   * Copies up to `count` bytes from `in_fd` (must be a regular file
//     supporting mmap-style reads) to `out_fd` (any fd, typically a
//     socket).
//   * If `offset` is non-null, the read starts there and the file's
//     current position is left unchanged. If null, reads from the file's
//     current position and advances it.
//   * Returns bytes transferred, or -1 on error.
//
// BRIDGE: posix-sendfile — Linux sendfile → MirageOS read-into-buffer +
// write-to-fd loop. JavaScript has no kernel-level zero-copy primitive; we
// emulate the API at the buffer level. nginx, varnish, etc. don't depend
// on the kernel-level zero-copy property — they depend on the simplified
// API and short total bytes count. We satisfy both.

import { MirageOS } from "../os.js";
import {
  send as posix_send,
  isSocketFd as posix_is_socket_fd,
} from "./sockets.js";

// ---------------------------------------------------------------------------
// errno values used here. POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EBADF  = 9;
const EINVAL = 22;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

/** Test-only — reset errno. */
export function _resetSendfile(): void { errno = 0; }

let _singleton: MirageOS | null = null;
function _os(): MirageOS {
  if (_singleton === null) _singleton = new MirageOS();
  return _singleton;
}

/** Test-only — install a specific OS singleton. */
export function _setSendfileOs(os: MirageOS | null): void {
  _singleton = os;
}

// ---------------------------------------------------------------------------
// sendfile(out_fd, in_fd, *offset, count). Linux-shape.
//
// `offsetPtr` is a translator-emitted ref-box. We accept:
//   * null / undefined — read from current file position, advance it.
//   * { value: number } — read from offsetPtr.value, write back the new
//     position; do NOT advance the file's own position.
// ---------------------------------------------------------------------------

/** Linux sendfile(out_fd, in_fd, offset, count). */
export function sendfile(
  out_fd: number,
  in_fd: number,
  offsetPtr: { value: number } | null,
  count: number,
): number {
  const os = _os();
  if (!os.fds.has(in_fd)) { errno = EBADF; return -1; }
  if (count < 0) { errno = EINVAL; return -1; }

  // Save+seek if offsetPtr provided.
  let savedPos = -1;
  if (offsetPtr) {
    savedPos = os.lseek(in_fd, 0, "cur");
    os.lseek(in_fd, offsetPtr.value | 0, "set");
  }

  // Read up to `count` bytes from the file.
  const buf = new Uint8Array(count);
  let read: number;
  try {
    read = os.readInto(in_fd, buf, count);
  } catch { errno = EBADF; return -1; }

  // Restore file position if offsetPtr was used.
  if (offsetPtr) {
    offsetPtr.value = (offsetPtr.value | 0) + Math.max(0, read);
    os.lseek(in_fd, savedPos, "set");
  }

  if (read <= 0) return 0;

  // Write to out_fd. If it's a socket, route to posix_send; else write to
  // the file table.
  let written = 0;
  if (posix_is_socket_fd(out_fd)) {
    while (written < read) {
      const n = posix_send(out_fd, buf.subarray(written, read), read - written, 0);
      if (n <= 0) { if (written === 0) { errno = EBADF; return -1; } return written; }
      written += n;
    }
    return written;
  }

  // File-output path.
  if (!os.fds.has(out_fd)) { errno = EBADF; return -1; }
  while (written < read) {
    let n: number;
    try {
      n = os.write(out_fd, buf.subarray(written, read));
    } catch { errno = EBADF; return written === 0 ? -1 : written; }
    if (n <= 0) break;
    written += n;
  }
  return written;
}
