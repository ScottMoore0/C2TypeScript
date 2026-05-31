// Mirage POSIX small surfaces — getlogin, getpwuid, getgrgid, getgroups,
// pathconf, confstr, sysconf, nice. These are the residual <unistd.h>,
// <pwd.h>, <grp.h> functions identified by the C coverage audit.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<unistd.h>:
//       char *getlogin(void);
//       int getlogin_r(char *buf, size_t len);
//       int getgroups(int size, gid_t list[]);
//       long pathconf(const char *path, int name);
//       long fpathconf(int fd, int name);
//       size_t confstr(int name, char *buf, size_t len);
//       long sysconf(int name);
//       int nice(int incr);
//   * IEEE Std 1003.1-2017 §<pwd.h>:
//       struct passwd *getpwuid(uid_t uid);
//       struct passwd *getpwnam(const char *name);
//       struct passwd *getpwent(void);
//       void setpwent(void); void endpwent(void);
//       int getpwuid_r(...); int getpwnam_r(...);
//   * IEEE Std 1003.1-2017 §<grp.h>:
//       struct group *getgrgid(gid_t gid);
//       struct group *getgrnam(const char *name);
//       struct group *getgrent(void);
//
// Approach
// --------
// Mirage runs in a browser or Node host where there is no real /etc/passwd.
// We populate a single "current user" entry via Node's `os.userInfo()` (when
// available) or via process.env.USER / process.env.LOGNAME, and stub all
// other lookups (return null + ENOENT). sysconf/pathconf/confstr return
// canonical Linux defaults for the well-known queries.
//
// BRIDGE: posix-unistd-misc — small POSIX functions for process introspection
// and system-config queries; backed by node:os when available.

// ---------------------------------------------------------------------------
// errno aliases.
// ---------------------------------------------------------------------------

const _ENOENT = 2;
const _EINVAL = 22;
const _ERANGE = 34;
const _ENOSYS = 38;

/** Module-level errno (matches other Mirage POSIX shim style). */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Optional Node bridges. We resolve lazily so this module loads in both
// browser and Node environments.
// ---------------------------------------------------------------------------

interface NodeUserInfo {
  username: string;
  uid: number;
  gid: number;
  shell: string | null;
  homedir: string;
}

function _isNode(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = globalThis as any;
  return !!(g.process && g.process.versions && g.process.versions.node);
}

let _userInfoCache: NodeUserInfo | null = null;
function _userInfo(): NodeUserInfo | null {
  if (_userInfoCache) return _userInfoCache;
  if (!_isNode()) return null;
  try {
    // Avoid static import so a browser host doesn't pull node:os.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const os = (globalThis as { require?: (m: string) => unknown }).require?.("node:os")
              ?? (globalThis as { require?: (m: string) => unknown }).require?.("os");
    if (os && typeof (os as { userInfo?: () => unknown }).userInfo === "function") {
      const u = (os as { userInfo: () => NodeUserInfo }).userInfo();
      _userInfoCache = u;
      return u;
    }
  } catch { /* fall through */ }
  return null;
}

// Allow tests to bypass require() and inject a synthetic user.
let _injectedUser: NodeUserInfo | null = null;
export function _setInjectedUser(u: NodeUserInfo | null): void {
  _injectedUser = u;
  _userInfoCache = null;
}

function _currentUser(): NodeUserInfo {
  if (_injectedUser) return _injectedUser;
  const u = _userInfo();
  if (u) return u;
  // Fall back to env var / synthetic defaults.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = ((globalThis as any).process?.env ?? {}) as Record<string, string>;
  const username = env.USER ?? env.LOGNAME ?? env.USERNAME ?? "user";
  return {
    username,
    uid: 1000,
    gid: 1000,
    shell: env.SHELL ?? null,
    homedir: env.HOME ?? "/home/" + username,
  };
}

/** Test-only: clear all cached state. */
export function _resetUnistdMisc(): void {
  _userInfoCache = null;
  _injectedUser = null;
  _pwentCursor = 0;
  _grentCursor = 0;
  errno = 0;
}

// ---------------------------------------------------------------------------
// getlogin / getlogin_r.
// ---------------------------------------------------------------------------

/** POSIX getlogin() — name of the user logged in on the controlling tty. */
export function getlogin(): string | null {
  const u = _currentUser();
  if (!u.username) { errno = _ENOENT; return null; }
  return u.username;
}

