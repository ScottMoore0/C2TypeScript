// Annex K — Bounds-checking interfaces (C17 §K.3, conditional via __STDC_LIB_EXT1__).
//
// All functions in this module are thin wrappers over the corresponding non-_s
// libc functions in Forge. They add the runtime constraint checks required by
// C17 §K.3 (NULL-pointer, zero/oversized destination size, source-overruns-
// destination, etc.) and report violations via the constraint handler defined
// in §K.3.6.1.
//
// Per §K.3.6.1.1, an implementation provides a default constraint handler.
// The default here is `__annex_k_default_handler` which records the violation
// but does NOT abort; the calling _s function returns a non-zero `errno_t` so
// the application can react. This matches the MSVC default (`_invalid_parameter
// _noinfo`) and `ignore_handler_s` semantics; programs that prefer abort can
// install `abort_handler_s` via `set_constraint_handler_s`.
//
// Types:
//   - `errno_t` is `int` (modeled as `number`)
//   - `rsize_t` is `size_t` (modeled as `number`); RSIZE_MAX caps "obviously
//     bogus" sizes per §K.3.4 p2.

import type { CPtr } from "../string/string.js";
import {
  c_strlen, c_strcpy, c_strncpy, c_strcat, c_strncat, c_strerror,
  c_memcpy, c_memmove, c_memset, c_strtok_r, c_fromString, c_toString
} from "../string/string.js";
import type { CFile } from "../stdio/file.js";
import {
  c_fopen, c_freopen, c_fprintf, c_printf, c_vfprintf, c_vprintf,
  c_vsnprintf, c_fscanf, c_sscanf, c_vfscanf, c_vsscanf,
  c_tmpfile, c_tmpnam, c_fgets
} from "../stdio/file.js";
import { snprintf } from "../stdio/printf.js";
import { c_qsort, c_bsearch, c_getenv, c_mbstowcs, c_wcstombs } from "../stdlib/stdlib.js";
import {
  c_wcslen, c_wcscpy, c_wcsncpy, c_wcscat, c_wcsncat, c_wcstok,
  c_wmemcpy, c_wmemmove, c_wcrtomb, c_mbsrtowcs, c_wcsrtombs,
  type MbState, type WcsTokState
} from "../wchar/wchar.js";
import type { CTime } from "../time/time.js";
import { c_gmtime, c_localtime, c_asctime, c_ctime } from "../time/time.js";

// -----------------------------------------------------------------------------
// §K.3.3 / §K.3.4 — types and limits
// -----------------------------------------------------------------------------

/** §K.3.3 p1: rsize_t — same range as size_t but typically capped at RSIZE_MAX. */
export type rsize_t = number;
/** §K.3.4 p1: errno_t — int. */
export type errno_t = number;

/** §K.3.5 — RSIZE_MAX. Programs treating any rsize_t > RSIZE_MAX as a runtime
 *  constraint violation. We pick a value comfortably above any sane buffer
 *  but below 2^53 (JS safe-integer ceiling). */
export const RSIZE_MAX = 0x7FFFFFFF; // 2 GiB - 1

// errno values commonly returned by Annex K (subset of <errno.h> values).
const EINVAL = 22;
const ERANGE = 34;
const ENOMEM = 12;

// -----------------------------------------------------------------------------
// §K.3.6.1 — Runtime-constraint handler
// -----------------------------------------------------------------------------

/** §K.3.6.1.1 p2: the constraint-handler signature. */
export type constraint_handler_t = (msg: string, ptr: unknown, error: errno_t) => void;

/** Recent constraint-violation messages, exposed for tests / diagnostics. */
export const __annex_k_violations: string[] = [];

let _handler: constraint_handler_t = __annex_k_default_handler;

/** Default constraint handler — record-and-continue (matches MSVC default). */
export function __annex_k_default_handler(msg: string, _ptr: unknown, _error: errno_t): void {
  __annex_k_violations.push(msg);
}

/** §K.3.6.1.2 p2: abort_handler_s — print msg and abort. */
export function abort_handler_s(msg: string, _ptr: unknown, _error: errno_t): void {
  process.stderr.write(`abort_handler_s: ${msg}\n`);
  throw new Error(`Annex K runtime constraint violated: ${msg}`);
}

/** §K.3.6.1.3 p2: ignore_handler_s — no-op. */
export function ignore_handler_s(_msg: string, _ptr: unknown, _error: errno_t): void {
  /* per §K.3.6.1.3 p2 */
}

/** §K.3.6.1.1 p1: set_constraint_handler_s — install a new handler, return previous. */
export function set_constraint_handler_s(h: constraint_handler_t | null): constraint_handler_t {
  const prev = _handler;
  _handler = h ?? __annex_k_default_handler;
  return prev;
}

/** Internal: invoke the current constraint handler, then return the supplied
 *  errno. Centralises the §K.3.1.4 p2 "report and return non-zero" pattern. */
function __annex_k_invoke(msg: string, ptr: unknown, error: errno_t): errno_t {
  _handler(msg, ptr, error);
  return error;
}

/** Test/diagnostic helper — clear the recorded-violations log. */
export function __annex_k_reset_violations(): void {
  __annex_k_violations.length = 0;
}

// -----------------------------------------------------------------------------
// §K.3.7 — String handling <string.h>
// -----------------------------------------------------------------------------

// Internal predicates --------------------------------------------------------
function isNull(p: CPtr | null | undefined): boolean {
  return p == null || (p.buf.length === 0 && p.off === 0);
}
function ptrSpace(p: CPtr): number {
  return p.buf.length - p.off;
}

