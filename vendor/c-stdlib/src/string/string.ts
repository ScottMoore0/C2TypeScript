// FC-3: C string functions — strlen, strcpy, strcmp, strcat, strchr, strstr, strtok, etc.
// C17 §7.24: String handling.
// These operate on CPtr (null-terminated byte buffers).

export interface CPtr { buf: Uint8Array; off: number; }

function isNullPtr(p: CPtr | null): boolean {
  return p == null || (p.buf.length === 0 && p.off === 0);
}

/** C17 §7.24.6.3: strlen — count bytes to first \0. */
export function c_strlen(s: CPtr | null): number {
  if (!s || isNullPtr(s)) return 0;
  let i = 0;
  while (s.off + i < s.buf.length && s.buf[s.off + i] !== 0) i++;
  return i;
}

/** C17 §7.24.2.3: strcpy — copy including \0. Returns dst. */
export function c_strcpy(dst: CPtr, src: CPtr): CPtr {
  let i = 0;
  while (src.off + i < src.buf.length && src.buf[src.off + i] !== 0) {
    dst.buf[dst.off + i] = src.buf[src.off + i]!;
    i++;
  }
  dst.buf[dst.off + i] = 0;
  return dst;
}

/** C17 §7.24.2.4: strncpy — copy up to n bytes, pad with \0. */
export function c_strncpy(dst: CPtr, src: CPtr, n: number): CPtr {
  let i = 0;
  for (; i < n && src.off + i < src.buf.length && src.buf[src.off + i] !== 0; i++) {
    dst.buf[dst.off + i] = src.buf[src.off + i]!;
  }
  for (; i < n; i++) dst.buf[dst.off + i] = 0;
  return dst;
}

/** C17 §7.24.3.1: strcat — append src to dst. Returns dst. */
export function c_strcat(dst: CPtr, src: CPtr): CPtr {
  const dstLen = c_strlen(dst);
  c_strcpy({ buf: dst.buf, off: dst.off + dstLen }, src);
  return dst;
}

/** C17 §7.24.3.2: strncat — append up to n chars. */
export function c_strncat(dst: CPtr, src: CPtr, n: number): CPtr {
  const dstLen = c_strlen(dst);
  let i = 0;
  for (; i < n && src.off + i < src.buf.length && src.buf[src.off + i] !== 0; i++) {
    dst.buf[dst.off + dstLen + i] = src.buf[src.off + i]!;
  }
  dst.buf[dst.off + dstLen + i] = 0;
  return dst;
}

/** C17 §7.24.4.2: strcmp — compare two strings. */
export function c_strcmp(a: CPtr, b: CPtr): number {
  let i = 0;
  while (true) {
    const ca = a.buf[a.off + i] ?? 0;
    const cb = b.buf[b.off + i] ?? 0;
    if (ca !== cb) return ca - cb;
    if (ca === 0) return 0;
    i++;
  }
}

/** C17 §7.24.4.4: strncmp — compare up to n bytes. */
export function c_strncmp(a: CPtr, b: CPtr, n: number): number {
  for (let i = 0; i < n; i++) {
    const ca = a.buf[a.off + i] ?? 0;
    const cb = b.buf[b.off + i] ?? 0;
    if (ca !== cb) return ca - cb;
    if (ca === 0) return 0;
  }
  return 0;
}

/** C17 §7.24.5.2: strchr — find first occurrence of c. Returns offset or -1. */
export function c_strchr(s: CPtr, c: number): number {
  let i = 0;
  while (s.off + i < s.buf.length) {
    if (s.buf[s.off + i] === (c & 0xFF)) return i;
    if (s.buf[s.off + i] === 0) return -1;
    i++;
  }
  return -1;
}

/** C17 §7.24.5.5: strrchr — find last occurrence of c. */
export function c_strrchr(s: CPtr, c: number): number {
  let last = -1;
  let i = 0;
  while (s.off + i < s.buf.length && s.buf[s.off + i] !== 0) {
    if (s.buf[s.off + i] === (c & 0xFF)) last = i;
    i++;
  }
  if (c === 0) return i; // \0 is always found at end
  return last;
}

