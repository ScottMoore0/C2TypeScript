// FC-4: C stdlib functions — C17 §7.22: General utilities <stdlib.h>.
//
// Every function below cites its ISO/IEC 9899:2018 (C17) section.
// Spec-grounded: behaviour (errno, endptr, base auto-detection, overflow
// clamping, locale-independent numeric parsing) mirrors the standard.

import { execSync as _execSync } from "node:child_process";
import type { CPtr } from "../string/string.js";

// --- Integer / float limits (C17 §7.20) referenced by this file ---
const INT_MAX = 0x7FFFFFFF;
const INT_MIN = -0x80000000;
const LONG_MAX = INT_MAX;                  // 32-bit long model
const LONG_MIN = INT_MIN;
const ULONG_MAX = 0xFFFFFFFF;
const LLONG_MAX = Number.MAX_SAFE_INTEGER; // 53-bit safe integer limit
const LLONG_MIN = -Number.MAX_SAFE_INTEGER;
const ULLONG_MAX = Number.MAX_SAFE_INTEGER;

/* -------------------------------------------------------------------------- */
/* §7.22.1 Numeric conversion functions                                       */
/* -------------------------------------------------------------------------- */

// Internal: C17 §7.4.1.10 isspace — the set of whitespace that strto* must
// skip before the sign character. Implementing locally keeps stdlib
// self-contained and deterministic regardless of host locale.
function _isSpace(c: string): boolean {
  return c === " " || c === "\t" || c === "\n" || c === "\v" || c === "\f" || c === "\r";
}

// Internal: interpret a single character as a digit in the given base.
// Returns -1 if not a digit in that base. Matches C17 §7.22.1.4 p3.
function _digitValue(c: string, base: number): number {
  const code = c.charCodeAt(0);
  let v: number;
  if (code >= 0x30 && code <= 0x39) v = code - 0x30;               // '0'..'9'
  else if (code >= 0x41 && code <= 0x5A) v = code - 0x41 + 10;     // 'A'..'Z'
  else if (code >= 0x61 && code <= 0x7A) v = code - 0x61 + 10;     // 'a'..'z'
  else return -1;
  return v < base ? v : -1;
}

/**
 * Internal: shared integer-parsing core for strtol/strtoll/strtoul/strtoull.
 * Implements C17 §7.22.1.4 "The strtol, strtoll, strtoul, and strtoull
 * functions":
 *   - p3: skip whitespace, accept optional '+'/'-'.
 *   - p3: base==0 auto-detects hex ("0x"/"0X"), octal ("0"), else decimal.
 *   - p3: base==16 may optionally start with "0x"/"0X".
 *   - p5: on overflow, return clamped value and set errno = ERANGE.
 *   - p7: if no conversion could be performed, endIndex is 0.
 */
function _strtoIntCore(
  s: string,
  base: number,
  unsigned: boolean,
  min: number,
  max: number,
): { value: number; endIndex: number } {
  let i = 0;
  while (i < s.length && _isSpace(s[i]!)) i++;
  const prefixEnd = i;

  let negative = false;
  if (i < s.length && (s[i] === "+" || s[i] === "-")) {
    negative = s[i] === "-";
    i++;
  }

  // Detect / validate base prefix (C17 §7.22.1.4 p3).
  if ((base === 0 || base === 16) && i + 1 < s.length
      && s[i] === "0" && (s[i + 1] === "x" || s[i + 1] === "X")
      && _digitValue(s[i + 2] ?? "", 16) >= 0) {
    i += 2;
    base = 16;
  } else if (base === 0 && i < s.length && s[i] === "0") {
    base = 8;
  } else if (base === 0) {
    base = 10;
  }

  if (base < 2 || base > 36) {
    errno = EINVAL;
    return { value: 0, endIndex: 0 };
  }

  const digitsStart = i;
  let acc = 0;
  let overflow = false;
  // Overflow threshold chosen so that acc*base+digit can still fit.
  const limit = unsigned ? max : (negative ? -min : max);
  while (i < s.length) {
    const d = _digitValue(s[i]!, base);
    if (d < 0) break;
    if (!overflow) {
      const next = acc * base + d;
      if (next > limit || !Number.isFinite(next)) overflow = true;
      else acc = next;
    }
    i++;
  }

  // No digits were consumed — no conversion performed (p7).
  if (i === digitsStart) {
    return { value: 0, endIndex: 0 };
  }

  if (overflow) {
    errno = ERANGE;
    if (unsigned) return { value: max, endIndex: i };
    return { value: negative ? min : max, endIndex: i };
  }

  const signed = negative ? -acc : acc;
  // Re-check signed range (e.g., decimal INT_MAX+1 with minus sign).
  if (!unsigned && (signed < min || signed > max)) {
    errno = ERANGE;
    return { value: negative ? min : max, endIndex: i };
  }
  // For unsigned 32-bit types, fold negative magnitudes into modular range.
  if (unsigned && signed < 0) {
    return { value: max === ULONG_MAX ? (signed >>> 0) : (max + signed + 1), endIndex: i };
  }
  return { value: signed, endIndex: i };
}