/** §K.3.7.1.1 memcpy_s — bounds-checked memcpy. */
export function memcpy_s(dest: CPtr | null, destsz: rsize_t, src: CPtr | null, n: rsize_t): errno_t {
  if (isNull(dest)) return __annex_k_invoke("memcpy_s: dest is null", dest, EINVAL);
  if (destsz > RSIZE_MAX) return __annex_k_invoke("memcpy_s: destsz > RSIZE_MAX", dest, ERANGE);
  if (n > RSIZE_MAX) { __zero(dest!, destsz); return __annex_k_invoke("memcpy_s: n > RSIZE_MAX", dest, ERANGE); }
  if (n > destsz) { __zero(dest!, destsz); return __annex_k_invoke("memcpy_s: n > destsz", dest, ERANGE); }
  if (isNull(src)) { __zero(dest!, destsz); return __annex_k_invoke("memcpy_s: src is null", dest, EINVAL); }
  // §K.3.7.1.1 p2: overlap is undefined behaviour; treat as runtime constraint.
  if (__overlap(dest!, src!, n)) { __zero(dest!, destsz); return __annex_k_invoke("memcpy_s: dest and src overlap", dest, EINVAL); }
  c_memcpy(dest!, src!, n);
  return 0;
}

/** §K.3.7.1.3 strcpy_s — bounds-checked strcpy. */
export function strcpy_s(dest: CPtr | null, destsz: rsize_t, src: CPtr | null): errno_t {
  if (isNull(dest)) return __annex_k_invoke("strcpy_s: dest is null", dest, EINVAL);
  if (destsz === 0 || destsz > RSIZE_MAX) return __annex_k_invoke("strcpy_s: bad destsz", dest, ERANGE);
  if (isNull(src)) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strcpy_s: src is null", dest, EINVAL); }
  const slen = c_strlen(src!);
  if (slen >= destsz) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strcpy_s: src too long for destsz", dest, ERANGE); }
  c_strcpy(dest!, src!);
  return 0;
}

/** §K.3.7.2.1 strcat_s — bounds-checked strcat. */
export function strcat_s(dest: CPtr | null, destsz: rsize_t, src: CPtr | null): errno_t {
  if (isNull(dest)) return __annex_k_invoke("strcat_s: dest is null", dest, EINVAL);
  if (destsz === 0 || destsz > RSIZE_MAX) return __annex_k_invoke("strcat_s: bad destsz", dest, ERANGE);
  if (isNull(src)) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strcat_s: src is null", dest, EINVAL); }
  const dlen = c_strlen(dest!);
  if (dlen >= destsz) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strcat_s: dest unterminated", dest, EINVAL); }
  const slen = c_strlen(src!);
  if (dlen + slen >= destsz) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strcat_s: result too long", dest, ERANGE); }
  c_strcat(dest!, src!);
  return 0;
}

/** §K.3.7.4.1 memset_s — bounds-checked memset. Crucially, unlike memset, the
 *  compiler MAY NOT optimise this away even when the destination is dead. */
export function memset_s(dest: CPtr | null, destsz: rsize_t, ch: number, count: rsize_t): errno_t {
  if (isNull(dest)) return __annex_k_invoke("memset_s: dest is null", dest, EINVAL);
  if (destsz > RSIZE_MAX) return __annex_k_invoke("memset_s: destsz > RSIZE_MAX", dest, ERANGE);
  if (count > RSIZE_MAX) {
    // Per §K.3.7.4.1 p3: writes destsz bytes of ch even when count is invalid.
    c_memset(dest!, ch, Math.min(destsz, ptrSpace(dest!)));
    return __annex_k_invoke("memset_s: count > RSIZE_MAX", dest, ERANGE);
  }
  if (count > destsz) {
    c_memset(dest!, ch, Math.min(destsz, ptrSpace(dest!)));
    return __annex_k_invoke("memset_s: count > destsz", dest, ERANGE);
  }
  c_memset(dest!, ch, count);
  return 0;
}

/** §K.3.7.1.2 memmove_s — bounds-checked memmove. */
export function memmove_s(dest: CPtr | null, destsz: rsize_t, src: CPtr | null, n: rsize_t): errno_t {
  if (isNull(dest)) return __annex_k_invoke("memmove_s: dest is null", dest, EINVAL);
  if (destsz > RSIZE_MAX) return __annex_k_invoke("memmove_s: destsz > RSIZE_MAX", dest, ERANGE);
  if (n > RSIZE_MAX) { __zero(dest!, destsz); return __annex_k_invoke("memmove_s: n > RSIZE_MAX", dest, ERANGE); }
  if (n > destsz) { __zero(dest!, destsz); return __annex_k_invoke("memmove_s: n > destsz", dest, ERANGE); }
  if (isNull(src)) { __zero(dest!, destsz); return __annex_k_invoke("memmove_s: src is null", dest, EINVAL); }
  c_memmove(dest!, src!, n);
  return 0;
}

/** §K.3.7.1.4 strncpy_s — bounds-checked strncpy. */
export function strncpy_s(dest: CPtr | null, destsz: rsize_t, src: CPtr | null, n: rsize_t): errno_t {
  if (isNull(dest)) return __annex_k_invoke("strncpy_s: dest is null", dest, EINVAL);
  if (destsz === 0 || destsz > RSIZE_MAX) return __annex_k_invoke("strncpy_s: bad destsz", dest, ERANGE);
  if (isNull(src)) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strncpy_s: src is null", dest, EINVAL); }
  if (n > RSIZE_MAX) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strncpy_s: n > RSIZE_MAX", dest, ERANGE); }
  // Determine effective length: min(strlen(src), n).
  const srcLen = c_strlen(src!);
  const copyLen = Math.min(srcLen, n);
  // §K.3.7.1.4 p2: if copyLen >= destsz, runtime-constraint violation.
  if (copyLen >= destsz) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strncpy_s: src too long for destsz", dest, ERANGE); }
  c_strncpy(dest!, src!, copyLen);
  dest!.buf[dest!.off + copyLen] = 0;
  return 0;
}

/** §K.3.7.2.2 strncat_s — bounds-checked strncat. */
export function strncat_s(dest: CPtr | null, destsz: rsize_t, src: CPtr | null, n: rsize_t): errno_t {
  if (isNull(dest)) return __annex_k_invoke("strncat_s: dest is null", dest, EINVAL);
  if (destsz === 0 || destsz > RSIZE_MAX) return __annex_k_invoke("strncat_s: bad destsz", dest, ERANGE);
  if (isNull(src)) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strncat_s: src is null", dest, EINVAL); }
  if (n > RSIZE_MAX) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strncat_s: n > RSIZE_MAX", dest, ERANGE); }
  const dlen = c_strlen(dest!);
  if (dlen >= destsz) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strncat_s: dest unterminated", dest, EINVAL); }
  const srcLen = c_strlen(src!);
  const copyLen = Math.min(srcLen, n);
  if (dlen + copyLen >= destsz) { dest!.buf[dest!.off] = 0; return __annex_k_invoke("strncat_s: result would overflow destsz", dest, ERANGE); }
  c_strncat(dest!, src!, copyLen);
  return 0;
}

