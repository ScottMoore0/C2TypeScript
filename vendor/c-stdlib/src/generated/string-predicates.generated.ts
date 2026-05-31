// AUTO-GENERATED — C17 §7.24 string functions following Template E2/E3
// Regenerate with: npx tsx compiler/scripts/build-catalogue/generate-c-stdlib-trivials.ts
// Generated: 2026-04-22T00:07:28.457Z

// These implementations follow CONVENTIONS.md:
//   §A1: char* → CPtr; size_t → number; null return for failure
//   §A2: null-pointer input returns null / 0 (not UB)
//   §A3: no allocation (caller provides buffers)
//   §A4: UTF-8-safe; operates on bytes, null-terminated
//   §A5: c_* naming

// CPtr interface — must match the project's shared definition.
// Normally imported from @c2typescript/c-pointer-layout; inlined here for the generated file.
export interface CPtr { buf: Uint8Array; off: number; }

/**
 * C17 §7.24.6.3: strlen
 * BRIDGE: libc-string
 */
export function c_strlen(s: CPtr): number {
  if (!s?.buf) return 0;
  let i = s.off;
  while (i < s.buf.length && s.buf[i] !== 0) i++;
  return i - s.off;
}

/**
 * POSIX.1-2008: strnlen
 * BRIDGE: libc-string
 */
export function c_strnlen(s: CPtr, maxlen: number): number {
  if (!s?.buf) return 0;
  let i = s.off;
  const end = Math.min(s.off + maxlen, s.buf.length);
  while (i < end && s.buf[i] !== 0) i++;
  return i - s.off;
}

/**
 * C17 §7.24.5.2: strchr
 * BRIDGE: libc-string
 */
export function c_strchr(s: CPtr, c: number): CPtr | null {
  if (!s?.buf) return null;
  const target = c & 0xFF;
  for (let i = s.off; i < s.buf.length; i++) {
    if (s.buf[i] === target) return { buf: s.buf, off: i };
    if (s.buf[i] === 0) return target === 0 ? { buf: s.buf, off: i } : null;
  }
  return null;
}

/**
 * C17 §7.24.5.5: strrchr
 * BRIDGE: libc-string
 */
export function c_strrchr(s: CPtr, c: number): CPtr | null {
  if (!s?.buf) return null;
  const target = c & 0xFF;
  let last: CPtr | null = null;
  for (let i = s.off; i < s.buf.length; i++) {
    if (s.buf[i] === target) last = { buf: s.buf, off: i };
    if (s.buf[i] === 0) {
      if (target === 0) return { buf: s.buf, off: i };
      break;
    }
  }
  return last;
}

/**
 * C17 §7.24.4.2: strcmp
 * BRIDGE: libc-string
 */
export function c_strcmp(a: CPtr, b: CPtr): number {
  if (!a?.buf || !b?.buf) return 0;
  let i = 0;
  while (true) {
    const ca = a.buf[a.off + i] ?? 0;
    const cb = b.buf[b.off + i] ?? 0;
    if (ca !== cb) return ca - cb;
    if (ca === 0) return 0;
    i++;
  }
}

/**
 * C17 §7.24.4.4: strncmp
 * BRIDGE: libc-string
 */
export function c_strncmp(a: CPtr, b: CPtr, n: number): number {
  if (!a?.buf || !b?.buf || n <= 0) return 0;
  for (let i = 0; i < n; i++) {
    const ca = a.buf[a.off + i] ?? 0;
    const cb = b.buf[b.off + i] ?? 0;
    if (ca !== cb) return ca - cb;
    if (ca === 0) return 0;
  }
  return 0;
}

/**
 * POSIX.1-2001: strcasecmp
 * BRIDGE: libc-string
 */
export function c_strcasecmp(a: CPtr, b: CPtr): number {
  if (!a?.buf || !b?.buf) return 0;
  let i = 0;
  while (true) {
    let ca = a.buf[a.off + i] ?? 0;
    let cb = b.buf[b.off + i] ?? 0;
    if (ca >= 0x41 && ca <= 0x5A) ca += 32;
    if (cb >= 0x41 && cb <= 0x5A) cb += 32;
    if (ca !== cb) return ca - cb;
    if (ca === 0) return 0;
    i++;
  }
}

/**
 * C17 §7.24.5.6: strspn
 * BRIDGE: libc-string
 */
export function c_strspn(s: CPtr, accept: CPtr): number {
  if (!s?.buf || !accept?.buf) return 0;
  const acceptSet = new Set<number>();
  for (let i = accept.off; i < accept.buf.length && accept.buf[i] !== 0; i++) {
    acceptSet.add(accept.buf[i]);
  }
  let count = 0;
  for (let i = s.off; i < s.buf.length && s.buf[i] !== 0; i++) {
    if (!acceptSet.has(s.buf[i])) break;
    count++;
  }
  return count;
}

/**
 * C17 §7.24.5.3: strcspn
 * BRIDGE: libc-string
 */
export function c_strcspn(s: CPtr, reject: CPtr): number {
  if (!s?.buf || !reject?.buf) return 0;
  const rejectSet = new Set<number>();
  for (let i = reject.off; i < reject.buf.length && reject.buf[i] !== 0; i++) {
    rejectSet.add(reject.buf[i]);
  }
  let count = 0;
  for (let i = s.off; i < s.buf.length && s.buf[i] !== 0; i++) {
    if (rejectSet.has(s.buf[i])) break;
    count++;
  }
  return count;
}

/**
 * C17 §7.24.5.4: strpbrk
 * BRIDGE: libc-string
 */