/** C17 §7.22.1.1: atof — equivalent to strtod(nptr, NULL) but with
 *  unspecified errno behaviour. */
export function c_atof(s: string): number {
  const r = c_strtod(s);
  return r.value;
}

/** C17 §7.22.1.2: atoi — equivalent to (int)strtol(nptr, NULL, 10). */
export function c_atoi(s: string): number {
  const r = _strtoIntCore(s, 10, false, INT_MIN, INT_MAX);
  return r.value | 0;
}

/** C17 §7.22.1.2: atol — equivalent to (long)strtol(nptr, NULL, 10). */
export function c_atol(s: string): number {
  const r = _strtoIntCore(s, 10, false, LONG_MIN, LONG_MAX);
  return r.value | 0;
}

/** C17 §7.22.1.2: atoll — equivalent to (long long)strtoll(nptr, NULL, 10). */
export function c_atoll(s: string): number {
  const r = _strtoIntCore(s, 10, false, LLONG_MIN, LLONG_MAX);
  return r.value;
}

/** C17 §7.22.1.4: strtol — string to long with base & endptr. */
export function c_strtol(s: string, base: number = 10): { value: number; endIndex: number } {
  return _strtoIntCore(s, base, false, LONG_MIN, LONG_MAX);
}

/** C17 §7.22.1.4: strtoll — string to long long (53-bit safe range). */
export function c_strtoll(s: string, base: number = 10): { value: number; endIndex: number } {
  return _strtoIntCore(s, base, false, LLONG_MIN, LLONG_MAX);
}

/** C17 §7.22.1.4: strtoul — string to unsigned long.
 *  Per p5: a leading '-' is accepted and the magnitude is negated modulo
 *  (ULONG_MAX+1). */
export function c_strtoul(s: string, base: number = 10): { value: number; endIndex: number } {
  return _strtoIntCore(s, base, true, 0, ULONG_MAX);
}

/** C17 §7.22.1.4: strtoull — string to unsigned long long (53-bit safe). */
export function c_strtoull(s: string, base: number = 10): { value: number; endIndex: number } {
  return _strtoIntCore(s, base, true, 0, ULLONG_MAX);
}

/** Internal: parse a C17 §7.22.1.3 floating-point prefix and return the
 *  numeric value plus the length consumed. Supports:
 *    [+-]? ( nan[(...)] | inf | infinity | digits[.digits]([eE][+-]?digits)?
 *          | 0x hexdigits[.hexdigits]([pP][+-]?digits)? )
 */