/** §K.3.7.3.1 strtok_s — bounds-checked, restartable strtok. */
export function strtok_s(s1: CPtr | null, s1max: { value: rsize_t }, s2: CPtr | null, ptr: { value: CPtr | null }): CPtr | null {
  if (s1max == null) { __annex_k_invoke("strtok_s: s1max is null", s1, EINVAL); return null; }
  if (isNull(s2)) { __annex_k_invoke("strtok_s: s2 is null", s2, EINVAL); return null; }
  if (ptr == null) { __annex_k_invoke("strtok_s: ptr is null", null, EINVAL); return null; }
  if (s1max.value > RSIZE_MAX) { __annex_k_invoke("strtok_s: s1max > RSIZE_MAX", s1, ERANGE); return null; }
  if (s1 !== null && !isNull(s1)) {
    // First call: s1 must be non-null
  } else if (ptr.value === null) {
    __annex_k_invoke("strtok_s: ptr is null on continuation call", null, EINVAL);
    return null;
  }
  // Delegate to strtok_r with same state.
  const state = { ptr: ptr.value };
  const tok = c_strtok_r(s1, s2!, state);
  ptr.value = state.ptr;
  // Update s1max to the remaining buffer size.
  if (tok !== null) {
    const consumed = (state.ptr ? state.ptr.off : s1max.value) - (s1 ? s1.off : 0);
    s1max.value = Math.max(0, s1max.value - consumed);
  }
  return tok;
}

/** §K.3.7.4.2 strerror_s — bounds-checked strerror copy. */
export function strerror_s(buf: CPtr | null, bufsz: rsize_t, errnum: number): errno_t {
  if (isNull(buf)) return __annex_k_invoke("strerror_s: buf is null", buf, EINVAL);
  if (bufsz === 0 || bufsz > RSIZE_MAX) return __annex_k_invoke("strerror_s: bad bufsz", buf, ERANGE);
  const msg = c_strerror(errnum);
  const copyLen = Math.min(msg.length, bufsz - 1);
  for (let i = 0; i < copyLen; i++) buf!.buf[buf!.off + i] = msg.charCodeAt(i);
  buf!.buf[buf!.off + copyLen] = 0;
  // §K.3.7.4.2 p3: if message was truncated, return non-zero (we still write).
  return msg.length >= bufsz ? __annex_k_invoke("strerror_s: message truncated", buf, ERANGE) : 0;
}

/** §K.3.7.4.3 strerrorlen_s — length of the strerror message. */
export function strerrorlen_s(errnum: number): number {
  return c_strerror(errnum).length;
}

/** §K.3.7.4.4 strnlen_s — bounded strlen. Returns 0 if str is null. */
export function strnlen_s(str: CPtr | null, strsz: rsize_t): number {
  if (isNull(str)) return 0;
  if (strsz > RSIZE_MAX) strsz = RSIZE_MAX;
  for (let i = 0; i < strsz; i++) {
    if (str!.buf[str!.off + i] === 0) return i;
  }
  return strsz;
}

// -----------------------------------------------------------------------------
// §K.3.5 — Input/output <stdio.h>
// -----------------------------------------------------------------------------

/** §K.3.5.1.1 tmpfile_s — bounds-checked tmpfile. */
export function tmpfile_s(streamptr: { value: CFile | null }): errno_t {
  if (streamptr == null) return __annex_k_invoke("tmpfile_s: streamptr is null", null, EINVAL);
  const f = c_tmpfile();
  streamptr.value = f;
  return f === null ? __annex_k_invoke("tmpfile_s: tmpfile failed", null, EIO()) : 0;
}
function EIO(): number { return 5; }

/** §K.3.5.1.2 tmpnam_s — bounds-checked tmpnam. */
export function tmpnam_s(s: CPtr | null, maxsize: rsize_t): errno_t {
  if (isNull(s)) return __annex_k_invoke("tmpnam_s: s is null", s, EINVAL);
  if (maxsize === 0 || maxsize > RSIZE_MAX) return __annex_k_invoke("tmpnam_s: bad maxsize", s, ERANGE);
  const name = c_tmpnam(null);
  if (name.length >= maxsize) return __annex_k_invoke("tmpnam_s: name too long for maxsize", s, ERANGE);
  for (let i = 0; i < name.length; i++) s!.buf[s!.off + i] = name.charCodeAt(i);
  s!.buf[s!.off + name.length] = 0;
  return 0;
}

/** §K.3.5.2.1 fopen_s — bounds-checked fopen. */
export function fopen_s(streamptr: { value: CFile | null }, filename: string | CPtr | null, mode: string | CPtr | null): errno_t {
  if (streamptr == null) return __annex_k_invoke("fopen_s: streamptr is null", null, EINVAL);
  if (filename == null || (typeof filename !== "string" && isNull(filename))) {
    streamptr.value = null;
    return __annex_k_invoke("fopen_s: filename is null", filename, EINVAL);
  }
  if (mode == null || (typeof mode !== "string" && isNull(mode))) {
    streamptr.value = null;
    return __annex_k_invoke("fopen_s: mode is null", mode, EINVAL);
  }
  const f = c_fopen(filename, mode);
  streamptr.value = f;
  return f === null ? __annex_k_invoke("fopen_s: fopen failed", null, EIO()) : 0;
}

