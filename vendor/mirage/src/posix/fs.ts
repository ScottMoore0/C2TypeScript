// Mirage L.8+: POSIX <unistd.h> filesystem helpers.
// IEEE Std 1003.1-2017.
//
// This module only contains constants and free helpers. The actual stateful
// operations (chdir, getcwd, unlink, link, symlink, …) are exposed as methods
// on MirageOS and delegate to the VFS + Environment.
//
// We define here:
//   * access() mode bits: F_OK / R_OK / W_OK / X_OK — §access.
//   * errno values used by the POSIX file APIs — POSIX §<errno.h>.
//
// These are exported from ../index.ts so translated C programs can use them.

// ---------------------------------------------------------------------------
// <unistd.h> — access() mode flags. POSIX §access.
// ---------------------------------------------------------------------------

export const F_OK = 0;  // existence test
export const R_OK = 4;  // read permission
export const W_OK = 2;  // write permission
export const X_OK = 1;  // execute/search permission

// ---------------------------------------------------------------------------
// POSIX §<errno.h> — values used by dirent/stat/fs helpers. Linux-canonical
// numbers that de-facto define the POSIX ABI. Callers that only check for
// success (return 0) vs error (return -1) can ignore these; callers that want
// to set a C-style errno from JS can use them with `MirageOS.errno`.
// ---------------------------------------------------------------------------

export const ENOENT       = 2;
export const EBADF        = 9;
export const EACCES       = 13;
export const EEXIST       = 17;
export const ENOTDIR      = 20;
export const EISDIR       = 21;
export const EINVAL       = 22;
export const ENAMETOOLONG = 36;
export const ENOTEMPTY    = 39;
export const ELOOP        = 40;
