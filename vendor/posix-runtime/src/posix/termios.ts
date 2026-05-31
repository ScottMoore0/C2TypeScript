// Mirage POSIX <termios.h> — terminal I/O attributes.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<termios.h>:
//       int tcgetattr(int fd, struct termios *t);
//       int tcsetattr(int fd, int optional_actions, const struct termios *t);
//       int tcdrain(int fd);
//       int tcflush(int fd, int queue_selector);
//       int tcflow(int fd, int action);
//       int tcsendbreak(int fd, int duration);
//       pid_t tcgetsid(int fd);
//       speed_t cfgetispeed(const struct termios *t);
//       speed_t cfgetospeed(const struct termios *t);
//       int cfsetispeed(struct termios *t, speed_t speed);
//       int cfsetospeed(struct termios *t, speed_t speed);
//       int cfsetspeed(struct termios *t, speed_t speed);   (BSD/Linux ext)
//       void cfmakeraw(struct termios *t);                  (BSD/Linux ext)
//
// API context — raw mode and VMIN/VTIME
// -------------------------------------
// Translated terminal emulators, REPLs, TUI libraries (ncurses-equivalent),
// and shells canonically configure raw mode by clearing flag bits in
// c_lflag/c_iflag/c_oflag/c_cflag and setting c_cc[VMIN]/c_cc[VTIME]:
//   c_lflag &= ~(ECHO | ICANON | ISIG | IEXTEN);  // raw input
//   c_iflag &= ~(IXON | ICRNL | BRKINT | INPCK | ISTRIP);
//   c_oflag &= ~OPOST;                            // raw output
//   c_cflag &= ~(CSIZE | PARENB);                 // 8-bit chars
//   c_cflag |= CS8;
//   c_cc[VMIN]  = N;                              // min bytes for read()
//   c_cc[VTIME] = T;                              // decisecond timeout
//
// The VMIN/VTIME pair governs blocking-read semantics:
//   VMIN > 0, VTIME == 0 — block until at least VMIN bytes available.
//   VMIN == 0, VTIME > 0 — block up to VTIME×100ms; return 0+available bytes.
//   VMIN > 0, VTIME > 0 — interbyte timer; block until VMIN bytes OR timeout.
//   VMIN == 0, VTIME == 0 — return immediately with whatever's available.
//
// In Mirage there is no real terminal driver, so tcgetattr/tcsetattr operate
// on a per-fd shadow termios state. Raw-mode flag manipulation is preserved
// bit-for-bit so emulators that probe their own state get consistent
// results. tcdrain/tcflush/tcflow are no-ops (no kernel queue to drain).
//
// BRIDGE: posix-termios — translated `tcgetattr`/`tcsetattr` route here;
// the host has no real tty, so each fd has a per-fd shadow termios.

// ---------------------------------------------------------------------------
// c_cc[] subscript constants (POSIX + Linux extensions).
// ---------------------------------------------------------------------------

export const VINTR    = 0;
export const VQUIT    = 1;
export const VERASE   = 2;
export const VKILL    = 3;
export const VEOF     = 4;
export const VTIME    = 5;
export const VMIN     = 6;
export const VSWTC    = 7;
export const VSTART   = 8;
export const VSTOP    = 9;
export const VSUSP    = 10;
export const VEOL     = 11;
export const VREPRINT = 12;
export const VDISCARD = 13;
export const VWERASE  = 14;
export const VLNEXT   = 15;
export const VEOL2    = 16;

/** Size of c_cc[] — POSIX mandates NCCS but the value varies by system. */
export const NCCS = 32;

// ---------------------------------------------------------------------------
// c_iflag — input modes (POSIX + Linux).
// ---------------------------------------------------------------------------

export const IGNBRK  = 0o000001;
export const BRKINT  = 0o000002;
export const IGNPAR  = 0o000004;
export const PARMRK  = 0o000010;
export const INPCK   = 0o000020;
export const ISTRIP  = 0o000040;
export const INLCR   = 0o000100;
export const IGNCR   = 0o000200;
export const ICRNL   = 0o000400;
export const IUCLC   = 0o001000;
export const IXON    = 0o002000;
export const IXANY   = 0o004000;
export const IXOFF   = 0o010000;
export const IMAXBEL = 0o020000;
export const IUTF8   = 0o040000;

