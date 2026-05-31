// AUTO-GENERATED — C17 §7.5 errno constants
// Values match Linux glibc / CONVENTIONS.md §D12 GCC-on-x86_64-linux
// Regenerate with: npx tsx compiler/scripts/build-catalogue/generate-c-stdlib-trivials.ts
// Generated: 2026-04-22T00:07:28.455Z

// BRIDGE: libc-errno
// Module-local errno state. Matches thread-local behaviour of C.
// Refactor target: throw Error / return Result<T,E>.
let _errno_value = 0;

/** Read current errno. Thread-local semantics approximated per V8 single-thread model. */
export function c_get_errno(): number { return _errno_value; }

/** Write errno. Called by runtime helpers reporting errors. */
export function c_set_errno(v: number): void { _errno_value = v; }

// Error-code constants:
/** errno 1: Operation not permitted */
export const EPERM: number = 1;
/** errno 2: No such file or directory */
export const ENOENT: number = 2;
/** errno 3: No such process */
export const ESRCH: number = 3;
/** errno 4: Interrupted system call */
export const EINTR: number = 4;
/** errno 5: I/O error */
export const EIO: number = 5;
/** errno 6: No such device or address */
export const ENXIO: number = 6;
/** errno 7: Argument list too long */
export const E2BIG: number = 7;
/** errno 8: Exec format error */
export const ENOEXEC: number = 8;
/** errno 9: Bad file number */
export const EBADF: number = 9;
/** errno 10: No child processes */
export const ECHILD: number = 10;
/** errno 11: Try again */
export const EAGAIN: number = 11;
/** errno 12: Out of memory */
export const ENOMEM: number = 12;
/** errno 13: Permission denied */
export const EACCES: number = 13;
/** errno 14: Bad address */
export const EFAULT: number = 14;
/** errno 15: Block device required */
export const ENOTBLK: number = 15;
/** errno 16: Device or resource busy */
export const EBUSY: number = 16;
/** errno 17: File exists */
export const EEXIST: number = 17;
/** errno 18: Cross-device link */
export const EXDEV: number = 18;
/** errno 19: No such device */
export const ENODEV: number = 19;
/** errno 20: Not a directory */
export const ENOTDIR: number = 20;
/** errno 21: Is a directory */
export const EISDIR: number = 21;
/** errno 22: Invalid argument */
export const EINVAL: number = 22;
/** errno 23: File table overflow */
export const ENFILE: number = 23;
/** errno 24: Too many open files */
export const EMFILE: number = 24;
/** errno 25: Not a typewriter */
export const ENOTTY: number = 25;
/** errno 26: Text file busy */
export const ETXTBSY: number = 26;
/** errno 27: File too large */
export const EFBIG: number = 27;
/** errno 28: No space left on device */
export const ENOSPC: number = 28;
/** errno 29: Illegal seek */
export const ESPIPE: number = 29;
/** errno 30: Read-only file system */
export const EROFS: number = 30;
/** errno 31: Too many links */
export const EMLINK: number = 31;
/** errno 32: Broken pipe */
export const EPIPE: number = 32;
/** errno 33: Math argument out of domain of func */
export const EDOM: number = 33;
/** errno 34: Math result not representable */
export const ERANGE: number = 34;
/** errno 35: Resource deadlock would occur */
export const EDEADLK: number = 35;
/** errno 36: File name too long */
export const ENAMETOOLONG: number = 36;
/** errno 37: No record locks available */
export const ENOLCK: number = 37;
/** errno 38: Function not implemented */
export const ENOSYS: number = 38;
/** errno 39: Directory not empty */
export const ENOTEMPTY: number = 39;
/** errno 40: Too many symbolic links encountered */
export const ELOOP: number = 40;
/** errno 11: Operation would block (alias for EAGAIN) */
export const EWOULDBLOCK: number = 11;