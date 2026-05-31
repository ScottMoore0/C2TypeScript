// wchar.h — C17 §7.29 wide string and wide-character I/O.
//
// wchar_t is modeled as a JavaScript number (UCS-2/UTF-16 code unit, which is
// sufficient for the BMP; supplementary characters are handled via surrogate
// pairs when converting to/from JS strings). Wide strings are stored as
// number[] arrays terminated by 0, matching the C convention.
//
// WEOF is re-exported from <wctype.h> (C17 §7.29.1 p3 "WEOF ... expands to a
// constant expression of type wint_t whose value does not correspond to any
// member of the extended character set"; we use -1).
//
// Per C17 §7.29.1 p3, the functions here operate on wide-character strings.
// Numeric parsing matches the narrow <stdlib.h> counterparts per §7.29.4.1.

import type { CFile } from "../stdio/file.js";
import { c_fputc, c_fgetc, c_ungetc, c_putchar, c_stdin, c_stdout } from "../stdio/file.js";
import { formatPrintf } from "../stdio/printf.js";

export { WEOF } from "../wctype/wctype.js";
import { WEOF } from "../wctype/wctype.js";

// ---------------------------------------------------------------------------
// §7.29.4 String manipulation
// ---------------------------------------------------------------------------

// §7.29.4.6.1 wcslen
export function c_wcslen(ws: number[]): number {
  let i = 0; while (ws[i] !== 0 && i < ws.length) i++; return i;
}
// §7.29.4.2.1 wcscpy
export function c_wcscpy(dst: number[], src: number[]): number[] {
  let i = 0; while (src[i] !== 0) { dst[i] = src[i]!; i++; } dst[i] = 0; return dst;
}
// §7.29.4.2.2 wcsncpy
export function c_wcsncpy(dst: number[], src: number[], n: number): number[] {
  let i = 0;
  for (; i < n && src[i] !== undefined && src[i] !== 0; i++) dst[i] = src[i]!;
  for (; i < n; i++) dst[i] = 0;
  return dst;
}
// §7.29.4.3.1 wcscat
export function c_wcscat(dst: number[], src: number[]): number[] {
  let i = c_wcslen(dst), j = 0;
  while (src[j] !== 0) { dst[i++] = src[j++]!; } dst[i] = 0; return dst;
}
// §7.29.4.3.2 wcsncat
export function c_wcsncat(dst: number[], src: number[], n: number): number[] {
  let i = c_wcslen(dst), j = 0;
  while (j < n && src[j] !== 0 && src[j] !== undefined) { dst[i++] = src[j++]!; }
  dst[i] = 0; return dst;
}
// §7.29.4.4.1 wcscmp
export function c_wcscmp(a: number[], b: number[]): number {
  let i = 0;
  while (a[i] === b[i] && a[i] !== 0) i++;
  return (a[i] ?? 0) - (b[i] ?? 0);
}
// §7.29.4.4.2 wcsncmp
export function c_wcsncmp(a: number[], b: number[], n: number): number {
  for (let i = 0; i < n; i++) {
    const av = a[i] ?? 0, bv = b[i] ?? 0;
    if (av !== bv) return av - bv;
    if (av === 0) return 0;
  }
  return 0;
}
// §7.29.4.4.3 wcscoll — locale-dependent collation; in the "C" locale this is
// equivalent to wcscmp (§7.11.1.1 p3 / §7.29.4.4.3 p2).
export function c_wcscoll(a: number[], b: number[]): number {
  return c_wcscmp(a, b);
}
// §7.29.4.4.4 wcsxfrm — transform so that wcscmp of transformed values mirrors
// wcscoll. In the "C" locale we can simply copy (§7.29.4.4.4 p2).
export function c_wcsxfrm(dst: number[] | null, src: number[], n: number): number {
  const len = c_wcslen(src);
  if (dst !== null && n > 0) {
    const limit = Math.min(len, n - 1);
    for (let i = 0; i < limit; i++) dst[i] = src[i]!;
    dst[limit] = 0;
  }
  return len;
}
// §7.29.4.5.1 wcschr — first occurrence, or -1 when absent (C returns NULL).
// Per §7.29.4.5.1 p2, the terminating null wide character is included in the search.
export function c_wcschr(ws: number[], c: number): number {
  for (let i = 0; i <= c_wcslen(ws); i++) { if (ws[i] === c) return i; }
  return -1;
}
// §7.29.4.5.5 wcsrchr — last occurrence; includes terminating null per §7.29.4.5.5 p2.
export function c_wcsrchr(ws: number[], c: number): number {
  let found = -1;
  for (let i = 0; i <= c_wcslen(ws); i++) { if (ws[i] === c) found = i; }
  return found;
}
// §7.29.4.5.7 wcsstr
export function c_wcsstr(hay: number[], needle: number[]): number {
  const n = c_wcslen(needle);
  if (n === 0) return 0;
  const h = c_wcslen(hay);
  outer: for (let i = 0; i + n <= h; i++) {
    for (let j = 0; j < n; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}
// §7.29.4.5.3 wcspbrk
export function c_wcspbrk(ws: number[], set: number[]): number {
  const setN = c_wcslen(set);
  for (let i = 0, l = c_wcslen(ws); i < l; i++) {
    for (let j = 0; j < setN; j++) if (ws[i] === set[j]) return i;
  }
  return -1;
}
// §7.29.4.5.6 wcsspn
export function c_wcsspn(ws: number[], set: number[]): number {
  const setN = c_wcslen(set); let i = 0;
  outer: for (const L = c_wcslen(ws); i < L; i++) {
    for (let j = 0; j < setN; j++) if (ws[i] === set[j]) continue outer;
    break;
  }
  return i;
}
// §7.29.4.5.2 wcscspn
export function c_wcscspn(ws: number[], set: number[]): number {
  const setN = c_wcslen(set); let i = 0;
  for (const L = c_wcslen(ws); i < L; i++) {
    for (let j = 0; j < setN; j++) if (ws[i] === set[j]) return i;
  }
  return i;
}

// §7.29.4.5.8 wcstok — reentrant tokenizer. The saveptr is modeled as a
// mutable single-element array { value: number[] | null, off: number }.
// Returns { tok, start, len } or null when no more tokens remain.
// This differs from the C signature (which mutates in place and returns a pointer)
// but preserves the functional behavior required by §7.29.4.5.8 p3: successive
// calls with null s1 continue from the previous position in the same string.
export interface WcsTokState { s: number[] | null; off: number; }
/** C17 §7.29.4.5.8 wcstok — strtok equivalent for wide strings. */
export function c_wcstok(s1: number[] | null, s2: number[], state: WcsTokState): number[] | null {
  if (s1 !== null) { state.s = s1; state.off = 0; }
  const s = state.s;
  if (s === null) return null;
  // Skip leading delimiters.
  let i = state.off;
  outer: while (i < s.length && s[i] !== 0) {
    for (let j = 0; j < s2.length && s2[j] !== 0; j++) {
      if (s[i] === s2[j]) { i++; continue outer; }
    }
    break;
  }
  if (i >= s.length || s[i] === 0) { state.s = null; return null; }
  const start = i;
  // Advance to next delimiter.
  while (i < s.length && s[i] !== 0) {
    let isDelim = false;
    for (let j = 0; j < s2.length && s2[j] !== 0; j++) {
      if (s[i] === s2[j]) { isDelim = true; break; }
    }
    if (isDelim) break;
    i++;
  }
  const token = s.slice(start, i);
  token.push(0);
  if (i < s.length && s[i] !== 0) { state.off = i + 1; } else { state.s = null; }
  return token;
}

// §7.29.4 (POSIX extension) wcsdup — duplicate a wide string. Not in C17
// proper, but widely available and required by real codebases.
export function c_wcsdup(ws: number[]): number[] {
  const len = c_wcslen(ws);
  const out = new Array<number>(len + 1);
  for (let i = 0; i < len; i++) out[i] = ws[i]!;
  out[len] = 0;
  return out;
}

// ---------------------------------------------------------------------------
// §7.29.4.4 Wide memory operations
// ---------------------------------------------------------------------------

// §7.29.4.4.1 wmemcpy
export function c_wmemcpy(dst: number[], src: number[], n: number): number[] {
  for (let i = 0; i < n; i++) dst[i] = src[i]!; return dst;
}
// §7.29.4.4.2 wmemmove — must behave as if via an intermediate buffer.
export function c_wmemmove(dst: number[], src: number[], n: number): number[] {
  const tmp = src.slice(0, n);
  for (let i = 0; i < n; i++) dst[i] = tmp[i]!; return dst;
}
// §7.29.4.4.3 wmemcmp
export function c_wmemcmp(a: number[], b: number[], n: number): number {
  for (let i = 0; i < n; i++) { if (a[i]! !== b[i]!) return a[i]! - b[i]!; } return 0;
}
// §7.29.4.4.4 wmemchr
export function c_wmemchr(ws: number[], c: number, n: number): number {
  for (let i = 0; i < n; i++) if (ws[i] === c) return i;
  return -1;
}
// §7.29.4.4.5 wmemset
export function c_wmemset(ws: number[], c: number, n: number): number[] {
  for (let i = 0; i < n; i++) ws[i] = c; return ws;
}

// ---------------------------------------------------------------------------
// §7.29.4.1 Numeric conversions
// ---------------------------------------------------------------------------

function trimLead(ws: number[], start: number): number {
  let i = start; while (ws[i] === 0x20 || (ws[i]! >= 0x09 && ws[i]! <= 0x0D)) i++; return i;
}
function digitVal(c: number, base: number): number {
  let v = -1;
  if (c >= 0x30 && c <= 0x39) v = c - 0x30;
  else if (c >= 0x41 && c <= 0x5A) v = c - 0x41 + 10;
  else if (c >= 0x61 && c <= 0x7A) v = c - 0x61 + 10;
  return v >= 0 && v < base ? v : -1;
}
function parseIntW(ws: number[], base: number): { value: number; endIndex: number } {
  let i = trimLead(ws, 0);
  let sign = 1;
  if (ws[i] === 0x2B) i++;
  else if (ws[i] === 0x2D) { sign = -1; i++; }
  if (base === 0) {
    if (ws[i] === 0x30 && (ws[i+1] === 0x78 || ws[i+1] === 0x58)) { base = 16; i += 2; }
    else if (ws[i] === 0x30) base = 8;
    else base = 10;
  } else if (base === 16 && ws[i] === 0x30 && (ws[i+1] === 0x78 || ws[i+1] === 0x58)) {
    i += 2;
  }
  let value = 0, any = false;
  while (i < ws.length) {
    const d = digitVal(ws[i]!, base);
    if (d < 0) break;
    value = value * base + d; i++; any = true;
  }
  if (!any) return { value: 0, endIndex: 0 };
  return { value: sign * value, endIndex: i };
}
// §7.29.4.1.2 wcstol
export function c_wcstol(ws: number[], base: number = 10) {
  const r = parseIntW(ws, base);
  // §7.29.4.1.2 p8: clamp to LONG_MIN/LONG_MAX on overflow (we model as 32-bit).
  if (r.value > 0x7FFFFFFF) return { value: 0x7FFFFFFF, endIndex: r.endIndex };
  if (r.value < -0x80000000) return { value: -0x80000000, endIndex: r.endIndex };
  return r;
}
// §7.29.4.1.2 wcstoll
export function c_wcstoll(ws: number[], base: number = 10) { return parseIntW(ws, base); }
// §7.29.4.1.2 wcstoul
export function c_wcstoul(ws: number[], base: number = 10) {
  const r = parseIntW(ws, base);
  // Per §7.29.4.1.2 p5, a leading minus sign is accepted and the negated value
  // is wrapped modulo ULONG_MAX+1. Mirror strtoul behavior using u32 wrap.
  return { value: r.value >>> 0, endIndex: r.endIndex };
}
// §7.29.4.1.2 wcstoull
export function c_wcstoull(ws: number[], base: number = 10) {
  const r = parseIntW(ws, base); return { value: r.value >>> 0, endIndex: r.endIndex };
}
// §7.29.4.1.1 wcstod
export function c_wcstod(ws: number[]): { value: number; endIndex: number } {
  const s = w_toStringPrefix(ws);
  const m = s.match(/^\s*[+-]?(inf(inity)?|nan|\d+(\.\d*)?([eE][+-]?\d+)?|\.\d+([eE][+-]?\d+)?|0[xX][0-9a-fA-F]+(\.[0-9a-fA-F]*)?([pP][+-]?\d+)?)/i);
  if (!m) return { value: 0, endIndex: 0 };
  // Count leading whitespace skipped by the regex so endIndex matches the
  // original string position (wchar_t code units).
  const lead = m[0].match(/^\s*/)![0].length;
  const token = m[0].slice(lead);
  let v: number;
  if (/^[+-]?inf/i.test(token)) v = token.startsWith("-") ? -Infinity : Infinity;
  else if (/^[+-]?nan/i.test(token)) v = NaN;
  else if (/^[+-]?0[xX]/.test(token)) v = parseFloat(token); // JS parseFloat handles hex poorly; fall back
  else v = parseFloat(token);
  return { value: v, endIndex: lead + token.length };
}
export const c_wcstof = c_wcstod;
export const c_wcstold = c_wcstod;

// ---------------------------------------------------------------------------
// §7.29.6 Multibyte/wide character conversion utilities (restartable)
// mbstate_t is modeled as an object that tracks incomplete UTF-8 state.
// ---------------------------------------------------------------------------

export interface MbState { pending: number[]; needed: number; cp: number; }
export function mb_initState(): MbState { return { pending: [], needed: 0, cp: 0 }; }

/** C17 §7.29.6.1 btowc — convert a single-byte character to wide. Returns
 *  WEOF for EOF and for bytes that are not valid in the initial state. */
export function c_btowc(c: number): number {
  if (c === -1) return WEOF;
  if (c < 0 || c > 0x7F) return WEOF; // only ASCII is well-defined in the C locale
  return c;
}

/** C17 §7.29.6.2 wctob — convert a wide character to single byte. Returns
 *  EOF (-1) if it has no single-byte representation. */
export function c_wctob(wc: number): number {
  if (wc < 0 || wc > 0x7F) return -1;
  return wc;
}

/** C17 §7.29.6.3 mbsinit — does the mbstate represent initial conversion state? */
export function c_mbsinit(ps: MbState | null): number {
  if (ps === null) return 1;
  return (ps.needed === 0) ? 1 : 0;
}

/** C17 §7.29.6.3.1 mbrlen — restartable mblen over UTF-8 bytes.
 *  Returns length in bytes of next mb character, 0 if null char, (size_t)-1
 *  on encoding error (-1 here), (size_t)-2 (-2) if incomplete. */
export function c_mbrlen(s: Uint8Array | number[] | null, n: number, ps: MbState): number {
  return c_mbrtowc(null, s, n, ps);
}

/** C17 §7.29.6.3.2 mbrtowc — restartable UTF-8 → wchar. */
export function c_mbrtowc(pwc: { value: number } | null, s: Uint8Array | number[] | null, n: number, ps: MbState): number {
  if (s === null) { ps.pending = []; ps.needed = 0; ps.cp = 0; return 0; }
  let consumed = 0;
  for (let i = 0; i < n; i++) {
    const b = (s as any)[i] as number;
    consumed++;
    if (ps.needed === 0) {
      if (b < 0x80) {
        if (pwc) pwc.value = b;
        if (b === 0) return 0;
        return consumed;
      } else if ((b & 0xE0) === 0xC0) { ps.needed = 1; ps.cp = b & 0x1F; }
      else if ((b & 0xF0) === 0xE0) { ps.needed = 2; ps.cp = b & 0x0F; }
      else if ((b & 0xF8) === 0xF0) { ps.needed = 3; ps.cp = b & 0x07; }
      else return -1;
    } else {
      if ((b & 0xC0) !== 0x80) return -1;
      ps.cp = (ps.cp << 6) | (b & 0x3F);
      ps.needed--;
      if (ps.needed === 0) { if (pwc) pwc.value = ps.cp; return consumed; }
    }
  }
  return -2; // incomplete
}

/** C17 §7.29.6.3.3 wcrtomb — restartable wchar → UTF-8. Writes up to 4 bytes
 *  into s (Uint8Array or number[]) and returns byte count, or (size_t)-1 on
 *  encoding error. If s is null, behaves as wcrtomb(buf, L'\\0', ps). */
export function c_wcrtomb(s: Uint8Array | number[] | null, wc: number, _ps: MbState): number {
  if (s === null) { wc = 0; s = new Uint8Array(4); }
  let i = 0;
  const put = (v: number) => { (s as any)[i++] = v; };
  if (wc < 0) return -1;
  if (wc < 0x80) { put(wc); return 1; }
  if (wc < 0x800) { put(0xC0 | (wc >> 6)); put(0x80 | (wc & 0x3F)); return 2; }
  if (wc < 0x10000) { put(0xE0 | (wc >> 12)); put(0x80 | ((wc >> 6) & 0x3F)); put(0x80 | (wc & 0x3F)); return 3; }
  if (wc < 0x110000) {
    put(0xF0 | (wc >> 18));
    put(0x80 | ((wc >> 12) & 0x3F));
    put(0x80 | ((wc >> 6) & 0x3F));
    put(0x80 | (wc & 0x3F));
    return 4;
  }
  return -1;
}

/** C17 §7.29.6.4.1 mbsrtowcs — restartable mbstowcs. */
export function c_mbsrtowcs(dst: number[] | null, src: Uint8Array | number[], n: number, ps: MbState): number {
  let count = 0, i = 0;
  const out = { value: 0 };
  while (true) {
    if (dst !== null && count >= n) break;
    const r = c_mbrtowc(out, (src as any).slice ? (src as any).slice(i) : (src as Uint8Array).subarray(i), (src as any).length - i, ps);
    if (r === -1 || r === -2) return -1;
    if (r === 0) { if (dst !== null) dst[count] = 0; return count; }
    if (dst !== null) dst[count] = out.value;
    count++; i += r;
  }
  return count;
}

/** C17 §7.29.6.4.2 wcsrtombs — restartable wcstombs. */
export function c_wcsrtombs(dst: Uint8Array | number[] | null, src: number[], n: number, ps: MbState): number {
  let count = 0, i = 0;
  const buf = new Uint8Array(4);
  while (src[i] !== 0 && src[i] !== undefined) {
    const r = c_wcrtomb(buf, src[i]!, ps);
    if (r === -1) return -1;
    if (dst !== null && count + r > n) break;
    if (dst !== null) for (let j = 0; j < r; j++) (dst as any)[count + j] = buf[j];
    count += r; i++;
  }
  if (src[i] === 0 && (dst === null || count < n)) {
    if (dst !== null) (dst as any)[count] = 0;
  }
  return count;
}

// ---------------------------------------------------------------------------
// §7.29.3 Wide character I/O (fwide and friends)
// ---------------------------------------------------------------------------

// §7.29.3.5 fwide — orientation selector. JS streams have no orientation, so
// we report a stable "wide" orientation when requested, else current (0).
const _fwideMap = new WeakMap<CFile, number>();
export function c_fwide(stream: CFile, mode: number): number {
  const cur = _fwideMap.get(stream) ?? 0;
  if (cur !== 0) return cur;
  if (mode > 0) { _fwideMap.set(stream, 1); return 1; }
  if (mode < 0) { _fwideMap.set(stream, -1); return -1; }
  return 0;
}

// §7.29.3.1 fwprintf — format to stream in UTF-8.
export function c_fwprintf(stream: CFile, fmt: number[], ...args: unknown[]): number {
  const s = formatPrintf(w_toString(fmt), args);
  const bytes = new TextEncoder().encode(s);
  for (let i = 0; i < bytes.length; i++) c_fputc(bytes[i]!, stream);
  return s.length;
}
// §7.29.3.9 wprintf
export function c_wprintf(fmt: number[], ...args: unknown[]): number {
  return c_fwprintf(c_stdout, fmt, ...args);
}
// §7.29.3.3 swprintf — format to wide string buffer, truncating to n-1 plus NUL.
export function c_swprintf(dst: number[], n: number, fmt: number[], ...args: unknown[]): number {
  const s = formatPrintf(w_toString(fmt), args);
  const limit = Math.min(s.length, n - 1);
  for (let i = 0; i < limit; i++) dst[i] = s.charCodeAt(i);
  if (n > 0) dst[limit] = 0;
  return s.length < n ? s.length : -1; // §7.29.3.3 p2: -1 if truncated
}
// §7.29.3.10 vfwprintf / §7.29.3.11 vswprintf / §7.29.3.12 vwprintf
export function c_vfwprintf(stream: CFile, fmt: number[], args: unknown[]): number {
  return c_fwprintf(stream, fmt, ...args);
}
export function c_vswprintf(dst: number[], n: number, fmt: number[], args: unknown[]): number {
  return c_swprintf(dst, n, fmt, ...args);
}
export function c_vwprintf(fmt: number[], args: unknown[]): number {
  return c_wprintf(fmt, ...args);
}

// §7.29.3.2 fputwc — write a single wide character as UTF-8 to stream.
export function c_fputwc(wc: number, stream: CFile): number {
  const buf = new Uint8Array(4);
  const n = c_wcrtomb(buf, wc, mb_initState());
  if (n < 0) return WEOF;
  for (let i = 0; i < n; i++) c_fputc(buf[i]!, stream);
  return wc;
}
export const c_putwc = c_fputwc; // §7.29.3.7
// §7.29.3.8 putwchar
export function c_putwchar(wc: number): number { return c_fputwc(wc, c_stdout); }

// §7.29.3.1 fputws — write a wide string.
export function c_fputws(ws: number[], stream: CFile): number {
  for (let i = 0, n = c_wcslen(ws); i < n; i++) {
    if (c_fputwc(ws[i]!, stream) === WEOF) return -1;
  }
  return 0;
}

// §7.29.3.6 fgetwc — read one wide character (decode UTF-8 from stream).
export function c_fgetwc(stream: CFile): number {
  const b0 = c_fgetc(stream);
  if (b0 === -1) return WEOF;
  let needed = 0, cp = 0;
  if (b0 < 0x80) return b0;
  else if ((b0 & 0xE0) === 0xC0) { needed = 1; cp = b0 & 0x1F; }
  else if ((b0 & 0xF0) === 0xE0) { needed = 2; cp = b0 & 0x0F; }
  else if ((b0 & 0xF8) === 0xF0) { needed = 3; cp = b0 & 0x07; }
  else return WEOF;
  for (let k = 0; k < needed; k++) {
    const b = c_fgetc(stream);
    if (b === -1 || (b & 0xC0) !== 0x80) return WEOF;
    cp = (cp << 6) | (b & 0x3F);
  }
  return cp;
}
export const c_getwc = c_fgetwc; // §7.29.3.5
// §7.29.3.6 getwchar
export function c_getwchar(): number { return c_fgetwc(c_stdin); }

// §7.29.3.3 fgetws — read up to n-1 wide chars or through \n, NUL-terminated.
export function c_fgetws(dst: number[], n: number, stream: CFile): number[] | null {
  if (n <= 0) return null;
  let i = 0, got = false;
  while (i < n - 1) {
    const wc = c_fgetwc(stream);
    if (wc === WEOF) break;
    got = true;
    dst[i++] = wc;
    if (wc === 0x0A) break; // newline terminates (§7.29.3.3 p2)
  }
  if (!got) return null;
  dst[i] = 0;
  return dst;
}

// §7.29.3.10 ungetwc — push back one wide char. We encode to UTF-8 and push
// each byte onto the underlying stream's ungetc buffer in reverse order.
export function c_ungetwc(wc: number, stream: CFile): number {
  if (wc === WEOF) return WEOF;
  const buf = new Uint8Array(4);
  const n = c_wcrtomb(buf, wc, mb_initState());
  if (n < 0) return WEOF;
  for (let i = n - 1; i >= 0; i--) c_ungetc(buf[i]!, stream);
  return wc;
}

// ---------------------------------------------------------------------------
// Interop helpers (non-standard but pragmatic).
// ---------------------------------------------------------------------------

// Convert a JS string to a nul-terminated wchar_t array (code points).
export function w_fromString(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) out.push(ch.codePointAt(0)!);
  out.push(0);
  return out;
}
// Convert a wchar_t array (nul-terminated) to a JS string.
export function w_toString(ws: number[]): string {
  const n = c_wcslen(ws);
  return String.fromCodePoint(...ws.slice(0, n));
}
// Convert up to the end of the array (no NUL assumption) — internal helper.
function w_toStringPrefix(ws: number[]): string {
  const cps: number[] = [];
  for (let i = 0; i < ws.length; i++) { if (ws[i] === 0) break; cps.push(ws[i]!); }
  return String.fromCodePoint(...cps);
}

// c_wcstombs / c_mbstowcs — C17 §7.29.2.2 / §7.29.2.1 non-restartable
// wide/multibyte conversions. The restartable variants (wcsrtombs / mbsrtowcs)
// above are more general; these are the thin non-state variants.

export function c_wcstombs(dst: any, src: number[], n: number): number {
  let count = 0, i = 0;
  while (i < src.length && src[i] !== 0) {
    const ch = src[i]!;
    const bytes: number[] = [];
    if (ch < 0x80) bytes.push(ch);
    else if (ch < 0x800) bytes.push(0xc0 | (ch >> 6), 0x80 | (ch & 0x3f));
    else if (ch < 0x10000) bytes.push(0xe0 | (ch >> 12), 0x80 | ((ch >> 6) & 0x3f), 0x80 | (ch & 0x3f));
    else bytes.push(0xf0 | (ch >> 18), 0x80 | ((ch >> 12) & 0x3f), 0x80 | ((ch >> 6) & 0x3f), 0x80 | (ch & 0x3f));
    if (dst && count + bytes.length > n) return count;
    if (dst) for (const b of bytes) { if (count < n) dst.buf[dst.off + count] = b; count++; }
    else count += bytes.length;
    i++;
  }
  if (dst && count < n) dst.buf[dst.off + count] = 0;
  return count;
}

export function c_mbstowcs(dst: number[] | null, src: any, n: number): number {
  let count = 0, si = 0;
  const readByte = (k: number): number => src?.buf ? (src.buf[src.off + k] ?? 0) : (typeof src === "string" ? src.charCodeAt(k) : 0);
  while (readByte(si) !== 0 && (dst === null || count < n)) {
    const b0 = readByte(si);
    let cp = 0, len = 1;
    if (b0 < 0x80) { cp = b0; len = 1; }
    else if ((b0 & 0xe0) === 0xc0) { cp = ((b0 & 0x1f) << 6) | (readByte(si + 1) & 0x3f); len = 2; }
    else if ((b0 & 0xf0) === 0xe0) { cp = ((b0 & 0x0f) << 12) | ((readByte(si + 1) & 0x3f) << 6) | (readByte(si + 2) & 0x3f); len = 3; }
    else { cp = ((b0 & 0x07) << 18) | ((readByte(si + 1) & 0x3f) << 12) | ((readByte(si + 2) & 0x3f) << 6) | (readByte(si + 3) & 0x3f); len = 4; }
    if (dst) dst[count] = cp;
    count++; si += len;
  }
  if (dst && count < n) dst[count] = 0;
  return count;
}