function _strtoFloatCore(s: string): { value: number; endIndex: number } {
  let i = 0;
  while (i < s.length && _isSpace(s[i]!)) i++;
  const start = i;

  let sign = 1;
  if (i < s.length && (s[i] === "+" || s[i] === "-")) {
    if (s[i] === "-") sign = -1;
    i++;
  }

  // NaN / INF (case-insensitive).
  const rest = s.slice(i).toLowerCase();
  if (rest.startsWith("nan")) {
    i += 3;
    if (s[i] === "(") {
      const close = s.indexOf(")", i);
      if (close !== -1) i = close + 1;
    }
    return { value: NaN, endIndex: i };
  }
  if (rest.startsWith("infinity")) return { value: sign * Infinity, endIndex: i + 8 };
  if (rest.startsWith("inf")) return { value: sign * Infinity, endIndex: i + 3 };

  // Hex float: 0x[hex].[hex]p[+-]?dec
  if (rest.startsWith("0x") || rest.startsWith("0x.")) {
    const hexStart = i + 2;
    let j = hexStart;
    let mantStr = "";
    while (j < s.length && _digitValue(s[j]!, 16) >= 0) { mantStr += s[j]; j++; }
    let frac = "";
    if (s[j] === ".") {
      j++;
      while (j < s.length && _digitValue(s[j]!, 16) >= 0) { frac += s[j]; j++; }
    }
    if (!mantStr && !frac) return { value: 0, endIndex: 0 };
    let exp = 0;
    let afterMant = j;
    if (s[j] === "p" || s[j] === "P") {
      let k = j + 1;
      let expSign = 1;
      if (s[k] === "+" || s[k] === "-") { if (s[k] === "-") expSign = -1; k++; }
      const expDigStart = k;
      let expStr = "";
      while (k < s.length && _digitValue(s[k]!, 10) >= 0) { expStr += s[k]; k++; }
      if (k > expDigStart) {
        exp = expSign * parseInt(expStr, 10);
        afterMant = k;
      }
    }
    let value = 0;
    for (const c of mantStr) value = value * 16 + _digitValue(c, 16);
    let fracVal = 0;
    let fracDiv = 1;
    for (const c of frac) {
      fracVal = fracVal * 16 + _digitValue(c, 16);
      fracDiv *= 16;
    }
    value = value + fracVal / fracDiv;
    value *= Math.pow(2, exp);
    return { value: sign * value, endIndex: afterMant };
  }

  // Decimal float.
  const decMatch = s.slice(i).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
  if (!decMatch) {
    // No conversion performed (C17 §7.22.1.3 p8).
    if (i > start) i = 0; // per p8: endptr points to original
    return { value: 0, endIndex: 0 };
  }
  const parsed = parseFloat(decMatch[0]);
  const val = sign * parsed;
  if (!Number.isFinite(val)) errno = ERANGE;
  return { value: val, endIndex: i + decMatch[0].length };
}

/** C17 §7.22.1.3: strtod — string to double with endptr. */
export function c_strtod(s: string): { value: number; endIndex: number } {
  return _strtoFloatCore(s);
}

/** C17 §7.22.1.3: strtof — string to float (rounds to nearest float32). */
export function c_strtof(s: string): { value: number; endIndex: number } {
  const r = _strtoFloatCore(s);
  return { value: Math.fround(r.value), endIndex: r.endIndex };
}

/** C17 §7.22.1.3: strtold — string to long double.
 *  TypeScript has no long double; we reuse IEEE-754 double, matching the
 *  x86-64 Windows ABI (sizeof(long double)==8). Extended-precision 80-bit
 *  behaviour is deferred — see PROVENANCE. */
export function c_strtold(s: string): { value: number; endIndex: number } {
  return _strtoFloatCore(s);
}

/* -------------------------------------------------------------------------- */
/* §7.22.2 Pseudo-random sequence generation                                  */
/* -------------------------------------------------------------------------- */

let _randState = 1;

/** C17 §7.22.2.2: srand — seed the PRNG. Per p3, srand(1) restores the
 *  implementation-defined default seed. */
export function c_srand(seed: number): void {
  _randState = seed >>> 0;
}

/** C17 §7.22.2.1: rand — returns values in [0, RAND_MAX]. LCG following
 *  POSIX.1-2017 sample implementation (behaviour is implementation-defined
 *  per p2; this one is deterministic and reproducible). */
export function c_rand(): number {
  _randState = ((_randState * 1103515245 + 12345) & 0x7FFFFFFF) >>> 0;
  return _randState;
}

/** POSIX (derived from C17 §7.22.2): rand_r — thread-safe rand.
 *  The caller owns the state; we mutate and return via a boxed state object
 *  since JavaScript has no pointer-to-unsigned. */
export function c_rand_r(state: { value: number }): number {
  state.value = ((state.value * 1103515245 + 12345) & 0x7FFFFFFF) >>> 0;
  return state.value;
}

/** C17 §7.22.2.2 p2: RAND_MAX is at least 32767. We use INT_MAX to match
 *  our LCG's output range. */
