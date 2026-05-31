/**
 * CPtr: C Pointer Model for TypeScript
 *
 * A C pointer is a base address + offset. CPtr models this exactly.
 * {buf} is the underlying storage (shared across all pointers into same allocation).
 * {off} is the current position.
 *
 * This eliminates ALL char* buffer edge cases because it correctly models
 * what a C pointer IS, rather than trying to make JS arrays pretend to be pointers.
 */

export interface CPtr {
  buf: Uint8Array;
  off: number;
}

/**
 * POINTER CONTRACT
 *
 * A CPtr models a pointer value as (storage identity, byte offset). Copying a
 * pointer copies that pair, not the pointee bytes. Aliasing is therefore
 * represented by multiple CPtr values sharing the same underlying {buf}.
 */

/** Allocate a new buffer (C17 §7.22.3.4 malloc) */
// BRIDGE: size accepts number | bigint per CPtr design; idempotent Number() coercion
// handles `(uint64_t)`-cast size arithmetic (e.g. Redis intset.c:107) without
// downstream `new Uint8Array(bigint)` TypeError.
export function cptr_create(size: number | bigint): CPtr {
  const sz = typeof size === "bigint" ? Number(size) : Number(size ?? 0);
  return { buf: new Uint8Array(sz), off: 0 };
}

/** Create an offset pointer into the same buffer (C17 §6.5.6 pointer + integer) */
export function cptr_offset(ptr: CPtr, n: number): CPtr {
  return { buf: ptr.buf, off: ptr.off + n };
}

/** Read one byte at position (C17 §6.5.3.2 dereference rvalue) */
export function cptr_read(ptr: CPtr, i: number = 0): number {
  return ptr.buf[ptr.off + i] ?? 0;
}

/** Write one byte at position (C17 §6.5.3.2 dereference lvalue) */
export function cptr_write(ptr: CPtr, i: number, val: number): void {
  ptr.buf[ptr.off + i] = val & 0xFF;
}

/** Read bytes from offset to first \0, decode as UTF-8 string (C17 §7.1.1) */
export function cptr_to_string(ptr: CPtr | null): string {
  if (!ptr) return '';
  let end = ptr.off;
  while (end < ptr.buf.length && ptr.buf[end] !== 0) end++;
  const bytes = ptr.buf.subarray(ptr.off, end);
  try {
    return new TextDecoder().decode(bytes);
  } catch {
    return String.fromCharCode(...bytes);
  }
}

/** Encode string as bytes + null terminator, return CPtr (C17 §6.4.5) */
export function cptr_from_string(str: string): CPtr {
  const encoded = new TextEncoder().encode(str);
  const buf = new Uint8Array(encoded.length + 1);
  buf.set(encoded);
  buf[encoded.length] = 0;
  return { buf, off: 0 };
}

/** Reallocate buffer, preserving data (C17 §7.22.3.5 realloc) */
// BRIDGE: newSize accepts number | bigint per CPtr design; idempotent Number()
// coercion handles `(uint64_t)`-cast size arithmetic at malloc/realloc/calloc
// call sites (e.g. Redis intset.c:107: `(uint64_t)len * intrev32ifbe(...)`)
// without `new Uint8Array(bigint)` TypeError.
export function cptr_realloc(ptr: CPtr | null, newSize: number | bigint): CPtr {
  const sz = typeof newSize === "bigint" ? Number(newSize) : Number(newSize ?? 0);
  const newBuf = new Uint8Array(sz);
  if (ptr) {
    // Preserve bytes visible from the passed pointer view. Cursor-style code is
    // expected to rebase onto the returned root after realloc.
    const copyLen = Math.min(ptr.buf.length - ptr.off, sz);
    newBuf.set(ptr.buf.subarray(ptr.off, ptr.off + copyLen));
  }
  return { buf: newBuf, off: 0 };
}