/** C17 §7.24.5.7: strstr — find substring. Returns offset or -1. */
export function c_strstr(haystack: CPtr, needle: CPtr): number {
  const needleLen = c_strlen(needle);
  if (needleLen === 0) return 0;
  const haystackLen = c_strlen(haystack);
  for (let i = 0; i <= haystackLen - needleLen; i++) {
    let match = true;
    for (let j = 0; j < needleLen; j++) {
      if (haystack.buf[haystack.off + i + j] !== needle.buf[needle.off + j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

/** C17 §7.24.2.1: memcpy. */
export function c_memcpy(dst: CPtr, src: CPtr, n: number): CPtr {
  dst.buf.set(src.buf.subarray(src.off, src.off + n), dst.off);
  return dst;
}

/** C17 §7.24.2.2: memmove (handles overlap). */
export function c_memmove(dst: CPtr, src: CPtr, n: number): CPtr {
  const tmp = src.buf.slice(src.off, src.off + n);
  dst.buf.set(tmp, dst.off);
  return dst;
}

/** C17 §7.24.6.1: memset. */
export function c_memset(s: CPtr, c: number, n: number): CPtr {
  s.buf.fill(c & 0xFF, s.off, s.off + n);
  return s;
}

/** C17 §7.24.4.1: memcmp. */
export function c_memcmp(a: CPtr, b: CPtr, n: number): number {
  for (let i = 0; i < n; i++) {
    const av = a.buf[a.off + i] ?? 0;
    const bv = b.buf[b.off + i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/** Helper: create CPtr from JS string (null-terminated). */
export function c_fromString(s: string): CPtr {
  const encoded = new TextEncoder().encode(s);
  const buf = new Uint8Array(encoded.length + 1);
  buf.set(encoded);
  return { buf, off: 0 };
}

/** Helper: read CPtr to JS string. */
export function c_toString(p: CPtr | null): string {
  if (!p || isNullPtr(p)) return "";
  let end = p.off;
  while (end < p.buf.length && p.buf[end] !== 0) end++;
  return new TextDecoder().decode(p.buf.subarray(p.off, end));
}

/** C17 §7.24.5.8: strtok — tokenize string. */
let _strtokPtr: CPtr | null = null;
let _strtokPos = 0;
export function c_strtok(s: CPtr | null, delim: CPtr): CPtr | null {
  // If s is non-null, start a new tokenization
  if (s && !isNullPtr(s)) {
    _strtokPtr = s;
    _strtokPos = s.off;
  }
  if (!_strtokPtr) return null;

  const delimStr = c_toString(delim);
  const buf = _strtokPtr.buf;

  // Skip leading delimiters
  while (_strtokPos < buf.length && buf[_strtokPos] !== 0 && delimStr.includes(String.fromCharCode(buf[_strtokPos]!))) {
    _strtokPos++;
  }
  if (_strtokPos >= buf.length || buf[_strtokPos] === 0) return null;

  // Find end of token
  const tokenStart = _strtokPos;
  while (_strtokPos < buf.length && buf[_strtokPos] !== 0 && !delimStr.includes(String.fromCharCode(buf[_strtokPos]!))) {
    _strtokPos++;
  }

  // Null-terminate the token
  if (_strtokPos < buf.length && buf[_strtokPos] !== 0) {
    buf[_strtokPos] = 0;
    _strtokPos++;
  }

  return { buf, off: tokenStart };
}

/**
 * POSIX strtok_r — reentrant strtok. C17 §7.24.5.8 defines strtok; strtok_r
 * (POSIX.1-2008) takes a caller-provided state pointer so concurrent/nested
 * tokenizations don't clobber each other.
 *
 * `state` is a CPtr whose .off is treated as the saved position and whose
 * .buf is the string being tokenized. When s is non-null we initialize it;
 * otherwise we resume from the saved state.
 */
export function c_strtok_r(s: CPtr | null, delim: CPtr, state: { ptr: CPtr | null }): CPtr | null {
  let cur: CPtr | null;
  let pos: number;
  if (s && !isNullPtr(s)) {
    cur = s;
    pos = s.off;
  } else {
    cur = state.ptr;
    pos = cur ? cur.off : 0;
  }
  if (!cur) return null;
  const buf = cur.buf;
  const delimStr = c_toString(delim);
  // Skip leading delimiters.
  while (pos < buf.length && buf[pos] !== 0 && delimStr.includes(String.fromCharCode(buf[pos]!))) {
    pos++;
  }
  if (pos >= buf.length || buf[pos] === 0) {
    state.ptr = { buf, off: pos };
    return null;
  }
  const tokenStart = pos;
  while (pos < buf.length && buf[pos] !== 0 && !delimStr.includes(String.fromCharCode(buf[pos]!))) {
    pos++;
  }
  if (pos < buf.length && buf[pos] !== 0) {
    buf[pos] = 0;
    pos++;
  }
  state.ptr = { buf, off: pos };
  return { buf, off: tokenStart };
}

/** C17 §7.24.5.4: strpbrk — find first occurrence of any char from accept. */
export function c_strpbrk(s: CPtr, accept: CPtr): number {
  const acceptStr = c_toString(accept);
  let i = 0;
  while (s.off + i < s.buf.length && s.buf[s.off + i] !== 0) {
    if (acceptStr.includes(String.fromCharCode(s.buf[s.off + i]!))) return i;
    i++;
  }
  return -1;
}

/** C17 §7.24.5.6: strspn — length of initial segment matching accept. */
export function c_strspn(s: CPtr, accept: CPtr): number {
  const acceptStr = c_toString(accept);
  let i = 0;
  while (s.off + i < s.buf.length && s.buf[s.off + i] !== 0) {
    if (!acceptStr.includes(String.fromCharCode(s.buf[s.off + i]!))) break;
    i++;
  }
  return i;
}

/** C17 §7.24.5.3: strcspn — length of initial segment NOT matching reject. */
export function c_strcspn(s: CPtr, reject: CPtr): number {
  const rejectStr = c_toString(reject);
  let i = 0;
  while (s.off + i < s.buf.length && s.buf[s.off + i] !== 0) {
    if (rejectStr.includes(String.fromCharCode(s.buf[s.off + i]!))) break;
    i++;
  }
  return i;
}

/** C17 §7.24.5.1: memchr — find byte in memory. */
export function c_memchr(s: CPtr, c: number, n: number): number {
  const target = c & 0xFF;
  for (let i = 0; i < n && s.off + i < s.buf.length; i++) {
    if (s.buf[s.off + i] === target) return i;
  }
  return -1;
}

/** C17 §7.24.6.2: strerror — error code to string (simplified). */
export function c_strerror(errnum: number): string {
  const errors: Record<number, string> = {
    0: "Success", 1: "Operation not permitted", 2: "No such file or directory",
    5: "I/O error", 9: "Bad file descriptor", 12: "Out of memory",
    13: "Permission denied", 17: "File exists", 22: "Invalid argument",
    28: "No space left on device", 33: "Numerical argument out of domain",
    34: "Numerical result out of range",
  };
  return errors[errnum] ?? `Unknown error ${errnum}`;
}

/** C17 §7.24.4.5: strxfrm — locale-dependent transform (simplified: copy). */
export function c_strxfrm(dst: CPtr, src: CPtr, n: number): number {
  const len = c_strlen(src);
  const copyLen = Math.min(len, n > 0 ? n - 1 : 0);
  for (let i = 0; i < copyLen; i++) {
    dst.buf[dst.off + i] = src.buf[src.off + i]!;
  }
  if (n > 0) dst.buf[dst.off + copyLen] = 0;
  return len;
}

/** C17 §7.24.4.3: strcoll — locale-dependent comparison (simplified: strcmp). */
export function c_strcoll(a: CPtr, b: CPtr): number {
  return c_strcmp(a, b); // Default "C" locale = strcmp
}

/** POSIX: strdup — duplicate a string. */
export function c_strdup(s: CPtr | null): CPtr | null {
  if (!s || isNullPtr(s)) return null;
  const len = c_strlen(s);
  const buf = new Uint8Array(len + 1);
  for (let i = 0; i < len; i++) buf[i] = s.buf[s.off + i]!;
  buf[len] = 0;
  return { buf, off: 0 };
}

/** POSIX: strndup — duplicate up to n characters. */
export function c_strndup(s: CPtr | null, n: number): CPtr | null {
  if (!s || isNullPtr(s)) return null;
  const len = Math.min(c_strlen(s), n);
  const buf = new Uint8Array(len + 1);
  for (let i = 0; i < len; i++) buf[i] = s.buf[s.off + i]!;
  buf[len] = 0;
  return { buf, off: 0 };
}

// POSIX string extensions — commonly seen in real-world C codebases.
// C17 does not standardise these; spec refs are POSIX.1-2017.

// c_strerror_r — POSIX.1-2017 strerror_r, thread-safe variant of strerror.
// Writes message into buf. Returns 0 on success, non-zero on error.
export function c_strerror_r(errnum: number, buf: CPtr, buflen: number): number {
  const msg: Record<number, string> = {
    0: "Success", 1: "Operation not permitted", 2: "No such file or directory",
    5: "I/O error", 9: "Bad file descriptor", 11: "Resource temporarily unavailable",
    12: "Cannot allocate memory", 13: "Permission denied", 14: "Bad address",
    17: "File exists", 21: "Is a directory", 22: "Invalid argument",
    28: "No space left on device", 32: "Broken pipe",
  };
  const s = msg[errnum] ?? "Unknown error";
  const n = Math.min(s.length, buflen - 1);
  for (let i = 0; i < n; i++) buf.buf[buf.off + i] = s.charCodeAt(i);
  if (buflen > 0) buf.buf[buf.off + n] = 0;
  return s.length >= buflen ? 34 /*ERANGE*/ : 0;
}

// c_strsignal — POSIX.1-2017 strsignal, maps signal number to name.
// Returns a CPtr to a static-storage string per POSIX semantics.
export function c_strsignal(signum: number): CPtr {
  const names: Record<number, string> = {
    1: "Hangup", 2: "Interrupt", 3: "Quit", 4: "Illegal instruction",
    6: "Aborted", 8: "Floating point exception", 9: "Killed",
    11: "Segmentation fault", 13: "Broken pipe", 14: "Alarm clock",
    15: "Terminated", 17: "Child exited", 18: "Continued", 19: "Stopped",
  };
  const s = names[signum] ?? "Unknown signal";
  const buf = new Uint8Array(s.length + 1);
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
  buf[s.length] = 0;
  return { buf, off: 0 };
}

// c_memccpy — POSIX.1-2017 memccpy, memcpy with stop-byte.
// Copies at most n bytes from src to dst, stopping after the first occurrence
// of byte c. Returns pointer past the copied c byte, or NULL if c not found.
export function c_memccpy(dst: CPtr, src: CPtr, c: number, n: number): CPtr | null {
  const stop = c & 0xff;
  for (let i = 0; i < n; i++) {
    const b = src.buf[src.off + i]!;
    dst.buf[dst.off + i] = b;
    if (b === stop) return { buf: dst.buf, off: dst.off + i + 1 };
  }
  return null;
}

// c_memrchr — POSIX.1-2017 memrchr, reverse memchr. Returns pointer to last
// occurrence of c in the first n bytes of s, or NULL if not found.
export function c_memrchr(s: CPtr, c: number, n: number): CPtr | null {
  const target = c & 0xff;
  for (let i = n - 1; i >= 0; i--) {
    if (s.buf[s.off + i] === target) return { buf: s.buf, off: s.off + i };
  }
  return null;
}

// c_strchrnul — GNU extension / POSIX candidate. Like strchr but returns
// pointer to the terminating null if c not found, instead of NULL.
export function c_strchrnul(s: CPtr, c: number): CPtr {
  const target = c & 0xff;
  let i = 0;
  while (s.buf[s.off + i] !== 0) {
    if (s.buf[s.off + i] === target) return { buf: s.buf, off: s.off + i };
    i++;
  }
  return { buf: s.buf, off: s.off + i };
}

// c_stpcpy — POSIX.1-2017 stpcpy. Like strcpy but returns pointer to the
// terminating null of the destination.
export function c_stpcpy(dst: CPtr, src: CPtr): CPtr {
  let i = 0;
  while (true) {
    const b = src.buf[src.off + i]!;
    dst.buf[dst.off + i] = b;
    if (b === 0) return { buf: dst.buf, off: dst.off + i };
    i++;
  }
}

// ---------------------------------------------------------------------------
// Legacy BSD memory functions (strings.h in POSIX, obsoleted in POSIX.1-2008
// but still used by many real codebases). Semantics match POSIX before
// obsoletion; they operate byte-wise with no null-termination.
// ---------------------------------------------------------------------------

/** POSIX (LEGACY) bcmp(s1, s2, n) — compare n bytes of two buffers. Returns
 *  zero if equal, nonzero otherwise. Unlike memcmp, the sign of a nonzero
 *  result is unspecified (historical Berkeley behaviour); we return the
 *  first-differing-byte difference for diagnostic parity with memcmp. */
export function c_bcmp(s1: CPtr, s2: CPtr, n: number): number {
  for (let i = 0; i < n; i++) {
    const a = s1.buf[s1.off + i] ?? 0;
    const b = s2.buf[s2.off + i] ?? 0;
    if (a !== b) return a - b;
  }
  return 0;
}

/** POSIX (LEGACY) bcopy(src, dst, n) — copy n bytes from src to dst.
 *  NOTE: argument order is (src, dst, n) — the REVERSE of memcpy. Must handle
 *  overlapping regions like memmove (historical Berkeley behaviour). */
export function c_bcopy(src: CPtr, dst: CPtr, n: number): void {
  if (n <= 0) return;
  // Forward or backward copy depending on overlap direction, matching memmove.
  if (dst.buf === src.buf && dst.off > src.off && dst.off < src.off + n) {
    for (let i = n - 1; i >= 0; i--) dst.buf[dst.off + i] = src.buf[src.off + i]!;
  } else {
    for (let i = 0; i < n; i++) dst.buf[dst.off + i] = src.buf[src.off + i]!;
  }
}

/** POSIX (LEGACY) bzero(s, n) — set the first n bytes of s to zero. Equivalent
 *  to memset(s, 0, n). */
export function c_bzero(s: CPtr, n: number): void {
  for (let i = 0; i < n; i++) s.buf[s.off + i] = 0;
}

// c_stpncpy — POSIX.1-2017 stpncpy. Like strncpy but returns pointer to the
// byte after the last non-null byte copied (or end of buffer).
export function c_stpncpy(dst: CPtr, src: CPtr, n: number): CPtr {
  let i = 0, sawNull = false;
  for (; i < n; i++) {
    if (sawNull) {
      dst.buf[dst.off + i] = 0;
    } else {
      const b = src.buf[src.off + i]!;
      dst.buf[dst.off + i] = b;
      if (b === 0) sawNull = true;
    }
  }
  if (!sawNull) return { buf: dst.buf, off: dst.off + n };
  let end = n;
  while (end > 0 && dst.buf[dst.off + end - 1] === 0) end--;
  return { buf: dst.buf, off: dst.off + end };
}