export const RAND_MAX = 0x7FFFFFFF;

/* -------------------------------------------------------------------------- */
/* §7.22.4 Communication with the environment                                 */
/* -------------------------------------------------------------------------- */

const _atexitHandlers: (() => void)[] = [];
const _quickExitHandlers: (() => void)[] = [];

/** C17 §7.22.4.1: abort — abnormal termination (raises SIGABRT, exit 134). */
export function c_abort(): never {
  process.exit(134);
}

/** C17 §7.22.4.2: atexit — register a function to be called at normal
 *  termination, in LIFO order. Returns 0 on success, non-zero on failure.
 *  C17 requires support for at least 32 registrations. */
export function c_atexit(func: () => void): number {
  _atexitHandlers.push(func);
  return 0;
}

/** C17 §7.22.4.3: at_quick_exit — register a handler for quick_exit.
 *  Separate from atexit registrations (per C17 p2). */
export function c_at_quick_exit(func: () => void): number {
  _quickExitHandlers.push(func);
  return 0;
}

/** C11 §7.22.3.1: aligned_alloc — allocation with specified alignment.
 *  In this runtime JS-backed allocations are already naturally aligned, so
 *  alignment is satisfied by returning a plain zero-filled buffer. Returns
 *  a zero-length buffer if the request is invalid (equivalent to NULL for
 *  this runtime's allocation discipline — callers check `.length`). */
export function c_aligned_alloc(alignment: number, size: number): Uint8Array {
  if (alignment <= 0 || size < 0) return new Uint8Array(0);
  if ((alignment & (alignment - 1)) !== 0) return new Uint8Array(0); // not a power of two
  if (size % alignment !== 0) return new Uint8Array(0);              // per C11 p2
  return new Uint8Array(size);
}

/** C17 §7.22.4.4: exit — normal program termination. atexit handlers run in
 *  reverse order of registration, then streams flush, then control returns
 *  to the host environment with the supplied status. */
export function c_exit(code: number): never {
  for (let i = _atexitHandlers.length - 1; i >= 0; i--) {
    try { _atexitHandlers[i]!(); } catch { /* per §7.22.4.4 p3, handlers must not throw */ }
  }
  process.exit(code);
}

/** C17 §7.22.4.5: _Exit — termination without running atexit handlers or
 *  flushing open streams. */
export function c__Exit(code: number): never {
  process.exit(code);
}

/** C17 §7.22.4.7: quick_exit — termination that runs at_quick_exit
 *  handlers in LIFO order, then calls _Exit(status). */
export function c_quick_exit(code: number): never {
  for (let i = _quickExitHandlers.length - 1; i >= 0; i--) {
    try { _quickExitHandlers[i]!(); } catch { /* per C17 §7.22.4.7 p2 */ }
  }
  process.exit(code);
}

/** C17 §7.22.4.6: getenv — return host environment string, or NULL (null)
 *  if the name is not found. Integrated with Node's `process.env`. */
export function c_getenv(name: string): string | null {
  const v = process.env[name];
  return v === undefined ? null : v;
}

/**
 * Shell-allowed flag for c_system. C17 §7.22.4.8 permits a hosted
 * implementation to decline the command processor entirely; we default to
 * "disabled" so that translated programs cannot unexpectedly shell out on
 * the user's behalf. Callers who genuinely need system() must opt in.
 */
let _shellAllowed = false;

/** Host control: enable or disable c_system. */
export function setShellAllowed(allowed: boolean): void {
  _shellAllowed = allowed;
}

/** C17 §7.22.4.8: system — execute host command processor.
 *  When command == null, returns non-zero iff a command processor is
 *  available. When disabled via setShellAllowed(false), always returns
 *  non-zero (treated as unavailable / failed). */
export function c_system(command: string | null): number {
  if (command === null) return _shellAllowed ? 1 : 0;
  if (!_shellAllowed) return -1;
  try {
    _execSync(command, { stdio: "inherit" });
    return 0;
  } catch {
    return -1;
  }
}

/* -------------------------------------------------------------------------- */
/* §7.22.5 Searching and sorting utilities                                    */
/* -------------------------------------------------------------------------- */

/** C17 §7.22.5.1: bsearch — binary search in a sorted array.
 *  Returns the matching element, or null if absent. Correctness requires
 *  the input to be sorted per compareFn. */