/** POSIX getlogin_r(buf, len) — re-entrant variant. Writes username into
 *  the caller's buffer object as `buf.value` (string). Returns 0 or errno. */
export function getlogin_r(
  buf: { value?: string } | null,
  len: number,
): number {
  if (!buf) return _EINVAL;
  const name = getlogin();
  if (name === null) return _ENOENT;
  if (name.length + 1 > len) return _ERANGE;
  buf.value = name;
  return 0;
}

// ---------------------------------------------------------------------------
// struct passwd + getpwuid / getpwnam / getpwent.
// ---------------------------------------------------------------------------

export interface passwd {
  pw_name:   string;
  pw_passwd: string;
  pw_uid:    number;
  pw_gid:    number;
  pw_gecos:  string;
  pw_dir:    string;
  pw_shell:  string;
}

function _pwForCurrent(): passwd {
  const u = _currentUser();
  return {
    pw_name:   u.username,
    pw_passwd: "x",
    pw_uid:    u.uid,
    pw_gid:    u.gid,
    pw_gecos:  u.username,
    pw_dir:    u.homedir,
    pw_shell:  u.shell ?? "/bin/sh",
  };
}

/** POSIX getpwuid(uid). Returns the current-user entry if uid matches,
 *  otherwise null with errno = ENOENT (no /etc/passwd available). */
export function getpwuid(uid: number): passwd | null {
  const cur = _pwForCurrent();
  if (uid === cur.pw_uid) return cur;
  errno = _ENOENT;
  return null;
}

/** POSIX getpwnam(name). Returns current-user entry if name matches. */
export function getpwnam(name: string): passwd | null {
  const cur = _pwForCurrent();
  if (name === cur.pw_name) return cur;
  errno = _ENOENT;
  return null;
}

/** Re-entrant getpwuid_r(uid, pwd, buf, buflen, result). Result is written
 *  to result.value (passwd or null). Returns 0 on success / 0 if not-found
 *  with result.value == null / errno-style code on error. */
export function getpwuid_r(
  uid: number,
  pwd: Partial<passwd> | null,
  _buf: unknown,
  _buflen: number,
  result: { value?: passwd | null } | null,
): number {
  if (!pwd || !result) return _EINVAL;
  const e = getpwuid(uid);
  if (e === null) { result.value = null; return 0; }
  Object.assign(pwd, e);
  result.value = pwd as passwd;
  return 0;
}

/** Re-entrant getpwnam_r(name, pwd, buf, buflen, result). */
export function getpwnam_r(
  name: string,
  pwd: Partial<passwd> | null,
  _buf: unknown,
  _buflen: number,
  result: { value?: passwd | null } | null,
): number {
  if (!pwd || !result) return _EINVAL;
  const e = getpwnam(name);
  if (e === null) { result.value = null; return 0; }
  Object.assign(pwd, e);
  result.value = pwd as passwd;
  return 0;
}

let _pwentCursor = 0;
/** POSIX getpwent() — sequential read of /etc/passwd. Mirage exposes the
 *  current user as the only entry, then null at end of stream. */
export function getpwent(): passwd | null {
  if (_pwentCursor === 0) { _pwentCursor = 1; return _pwForCurrent(); }
  return null;
}
export function setpwent(): void { _pwentCursor = 0; }
export function endpwent(): void { _pwentCursor = 0; }

// ---------------------------------------------------------------------------
// struct group + getgrgid / getgrnam / getgrent / getgroups.
// ---------------------------------------------------------------------------

export interface group {
  gr_name:   string;
  gr_passwd: string;
  gr_gid:    number;
  gr_mem:    string[];
}

function _grForCurrent(): group {
  const u = _currentUser();
  return {
    gr_name:   u.username,
    gr_passwd: "x",
    gr_gid:    u.gid,
    gr_mem:    [u.username],
  };
}

export function getgrgid(gid: number): group | null {
  const cur = _grForCurrent();
  if (gid === cur.gr_gid) return cur;
  errno = _ENOENT;
  return null;
}

export function getgrnam(name: string): group | null {
  const cur = _grForCurrent();
  if (name === cur.gr_name) return cur;
  errno = _ENOENT;
  return null;
}

