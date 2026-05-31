// Mirage POSIX <syslog.h> — system logging.
//
// Spec sources
// ------------
//   * IEEE Std 1003.1-2017 §<syslog.h>:
//       void openlog (const char *ident, int option, int facility);
//       void syslog  (int priority, const char *format, ...);
//       void closelog(void);
//       int  setlogmask(int maskpri);
//       void vsyslog (int priority, const char *format, va_list ap);
//
// Behaviour
// ---------
//   * In Mirage we route syslog output to the host's stderr (best-effort
//     `console.error`). Each message is formatted as:
//       "<ident>[<pid>]: <prio>: <message>"
//     where <prio> is the textual priority name.
//   * The current log mask is honored (LOG_MASK / LOG_UPTO).
//   * vsyslog accepts a JS array as `va_list`.
//
// BRIDGE: posix-syslog — POSIX syslog → host stderr via console.error.

// ---------------------------------------------------------------------------
// Priorities (POSIX <syslog.h>).
// ---------------------------------------------------------------------------

export const LOG_EMERG   = 0;
export const LOG_ALERT   = 1;
export const LOG_CRIT    = 2;
export const LOG_ERR     = 3;
export const LOG_WARNING = 4;
export const LOG_NOTICE  = 5;
export const LOG_INFO    = 6;
export const LOG_DEBUG   = 7;

// Facilities.
export const LOG_KERN     = 0  << 3;
export const LOG_USER     = 1  << 3;
export const LOG_MAIL     = 2  << 3;
export const LOG_DAEMON   = 3  << 3;
export const LOG_AUTH     = 4  << 3;
export const LOG_SYSLOG   = 5  << 3;
export const LOG_LPR      = 6  << 3;
export const LOG_NEWS     = 7  << 3;
export const LOG_UUCP     = 8  << 3;
export const LOG_CRON     = 9  << 3;
export const LOG_AUTHPRIV = 10 << 3;
export const LOG_FTP      = 11 << 3;
export const LOG_LOCAL0   = 16 << 3;
export const LOG_LOCAL1   = 17 << 3;
export const LOG_LOCAL2   = 18 << 3;
export const LOG_LOCAL3   = 19 << 3;
export const LOG_LOCAL4   = 20 << 3;
export const LOG_LOCAL5   = 21 << 3;
export const LOG_LOCAL6   = 22 << 3;
export const LOG_LOCAL7   = 23 << 3;

// Options to openlog().
export const LOG_PID    = 0x01;
export const LOG_CONS   = 0x02;
export const LOG_ODELAY = 0x04;
export const LOG_NDELAY = 0x08;
export const LOG_NOWAIT = 0x10;
export const LOG_PERROR = 0x20;

/** Priority mask helpers. POSIX. */
export function LOG_MASK(pri: number): number { return 1 << (pri & 0x07); }
export function LOG_UPTO(pri: number): number { return (1 << ((pri & 0x07) + 1)) - 1; }

export function LOG_PRI(p: number): number     { return p & 0x07; }
export function LOG_FAC(p: number): number     { return (p >> 3) & 0xff; }
export function LOG_MAKEPRI(fac: number, pri: number): number {
  return (fac & 0xff) << 3 | (pri & 0x07);
}

// ---------------------------------------------------------------------------
// Module state.
// ---------------------------------------------------------------------------

let _ident: string = "";
let _option: number = 0;
let _facility: number = LOG_USER;
let _mask: number = 0xff; // all priorities allowed by default

const PRIO_NAMES: string[] = [
  "EMERG", "ALERT", "CRIT", "ERR", "WARNING", "NOTICE", "INFO", "DEBUG",
];

/** Test-only: reset module state. */
export function _resetSyslog(): void {
  _ident = "";
  _option = 0;
  _facility = LOG_USER;
  _mask = 0xff;
}

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------