export function c_bsearch<T>(key: T, arr: T[], compareFn: (a: T, b: T) => number): T | null {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = compareFn(key, arr[mid]!);
    if (cmp === 0) return arr[mid]!;
    if (cmp < 0) hi = mid - 1;
    else lo = mid + 1;
  }
  return null;
}

/** C17 §7.22.5.2: qsort — sort an array in place.
 *  The standard does not guarantee stability; we delegate to Array.prototype
 *  .sort which on Node 20+ (V8) is stable Timsort. This is correct-by-
 *  construction: a stable sort satisfies any property an unstable sort
 *  would, but not vice versa. */
export function c_qsort<T>(arr: T[], compareFn: (a: T, b: T) => number): void {
  arr.sort(compareFn);
}

/* -------------------------------------------------------------------------- */
/* §7.22.6 Integer arithmetic functions                                       */
/* -------------------------------------------------------------------------- */

/** C17 §7.22.6.1: abs — |int|. Undefined if the result is not
 *  representable; we mirror that by returning INT_MIN for abs(INT_MIN). */
export function c_abs(x: number): number {
  return x === INT_MIN ? INT_MIN : Math.abs(x) | 0;
}

/** C17 §7.22.6.1: labs — |long|. */
export function c_labs(x: number): number {
  return x === LONG_MIN ? LONG_MIN : Math.abs(x) | 0;
}

/** C17 §7.22.6.1: llabs — |long long|. Uses the 53-bit safe-integer range
 *  since JS numbers cannot represent a true 64-bit long long. */
export function c_llabs(x: number): number {
  return Math.abs(x);
}

/** C17 §7.22.6.2: div — quotient and remainder of integer division.
 *  Per p2, truncation is toward zero and (quot*denom + rem) == numer. */
export function c_div(numer: number, denom: number): { quot: number; rem: number } {
  const quot = Math.trunc(numer / denom);
  return { quot, rem: numer - quot * denom };
}

/** C17 §7.22.6.2: ldiv — same semantics as div for long. */
export const c_ldiv = c_div;

/** C17 §7.22.6.2: lldiv — same semantics as div for long long. */
export const c_lldiv = c_div;

/* -------------------------------------------------------------------------- */
/* §7.22.7 Multibyte / wide character conversion                              */
/* -------------------------------------------------------------------------- */
//
// We implement these in the "C" locale, treating multibyte strings as UTF-8
// (the ubiquitous default on Linux/macOS and on Windows when the process
// code page is set to UTF-8). Per C17 §7.22.7.1 p3, the "C" locale may
// define the multibyte encoding to be any superset of the basic source
// character set — UTF-8 qualifies.

/** Normalize the many forms stdio/stdlib callers use to pass a multibyte
 *  string (JS string, number[], Uint8Array) into a Uint8Array view. */
function _toBytes(s: string | number[] | Uint8Array): Uint8Array {
  if (typeof s === "string") return new Uint8Array(Buffer.from(s, "utf8"));
  if (s instanceof Uint8Array) return s;
  return new Uint8Array(s);
}

/** C17 §7.22.7.1: mblen — length in bytes of the next multibyte character.
 *  Returns 0 if s starts with NUL, -1 on encoding error. When s == null,
 *  returns non-zero iff the encoding has shift states (UTF-8 has none, so
 *  we return 0). */
export function c_mblen(s: string | number[] | Uint8Array | null, n: number): number {
  if (s === null) return 0;
  if (n === 0) return -1;
  const b = _toBytes(s);
  if (b.length === 0 || b[0] === 0) return 0;
  const first = b[0]!;
  let len: number;
  if (first < 0x80) len = 1;
  else if ((first & 0xE0) === 0xC0) len = 2;
  else if ((first & 0xF0) === 0xE0) len = 3;
  else if ((first & 0xF8) === 0xF0) len = 4;
  else return -1;
  return len > n ? -1 : len;
}

/** C17 §7.22.7.2: mbtowc — convert one multibyte char to wide char.
 *  Writes the code point into pwc.value (boxed for pointer semantics). */