export function c_strpbrk(s: CPtr, accept: CPtr): CPtr | null {
  if (!s?.buf || !accept?.buf) return null;
  const acceptSet = new Set<number>();
  for (let i = accept.off; i < accept.buf.length && accept.buf[i] !== 0; i++) {
    acceptSet.add(accept.buf[i]);
  }
  for (let i = s.off; i < s.buf.length && s.buf[i] !== 0; i++) {
    if (acceptSet.has(s.buf[i])) return { buf: s.buf, off: i };
  }
  return null;
}

/**
 * C17 §7.24.5.1: memchr
 * BRIDGE: libc-string
 */
export function c_memchr(s: CPtr, c: number, n: number): CPtr | null {
  if (!s?.buf || n <= 0) return null;
  const target = c & 0xFF;
  const end = Math.min(s.off + n, s.buf.length);
  for (let i = s.off; i < end; i++) {
    if (s.buf[i] === target) return { buf: s.buf, off: i };
  }
  return null;
}

/**
 * C17 §7.24.4.1: memcmp
 * BRIDGE: libc-string
 */
export function c_memcmp(a: CPtr, b: CPtr, n: number): number {
  if (!a?.buf || !b?.buf || n <= 0) return 0;
  const aEnd = Math.min(a.off + n, a.buf.length);
  const bEnd = Math.min(b.off + n, b.buf.length);
  for (let i = 0; i < n; i++) {
    const av = a.off + i < aEnd ? a.buf[a.off + i] : 0;
    const bv = b.off + i < bEnd ? b.buf[b.off + i] : 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/**
 * C17 §7.24.2.1: memcpy
 * BRIDGE: libc-string
 */
export function c_memcpy(dst: CPtr, src: CPtr, n: number): CPtr {
  if (!dst?.buf || !src?.buf || n <= 0) return dst;
  const len = Math.min(n, src.buf.length - src.off, dst.buf.length - dst.off);
  for (let i = 0; i < len; i++) dst.buf[dst.off + i] = src.buf[src.off + i];
  return dst;
}

/**
 * C17 §7.24.2.2: memmove
 * BRIDGE: libc-string
 */
export function c_memmove(dst: CPtr, src: CPtr, n: number): CPtr {
  if (!dst?.buf || !src?.buf || n <= 0) return dst;
  const len = Math.min(n, src.buf.length - src.off, dst.buf.length - dst.off);
  // Handle overlap: copy backward if dst is after src in same buffer.
  if (dst.buf === src.buf && dst.off > src.off && dst.off < src.off + len) {
    for (let i = len - 1; i >= 0; i--) dst.buf[dst.off + i] = src.buf[src.off + i];
  } else {
    for (let i = 0; i < len; i++) dst.buf[dst.off + i] = src.buf[src.off + i];
  }
  return dst;
}

/**
 * C17 §7.24.6.1: memset
 * BRIDGE: libc-string
 */
export function c_memset(s: CPtr, c: number, n: number): CPtr {
  if (!s?.buf || n <= 0) return s;
  const byte = c & 0xFF;
  const end = Math.min(s.off + n, s.buf.length);
  for (let i = s.off; i < end; i++) s.buf[i] = byte;
  return s;
}

/**
 * C17 §7.24.2.3: strcpy
 * BRIDGE: libc-string
 */
export function c_strcpy(dst: CPtr, src: CPtr): CPtr {
  if (!dst?.buf || !src?.buf) return dst;
  let i = 0;
  while (src.off + i < src.buf.length && src.buf[src.off + i] !== 0 && dst.off + i < dst.buf.length) {
    dst.buf[dst.off + i] = src.buf[src.off + i];
    i++;
  }
  if (dst.off + i < dst.buf.length) dst.buf[dst.off + i] = 0;
  return dst;
}

/**
 * C17 §7.24.2.4: strncpy
 * BRIDGE: libc-string
 */
export function c_strncpy(dst: CPtr, src: CPtr, n: number): CPtr {
  if (!dst?.buf || !src?.buf) return dst;
  let i = 0;
  while (i < n && src.off + i < src.buf.length && src.buf[src.off + i] !== 0 && dst.off + i < dst.buf.length) {
    dst.buf[dst.off + i] = src.buf[src.off + i];
    i++;
  }
  while (i < n && dst.off + i < dst.buf.length) {
    dst.buf[dst.off + i] = 0;
    i++;
  }
  return dst;
}

/**
 * C17 §7.24.3.1: strcat
 * BRIDGE: libc-string
 */
export function c_strcat(dst: CPtr, src: CPtr): CPtr {
  if (!dst?.buf || !src?.buf) return dst;
  let dstEnd = dst.off;
  while (dstEnd < dst.buf.length && dst.buf[dstEnd] !== 0) dstEnd++;
  let i = 0;
  while (src.off + i < src.buf.length && src.buf[src.off + i] !== 0 && dstEnd + i < dst.buf.length) {
    dst.buf[dstEnd + i] = src.buf[src.off + i];
    i++;
  }
  if (dstEnd + i < dst.buf.length) dst.buf[dstEnd + i] = 0;
  return dst;
}

/**
 * C17 §7.24.5.7: strstr
 * BRIDGE: libc-string
 */
export function c_strstr(haystack: CPtr, needle: CPtr): CPtr | null {
  if (!haystack?.buf || !needle?.buf) return null;
  let nLen = 0;
  while (needle.off + nLen < needle.buf.length && needle.buf[needle.off + nLen] !== 0) nLen++;
  if (nLen === 0) return haystack;
  for (let i = haystack.off; i + nLen <= haystack.buf.length; i++) {
    let match = true;
    for (let j = 0; j < nLen; j++) {
      if (haystack.buf[i + j] !== needle.buf[needle.off + j]) { match = false; break; }
    }
    if (match) return { buf: haystack.buf, off: i };
    if (haystack.buf[i] === 0) break;
  }
  return null;
}