// ---------------------------------------------------------------------------
// c_oflag — output modes.
// ---------------------------------------------------------------------------

export const OPOST  = 0o000001;
export const OLCUC  = 0o000002;
export const ONLCR  = 0o000004;
export const OCRNL  = 0o000010;
export const ONOCR  = 0o000020;
export const ONLRET = 0o000040;
export const OFILL  = 0o000100;
export const OFDEL  = 0o000200;

// ---------------------------------------------------------------------------
// c_cflag — control modes.
// ---------------------------------------------------------------------------

export const CSIZE   = 0o000060;
export const CS5     = 0o000000;
export const CS6     = 0o000020;
export const CS7     = 0o000040;
export const CS8     = 0o000060;
export const CSTOPB  = 0o000100;
export const CREAD   = 0o000200;
export const PARENB  = 0o000400;
export const PARODD  = 0o001000;
export const HUPCL   = 0o002000;
export const CLOCAL  = 0o004000;
export const CRTSCTS = 0o020000000000;

// ---------------------------------------------------------------------------
// c_lflag — local modes.
// ---------------------------------------------------------------------------

export const ISIG    = 0o000001;
export const ICANON  = 0o000002;
export const XCASE   = 0o000004;
export const ECHO    = 0o000010;
export const ECHOE   = 0o000020;
export const ECHOK   = 0o000040;
export const ECHONL  = 0o000100;
export const NOFLSH  = 0o000200;
export const TOSTOP  = 0o000400;
export const ECHOCTL = 0o001000;
export const ECHOPRT = 0o002000;
export const ECHOKE  = 0o004000;
export const FLUSHO  = 0o010000;
export const PENDIN  = 0o040000;
export const IEXTEN  = 0o100000;

// ---------------------------------------------------------------------------
// Baud rate constants (Bxxx) — POSIX speed_t values.
// ---------------------------------------------------------------------------

export const B0      = 0o000000;
export const B50     = 0o000001;
export const B75     = 0o000002;
export const B110    = 0o000003;
export const B134    = 0o000004;
export const B150    = 0o000005;
export const B200    = 0o000006;
export const B300    = 0o000007;
export const B600    = 0o000010;
export const B1200   = 0o000011;
export const B1800   = 0o000012;
export const B2400   = 0o000013;
export const B4800   = 0o000014;
export const B9600   = 0o000015;
export const B19200  = 0o000016;
export const B38400  = 0o000017;
export const B57600  = 0o010001;
export const B115200 = 0o010002;
export const B230400 = 0o010003;

// optional_actions for tcsetattr.
export const TCSANOW   = 0;
export const TCSADRAIN = 1;
export const TCSAFLUSH = 2;

// queue_selector for tcflush.
export const TCIFLUSH  = 0;
export const TCOFLUSH  = 1;
export const TCIOFLUSH = 2;

// action for tcflow.
export const TCOOFF = 0;
export const TCOON  = 1;
export const TCIOFF = 2;
export const TCION  = 3;

// errno aliases used here.
const _EBADF = 9;
const _EINVAL = 22;

/** Module-level errno (POSIX termios.h shim; errno propagation via this
 *  module-level mutable matches other Mirage POSIX shims). */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// struct termios (Mirage shape).
//
// Representation note (per CLAUDE.md refactorability charter): the real C
// struct exposes c_iflag/c_oflag/c_cflag/c_lflag as tcflag_t (unsigned long)
// and c_cc as char[NCCS]. We model them as `number` and `Uint8Array`
// respectively. The c_ispeed / c_ospeed fields exist on Linux but are
// derived on POSIX.1-2008 from the cflag — we expose them as separate
// number fields for cfsetispeed/cfsetospeed.
// ---------------------------------------------------------------------------