/** §K.3.5.2.2 freopen_s — bounds-checked freopen. */
export function freopen_s(newstreamptr: { value: CFile | null }, filename: string | CPtr | null, mode: string | CPtr | null, stream: CFile | null): errno_t {
  if (newstreamptr == null) return __annex_k_invoke("freopen_s: newstreamptr is null", null, EINVAL);
  if (mode == null || (typeof mode !== "string" && isNull(mode))) { newstreamptr.value = null; return __annex_k_invoke("freopen_s: mode is null", mode, EINVAL); }
  if (stream == null) { newstreamptr.value = null; return __annex_k_invoke("freopen_s: stream is null", null, EINVAL); }
  if (filename == null || (typeof filename !== "string" && isNull(filename))) {
    // §K.3.5.2.2 p3: filename may be null, in which case mode-change only.
    // c_freopen requires a filename, so use the stream's path.
    const f = c_freopen(stream.path, mode, stream);
    newstreamptr.value = f;
    return f === null ? __annex_k_invoke("freopen_s: freopen failed", null, EIO()) : 0;
  }
  const f = c_freopen(filename, mode, stream);
  newstreamptr.value = f;
  return f === null ? __annex_k_invoke("freopen_s: freopen failed", null, EIO()) : 0;
}

/** §K.3.5.3.3 printf_s — like printf but with format-string constraint checks. */
export function printf_s(fmt: string | CPtr | null, ...args: unknown[]): number {
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    __annex_k_invoke("printf_s: fmt is null", fmt, EINVAL);
    return -1;
  }
  return c_printf(fmt, ...args);
}

/** §K.3.5.3.1 fprintf_s — like fprintf with format-string constraint checks. */
export function fprintf_s(stream: CFile | null, fmt: string | CPtr | null, ...args: unknown[]): number {
  if (stream == null) { __annex_k_invoke("fprintf_s: stream is null", null, EINVAL); return -1; }
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    __annex_k_invoke("fprintf_s: fmt is null", fmt, EINVAL);
    return -1;
  }
  return c_fprintf(stream, fmt, ...args);
}

/** §K.3.5.3.10 vprintf_s — vprintf with constraint checks. */
export function vprintf_s(fmt: string | CPtr | null, args: unknown[]): number {
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    __annex_k_invoke("vprintf_s: fmt is null", fmt, EINVAL);
    return -1;
  }
  const f = typeof fmt === "string" ? fmt : c_toString(fmt);
  return c_vprintf(f, args);
}

/** §K.3.5.3.8 vfprintf_s — vfprintf with constraint checks. */
export function vfprintf_s(stream: CFile | null, fmt: string | CPtr | null, args: unknown[]): number {
  if (stream == null) { __annex_k_invoke("vfprintf_s: stream is null", null, EINVAL); return -1; }
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    __annex_k_invoke("vfprintf_s: fmt is null", fmt, EINVAL);
    return -1;
  }
  const f = typeof fmt === "string" ? fmt : c_toString(fmt);
  return c_vfprintf(stream, f, args);
}

/** §K.3.5.3.6 sprintf_s — bounds-checked sprintf. Returns chars written or -1. */
export function sprintf_s(s: CPtr | null, n: rsize_t, fmt: string | CPtr | null, ...args: unknown[]): number {
  if (isNull(s)) { __annex_k_invoke("sprintf_s: s is null", s, EINVAL); return -1; }
  if (n === 0 || n > RSIZE_MAX) { __annex_k_invoke("sprintf_s: bad n", s, ERANGE); return -1; }
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    s!.buf[s!.off] = 0;
    __annex_k_invoke("sprintf_s: fmt is null", fmt, EINVAL); return -1;
  }
  const f = typeof fmt === "string" ? fmt : c_toString(fmt);
  const { result, length } = snprintf(n, f, ...args);
  if (length >= n) { s!.buf[s!.off] = 0; __annex_k_invoke("sprintf_s: output truncated", s, ERANGE); return -1; }
  const bytes = new TextEncoder().encode(result);
  for (let i = 0; i < bytes.length; i++) s!.buf[s!.off + i] = bytes[i]!;
  s!.buf[s!.off + bytes.length] = 0;
  return length;
}

/** §K.3.5.3.5 snprintf_s — bounds-checked snprintf. */
export function snprintf_s(s: CPtr | null, n: rsize_t, fmt: string | CPtr | null, ...args: unknown[]): number {
  if (n > RSIZE_MAX) { __annex_k_invoke("snprintf_s: n > RSIZE_MAX", s, ERANGE); return -1; }
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    if (n > 0 && !isNull(s)) s!.buf[s!.off] = 0;
    __annex_k_invoke("snprintf_s: fmt is null", fmt, EINVAL); return -1;
  }
  if (n > 0 && isNull(s)) { __annex_k_invoke("snprintf_s: s is null with n>0", s, EINVAL); return -1; }
  const f = typeof fmt === "string" ? fmt : c_toString(fmt);
  const { result, length } = snprintf(n, f, ...args);
  if (n > 0 && s) {
    const bytes = new TextEncoder().encode(result);
    for (let i = 0; i < bytes.length; i++) s.buf[s.off + i] = bytes[i]!;
    s.buf[s.off + bytes.length] = 0;
  }
  // §K.3.5.3.5 p4: if length >= n, truncation occurred — runtime constraint.
  if (length >= n && n > 0) { __annex_k_invoke("snprintf_s: output truncated", s, ERANGE); }
  return length;
}

/** §K.3.5.3.12 vsnprintf_s — bounds-checked vsnprintf. */
export function vsnprintf_s(s: CPtr | null, n: rsize_t, fmt: string | CPtr | null, args: unknown[]): number {
  return snprintf_s(s, n, fmt, ...args);
}

/** §K.3.5.3.4 scanf_s — bounds-checked scanf. (No real stdin in this runtime.) */
export function scanf_s(fmt: string | CPtr | null, ..._args: unknown[]): number {
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    __annex_k_invoke("scanf_s: fmt is null", fmt, EINVAL); return -1;
  }
  // No stdin support in non-interactive context; matches scanf behaviour here.
  return -1;
}

/** §K.3.5.3.2 fscanf_s — bounds-checked fscanf. */
export function fscanf_s(stream: CFile | null, fmt: string | CPtr | null, ...args: Array<{ value: unknown } | null>): number {
  if (stream == null) { __annex_k_invoke("fscanf_s: stream is null", null, EINVAL); return -1; }
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    __annex_k_invoke("fscanf_s: fmt is null", fmt, EINVAL); return -1;
  }
  return c_fscanf(stream, fmt, ...args);
}