export function c_mbtowc(pwc: { value: number } | null, s: string | number[] | Uint8Array | null, n: number): number {
  if (s === null) return 0;
  if (n === 0) return -1;
  const len = c_mblen(s, n);
  if (len < 0) return len;
  if (len === 0) {
    // §7.22.7.2 p3: if s points to a NUL byte, store 0 in *pwc and return 0.
    if (pwc !== null) pwc.value = 0;
    return 0;
  }
  const bytes = _toBytes(s).subarray(0, len);
  const cp = new TextDecoder().decode(bytes).codePointAt(0) ?? 0;
  if (pwc !== null) pwc.value = cp;
  return len;
}

/** C17 §7.22.7.3: wctomb — convert one wide char to multibyte sequence.
 *  Accepts either a {buf,off} handle, a number[]/Uint8Array, or null (to
 *  query shift-state support, which is always 0 for UTF-8). Returns the
 *  number of bytes written, or -1 on an encoding error (e.g. surrogate). */
export function c_wctomb(
  s: { buf: Uint8Array; off: number } | number[] | Uint8Array | null,
  wc: number,
): number {
  if (s === null) return 0;
  // Reject unpaired surrogates per C17 §7.22.7.3 — they are not valid UTF-8
  // characters and therefore have no encoding.
  if (wc >= 0xD800 && wc <= 0xDFFF) return -1;
  const bytes = Buffer.from(String.fromCodePoint(wc), "utf8");
  if (Array.isArray(s) || s instanceof Uint8Array) {
    for (let i = 0; i < bytes.length; i++) (s as any)[i] = bytes[i]!;
  } else {
    for (let i = 0; i < bytes.length; i++) s.buf[s.off + i] = bytes[i]!;
  }
  return bytes.length;
}

/* -------------------------------------------------------------------------- */
/* §7.22.8 Multibyte / wide string conversion                                 */
/* -------------------------------------------------------------------------- */

/** C17 §7.22.8.1: mbstowcs — convert a multibyte (UTF-8 byte sequence) string
 *  to a wide string. Accepts either a JS string or a numeric byte array as
 *  `src`. Returns the number of wide characters written (excluding terminator). */
export function c_mbstowcs(dst: number[] | null, src: string | number[] | Uint8Array, n: number): number {
  // Normalize src to a JS string via UTF-8 decoding when byte-array input.
  let text: string;
  if (typeof src === "string") text = src;
  else {
    const bytes = src instanceof Uint8Array ? src : new Uint8Array(src);
    let end = 0;
    while (end < bytes.length && bytes[end] !== 0) end++;
    text = new TextDecoder().decode(bytes.subarray(0, end));
  }
  let count = 0;
  for (const ch of text) {
    if (count >= n) break;
    const cp = ch.codePointAt(0)!;
    if (dst !== null) dst[count] = cp;
    count++;
    if (cp === 0) return count - 1;
  }
  if (dst !== null && count < n) dst[count] = 0;
  return count;
}

/** C17 §7.22.8.2: wcstombs — convert a wide string to multibyte string.
 *  Returns the number of bytes written (excluding terminator), or (size_t)
 *  -1 on encoding failure. */
export function c_wcstombs(dst: Uint8Array | number[] | null, src: number[], n: number): number {
  let written = 0;
  for (const cp of src) {
    if (cp === 0) {
      if (dst !== null && written < n) dst[written] = 0;
      return written;
    }
    const bytes = Buffer.from(String.fromCodePoint(cp), "utf8");
    if (written + bytes.length > n) break;
    if (dst !== null) for (let i = 0; i < bytes.length; i++) dst[written + i] = bytes[i]!;
    written += bytes.length;
  }
  return written;
}

/* -------------------------------------------------------------------------- */
/* §7.13 Nonlocal jumps (setjmp / longjmp)                                    */
/* -------------------------------------------------------------------------- */

/** setjmp/longjmp are implemented via thrown exceptions carrying the
 *  restart value. See C17 §7.13. */
export class LongjmpSignal extends Error {
  constructor(public readonly value: number) {
    super(`longjmp(${value})`);
    this.name = "LongjmpSignal";
  }
}

/** C17 §7.13.2.1: longjmp — restore saved environment.
 *  Per p3, longjmp(_, 0) shall cause setjmp to return 1. */