export interface termios {
  c_iflag: number;
  c_oflag: number;
  c_cflag: number;
  c_lflag: number;
  c_line:  number;
  c_cc:    Uint8Array;   // length NCCS
  c_ispeed: number;
  c_ospeed: number;
}

/** Allocate a new zero-initialised termios. Translated C uses
 *  `struct termios t;` with stack storage; this is the runtime shadow. */
export function makeTermios(): termios {
  return {
    c_iflag: 0,
    c_oflag: 0,
    c_cflag: 0,
    c_lflag: 0,
    c_line:  0,
    c_cc:    new Uint8Array(NCCS),
    c_ispeed: B0,
    c_ospeed: B0,
  };
}

// ---------------------------------------------------------------------------
// Per-fd shadow state.
// ---------------------------------------------------------------------------

/** Per-fd shadow termios — Mirage stores the *current* attributes for each
 *  fd that any caller has called tcgetattr/tcsetattr on. */
const _fdShadow: Map<number, termios> = new Map();

/** Test-only: reset the entire shadow store. */
export function _resetTermios(): void {
  _fdShadow.clear();
  errno = 0;
}

/** Test-only: peek at the shadow termios for fd (returns null if none). */
export function _shadowFor(fd: number): termios | null {
  return _fdShadow.get(fd) ?? null;
}

/** Internal: deep-copy a termios (fields are number + Uint8Array). */
function _cloneTermios(src: termios): termios {
  return {
    c_iflag: src.c_iflag,
    c_oflag: src.c_oflag,
    c_cflag: src.c_cflag,
    c_lflag: src.c_lflag,
    c_line:  src.c_line,
    c_cc:    new Uint8Array(src.c_cc),
    c_ispeed: src.c_ispeed,
    c_ospeed: src.c_ospeed,
  };
}

/** Default cooked-mode termios — what a freshly-opened tty would look like
 *  on Linux. Approximates `stty sane`. Used as the shadow for any fd that
 *  has not had tcsetattr called on it yet. */
function _defaultCookedTermios(): termios {
  const t = makeTermios();
  t.c_iflag = ICRNL | IXON | BRKINT;
  t.c_oflag = OPOST | ONLCR;
  t.c_cflag = CS8 | CREAD;
  t.c_lflag = ISIG | ICANON | ECHO | ECHOE | ECHOK | IEXTEN;
  t.c_ispeed = B38400;
  t.c_ospeed = B38400;
  // Default control chars (Linux defaults).
  t.c_cc[VINTR]    = 0o003;  // ^C
  t.c_cc[VQUIT]    = 0o034;  // ^\
  t.c_cc[VERASE]   = 0o177;  // DEL
  t.c_cc[VKILL]    = 0o025;  // ^U
  t.c_cc[VEOF]     = 0o004;  // ^D
  t.c_cc[VMIN]     = 1;
  t.c_cc[VTIME]    = 0;
  t.c_cc[VSTART]   = 0o021;  // ^Q
  t.c_cc[VSTOP]    = 0o023;  // ^S
  t.c_cc[VSUSP]    = 0o032;  // ^Z
  t.c_cc[VREPRINT] = 0o022;  // ^R
  t.c_cc[VDISCARD] = 0o017;  // ^O
  t.c_cc[VWERASE]  = 0o027;  // ^W
  t.c_cc[VLNEXT]   = 0o026;  // ^V
  return t;
}

// ---------------------------------------------------------------------------
// POSIX termios free functions.
// ---------------------------------------------------------------------------

/** POSIX tcgetattr(fd, t) — IEEE Std 1003.1-2017. Copies the current shadow
 *  termios for `fd` into the caller-supplied termios object. */