/** §K.3.5.3.7 sscanf_s — bounds-checked sscanf. */
export function sscanf_s(s: string | CPtr | null, fmt: string | CPtr | null, ...args: Array<{ value: unknown } | null>): number {
  if (s == null || (typeof s !== "string" && isNull(s))) {
    __annex_k_invoke("sscanf_s: s is null", s, EINVAL); return -1;
  }
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    __annex_k_invoke("sscanf_s: fmt is null", fmt, EINVAL); return -1;
  }
  return c_sscanf(s, fmt, ...args);
}

/** §K.3.5.3.11 vscanf_s. */
export function vscanf_s(fmt: string | CPtr | null, _args: Array<{ value: unknown } | null>): number {
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    __annex_k_invoke("vscanf_s: fmt is null", fmt, EINVAL); return -1;
  }
  return -1;
}

/** §K.3.5.3.9 vfscanf_s. */
export function vfscanf_s(stream: CFile | null, fmt: string | CPtr | null, args: Array<{ value: unknown } | null>): number {
  if (stream == null) { __annex_k_invoke("vfscanf_s: stream is null", null, EINVAL); return -1; }
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    __annex_k_invoke("vfscanf_s: fmt is null", fmt, EINVAL); return -1;
  }
  const f = typeof fmt === "string" ? fmt : c_toString(fmt);
  return c_vfscanf(stream, f, args);
}

/** §K.3.5.3.14 vsscanf_s. */
export function vsscanf_s(s: string | CPtr | null, fmt: string | CPtr | null, args: Array<{ value: unknown } | null>): number {
  if (s == null || (typeof s !== "string" && isNull(s))) {
    __annex_k_invoke("vsscanf_s: s is null", s, EINVAL); return -1;
  }
  if (fmt == null || (typeof fmt !== "string" && isNull(fmt))) {
    __annex_k_invoke("vsscanf_s: fmt is null", fmt, EINVAL); return -1;
  }
  const f = typeof fmt === "string" ? fmt : c_toString(fmt);
  return c_vsscanf(s, f, args);
}

/** §K.3.5.4.1 gets_s — bounds-checked gets (read line from stdin). */
export function gets_s(s: CPtr | null, n: rsize_t, stream?: CFile): CPtr | null {
  if (isNull(s)) { __annex_k_invoke("gets_s: s is null", s, EINVAL); return null; }
  if (n === 0 || n > RSIZE_MAX) { __annex_k_invoke("gets_s: bad n", s, ERANGE); return null; }
  // Forge has no real stdin in non-interactive contexts; if a stream is
  // provided, delegate to fgets. Otherwise return null (EOF).
  if (stream) return c_fgets(s!, n, stream);
  return null;
}

// -----------------------------------------------------------------------------
// §K.3.6 — General utilities <stdlib.h>
// -----------------------------------------------------------------------------

/** §K.3.6.2.1 getenv_s — bounds-checked getenv. Writes the value into the
 *  caller's buffer and returns 0 on success, non-zero on constraint violation
 *  or insufficient buffer (per §K.3.6.2.1 p3). */
export function getenv_s(len: { value: number } | null, value: CPtr | null,
                          maxsize: rsize_t, name: string | CPtr | null): errno_t {
  if (name == null || (typeof name !== "string" && isNull(name))) {
    return __annex_k_invoke("getenv_s: name is null", name, EINVAL);
  }
  if (maxsize > RSIZE_MAX) return __annex_k_invoke("getenv_s: maxsize > RSIZE_MAX", value, ERANGE);
  if (maxsize > 0 && isNull(value)) return __annex_k_invoke("getenv_s: value is null with maxsize>0", value, EINVAL);
  const nameStr = typeof name === "string" ? name : c_toString(name);
  const v = c_getenv(nameStr);
  if (v === null) {
    if (maxsize > 0 && value && !isNull(value)) value.buf[value.off] = 0;
    if (len) len.value = 0;
    return 0;
  }
  if (len) len.value = v.length;
  if (v.length >= maxsize) {
    if (maxsize > 0 && value && !isNull(value)) value.buf[value.off] = 0;
    return __annex_k_invoke("getenv_s: value too long for maxsize", value, ERANGE);
  }
  if (value && !isNull(value)) {
    for (let i = 0; i < v.length; i++) value.buf[value.off + i] = v.charCodeAt(i);
    value.buf[value.off + v.length] = 0;
  }
  return 0;
}

/** §K.3.6.3.1 bsearch_s — bounds-checked bsearch with extra context arg. */
export function bsearch_s<T>(key: T, base: T[] | null, nmemb: rsize_t, _size: rsize_t,
                             cmp: ((k: T, e: T, ctx: unknown) => number) | null,
                             context: unknown): T | null {
  if (nmemb === 0) return null;
  if (base === null) { __annex_k_invoke("bsearch_s: base is null", null, EINVAL); return null; }
  if (cmp === null) { __annex_k_invoke("bsearch_s: cmp is null", null, EINVAL); return null; }
  if (nmemb > RSIZE_MAX) { __annex_k_invoke("bsearch_s: nmemb > RSIZE_MAX", null, ERANGE); return null; }
  return c_bsearch(key, base.slice(0, nmemb), (a, b) => cmp(a, b, context));
}

/** §K.3.6.3.2 qsort_s — bounds-checked qsort with extra context arg. */
export function qsort_s<T>(base: T[] | null, nmemb: rsize_t, _size: rsize_t,
                           cmp: ((a: T, b: T, ctx: unknown) => number) | null,
                           context: unknown): errno_t {
  if (nmemb === 0) return 0;
  if (base === null) return __annex_k_invoke("qsort_s: base is null", null, EINVAL);
  if (cmp === null) return __annex_k_invoke("qsort_s: cmp is null", null, EINVAL);
  if (nmemb > RSIZE_MAX) return __annex_k_invoke("qsort_s: nmemb > RSIZE_MAX", null, ERANGE);
  c_qsort(base, (a, b) => cmp(a, b, context));
  return 0;
}