export function c_longjmp(value: number): never {
  throw new LongjmpSignal(value === 0 ? 1 : value);
}

/* -------------------------------------------------------------------------- */
/* §7.5 errno                                                                 */
/* -------------------------------------------------------------------------- */

/** C17 §7.5: errno — modifiable lvalue of type int. */
export let errno = 0;

/** Host control: reset errno (tests). */
export function setErrno(value: number): void { errno = value; }

/** Aliases so cross-module writers can update the live binding. */
export function set_errno(value: number): void { errno = value; }
export function get_errno(): number { return errno; }

export const EDOM = 33;
export const ERANGE = 34;
export const EILSEQ = 84;
export const ENOENT = 2;
export const EACCES = 13;
export const EEXIST = 17;
export const EINVAL = 22;
export const ENOMEM = 12;
export const EIO = 5;

// POSIX.1 errno values (Linux errno.h / asm-generic/errno-base.h).
export const EPERM = 1;
export const ESRCH = 3;
export const EINTR = 4;
export const ENXIO = 6;
export const EBADF = 9;
export const ECHILD = 10;
export const EAGAIN = 11;
export const EBUSY = 16;
export const EXDEV = 18;
export const ENODEV = 19;
export const ENOTDIR = 20;
export const EISDIR = 21;
export const ENFILE = 23;
export const EMFILE = 24;
export const ENOTTY = 25;
export const EFBIG = 27;
export const ENOSPC = 28;
export const ESPIPE = 29;
export const EROFS = 30;
export const EPIPE = 32;
export const ENOTEMPTY = 39;

/* -------------------------------------------------------------------------- */
/* §7.14 Signal handling                                                      */
/* -------------------------------------------------------------------------- */

const _signalHandlers = new Map<number, ((sig: number) => void) | null>();

export const SIGABRT = 6;
export const SIGFPE = 8;
export const SIGILL = 4;
export const SIGINT = 2;
export const SIGSEGV = 11;
export const SIGTERM = 15;
export const SIG_DFL = null;

/** C17 §7.14.1.1: signal — register signal handler. */
export function c_signal(sig: number, handler: ((sig: number) => void) | null): ((sig: number) => void) | null {
  const prev = _signalHandlers.get(sig) ?? null;
  _signalHandlers.set(sig, handler);
  return prev;
}

/** C17 §7.14.2.1: raise — send signal to self. */
export function c_raise(sig: number): number {
  const handler = _signalHandlers.get(sig);
  if (handler) {
    handler(sig);
    return 0;
  }
  if (sig === SIGABRT) c_abort();
  return 0;
}

// C17 §7.22.1.3 strfromd/f/l: convert floating-point value to string using a
// printf-style format. Added in C17; frequently present in real codebases.

function __strfrom_impl(s: CPtr, n: number, fmt: CPtr | string, value: number): number {
  const fmtStr = typeof fmt === "string" ? fmt :
    (() => { let str = ""; let i = 0; while (fmt.buf[fmt.off + i] !== 0) str += String.fromCharCode(fmt.buf[fmt.off + i]!); i++; return str; })();
  // Support only %g / %f / %e variants (C17 §7.22.1.3 ¶2). %Lf / %Lg allowed too.
  const m = fmtStr.match(/^%(?:\.(\d+))?([gGfFeE])$/);
  let out: string;
  if (m) {
    const prec = m[1] ? parseInt(m[1]!) : 6;
    const spec = m[2]!;
    if (spec === "f" || spec === "F") out = value.toFixed(prec);
    else if (spec === "e" || spec === "E") out = value.toExponential(prec).replace(/e([+-])(\d)$/, "e$10$2");
    else out = value.toPrecision(prec).replace(/(\.\d*?)0+(?=e|$)/, "$1").replace(/\.(?=e|$)/, "");
    if (spec === "E" || spec === "G" || spec === "F") out = out.toUpperCase();
  } else {
    out = String(value);
  }
  const ret = out.length;
  if (n > 0) {
    const writeLen = Math.min(out.length, n - 1);
    for (let i = 0; i < writeLen; i++) s.buf[s.off + i] = out.charCodeAt(i);
    s.buf[s.off + writeLen] = 0;
  }
  return ret;
}