export function tcgetattr(fd: number, t: termios | null): number {
  if (fd < 0)  { errno = _EBADF;  return -1; }
  if (t === null) { errno = _EINVAL; return -1; }
  let cur = _fdShadow.get(fd);
  if (!cur) {
    cur = _defaultCookedTermios();
    _fdShadow.set(fd, _cloneTermios(cur));
  }
  // Copy fields into caller's struct.
  t.c_iflag = cur.c_iflag;
  t.c_oflag = cur.c_oflag;
  t.c_cflag = cur.c_cflag;
  t.c_lflag = cur.c_lflag;
  t.c_line  = cur.c_line;
  if (!t.c_cc || t.c_cc.length < NCCS) t.c_cc = new Uint8Array(NCCS);
  for (let i = 0; i < NCCS; i++) t.c_cc[i] = cur.c_cc[i] ?? 0;
  t.c_ispeed = cur.c_ispeed;
  t.c_ospeed = cur.c_ospeed;
  return 0;
}

/** POSIX tcsetattr(fd, opt, t) — replaces shadow termios for `fd`. The
 *  optional_actions argument (TCSANOW/TCSADRAIN/TCSAFLUSH) is accepted but
 *  Mirage applies all changes immediately (no real driver to drain/flush). */
export function tcsetattr(
  fd: number,
  optional_actions: number,
  t: termios | null,
): number {
  if (fd < 0) { errno = _EBADF; return -1; }
  if (t === null) { errno = _EINVAL; return -1; }
  if (optional_actions !== TCSANOW &&
      optional_actions !== TCSADRAIN &&
      optional_actions !== TCSAFLUSH) {
    errno = _EINVAL; return -1;
  }
  _fdShadow.set(fd, _cloneTermios(t));
  return 0;
}

/** POSIX tcdrain(fd) — wait for output to drain. No real driver, so 0. */
export function tcdrain(fd: number): number {
  if (fd < 0) { errno = _EBADF; return -1; }
  return 0;
}

/** POSIX tcflush(fd, queue) — discard buffered I/O. No real buffers, so 0. */
export function tcflush(fd: number, queue_selector: number): number {
  if (fd < 0) { errno = _EBADF; return -1; }
  if (queue_selector !== TCIFLUSH &&
      queue_selector !== TCOFLUSH &&
      queue_selector !== TCIOFLUSH) {
    errno = _EINVAL; return -1;
  }
  return 0;
}

/** POSIX tcflow(fd, action) — suspend/resume output or input. Stub. */
export function tcflow(fd: number, action: number): number {
  if (fd < 0) { errno = _EBADF; return -1; }
  if (action !== TCOOFF && action !== TCOON &&
      action !== TCIOFF && action !== TCION) {
    errno = _EINVAL; return -1;
  }
  return 0;
}

/** POSIX tcsendbreak(fd, duration) — send a break. No-op stub. */
export function tcsendbreak(fd: number, _duration: number): number {
  if (fd < 0) { errno = _EBADF; return -1; }
  return 0;
}

/** POSIX tcgetsid(fd) — session ID of controlling terminal. Stub returns 1. */
export function tcgetsid(fd: number): number {
  if (fd < 0) { errno = _EBADF; return -1; }
  return 1;
}

// ---------------------------------------------------------------------------
// Speed helpers (POSIX cfgetispeed / cfgetospeed / cfsetispeed / cfsetospeed).
// ---------------------------------------------------------------------------

export function cfgetispeed(t: termios): number { return t.c_ispeed; }
export function cfgetospeed(t: termios): number { return t.c_ospeed; }

export function cfsetispeed(t: termios, speed: number): number {
  if (!_isValidBaud(speed)) { errno = _EINVAL; return -1; }
  t.c_ispeed = speed;
  return 0;
}

export function cfsetospeed(t: termios, speed: number): number {
  if (!_isValidBaud(speed)) { errno = _EINVAL; return -1; }
  t.c_ospeed = speed;
  return 0;
}

/** BSD/Linux cfsetspeed(t, speed) — set both input and output speeds. */
export function cfsetspeed(t: termios, speed: number): number {
  if (!_isValidBaud(speed)) { errno = _EINVAL; return -1; }
  t.c_ispeed = speed;
  t.c_ospeed = speed;
  return 0;
}