// -----------------------------------------------------------------------------
// §K.3.6.4 — Multibyte/wide-char conversion (in <stdlib.h>)
// -----------------------------------------------------------------------------

/** §K.3.6.4.1 mbstowcs_s — bounds-checked mbstowcs. */
export function mbstowcs_s(retval: { value: number } | null,
                            dst: number[] | null, dstmax: rsize_t,
                            src: string | Uint8Array | null, len: rsize_t): errno_t {
  if (src == null) return __annex_k_invoke("mbstowcs_s: src is null", null, EINVAL);
  if (dst !== null && (dstmax === 0 || dstmax > RSIZE_MAX)) return __annex_k_invoke("mbstowcs_s: bad dstmax", null, ERANGE);
  if (len > RSIZE_MAX) return __annex_k_invoke("mbstowcs_s: len > RSIZE_MAX", null, ERANGE);
  const srcStr = typeof src === "string" ? src : new TextDecoder().decode(src);
  const wideArr: number[] = [];
  for (let i = 0; i < srcStr.length; i++) wideArr.push(srcStr.charCodeAt(i));
  const need = wideArr.length;
  if (dst !== null) {
    const copyLen = Math.min(need, len, dstmax - 1);
    for (let i = 0; i < copyLen; i++) dst[i] = wideArr[i]!;
    dst[copyLen] = 0;
    if (need >= dstmax) {
      if (retval) retval.value = need;
      return __annex_k_invoke("mbstowcs_s: dst too small", null, ERANGE);
    }
    if (retval) retval.value = copyLen;
  } else {
    if (retval) retval.value = need;
  }
  return 0;
}

/** §K.3.6.4.2 wcstombs_s — bounds-checked wcstombs. */
export function wcstombs_s(retval: { value: number } | null,
                            dst: Uint8Array | number[] | null, dstmax: rsize_t,
                            src: number[] | null, len: rsize_t): errno_t {
  if (src == null) return __annex_k_invoke("wcstombs_s: src is null", null, EINVAL);
  if (dst !== null && (dstmax === 0 || dstmax > RSIZE_MAX)) return __annex_k_invoke("wcstombs_s: bad dstmax", null, ERANGE);
  if (len > RSIZE_MAX) return __annex_k_invoke("wcstombs_s: len > RSIZE_MAX", null, ERANGE);
  // Encode wide chars (code units) to UTF-8 bytes.
  let str = "";
  for (let i = 0; i < src.length && src[i] !== 0; i++) str += String.fromCharCode(src[i]!);
  const bytes = new TextEncoder().encode(str);
  const need = bytes.length;
  if (dst !== null) {
    const copyLen = Math.min(need, len, dstmax - 1);
    for (let i = 0; i < copyLen; i++) (dst as any)[i] = bytes[i];
    (dst as any)[copyLen] = 0;
    if (need >= dstmax) {
      if (retval) retval.value = need;
      return __annex_k_invoke("wcstombs_s: dst too small", null, ERANGE);
    }
    if (retval) retval.value = copyLen;
  } else {
    if (retval) retval.value = need;
  }
  return 0;
}

// -----------------------------------------------------------------------------
// §K.3.9 — Wide string and multibyte <wchar.h>
// -----------------------------------------------------------------------------

function wlen(ws: number[]): number { return c_wcslen(ws); }

/** §K.3.9.2.1.3 wmemcpy_s. */
export function wmemcpy_s(dest: number[] | null, destsz: rsize_t, src: number[] | null, n: rsize_t): errno_t {
  if (dest == null) return __annex_k_invoke("wmemcpy_s: dest is null", null, EINVAL);
  if (destsz > RSIZE_MAX) return __annex_k_invoke("wmemcpy_s: destsz > RSIZE_MAX", null, ERANGE);
  if (n > RSIZE_MAX) return __annex_k_invoke("wmemcpy_s: n > RSIZE_MAX", null, ERANGE);
  if (n > destsz) return __annex_k_invoke("wmemcpy_s: n > destsz", null, ERANGE);
  if (src == null) return __annex_k_invoke("wmemcpy_s: src is null", null, EINVAL);
  c_wmemcpy(dest, src, n);
  return 0;
}

/** §K.3.9.2.1.4 wmemmove_s. */
export function wmemmove_s(dest: number[] | null, destsz: rsize_t, src: number[] | null, n: rsize_t): errno_t {
  if (dest == null) return __annex_k_invoke("wmemmove_s: dest is null", null, EINVAL);
  if (destsz > RSIZE_MAX) return __annex_k_invoke("wmemmove_s: destsz > RSIZE_MAX", null, ERANGE);
  if (n > RSIZE_MAX) return __annex_k_invoke("wmemmove_s: n > RSIZE_MAX", null, ERANGE);
  if (n > destsz) return __annex_k_invoke("wmemmove_s: n > destsz", null, ERANGE);
  if (src == null) return __annex_k_invoke("wmemmove_s: src is null", null, EINVAL);
  c_wmemmove(dest, src, n);
  return 0;
}

/** §K.3.9.2.1.1 wcscpy_s. */
export function wcscpy_s(dest: number[] | null, destsz: rsize_t, src: number[] | null): errno_t {
  if (dest == null) return __annex_k_invoke("wcscpy_s: dest is null", null, EINVAL);
  if (destsz === 0 || destsz > RSIZE_MAX) return __annex_k_invoke("wcscpy_s: bad destsz", null, ERANGE);
  if (src == null) { dest[0] = 0; return __annex_k_invoke("wcscpy_s: src is null", null, EINVAL); }
  const slen = wlen(src);
  if (slen >= destsz) { dest[0] = 0; return __annex_k_invoke("wcscpy_s: src too long", null, ERANGE); }
  c_wcscpy(dest, src);
  return 0;
}