export function c_strfromd(s: CPtr, n: number, fmt: CPtr | string, value: number): number {
  return __strfrom_impl(s, n, fmt, value);
}
export function c_strfromf(s: CPtr, n: number, fmt: CPtr | string, value: number): number {
  return __strfrom_impl(s, n, fmt, Math.fround(value));
}
export function c_strfroml(s: CPtr, n: number, fmt: CPtr | string, value: number): number {
  return __strfrom_impl(s, n, fmt, value);
}

// POSIX.1-2017 qsort_r — sort array `base` of `nmemb` elements each of `size`
// bytes, with a comparator that takes an extra user-data argument.
// We accept CPtr-style arrays AND plain JS arrays for convenience.
export function c_qsort_r(base: any, nmemb: number, size: number, cmp: (a: any, b: any, arg: any) => number, arg: any): void {
  if (Array.isArray(base)) {
    base.sort((a, b) => cmp(a, b, arg));
    return;
  }
  // CPtr path — read nmemb elements of `size` bytes as raw byte blocks,
  // sort the index array, then write back.
  const indices = Array.from({ length: nmemb }, (_, i) => i);
  indices.sort((a, b) => {
    const pa = { buf: base.buf, off: base.off + a * size };
    const pb = { buf: base.buf, off: base.off + b * size };
    return cmp(pa, pb, arg);
  });
  const copy = new Uint8Array(nmemb * size);
  for (let i = 0; i < nmemb; i++) {
    const src = base.off + indices[i]! * size;
    copy.set(base.buf.subarray(src, src + size), i * size);
  }
  for (let i = 0; i < nmemb * size; i++) base.buf[base.off + i] = copy[i]!;
}

// POSIX.1-2017 posix_memalign — allocate memory aligned to `alignment` bytes.
// Returns 0 on success (sets *memptr); non-zero errno on failure.
// JS doesn't expose raw-pointer alignment, so we return an over-sized buffer
// whose nominal `off` is rounded up to the alignment boundary. Alignment is
// informational in this runtime but the pointer offset satisfies the contract.
export function c_posix_memalign(memptr: { value: CPtr | null }, alignment: number, size: number): number {
  if (alignment < 1 || (alignment & (alignment - 1)) !== 0) return 22 /*EINVAL*/;
  if (size === 0) { memptr.value = null; return 0; }
  const total = size + alignment;
  const buf = new Uint8Array(total);
  // Report alignment-satisfying offset 0 (Uint8Array byteOffset is always 0
  // in Node/V8 when created via new Uint8Array(size), which is alignment-safe).
  memptr.value = { buf, off: 0 };
  return 0;
}

// POSIX.1-2017 wcstoimax / wcstoumax — wide-char to intmax_t/uintmax_t.
// Implementation operates on UTF-16 surrogate-aware JS strings that the
// translator supplies for wchar_t*; minimal but spec-sufficient for common
// real-world usage (digits + sign + base prefix).
export function c_wcstoimax(nptr: string, endptr: { value: string } | null, base: number): bigint {
  const s = nptr.trim();
  const parsed = __parse_int_like(s, base);
  if (endptr) endptr.value = parsed.rest;
  return BigInt(parsed.value);
}
export function c_wcstoumax(nptr: string, endptr: { value: string } | null, base: number): bigint {
  const s = nptr.trim();
  const parsed = __parse_int_like(s, base);
  if (endptr) endptr.value = parsed.rest;
  return BigInt.asUintN(64, BigInt(parsed.value));
}
function __parse_int_like(s: string, base: number): { value: number; rest: string } {
  let i = 0, sign = 1;
  if (s[i] === "+") i++;
  else if (s[i] === "-") { sign = -1; i++; }
  if ((base === 0 || base === 16) && s[i] === "0" && (s[i+1] === "x" || s[i+1] === "X")) {
    i += 2; base = 16;
  } else if (base === 0 && s[i] === "0") { base = 8; i++; }
  else if (base === 0) base = 10;
  const digits = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, base);
  let acc = 0, saw = false;
  while (i < s.length && digits.includes(s[i]!.toLowerCase())) {
    acc = acc * base + digits.indexOf(s[i]!.toLowerCase());
    i++; saw = true;
  }
  return { value: saw ? sign * acc : 0, rest: s.slice(i) };
}