let _grentCursor = 0;
export function getgrent(): group | null {
  if (_grentCursor === 0) { _grentCursor = 1; return _grForCurrent(); }
  return null;
}
export function setgrent(): void { _grentCursor = 0; }
export function endgrent(): void { _grentCursor = 0; }

/** POSIX getgroups(size, list) — supplementary GIDs of the calling process.
 *  Mirage reports the single primary GID. If size == 0 returns the count
 *  without writing list. Returns -1 with errno=EINVAL if list too small. */
export function getgroups(size: number, list: number[] | Int32Array | null): number {
  const u = _currentUser();
  const ngroups = 1;
  if (size === 0) return ngroups;
  if (size < ngroups || list === null) { errno = _EINVAL; return -1; }
  list[0] = u.gid;
  return ngroups;
}

// ---------------------------------------------------------------------------
// sysconf / pathconf / fpathconf / confstr.
//
// We mirror Linux glibc's _SC_*, _PC_*, _CS_* constant numbering so emitted
// translated code can use the literals it inherits from <unistd.h>.
// ---------------------------------------------------------------------------

export const _SC_ARG_MAX            = 0;
export const _SC_CHILD_MAX          = 1;
export const _SC_CLK_TCK            = 2;
export const _SC_NGROUPS_MAX        = 3;
export const _SC_OPEN_MAX           = 4;
export const _SC_STREAM_MAX         = 5;
export const _SC_TZNAME_MAX         = 6;
export const _SC_JOB_CONTROL        = 7;
export const _SC_SAVED_IDS          = 8;
export const _SC_VERSION            = 29;
export const _SC_LINE_MAX           = 43;
export const _SC_PAGESIZE           = 30;
export const _SC_PAGE_SIZE          = 30;  // alias
export const _SC_NPROCESSORS_CONF   = 83;
export const _SC_NPROCESSORS_ONLN   = 84;
export const _SC_PHYS_PAGES         = 85;
export const _SC_AVPHYS_PAGES       = 86;
export const _SC_HOST_NAME_MAX      = 180;
export const _SC_LOGIN_NAME_MAX     = 71;
export const _SC_TTY_NAME_MAX       = 72;
export const _SC_GETPW_R_SIZE_MAX   = 70;
export const _SC_GETGR_R_SIZE_MAX   = 69;
export const _SC_SYMLOOP_MAX        = 173;

/** POSIX sysconf(name) — system limit / option query. Returns long; -1
 *  with errno=EINVAL for unknown names. */
export function sysconf(name: number): number {
  switch (name) {
    case _SC_ARG_MAX:           return 2097152;       // 2 MiB (Linux default)
    case _SC_CHILD_MAX:         return 2048;
    case _SC_CLK_TCK:           return 100;           // POSIX-canonical Linux value
    case _SC_NGROUPS_MAX:       return 65536;
    case _SC_OPEN_MAX:          return 1024;
    case _SC_STREAM_MAX:        return 16;
    case _SC_TZNAME_MAX:        return 6;
    case _SC_JOB_CONTROL:       return 1;
    case _SC_SAVED_IDS:         return 1;
    case _SC_VERSION:           return 200809;        // POSIX.1-2008
    case _SC_LINE_MAX:          return 2048;
    case _SC_PAGESIZE:          return 4096;
    case _SC_NPROCESSORS_CONF:
    case _SC_NPROCESSORS_ONLN: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g: any = globalThis as any;
      return g.navigator?.hardwareConcurrency ?? 1;
    }
    case _SC_PHYS_PAGES:        return 1024 * 1024;   // 4 GiB worth
    case _SC_AVPHYS_PAGES:      return 512 * 1024;
    case _SC_HOST_NAME_MAX:     return 64;
    case _SC_LOGIN_NAME_MAX:    return 256;
    case _SC_TTY_NAME_MAX:      return 32;
    case _SC_GETPW_R_SIZE_MAX:  return 1024;
    case _SC_GETGR_R_SIZE_MAX:  return 1024;
    case _SC_SYMLOOP_MAX:       return 40;
    default: errno = _EINVAL; return -1;
  }
}