/** §K.3.9.2.1.2 wcsncpy_s. */
export function wcsncpy_s(dest: number[] | null, destsz: rsize_t, src: number[] | null, n: rsize_t): errno_t {
  if (dest == null) return __annex_k_invoke("wcsncpy_s: dest is null", null, EINVAL);
  if (destsz === 0 || destsz > RSIZE_MAX) return __annex_k_invoke("wcsncpy_s: bad destsz", null, ERANGE);
  if (src == null) { dest[0] = 0; return __annex_k_invoke("wcsncpy_s: src is null", null, EINVAL); }
  if (n > RSIZE_MAX) { dest[0] = 0; return __annex_k_invoke("wcsncpy_s: n > RSIZE_MAX", null, ERANGE); }
  const slen = wlen(src);
  const copyLen = Math.min(slen, n);
  if (copyLen >= destsz) { dest[0] = 0; return __annex_k_invoke("wcsncpy_s: src too long", null, ERANGE); }
  c_wcsncpy(dest, src, copyLen);
  dest[copyLen] = 0;
  return 0;
}

/** §K.3.9.2.2.1 wcscat_s. */
export function wcscat_s(dest: number[] | null, destsz: rsize_t, src: number[] | null): errno_t {
  if (dest == null) return __annex_k_invoke("wcscat_s: dest is null", null, EINVAL);
  if (destsz === 0 || destsz > RSIZE_MAX) return __annex_k_invoke("wcscat_s: bad destsz", null, ERANGE);
  if (src == null) { dest[0] = 0; return __annex_k_invoke("wcscat_s: src is null", null, EINVAL); }
  const dlen = wlen(dest);
  if (dlen >= destsz) { dest[0] = 0; return __annex_k_invoke("wcscat_s: dest unterminated", null, EINVAL); }
  const slen = wlen(src);
  if (dlen + slen >= destsz) { dest[0] = 0; return __annex_k_invoke("wcscat_s: result too long", null, ERANGE); }
  c_wcscat(dest, src);
  return 0;
}

/** §K.3.9.2.2.2 wcsncat_s. */
export function wcsncat_s(dest: number[] | null, destsz: rsize_t, src: number[] | null, n: rsize_t): errno_t {
  if (dest == null) return __annex_k_invoke("wcsncat_s: dest is null", null, EINVAL);
  if (destsz === 0 || destsz > RSIZE_MAX) return __annex_k_invoke("wcsncat_s: bad destsz", null, ERANGE);
  if (src == null) { dest[0] = 0; return __annex_k_invoke("wcsncat_s: src is null", null, EINVAL); }
  if (n > RSIZE_MAX) { dest[0] = 0; return __annex_k_invoke("wcsncat_s: n > RSIZE_MAX", null, ERANGE); }
  const dlen = wlen(dest);
  if (dlen >= destsz) { dest[0] = 0; return __annex_k_invoke("wcsncat_s: dest unterminated", null, EINVAL); }
  const slen = Math.min(wlen(src), n);
  if (dlen + slen >= destsz) { dest[0] = 0; return __annex_k_invoke("wcsncat_s: result too long", null, ERANGE); }
  c_wcsncat(dest, src, slen);
  return 0;
}

/** §K.3.9.2.4.1 wcsnlen_s — bounded wcslen. */
export function wcsnlen_s(s: number[] | null, maxsize: rsize_t): number {
  if (s == null) return 0;
  if (maxsize > RSIZE_MAX) maxsize = RSIZE_MAX;
  for (let i = 0; i < maxsize; i++) {
    if (s[i] === 0 || s[i] === undefined) return i;
  }
  return maxsize;
}

/** §K.3.9.2.3.1 wcstok_s. */
export function wcstok_s(s1: number[] | null, s1max: { value: rsize_t },
                          delim: number[] | null, ptr: { value: number[] | null }): number[] | null {
  if (s1max == null) { __annex_k_invoke("wcstok_s: s1max is null", null, EINVAL); return null; }
  if (delim == null) { __annex_k_invoke("wcstok_s: delim is null", null, EINVAL); return null; }
  if (ptr == null) { __annex_k_invoke("wcstok_s: ptr is null", null, EINVAL); return null; }
  if (s1max.value > RSIZE_MAX) { __annex_k_invoke("wcstok_s: s1max > RSIZE_MAX", null, ERANGE); return null; }
  if (s1 === null && ptr.value === null) {
    __annex_k_invoke("wcstok_s: ptr is null on continuation call", null, EINVAL);
    return null;
  }
  const state: WcsTokState = { s: s1 ?? ptr.value, off: 0 };
  // Find current offset in ptr.value if continuing.
  if (s1 === null && ptr.value !== null) {
    state.s = ptr.value;
  }
  const tok = c_wcstok(s1, delim, state);
  ptr.value = state.s;
  return tok;
}

/** §K.3.9.3.1.1 wcrtomb_s — bounds-checked wcrtomb. */
export function wcrtomb_s(retval: { value: number } | null, s: Uint8Array | number[] | null,
                           ssz: rsize_t, wc: number, ps: MbState): errno_t {
  if (s !== null && (ssz === 0 || ssz > RSIZE_MAX)) return __annex_k_invoke("wcrtomb_s: bad ssz", null, ERANGE);
  // §K.3.9.3.1.1 p3: if s is null, ssz and wc are ignored, behave as wcrtomb(NULL,L'\0',ps).
  if (s === null) {
    const r = c_wcrtomb(null, 0, ps);
    if (r < 0) return __annex_k_invoke("wcrtomb_s: encoding error", null, EILSEQ());
    if (retval) retval.value = r;
    return 0;
  }
  // Need a small probe to compute byte length.
  const probe = new Uint8Array(4);
  const r = c_wcrtomb(probe, wc, ps);
  if (r < 0) return __annex_k_invoke("wcrtomb_s: encoding error", null, EILSEQ());
  if (r > ssz) return __annex_k_invoke("wcrtomb_s: result too large for ssz", null, ERANGE);
  for (let i = 0; i < r; i++) (s as any)[i] = probe[i];
  if (retval) retval.value = r;
  return 0;
}
function EILSEQ(): number { return 84; }