/** Copy n bytes from src to dst (C17 §7.24.2.1 memcpy) */
export function cptr_copy(dst: CPtr, src: CPtr, n: number): void {
  for (let i = 0; i < n; i++) {
    dst.buf[dst.off + i] = src.buf[src.off + i] ?? 0;
  }
}

/** Compare n bytes (C17 §7.24.4.1 memcmp) */
export function cptr_compare(a: CPtr, b: CPtr, n: number): number {
  for (let i = 0; i < n; i++) {
    const av = a.buf[a.off + i] ?? 0;
    const bv = b.buf[b.off + i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/** Count bytes from offset to first \0 (C17 §7.24.6.3 strlen) */
export function cptr_strlen(ptr: CPtr | null): number {
  if (!ptr) return 0;
  let i = 0;
  while (ptr.off + i < ptr.buf.length && ptr.buf[ptr.off + i] !== 0) i++;
  return i;
}

/** Set n bytes to value (C17 §7.24.6.1 memset) */
export function cptr_memset(ptr: CPtr, val: number, n: number): void {
  for (let i = 0; i < n; i++) {
    ptr.buf[ptr.off + i] = val & 0xFF;
  }
}

/** Find first occurrence of byte c (C17 §7.24.5.2 strchr) — returns offset or -1 */
export function cptr_strchr(ptr: CPtr | null, c: number): number {
  if (!ptr) return -1;
  for (let i = ptr.off; i < ptr.buf.length; i++) {
    if (ptr.buf[i] === 0) return -1; // end of string
    if (ptr.buf[i] === c) return i - ptr.off;
  }
  return -1;
}

/** Find last occurrence of byte c (C17 §7.24.5.5 strrchr) */
export function cptr_strrchr(ptr: CPtr | null, c: number): number {
  if (!ptr) return -1;
  let last = -1;
  for (let i = ptr.off; i < ptr.buf.length && ptr.buf[i] !== 0; i++) {
    if (ptr.buf[i] === c) last = i - ptr.off;
  }
  return last;
}

/** Copy string from src to dst (C17 §7.24.2.3 strcpy) */
export function cptr_strcpy(dst: CPtr, src: CPtr | string): CPtr {
  if (typeof src === 'string') {
    const encoded = new TextEncoder().encode(src);
    for (let i = 0; i < encoded.length; i++) {
      dst.buf[dst.off + i] = encoded[i];
    }
    dst.buf[dst.off + encoded.length] = 0;
  } else {
    let i = 0;
    while (src.buf[src.off + i] !== 0 && src.off + i < src.buf.length) {
      dst.buf[dst.off + i] = src.buf[src.off + i];
      i++;
    }
    dst.buf[dst.off + i] = 0;
  }
  return dst;
}

/** Copy up to n bytes (C17 §7.24.2.4 strncpy) */
export function cptr_strncpy(dst: CPtr, src: CPtr | string, n: number): CPtr {
  let srcBytes: Uint8Array;
  let srcOff = 0;
  if (typeof src === 'string') {
    srcBytes = new TextEncoder().encode(src);
  } else {
    srcBytes = src.buf;
    srcOff = src.off;
  }
  let i = 0;
  for (; i < n && srcOff + i < srcBytes.length && srcBytes[srcOff + i] !== 0; i++) {
    dst.buf[dst.off + i] = srcBytes[srcOff + i];
  }
  for (; i < n; i++) {
    dst.buf[dst.off + i] = 0; // pad with \0
  }
  return dst;
}

/** Compare two C strings (C17 §7.24.4.2 strcmp) */
export function cptr_strcmp(a: CPtr | string | null, b: CPtr | string | null): number {
  const sa = typeof a === 'string' ? a : a ? cptr_to_string(a) : '';
  const sb = typeof b === 'string' ? b : b ? cptr_to_string(b) : '';
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

/** Compare up to n bytes (C17 §7.24.4.4 strncmp) */
export function cptr_strncmp(a: CPtr | string | null, b: CPtr | string | null, n: number): number {
  const sa = (typeof a === 'string' ? a : a ? cptr_to_string(a) : '').substring(0, n);
  const sb = (typeof b === 'string' ? b : b ? cptr_to_string(b) : '').substring(0, n);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

/** Concatenate src onto end of dst string (C17 §7.24.3.1 strcat) */
export function cptr_strcat(dst: CPtr, src: CPtr | string): CPtr {
  const dstEnd = cptr_strlen(dst);
  cptr_strcpy(cptr_offset(dst, dstEnd), src);
  return dst;
}

/** Find substring (C17 §7.24.5.7 strstr) — returns offset or -1 */
export function cptr_strstr(haystack: CPtr | null, needle: CPtr | string | null): number {
  if (!haystack) return -1;
  const h = cptr_to_string(haystack);
  const n = typeof needle === 'string' ? needle : needle ? cptr_to_string(needle) : '';
  const idx = h.indexOf(n);
  return idx;
}

/** Check if CPtr is null/falsy (C17 §6.3.2.3 null pointer) */
export function cptr_is_null(ptr: any): boolean {
  return ptr === null || ptr === undefined || ptr === 0;
}

export function cptr_same_storage(a: CPtr | null, b: CPtr | null): boolean {
  return !!a && !!b && a.buf === b.buf;
}

/** Typed pointer operations for non-char types */
export function cptr_read_int8(ptr: CPtr, i: number = 0): number {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  return dv.getInt8(ptr.off + i);
}

export function cptr_write_int8(ptr: CPtr, i: number, val: number): void {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  dv.setInt8(ptr.off + i, val);
}

export function cptr_read_uint8(ptr: CPtr, i: number = 0): number {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  return dv.getUint8(ptr.off + i);
}

export function cptr_write_uint8(ptr: CPtr, i: number, val: number): void {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  dv.setUint8(ptr.off + i, val);
}

export function cptr_read_int16(ptr: CPtr, i: number = 0): number {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  return dv.getInt16(ptr.off + i * 2, true);
}

export function cptr_write_int16(ptr: CPtr, i: number, val: number): void {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  dv.setInt16(ptr.off + i * 2, val, true);
}

export function cptr_read_uint16(ptr: CPtr, i: number = 0): number {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  return dv.getUint16(ptr.off + i * 2, true);
}

export function cptr_write_uint16(ptr: CPtr, i: number, val: number): void {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  dv.setUint16(ptr.off + i * 2, val, true);
}

export function cptr_read_uint32(ptr: CPtr, i: number = 0): number {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  return dv.getUint32(ptr.off + i * 4, true);
}

export function cptr_write_uint32(ptr: CPtr, i: number, val: number): void {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  dv.setUint32(ptr.off + i * 4, val, true);
}

export function cptr_read_int32(ptr: CPtr, i: number = 0): number {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  return dv.getInt32(ptr.off + i * 4, true);
}

export function cptr_write_int32(ptr: CPtr, i: number, val: number): void {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  dv.setInt32(ptr.off + i * 4, val, true);
}

export function cptr_read_float64(ptr: CPtr, i: number = 0): number {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  return dv.getFloat64(ptr.off + i * 8, true);
}

export function cptr_write_float64(ptr: CPtr, i: number, val: number): void {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  dv.setFloat64(ptr.off + i * 8, val, true);
}

export function cptr_read_float32(ptr: CPtr, i: number = 0): number {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  return dv.getFloat32(ptr.off + i * 4, true);
}

export function cptr_write_float32(ptr: CPtr, i: number, val: number): void {
  const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
  dv.setFloat32(ptr.off + i * 4, val, true);
}

export function cptr_clone(ptr: CPtr | null): CPtr | null {
  if (!ptr) return null;
  if (typeof ptr === 'string') return cptr_from_string(ptr);
  return { buf: ptr.buf, off: ptr.off };
}

export function cptr_eq(a: CPtr | null, b: CPtr | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.buf === b.buf && a.off === b.off;
}