export const _PC_LINK_MAX           = 0;
export const _PC_MAX_CANON          = 1;
export const _PC_MAX_INPUT          = 2;
export const _PC_NAME_MAX           = 3;
export const _PC_PATH_MAX           = 4;
export const _PC_PIPE_BUF           = 5;
export const _PC_CHOWN_RESTRICTED   = 6;
export const _PC_NO_TRUNC           = 7;
export const _PC_VDISABLE           = 8;
export const _PC_SYNC_IO            = 9;
export const _PC_ASYNC_IO           = 10;
export const _PC_PRIO_IO            = 11;
export const _PC_SOCK_MAXBUF        = 12;
export const _PC_FILESIZEBITS       = 13;
export const _PC_REC_INCR_XFER_SIZE = 14;
export const _PC_REC_MAX_XFER_SIZE  = 15;
export const _PC_REC_MIN_XFER_SIZE  = 16;
export const _PC_REC_XFER_ALIGN     = 17;
export const _PC_ALLOC_SIZE_MIN     = 18;
export const _PC_SYMLINK_MAX        = 19;
export const _PC_2_SYMLINKS         = 20;

function _pathconfImpl(name: number): number {
  switch (name) {
    case _PC_LINK_MAX:         return 127;
    case _PC_MAX_CANON:        return 255;
    case _PC_MAX_INPUT:        return 255;
    case _PC_NAME_MAX:         return 255;
    case _PC_PATH_MAX:         return 4096;
    case _PC_PIPE_BUF:         return 4096;
    case _PC_CHOWN_RESTRICTED: return 1;
    case _PC_NO_TRUNC:         return 1;
    case _PC_VDISABLE:         return 0;
    case _PC_SYNC_IO:          return 1;
    case _PC_ASYNC_IO:         return -1;
    case _PC_PRIO_IO:          return -1;
    case _PC_FILESIZEBITS:     return 64;
    case _PC_SYMLINK_MAX:      return 4096;
    case _PC_2_SYMLINKS:       return 1;
    default: errno = _EINVAL; return -1;
  }
}

/** POSIX pathconf(path, name). Path is accepted but not validated against
 *  Mirage's VFS — these are static system limits in our model. */
export function pathconf(_path: string, name: number): number {
  return _pathconfImpl(name);
}

/** POSIX fpathconf(fd, name). */
export function fpathconf(fd: number, name: number): number {
  if (fd < 0) { errno = 9 /*EBADF*/; return -1; }
  return _pathconfImpl(name);
}

export const _CS_PATH                       = 0;
export const _CS_GNU_LIBC_VERSION           = 2;
export const _CS_GNU_LIBPTHREAD_VERSION     = 3;
export const _CS_POSIX_V7_ILP32_OFF32_CFLAGS = 1116;

/** POSIX confstr(name, buf, len). Writes value into buf.value (string),
 *  returns the (1+) length needed, or 0 if name unknown. */
export function confstr(
  name: number,
  buf: { value?: string } | null,
  len: number,
): number {
  let s: string;
  switch (name) {
    case _CS_PATH:                       s = "/usr/bin:/bin"; break;
    case _CS_GNU_LIBC_VERSION:           s = "glibc 2.38"; break;
    case _CS_GNU_LIBPTHREAD_VERSION:     s = "NPTL 2.38"; break;
    case _CS_POSIX_V7_ILP32_OFF32_CFLAGS: s = ""; break;
    default: errno = _EINVAL; return 0;
  }
  const need = s.length + 1;
  if (buf && len > 0) {
    buf.value = need <= len ? s : s.slice(0, len - 1);
  }
  return need;
}

// ---------------------------------------------------------------------------
// nice — process priority adjustment.
//
// Node only exposes priority via `os.getPriority`/`os.setPriority` (Node 10+).
// Mirage tracks an in-process nice offset (clamped to POSIX range -20..19).
// ---------------------------------------------------------------------------

let _niceLevel = 0;

/** POSIX nice(incr) — add incr to the calling process nice level. Returns
 *  the new nice level, or -1 with errno=EPERM/EACCES if the change fails.
 *  In Mirage we always succeed (no real scheduler), and clamp to [-20, 19]. */
export function nice(incr: number): number {
  let next = _niceLevel + (incr | 0);
  if (next < -20) next = -20;
  if (next > 19) next = 19;
  _niceLevel = next;
  return next;
}

/** Test helper — read the current shadow nice level. */
export function _getNiceLevel(): number { return _niceLevel; }
/** Test helper — reset the shadow nice level. */
export function _resetNiceLevel(): void { _niceLevel = 0; }