/** §K.3.9.3.2.1 mbsrtowcs_s — bounds-checked mbsrtowcs. */
export function mbsrtowcs_s(retval: { value: number } | null,
                             dst: number[] | null, dstmax: rsize_t,
                             src: { value: Uint8Array | number[] | null },
                             len: rsize_t, ps: MbState): errno_t {
  if (src == null || src.value == null) return __annex_k_invoke("mbsrtowcs_s: src is null", null, EINVAL);
  if (dst !== null && (dstmax === 0 || dstmax > RSIZE_MAX)) return __annex_k_invoke("mbsrtowcs_s: bad dstmax", null, ERANGE);
  if (len > RSIZE_MAX) return __annex_k_invoke("mbsrtowcs_s: len > RSIZE_MAX", null, ERANGE);
  const n = c_mbsrtowcs(dst, src.value, dst === null ? len : Math.min(len, dstmax - 1), ps);
  if (n < 0) return __annex_k_invoke("mbsrtowcs_s: encoding error", null, EILSEQ());
  if (retval) retval.value = n;
  if (dst !== null && n >= 0) dst[n] = 0;
  return 0;
}

/** §K.3.9.3.2.2 wcsrtombs_s — bounds-checked wcsrtombs. */
export function wcsrtombs_s(retval: { value: number } | null,
                             dst: Uint8Array | number[] | null, dstmax: rsize_t,
                             src: { value: number[] | null }, len: rsize_t, ps: MbState): errno_t {
  if (src == null || src.value == null) return __annex_k_invoke("wcsrtombs_s: src is null", null, EINVAL);
  if (dst !== null && (dstmax === 0 || dstmax > RSIZE_MAX)) return __annex_k_invoke("wcsrtombs_s: bad dstmax", null, ERANGE);
  if (len > RSIZE_MAX) return __annex_k_invoke("wcsrtombs_s: len > RSIZE_MAX", null, ERANGE);
  const n = c_wcsrtombs(dst, src.value, dst === null ? len : Math.min(len, dstmax - 1), ps);
  if (n < 0) return __annex_k_invoke("wcsrtombs_s: encoding error", null, EILSEQ());
  if (retval) retval.value = n;
  if (dst !== null && n >= 0) (dst as any)[n] = 0;
  return 0;
}

// -----------------------------------------------------------------------------
// §K.3.8 — Date and time <time.h>
// -----------------------------------------------------------------------------

/** §K.3.8.2.3 gmtime_s — bounds-checked gmtime, writes into caller's buffer. */
export function gmtime_s(timer: { value: number } | number, result: CTime | null): CTime | null {
  if (result == null) { __annex_k_invoke("gmtime_s: result is null", null, EINVAL); return null; }
  const t = typeof timer === "number" ? timer : timer.value;
  const r = c_gmtime(t);
  Object.assign(result, r);
  return result;
}

/** §K.3.8.2.4 localtime_s — bounds-checked localtime. */
export function localtime_s(timer: { value: number } | number, result: CTime | null): CTime | null {
  if (result == null) { __annex_k_invoke("localtime_s: result is null", null, EINVAL); return null; }
  const t = typeof timer === "number" ? timer : timer.value;
  const r = c_localtime(t);
  Object.assign(result, r);
  return result;
}

/** §K.3.8.2.1 asctime_s — bounds-checked asctime, writes into caller's buffer.
 *  §K.3.8.2.1 p1 mandates buf sized at least 26 chars. */
export function asctime_s(buf: CPtr | null, bufsz: rsize_t, tm: CTime | null): errno_t {
  if (isNull(buf)) return __annex_k_invoke("asctime_s: buf is null", buf, EINVAL);
  if (bufsz < 26 || bufsz > RSIZE_MAX) return __annex_k_invoke("asctime_s: bufsz < 26", buf, ERANGE);
  if (tm == null) { buf!.buf[buf!.off] = 0; return __annex_k_invoke("asctime_s: tm is null", buf, EINVAL); }
  const s = c_asctime(tm);
  if (s.length >= bufsz) { buf!.buf[buf!.off] = 0; return __annex_k_invoke("asctime_s: result too long", buf, ERANGE); }
  for (let i = 0; i < s.length; i++) buf!.buf[buf!.off + i] = s.charCodeAt(i);
  buf!.buf[buf!.off + s.length] = 0;
  return 0;
}

/** §K.3.8.2.2 ctime_s — bounds-checked ctime. */
export function ctime_s(buf: CPtr | null, bufsz: rsize_t, timer: { value: number } | number | null): errno_t {
  if (isNull(buf)) return __annex_k_invoke("ctime_s: buf is null", buf, EINVAL);
  if (bufsz < 26 || bufsz > RSIZE_MAX) return __annex_k_invoke("ctime_s: bufsz < 26", buf, ERANGE);
  if (timer == null) { buf!.buf[buf!.off] = 0; return __annex_k_invoke("ctime_s: timer is null", buf, EINVAL); }
  const t = typeof timer === "number" ? timer : timer.value;
  const s = c_ctime(t);
  if (s.length >= bufsz) { buf!.buf[buf!.off] = 0; return __annex_k_invoke("ctime_s: result too long", buf, ERANGE); }
  for (let i = 0; i < s.length; i++) buf!.buf[buf!.off + i] = s.charCodeAt(i);
  buf!.buf[buf!.off + s.length] = 0;
  return 0;
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

function __zero(p: CPtr, n: number): void {
  const limit = Math.min(n, ptrSpace(p));
  for (let i = 0; i < limit; i++) p.buf[p.off + i] = 0;
}

/** Detect overlapping byte ranges within the same backing buffer. Different
 *  buffers can never overlap in this runtime model. */
function __overlap(dest: CPtr, src: CPtr, n: number): boolean {
  if (dest.buf !== src.buf) return false;
  const ds = dest.off, de = dest.off + n;
  const ss = src.off, se = src.off + n;
  return ds < se && ss < de;
}

// Suppress "imported but not used" warnings — these may be needed by future
// _s functions (e.g. memcpy_s, getenv_s already exist in the codebase per
// the audit, but additional helpers may need them).
void c_memcpy; void c_memset; void c_strcpy; void c_strcat; void c_strtok_r;
void c_fromString; void c_getenv; void c_mbstowcs; void c_wcstombs;
void c_vsnprintf;