function _isValidBaud(s: number): boolean {
  switch (s) {
    case B0: case B50: case B75: case B110: case B134: case B150:
    case B200: case B300: case B600: case B1200: case B1800: case B2400:
    case B4800: case B9600: case B19200: case B38400:
    case B57600: case B115200: case B230400:
      return true;
    default: return false;
  }
}

// ---------------------------------------------------------------------------
// Raw-mode helper (BSD/Linux cfmakeraw + Mirage friendly API).
// ---------------------------------------------------------------------------

/** BSD/Linux cfmakeraw(t) — set termios to raw mode in-place.
 *  Mirrors the canonical mask sequence used by terminal emulators / TUIs:
 *    c_iflag &= ~(IGNBRK|BRKINT|PARMRK|ISTRIP|INLCR|IGNCR|ICRNL|IXON);
 *    c_oflag &= ~OPOST;
 *    c_lflag &= ~(ECHO|ECHONL|ICANON|ISIG|IEXTEN);
 *    c_cflag &= ~(CSIZE|PARENB);
 *    c_cflag |= CS8;
 *    c_cc[VMIN] = 1; c_cc[VTIME] = 0;   (block until 1 byte)
 *  After cfmakeraw the terminal is in 8-N-1 raw mode with no echo, no
 *  canonical line buffering, no signals, no XON/XOFF flow control. */
export function cfmakeraw(t: termios): void {
  t.c_iflag &= ~(IGNBRK | BRKINT | PARMRK | ISTRIP | INLCR | IGNCR | ICRNL | IXON);
  t.c_oflag &= ~OPOST;
  t.c_lflag &= ~(ECHO | ECHONL | ICANON | ISIG | IEXTEN);
  t.c_cflag &= ~(CSIZE | PARENB);
  t.c_cflag |= CS8;
  t.c_cc[VMIN]  = 1;
  t.c_cc[VTIME] = 0;
}

/** Mirage extension — friendlier raw-mode helper for translated terminal
 *  emulators / TUI libraries. Combines tcgetattr → cfmakeraw → optional
 *  VMIN/VTIME override → tcsetattr in one call.
 *
 *  @param fd     file descriptor of the (virtual) tty.
 *  @param vmin   c_cc[VMIN] — minimum bytes for a read() to return. Default 1.
 *  @param vtime  c_cc[VTIME] — read timeout in deciseconds. Default 0.
 *  @returns the previous (saved) termios, suitable for restoring later via
 *           tcsetattr(fd, TCSANOW, saved). */
export function posix_raw_mode_helper(
  fd: number,
  vmin: number = 1,
  vtime: number = 0,
): termios | null {
  const saved = makeTermios();
  if (tcgetattr(fd, saved) !== 0) return null;
  const next = _cloneTermios(saved);
  cfmakeraw(next);
  next.c_cc[VMIN]  = vmin & 0xff;
  next.c_cc[VTIME] = vtime & 0xff;
  if (tcsetattr(fd, TCSANOW, next) !== 0) return null;
  return saved;
}

/** Mirage extension — classify the four VMIN/VTIME read regimes (POSIX
 *  §11.1.7). Returns one of:
 *    "blocking-min"    — VMIN > 0, VTIME == 0
 *    "polling"         — VMIN == 0, VTIME == 0
 *    "read-timeout"    — VMIN == 0, VTIME > 0
 *    "interbyte-timer" — VMIN > 0, VTIME > 0
 *  Translated TUI code can use this to dispatch to the right read strategy. */
export type VminVtimeRegime =
  | "blocking-min"
  | "polling"
  | "read-timeout"
  | "interbyte-timer";

export function posix_vmin_vtime_regime(t: termios): VminVtimeRegime {
  const m = t.c_cc[VMIN]  ?? 0;
  const T = t.c_cc[VTIME] ?? 0;
  if (m > 0  && T === 0) return "blocking-min";
  if (m === 0 && T === 0) return "polling";
  if (m === 0 && T > 0)   return "read-timeout";
  return "interbyte-timer";
}