/** POSIX openlog() — set ident, option flags, default facility. */
export function openlog(ident: string, option: number, facility: number): void {
  _ident = ident;
  _option = option;
  _facility = facility & ~0x07; // strip any priority bits caller passed
}

/** POSIX closelog() — release the (notional) connection. */
export function closelog(): void {
  // Nothing to close — keep ident in case caller resumes via syslog().
  _ident = "";
  _option = 0;
}

/** POSIX setlogmask() — return previous mask, install new one. 0 = no change. */
export function setlogmask(maskpri: number): number {
  const prev = _mask;
  if (maskpri !== 0) _mask = maskpri & 0xff;
  return prev;
}

/**
 * POSIX syslog() — log a message at `priority` (priority|facility allowed).
 * Variadic format args follow C printf rules; here we accept a pre-formatted
 * string OR a printf-style format with the vararg list as `args`.
 */
export function syslog(priority: number, format: string, ...args: unknown[]): void {
  vsyslog(priority, format, args);
}

/**
 * POSIX vsyslog() — variadic-list form. `ap` is a JS array standing in for
 * va_list. Format string supports %s, %d, %u, %x, %X, %o, %c, %%.
 */
export function vsyslog(priority: number, format: string, ap: unknown[]): void {
  const pri = priority & 0x07;
  let fac = priority & ~0x07;
  if (fac === 0) fac = _facility;
  if ((LOG_MASK(pri) & _mask) === 0) return;

  const msg = _printf(format, ap);
  const ident = _ident || _basenameArgv0();
  const pidPart = (_option & LOG_PID) !== 0 ? `[${_pid()}]` : "";
  const line = `${ident}${pidPart}: ${PRIO_NAMES[pri]}: ${msg}`;
  try {
    if ((_option & LOG_PERROR) !== 0 || (_option & LOG_CONS) !== 0 || _ident === "" || true) {
      // Always route to stderr in the host environment.
      console.error(line);
    }
  } catch { /* ignore */ }
}

function _pid(): number {
  const proc = (globalThis as unknown as { process?: { pid?: number } }).process;
  return proc?.pid ?? 1;
}

function _basenameArgv0(): string {
  const proc = (globalThis as unknown as { process?: { argv?: string[] } }).process;
  const a0 = proc?.argv?.[1] ?? proc?.argv?.[0] ?? "syslog";
  const slash = Math.max(a0.lastIndexOf("/"), a0.lastIndexOf("\\"));
  return slash < 0 ? a0 : a0.slice(slash + 1);
}

// Minimal printf for syslog formatting. Subset: %s %d %u %x %X %o %c %%.
function _printf(fmt: string, args: unknown[]): string {
  let out = "";
  let ai = 0;
  let i = 0;
  while (i < fmt.length) {
    const c = fmt[i]!;
    if (c !== "%") { out += c; i++; continue; }
    i++;
    if (i >= fmt.length) { out += "%"; break; }
    const spec = fmt[i]!;
    i++;
    switch (spec) {
      case "%": out += "%"; break;
      case "s": out += String(args[ai++] ?? ""); break;
      case "d": case "i": out += String(Number(args[ai++] ?? 0) | 0); break;
      case "u": { const v = Number(args[ai++] ?? 0); out += String(v < 0 ? (v >>> 0) : (v >>> 0)); break; }
      case "x": out += (Number(args[ai++] ?? 0) >>> 0).toString(16); break;
      case "X": out += (Number(args[ai++] ?? 0) >>> 0).toString(16).toUpperCase(); break;
      case "o": out += (Number(args[ai++] ?? 0) >>> 0).toString(8); break;
      case "c": {
        const v = args[ai++];
        out += typeof v === "number" ? String.fromCharCode(v & 0xff) : String(v ?? "");
        break;
      }
      case "m": {
        // GNU extension: errno string. We don't track errno here; emit blank.
        out += "";
        break;
      }
      default: out += "%" + spec;
    }
  }
  return out;
}
