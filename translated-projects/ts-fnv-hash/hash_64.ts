function __builtin_unreachable(): never { throw new Error('__builtin_unreachable reached (C17 §6.5.2.2 UB)'); }
function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function __builtin_llabs(x: any): any { const v = typeof x === 'bigint' ? x : BigInt(Math.trunc(Number(x))); return v < 0n ? -v : v; }
function llabs(x: any): any { if (typeof x === 'bigint') return x < 0n ? -x : x; return Math.abs(Number(x)); }
const ENOENT = 2, EACCES = 13, EEXIST = 17, EINTR = 4, EAGAIN = 11, EBADF = 9, EPERM = 1, ENOMEM = 12, EINVAL = 22, ENOSYS = 38, ERANGE = 34, EDOM = 33, EILSEQ = 84, ENFILE = 23, EMFILE = 24, ENOTTY = 25, EBUSY = 16, ENOSPC = 28, EROFS = 30, EPIPE = 32, ECONNREFUSED = 111, EADDRINUSE = 98, ETIMEDOUT = 110, ECONNRESET = 104;
let errno = 0;
function labs(x: number): number { return Math.abs(x); }
function realloc(ptr: any, size: any): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 const sz = typeof size === 'bigint' ? Number(size) : Number(size ?? 0); if (ptr && ptr.__cptr_overlay === true) { const cp = ptr.__cptr; ptr = { buf: cp.buf, off: (cp.off ?? 0) + (ptr.__byteOff ?? 0) }; return cptr_realloc(ptr, sz); } if (ptr && typeof ptr === 'object' && !ptr.buf && ptr.constructor && (ptr.constructor as any).__fieldNames) { /* BRIDGE: struct-as-class realloc */ const existing = ptr.__cptr; const newBuf = new Uint8Array(sz); if (existing && existing.buf) { const srcOff = existing.off ?? 0; const copyLen = Math.min(existing.buf.length - srcOff, sz); if (copyLen > 0) newBuf.set(existing.buf.subarray(srcOff, srcOff + copyLen)); } ptr.__cptr = { buf: newBuf, off: 0 }; ptr.__byteOff = 0; return ptr; } return cptr_realloc(ptr, sz); }
function free(ptr: any): void { /* no-op in JS — GC handles it */ }

// CPtr runtime for C pointer semantics
const __LITTLE_ENDIAN = true;
interface CPtr { buf: Uint8Array; off: number; }
function cptr_create(size: any): CPtr { const n = typeof size === "bigint" ? Number(size) : Number(size ?? 0); return { buf: new Uint8Array(n), off: 0 }; }
function cptr_box_int32(val: number): CPtr { const b = new Uint8Array(4); new DataView(b.buffer).setInt32(0, val, true); return {buf: b, off: 0}; }
function cptr_box_int8(val: number): CPtr { const b = new Uint8Array(1); b[0] = val & 0xFF; return {buf: b, off: 0}; }
function cptr_box_float32(val: number): CPtr { const b = new Uint8Array(4); new DataView(b.buffer).setFloat32(0, val, true); return {buf: b, off: 0}; }
function cptr_box_float64(val: number): CPtr { const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, val, true); return {buf: b, off: 0}; }
function __cptr_cached_array(arr: any, key: string, byteLen: number, writer: (view: DataView, index: number, value: number) => void, elemSize?: number): CPtr {
  // Idempotence: if the caller already has a CPtr wrapper {buf, off}, pass through.
  if (arr && typeof arr === "object" && "buf" in arr && arr.buf instanceof Uint8Array) return arr as CPtr;
  // C17 §6.5.3.2 + §6.5.16.1: the CPtr is a live view into the source JS
  // array. On every call, refresh buf from arr so JS-side writes are seen
  // through the CPtr. __src_arr + __src_writer + __elem_size are retained on
  // the CPtr so cptr_write_* helpers can back-propagate through cptr_offset.
  const existing = arr?.[key];
  const b = existing?.buf ?? new Uint8Array(byteLen);
  const v = new DataView(b.buffer);
  for (let i = 0; i < arr.length; i++) writer(v, i, Number(arr[i] ?? 0));
  if (existing?.buf) return existing;
  const ptr: any = { buf: b, off: 0, __src_arr: arr, __src_writer: writer, __elem_size: elemSize ?? 1 };
  if (arr && typeof arr === "object") {
    try { Object.defineProperty(arr, key, { value: ptr, enumerable: false, configurable: true, writable: true }); } catch { (arr as any)[key] = ptr; }
  }
  return ptr;
}
function cptr_from_int_array(arr: number[]): CPtr { return __cptr_cached_array(arr, "__cptr_int32", arr.length * 4, (v, i, x) => v.setInt32(i * 4, x, true), 4); }
function cptr_from_uint32_array(arr: number[]): CPtr { return __cptr_cached_array(arr, "__cptr_uint32", arr.length * 4, (v, i, x) => v.setUint32(i * 4, x >>> 0, true), 4); }
function cptr_from_int16_array(arr: number[]): CPtr { return __cptr_cached_array(arr, "__cptr_int16", arr.length * 2, (v, i, x) => v.setInt16(i * 2, x, true), 2); }
function cptr_from_uint16_array(arr: number[]): CPtr { return __cptr_cached_array(arr, "__cptr_uint16", arr.length * 2, (v, i, x) => v.setUint16(i * 2, x & 0xFFFF, true), 2); }
function cptr_from_int8_array(arr: number[]): CPtr { return __cptr_cached_array(arr, "__cptr_int8", arr.length, (v, i, x) => v.setInt8(i, x), 1); }
function cptr_from_uint8_array(arr: number[]): CPtr { return __cptr_cached_array(arr, "__cptr_uint8", arr.length, (v, i, x) => v.setUint8(i, x & 0xFF), 1); }
function cptr_from_float32_array(arr: number[]): CPtr { return __cptr_cached_array(arr, "__cptr_float32", arr.length * 4, (v, i, x) => v.setFloat32(i * 4, x, true), 4); }
function cptr_from_float64_array(arr: number[]): CPtr { return __cptr_cached_array(arr, "__cptr_float64", arr.length * 8, (v, i, x) => v.setFloat64(i * 8, x, true), 8); }
// C17 §6.2.5 p5 / §7.20: uint64_t / int64_t are exactly 64 bits. Use BigInt accessors
// to preserve full precision through DataView.setBigUint64 / setBigInt64.
function __cptr_cached_array_bigint(arr: any, key: string, byteLen: number, writer: (view: DataView, index: number, value: bigint) => void): CPtr {
  // Idempotence: if arr is already a CPtr (from the earlier SML
  // array-to-DataView IIFE), pass it through unchanged. Re-encoding
  // would walk arr.length (undefined on a CPtr) and emit a zero-length
  // buffer, then DataView.getBigInt64 throws RangeError at the read.
  if (arr && arr.buf && typeof arr.off !== "undefined") return arr;
  const existing = arr?.[key];
  if (existing?.buf) return existing;
  const b = new Uint8Array(byteLen);
  const v = new DataView(b.buffer);
  for (let i = 0; i < arr.length; i++) {
    const x = arr[i];
    writer(v, i, typeof x === "bigint" ? x : BigInt(Math.trunc(Number(x ?? 0))));
  }
  const ptr = { buf: b, off: 0 };
  if (arr && typeof arr === "object") {
    try { Object.defineProperty(arr, key, { value: ptr, enumerable: false, configurable: true, writable: true }); } catch { (arr as any)[key] = ptr; }
  }
  return ptr;
}
function cptr_from_uint64_array(arr: any[]): CPtr { return __cptr_cached_array_bigint(arr, "__cptr_uint64", arr.length * 8, (v, i, x) => v.setBigUint64(i * 8, BigInt.asUintN(64, x), true)); }
function cptr_from_int64_array(arr: any[]): CPtr { return __cptr_cached_array_bigint(arr, "__cptr_int64", arr.length * 8, (v, i, x) => v.setBigInt64(i * 8, BigInt.asIntN(64, x), true)); }
function cptr_offset(ptr: any, n: number): any { if (typeof ptr === 'string') { /* C17 §6.5.6 pointer arithmetic chains: s+ls-lp lowers to cptr_offset(cptr_offset(s,ls),-lp). On a JS string the first substring drops absolute position; convert to CPtr so the chain composes. */ const __b = new Uint8Array(ptr.length + 1); for (let __i = 0; __i < ptr.length; __i++) __b[__i] = ptr.charCodeAt(__i); return { buf: __b, off: Number(n) }; } if (ptr && ptr.__field_ref === true) { return { __field_ref: true, __owner: ptr.__owner, __owner_type: ptr.__owner_type, __field_name: ptr.__field_name, __field_offset: ptr.__field_offset, __byte_delta: (ptr.__byte_delta ?? 0) + Number(n) }; } if (ptr && ptr.__field_at_offset === true) { return { __field_at_offset: true, __owner: ptr.__owner, __byte_offset: (ptr.__byte_offset ?? 0) + Number(n) }; } /* BRIDGE: pointer-array — C17 §6.7.6.2 array-of-pointers (T*[N]) decays to T** (§6.3.2.1). When a slot-bearing CPtr (slots+__ptr_arr) is incremented, scale n by 8 (LLP64 sizeof(void*)) so cptr_read_ptr's off>>3 advances slot-by-slot, not byte-by-byte. */ if (ptr?.buf && ptr.__ptr_arr === true) return { buf: ptr.buf, off: (ptr.off ?? 0) + Number(n) * 8, slots: ptr.slots, __ptr_arr: true }; if (ptr?.buf) return { buf: ptr.buf, off: (ptr.off ?? 0) + n, __src_arr: ptr.__src_arr, __src_writer: ptr.__src_writer, __elem_size: ptr.__elem_size }; if (Array.isArray(ptr)) { /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: const T *arr[N] init-then-decay produces a T** that survives cptr_offset/cptr_read_ptr. Detect "JS array of pointers" by element shape (CPtr-like {buf,...} or null) and lift to a slot-bearing CPtr. Plain numeric arrays fall through to the int32-DataView path. */ const isPtrArr = ptr.length > 0 && ptr.some((e: any) => e == null || (typeof e === 'object' && (e?.buf || e?.slots))); if (isPtrArr) { return { buf: new Uint8Array(ptr.length * 8), off: Number(n) * 8, slots: ptr.slice(), __ptr_arr: true }; } const b = new Uint8Array(ptr.length * 4); const v = new DataView(b.buffer); for (let i = 0; i < ptr.length; i++) v.setInt32(i * 4, ptr[i], true); return { buf: b, off: n }; } if (ptr && typeof ptr === 'object' && !ptr.__cptr_overlay && !ptr.__arr && ptr.constructor && (ptr.constructor as any).__fieldNames) { return { __field_at_offset: true, __owner: ptr, __byte_offset: Number(n) }; } return ptr; }
// C17 §6.5.16.1: writes through a CPtr derived from a JS array must mirror
// to the source array so subsequent arr[i] reads see the written value.
function __cptr_writeback(ptr: any, byteOff: number): void { const arr = ptr.__src_arr; if (!arr) return; const es = ptr.__elem_size ?? 1; if (byteOff % es !== 0) return; const idx = byteOff / es; if (idx < 0 || idx >= arr.length) return; const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); if (es === 1) arr[idx] = dv.getInt8(byteOff); else if (es === 2) arr[idx] = dv.getInt16(byteOff, true); else if (es === 4) arr[idx] = dv.getInt32(byteOff, true); else if (es === 8) arr[idx] = dv.getFloat64(byteOff, true); }
function cptr_read(ptr: any, i: number = 0): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (Array.isArray(ptr)) return ptr[i]; if (!ptr?.buf) return 0; return ptr.buf[ptr.off + i] ?? 0; }
function cptr_write(ptr: CPtr, i: number, val: number): void {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr?.buf) return; ptr.buf[ptr.off + i] = val & 0xFF; }
function cptr_to_string(ptr: CPtr | null): string {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr) return ''; const bytes: number[] = []; for (let i = ptr.off; i < ptr.buf.length; i++) { if (ptr.buf[i] === 0) break; bytes.push(ptr.buf[i]); } return String.fromCharCode(...bytes); }
function cptr_from_string(str: string): CPtr { const buf = new Uint8Array(str.length + 1); for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i); buf[str.length] = 0; return { buf, off: 0 }; }
function cptr_strlen(ptr: CPtr | null): number {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr) return 0; let i = 0; while (ptr.off + i < ptr.buf.length && ptr.buf[ptr.off + i] !== 0) i++; return i; }
function cptr_memset(ptr: CPtr, val: number, n: number): void {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 for (let i = 0; i < n; i++) ptr.buf[ptr.off + i] = val & 0xFF; }
function cptr_copy(dst: CPtr, src: CPtr, n: number): void {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
  if (typeof src === 'string') src = cptr_from_string(src);
 for (let i = 0; i < n; i++) dst.buf[dst.off + i] = src.buf[src.off + i] ?? 0; }
function cptr_realloc(ptr: CPtr | null, newSize: any): CPtr { const sz = typeof newSize === "bigint" ? Number(newSize) : Number(newSize ?? 0); const n = new Uint8Array(sz); if (ptr) { const copyLen = Math.min(ptr.buf.length - ptr.off, sz); n.set(ptr.buf.subarray(ptr.off, ptr.off + copyLen)); } const r: any = { buf: n, off: 0 }; if (ptr && (ptr as any).slots) r.slots = (ptr as any).slots.slice(); return r; }
function cptr_clone(ptr: any): any { if (ptr == null) return null; if (ptr?.buf) { const c: any = { buf: ptr.buf, off: ptr.off }; if (ptr.slots) c.slots = ptr.slots; if (ptr.__ptr_arr) c.__ptr_arr = true; return c; } /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: cloning a JS array-of-pointers (T*[N]) at a call boundary lifts it to a slot-bearing CPtr so callee-side cptr_offset/cptr_read_ptr operate on a T** view rather than treating it as an int32 array. */ if (Array.isArray(ptr)) { const isPtrArr = ptr.length > 0 && ptr.some((e: any) => e == null || (typeof e === 'object' && (e?.buf || e?.slots))); if (isPtrArr) { return { buf: new Uint8Array(ptr.length * 8), off: 0, slots: ptr.slice(), __ptr_arr: true }; } return ptr; } if (typeof ptr === 'string') return cptr_from_string(ptr); return ptr; }
function cptr_eq(a: any, b: any): boolean {
  if (typeof a === 'string') a = cptr_from_string(a);
  if (typeof b === 'string') b = cptr_from_string(b);
 if (a === b) return true; if (!a || !b) return false; if (!a.buf && !b.buf) return false; return a.buf === b.buf && a.off === b.off; }
function cptr_read_int8(ptr: any, i: number = 0): number { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getInt8(ptr.off + i); }
function cptr_write_int8(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setInt8(ptr.off + i, val); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i); }
function cptr_read_uint8(ptr: any, i: number = 0): number {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } return ptr.buf[ptr.off + i] ?? 0; }
function cptr_write_uint8(ptr: any, i: number, val: number): void {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } ptr.buf[ptr.off + i] = val & 0xFF; if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i); }
function cptr_read_int16(ptr: any, i: number = 0): number { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getInt16(ptr.off + i * 2, __LITTLE_ENDIAN); }
function cptr_write_int16(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setInt16(ptr.off + i * 2, val, __LITTLE_ENDIAN); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i * 2); }
function cptr_read_uint16(ptr: any, i: number = 0): number { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getUint16(ptr.off + i * 2, __LITTLE_ENDIAN); }
function cptr_write_uint16(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setUint16(ptr.off + i * 2, val, __LITTLE_ENDIAN); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i * 2); }
function cptr_read_int32(ptr: any, i: number = 0): number {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } if (Array.isArray(ptr.buf)) { const idx = (ptr.off ?? 0) / 4 + i; return Number(ptr.buf[idx] ?? 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getInt32(ptr.off + i * 4, __LITTLE_ENDIAN); }
function cptr_write_int32(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setInt32(ptr.off + i * 4, val, __LITTLE_ENDIAN); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i * 4); }
function cptr_read_uint32(ptr: any, i: number = 0): number { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getUint32(ptr.off + i * 4, __LITTLE_ENDIAN); }
function cptr_write_uint32(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setUint32(ptr.off + i * 4, val, __LITTLE_ENDIAN); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i * 4); }
function cptr_read_int64(ptr: any, i: number = 0): bigint { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { const v = ptr.value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof ptr === 'bigint') return ptr; if (typeof ptr === 'number') return BigInt(Math.trunc(ptr)); if (Array.isArray(ptr)) { const x = ptr[i]; return typeof x === 'bigint' ? x : BigInt(Math.trunc(Number(x ?? 0))); } return 0n; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getBigInt64(ptr.off + i * 8, __LITTLE_ENDIAN); }
function cptr_write_int64(ptr: any, i: number, val: bigint | number): void { const v = typeof val === 'bigint' ? val : BigInt(Math.trunc(Number(val ?? 0))); if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = v; return; } if (Array.isArray(ptr)) ptr[i] = v; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setBigInt64(ptr.off + i * 8, BigInt.asIntN(64, v), __LITTLE_ENDIAN); }
function cptr_read_uint64(ptr: any, i: number = 0): bigint { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { const v = ptr.value; return typeof v === 'bigint' ? BigInt.asUintN(64, v) : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof ptr === 'bigint') return BigInt.asUintN(64, ptr); if (typeof ptr === 'number') return BigInt(Math.trunc(ptr)); if (Array.isArray(ptr)) { const x = ptr[i]; return typeof x === 'bigint' ? BigInt.asUintN(64, x) : BigInt(Math.trunc(Number(x ?? 0))); } return 0n; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getBigUint64(ptr.off + i * 8, __LITTLE_ENDIAN); }
function cptr_write_uint64(ptr: any, i: number, val: bigint | number): void { const v = typeof val === 'bigint' ? val : BigInt(Math.trunc(Number(val ?? 0))); if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = v; return; } if (Array.isArray(ptr)) ptr[i] = v; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setBigUint64(ptr.off + i * 8, BigInt.asUintN(64, v), __LITTLE_ENDIAN); }
function cptr_read_float32(ptr: any, i: number = 0): number { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getFloat32(ptr.off + i * 4, __LITTLE_ENDIAN); }
function cptr_write_float32(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setFloat32(ptr.off + i * 4, val, __LITTLE_ENDIAN); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i * 4); }
function cptr_read_float64(ptr: any, i: number = 0): number { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getFloat64(ptr.off + i * 8, __LITTLE_ENDIAN); }
function cptr_write_float64(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setFloat64(ptr.off + i * 8, val, __LITTLE_ENDIAN); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i * 8); }
// C17 6.7.6.1 / 6.7.6.2: pointer-to-pointer (T**) read/write helpers.
// CPtr buf/off carries an optional parallel slots[] array of (CPtr | null)
// entries. cptr_write_ptr lazily attaches slots[] and stores the pointer
// reference at slots[idx]; it also stamps a non-zero sentinel into the byte
// view at idx*8 so byte-level scans (e.g. p->items[i] truthiness) still see
// the slot as truthy. cptr_read_ptr returns slots[idx] (or null when not yet
// written). memcpy/memmove of a slot-bearing CPtr copies the slot references
// alongside the bytes so a re-allocated buffer preserves pointer identity.
// Slot offset within the source CPtr is (off/8) so cptr_offset by 8*N
// preserves the slot view consistently.
function cptr_read_ptr(ptr: any, idx: number = 0): any { if (ptr == null) return null; if (Array.isArray(ptr)) { const v = ptr[idx]; return v ?? null; } if (typeof ptr === 'object' && (ptr as any).slots) { const slotIdx = (((ptr as any).off ?? 0) >> 3) + Number(idx); return (ptr as any).slots[slotIdx] ?? null; } return null; }
function cptr_write_ptr(ptr: any, idx: number, val: any): void { if (ptr == null) return; if (Array.isArray(ptr)) { ptr[Number(idx)] = val; return; } if (typeof ptr !== 'object') return; if (!(ptr as any).slots) (ptr as any).slots = []; const slotIdx = (((ptr as any).off ?? 0) >> 3) + Number(idx); (ptr as any).slots[slotIdx] = val ?? null; if ((ptr as any).buf) { const byteOff = (((ptr as any).off ?? 0) + Number(idx) * 8); const buf = (ptr as any).buf; if (buf && buf.length >= byteOff + 1) { buf[byteOff] = val == null ? 0 : 0xFF; } } }
function malloc(size: any): CPtr { return cptr_create(size); }
function abs(x: number): number { if (x == null) return 0; return Math.abs(x); }
// C++20 iterator helpers — shared by <algorithm> / <numeric>.
// The emitter lowers `v[Symbol.iterator]()` to `v.values()` (C++20 §22.3.11). We patch
// Array.prototype.values once so the returned iterator carries __arr/__pos and
// coerces to its position via valueOf, so iterator arithmetic expressions like
// `it - v[Symbol.iterator]()` (from std::distance lowerings) evaluate to a position index
// instead of NaN.
if (!(Array.prototype as any).__cpp_values_patched) {
  Object.defineProperty(Array.prototype, '__cpp_values_patched', { value: true, enumerable: false });
  const __origValues = Array.prototype.values;
  (Array.prototype as any).values = function () {
    const arr: any[] = this as any;
    let pos = 0;
    const it: any = {
      __arr: arr,
      get __pos() { return pos; },
      set __pos(v: number) { pos = v; },
      next() { if (pos < arr.length) return { value: arr[pos++], done: false }; return { value: undefined, done: true }; },
      [Symbol.iterator]() { return this; },
      valueOf() { return pos; },
      return(v: any) { pos = arr.length; return { value: v, done: true }; },
    };
    return it;
  };
  void __origValues;
}
function __cpp_arr(first: any, last?: any): { arr: any[]; start: number; end: number } {
  if (first == null) return { arr: [], start: 0, end: 0 };
  if (Array.isArray(first)) {
    const end = (last != null && typeof last === 'number') ? last
              : (last && last.__arr === first) ? last.__pos
              : first.length;
    return { arr: first, start: 0, end };
  }
  if (first && first.__arr !== undefined && Array.isArray(first.__arr)) {
    const arr = first.__arr;
    const start = first.__pos ?? 0;
    const end = (last && last.__arr === arr) ? (last.__pos ?? arr.length)
              : (last == null) ? arr.length
              : (typeof last === 'number') ? last
              : arr.length;
    return { arr, start, end };
  }
  // Fallback: any iterable — materialise
  const arr = Array.from(first as Iterable<any>);
  return { arr, start: 0, end: arr.length };
}
function __cpp_iter(arr: any[], pos: number): any {
  return { __arr: arr, __pos: pos, valueOf() { return this.__pos; }, [Symbol.iterator](): any { let i = this.__pos; const self = this; return { next() { if (i < self.__arr.length) return { value: self.__arr[i++], done: false }; return { value: undefined, done: true }; } }; } };
}
// C++20 27.2.3 [iterator.requirements]: iterator equality compares position
// within the same range. The emitter lowers it == __cpp_iter(v, v.length) and similar
// patterns through this helper because strict object-identity is meaningless
// across distinct iterator literals: __cpp_iter(v, n) === __cpp_iter(v, n)
// is false even when the positions are equal.
function __cpp_iter_eq(a: any, b: any): boolean {
  const ap = (a && typeof a === 'object' && '__pos' in a) ? a.__pos : (typeof a === 'number' ? a : Number(a));
  const bp = (b && typeof b === 'object' && '__pos' in b) ? b.__pos : (typeof b === 'number' ? b : Number(b));
  return ap === bp;
}
// back_inserter: C++20 §25.5.2.1. Accepts a ref-box { value: array } or the
// raw array. Produces a sink object with __push(x) and __arr pointing at the
// destination so algorithm shims that append do so via __push.
function back_inserter(c: any): any {
  const target: any[] = (c && 'value' in c) ? c.value : c;
  return { __arr: target, __push(x: any) { target.push(x); }, __isBackInserter: true };
}
function front_inserter(c: any): any {
  const target: any[] = (c && 'value' in c) ? c.value : c;
  return { __arr: target, __push(x: any) { target.unshift(x); }, __isBackInserter: true };
}
function inserter(c: any, pos: any): any {
  const target: any[] = (c && 'value' in c) ? c.value : c;
  let idx = (pos && pos.__pos !== undefined) ? pos.__pos : (typeof pos === 'number' ? pos : target.length);
  return { __arr: target, __push(x: any) { target.splice(idx++, 0, x); }, __isBackInserter: true };
}
function __cpp_write(out: any, values: any[]): any {
  if (out == null) return null;
  if (out.__isBackInserter) { for (const v of values) out.__push(v); return out; }
  if (Array.isArray(out)) { for (let i = 0; i < values.length; i++) out[i] = values[i]; return __cpp_iter(out, values.length); }
  if (out.__arr !== undefined && Array.isArray(out.__arr)) {
    const a = out.__arr; let p = out.__pos ?? 0;
    for (const v of values) a[p++] = v;
    return __cpp_iter(a, p);
  }
  return null;
}
function fill(first: any, last: any, value: any): void { const A = __cpp_arr(first, last); for (let i = A.start; i < A.end; i++) A.arr[i] = value; }
function trunc(x: number): number { return Math.trunc(x); }
function unique(first: any, last: any, pred?: Function): any { const A = __cpp_arr(first, last); const eq = pred ?? ((a: any, b: any) => a === b); if (A.end <= A.start) return __cpp_iter(A.arr, A.start); let w = A.start + 1; for (let i = A.start + 1; i < A.end; i++) if (!eq(A.arr[w - 1], A.arr[i])) A.arr[w++] = A.arr[i]; return __cpp_iter(A.arr, w); }
/* ═══════════════════════════════════════════════
 * TRANSLATOR DIAGNOSTICS
 * ═══════════════════════════════════════════════
 * One entry per unique (kind, reason). See emitter.diagnostics
 * for the full list with all source locations.
 *
 * ── ERRORS (1) ──
 *   [unsupported] [x2]
 *     inline assembly is platform-specific and cannot be translated to TypeScript: (asm template not exposed in AST)
 *
 * ═══════════════════════════════════════════════ */
function i32(x: number) { return x | 0; }
function u32(x: number) { return x >>> 0; }
function __as_bigint(x: any): bigint { if (typeof x === 'bigint') return x; if (typeof x === 'number') return BigInt(Math.trunc(x)); if (x && typeof x === 'object' && 'value' in x) { const v = (x as any).value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof x === 'boolean') return x ? 1n : 0n; return BigInt(Math.trunc(Number(x ?? 0))); }
function __u64(x: bigint): bigint { return BigInt.asUintN(64, x); }
function __i64(x: bigint): bigint { return BigInt.asIntN(64, x); }
function __safe_div_i64(a: bigint, b: bigint): bigint { if (b === 0n) throw new Error('Division by zero'); return a / b; }
function __safe_mod_i64(a: bigint, b: bigint): bigint { if (b === 0n) throw new Error('Division by zero'); return a % b; }

const __cpp2ts_objId_map = new WeakMap<object, number>(); const __cpp2ts_objId_inverse = new Map<number, any>(); let __cpp2ts_objId_next = 64; function __cpp2ts_objId(o: any): number { if (o == null || typeof o !== 'object') return 0; let id = __cpp2ts_objId_map.get(o); if (id === undefined) { id = __cpp2ts_objId_next; __cpp2ts_objId_next += 64; __cpp2ts_objId_map.set(o, id); __cpp2ts_objId_inverse.set(id, o); } return id; } const __cpp2ts_cptrInt_byBuf = new WeakMap<object, Map<number, number>>(); const __cpp2ts_cptrInt_inverse = new Map<number, any>(); let __cpp2ts_cptrInt_next = -64; function __cpp2ts_ptr_to_intptr(p: any): number {
  if (typeof p === 'string') p = cptr_from_string(p);
 if (p == null) return 0; if (p && p.buf && typeof p.off !== 'undefined') { let m = __cpp2ts_cptrInt_byBuf.get(p.buf); if (!m) { m = new Map(); __cpp2ts_cptrInt_byBuf.set(p.buf, m); } const off = p.off ?? 0; let id = m.get(off); if (id === undefined) { id = __cpp2ts_cptrInt_next; __cpp2ts_cptrInt_next -= 64; m.set(off, id); __cpp2ts_cptrInt_inverse.set(id, { buf: p.buf, off }); } return id; } return __cpp2ts_objId(p); } function __cpp2ts_intptr_to_ptr(i: any): any { if (i === 0 || i === 0n || i == null) return null; const n = typeof i === 'bigint' ? Number(i) : i; if (__cpp2ts_cptrInt_inverse.has(n)) return __cpp2ts_cptrInt_inverse.get(n); if (__cpp2ts_objId_inverse.has(n)) return __cpp2ts_objId_inverse.get(n); return n; }

export function __debugbreak(): void {
  ((): never => { throw new Error("inline asm not supported in TS translation: (asm template not exposed in AST)"); })() /* BRIDGE: c-inline-asm — GCC manual "Extended Asm" */;
}

export function __fastfail(_Code: number): void {
  ((): never => { throw new Error("inline asm not supported in TS translation: (asm template not exposed in AST)"); })() /* BRIDGE: c-inline-asm — GCC manual "Extended Asm" */;
  (() => { throw new Error("__builtin_unreachable reached"); })();
}

type rsize_t = number;
type wctype_t = number;
type errno_t = number;
type __time32_t = number;
type __time64_t = number;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class localeinfo_struct {
  locinfo: any;
  mbcinfo: any;
  constructor() {
    this.locinfo = undefined;
    this.mbcinfo = undefined;
  }
}
const _locale_tstruct = localeinfo_struct;
type _locale_tstruct = localeinfo_struct;
(localeinfo_struct as any).__fieldTypes = ["int32","int32"];
(localeinfo_struct as any).__fieldNames = ["locinfo","mbcinfo"];
(localeinfo_struct as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class tagLC_ID {
  wLanguage: number;
  wCountry: number;
  wCodePage: number;
  constructor() {
    this.wLanguage = 0;
    this.wCountry = 0;
    this.wCodePage = 0;
  }
}
const LC_ID = tagLC_ID;
type LC_ID = tagLC_ID;
(tagLC_ID as any).__fieldTypes = ["int16","int16","int16"];
(tagLC_ID as any).__fieldNames = ["wLanguage","wCountry","wCodePage"];
(tagLC_ID as any).__fieldOffsets = [0,2,4];

type LPLC_ID = any | null;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class threadlocaleinfostruct {
  _locale_pctype: number | null;
  _locale_mb_cur_max: number;
  _locale_lc_codepage: number;
  constructor() {
    this._locale_pctype = null;
    this._locale_mb_cur_max = 0;
    this._locale_lc_codepage = 0;
  }
}
const threadlocinfo = threadlocaleinfostruct;
type threadlocinfo = threadlocaleinfostruct;
(threadlocaleinfostruct as any).__fieldTypes = ["int64","int32","int32"];
(threadlocaleinfostruct as any).__fieldNames = ["_locale_pctype","_locale_mb_cur_max","_locale_lc_codepage"];
(threadlocaleinfostruct as any).__fieldOffsets = [0,8,12];

type _onexit_t = (...args: any[]) => any;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _div_t {
  quot: number;
  rem: number;
  constructor() {
    this.quot = 0;
    this.rem = 0;
  }
}
const div_t = _div_t;
type div_t = _div_t;
(_div_t as any).__fieldTypes = ["int32","int32"];
(_div_t as any).__fieldNames = ["quot","rem"];
(_div_t as any).__fieldOffsets = [0,4];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _ldiv_t {
  quot: number;
  rem: number;
  constructor() {
    this.quot = 0;
    this.rem = 0;
  }
}
const ldiv_t = _ldiv_t;
type ldiv_t = _ldiv_t;
(_ldiv_t as any).__fieldTypes = ["int64","int64"];
(_ldiv_t as any).__fieldNames = ["quot","rem"];
(_ldiv_t as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _LDOUBLE {
  ld: any = cptr_create(10);
  constructor() {
    this.ld = cptr_create(10);
  }
}
(_LDOUBLE as any).__fieldTypes = ["bytes"];
(_LDOUBLE as any).__fieldNames = ["ld"];
(_LDOUBLE as any).__fieldOffsets = [0];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _CRT_DOUBLE {
  x: number;
  constructor() {
    this.x = 0.0;
  }
}
(_CRT_DOUBLE as any).__fieldTypes = ["double"];
(_CRT_DOUBLE as any).__fieldNames = ["x"];
(_CRT_DOUBLE as any).__fieldOffsets = [0];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _CRT_FLOAT {
  f: number;
  constructor() {
    this.f = 0.0;
  }
}
(_CRT_FLOAT as any).__fieldTypes = ["float"];
(_CRT_FLOAT as any).__fieldNames = ["f"];
(_CRT_FLOAT as any).__fieldOffsets = [0];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _LONGDOUBLE {
  x: number;
  constructor() {
    this.x = 0.0;
  }
}
(_LONGDOUBLE as any).__fieldTypes = ["double"];
(_LONGDOUBLE as any).__fieldNames = ["x"];
(_LONGDOUBLE as any).__fieldOffsets = [0];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _LDBL12 {
  ld12: any = cptr_create(12);
  constructor() {
    this.ld12 = cptr_create(12);
  }
}
(_LDBL12 as any).__fieldTypes = ["bytes"];
(_LDBL12 as any).__fieldNames = ["ld12"];
(_LDBL12 as any).__fieldOffsets = [0];

type _purecall_handler = (...args: any[]) => any;
type _invalid_parameter_handler = (...args: any[]) => any;
export function _abs64(x: number): number {
  return __builtin_llabs(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ x);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class lldiv_t {
  quot: number;
  rem: number;
  constructor() {
    this.quot = 0;
    this.rem = 0;
  }
}
(lldiv_t as any).__fieldTypes = ["int64","int64"];
(lldiv_t as any).__fieldNames = ["quot","rem"];
(lldiv_t as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _heapinfo {
  _pentry: number | null;
  _size: number;
  _useflag: number;
  constructor() {
    this._pentry = null;
    this._size = 0;
    this._useflag = 0;
  }
}
const _HEAPINFO = _heapinfo;
type _HEAPINFO = _heapinfo;
(_heapinfo as any).__fieldTypes = ["int64","int64","int32"];
(_heapinfo as any).__fieldNames = ["_pentry","_size","_useflag"];
(_heapinfo as any).__fieldOffsets = [0,8,16];

function _MarkAllocaS(_Ptr: any | null, _Marker: number): any | null {
  if (_Ptr) {
    cptr_write_uint32(((_Ptr)), 0, ((_Marker) >>> 0));
    _Ptr = cptr_offset((_Ptr), 16);
  }
  return cptr_clone(_Ptr);
}

function _freea(_Memory: any | null): void {
  let _Marker = 0;
  if (_Memory) {
    _Memory = cptr_offset((_Memory), -(16));
    _Marker = ((cptr_read_uint32((_Memory))) >>> 0);
    if (((_Marker) >>> 0) == ((56797) >>> 0)) {
      free(_Memory);
    }
  }
}

type int_least8_t = number;
type uint_least8_t = number;
type int_least16_t = number;
type uint_least16_t = number;
type int_least32_t = number;
type uint_least32_t = number;
type int_least64_t = number;
type uint_least64_t = number;
type int_fast8_t = number;
type uint_fast8_t = number;
type int_fast16_t = number;
type uint_fast16_t = number;
type int_fast32_t = number;
type uint_fast32_t = number;
type int_fast64_t = number;
type uint_fast64_t = number;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class max_align_t {
  __max_align_ll: number;
  __max_align_ld: number;
  constructor() {
    this.__max_align_ll = 0;
    this.__max_align_ld = 0.0;
  }
}
(max_align_t as any).__fieldTypes = ["int64","double"];
(max_align_t as any).__fieldNames = ["__max_align_ll","__max_align_ld"];
(max_align_t as any).__fieldOffsets = [0,16];

type Fnv32_t = number;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class Fnv64_t {
  w32: any = new Array(2).fill(0);
  constructor() {
    this.w32 = new Array(2).fill(0);
  }
}
(Fnv64_t as any).__fieldTypes = ["bytes"];
(Fnv64_t as any).__fieldNames = ["w32"];
(Fnv64_t as any).__fieldOffsets = [0];

export type fnv_type = number;
export const FNV_NONE: number = 0;
export const FNV0_32: number = 1;
export const FNV1_32: number = 2;
export const FNV1a_32: number = 3;
export const FNV0_64: number = 4;
export const FNV1_64: number = 5;
export const FNV1a_64: number = 6;

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class test_vector {
  buf: any | null;
  len: number;
  constructor() {
    this.buf = null;
    this.len = 0;
  }
}
(test_vector as any).__fieldTypes = ["int64","int32"];
(test_vector as any).__fieldNames = ["buf","len"];
(test_vector as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class fnv0_32_test_vector {
  test: test_vector | null;
  fnv0_32: Fnv32_t;
  constructor() {
    this.test = null;
    this.fnv0_32 = 0;
  }
}
(fnv0_32_test_vector as any).__fieldTypes = ["int64","int32"];
(fnv0_32_test_vector as any).__fieldNames = ["test","fnv0_32"];
(fnv0_32_test_vector as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class fnv1_32_test_vector {
  test: test_vector | null;
  fnv1_32: Fnv32_t;
  constructor() {
    this.test = null;
    this.fnv1_32 = 0;
  }
}
(fnv1_32_test_vector as any).__fieldTypes = ["int64","int32"];
(fnv1_32_test_vector as any).__fieldNames = ["test","fnv1_32"];
(fnv1_32_test_vector as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class fnv1a_32_test_vector {
  test: test_vector | null;
  fnv1a_32: Fnv32_t;
  constructor() {
    this.test = null;
    this.fnv1a_32 = 0;
  }
}
(fnv1a_32_test_vector as any).__fieldTypes = ["int64","int32"];
(fnv1a_32_test_vector as any).__fieldNames = ["test","fnv1a_32"];
(fnv1a_32_test_vector as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class fnv0_64_test_vector {
  test: test_vector | null;
  fnv0_64: Fnv64_t;
  constructor() {
    this.test = null;
    this.fnv0_64 = new Fnv64_t();
  }
}
(fnv0_64_test_vector as any).__fieldTypes = ["int64","int32"];
(fnv0_64_test_vector as any).__fieldNames = ["test","fnv0_64"];
(fnv0_64_test_vector as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class fnv1_64_test_vector {
  test: test_vector | null;
  fnv1_64: Fnv64_t;
  constructor() {
    this.test = null;
    this.fnv1_64 = new Fnv64_t();
  }
}
(fnv1_64_test_vector as any).__fieldTypes = ["int64","int32"];
(fnv1_64_test_vector as any).__fieldNames = ["test","fnv1_64"];
(fnv1_64_test_vector as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class fnv1a_64_test_vector {
  test: test_vector | null;
  fnv1a_64: Fnv64_t;
  constructor() {
    this.test = null;
    this.fnv1a_64 = new Fnv64_t();
  }
}
(fnv1a_64_test_vector as any).__fieldTypes = ["int64","int32"];
(fnv1a_64_test_vector as any).__fieldNames = ["test","fnv1a_64"];
(fnv1a_64_test_vector as any).__fieldOffsets = [0,8];

export const fnv0_64_init = Object.assign(new Fnv64_t(), { w32: [((0) >>> 0), ((0) >>> 0)] });
export const fnv1_64_init = Object.assign(new Fnv64_t(), { w32: [((2216829733) >>> 0), ((3421674724) >>> 0)] });
export function fnv_64_buf(buf: any | null, len: number, hval: Fnv64_t): Fnv64_t {
  let bp = cptr_clone(cptr_clone((buf))); /* &ref */
  let be = cptr_offset(bp, ((len) >>> 0)); /* &ref */
  let val = new Array(4).fill(0);
  let tmp = new Array(4).fill(0);
  val[0] = ((((hval.w32[0]) >>> 0)) >>> 0);
  val[1] = ((((val[0]) >>> 0) >>> 16) >>> 0);
  val[0] = (val[0] & ((65535) >>> 0)) >>> 0;
  val[2] = ((((hval.w32[1]) >>> 0)) >>> 0);
  val[3] = ((((val[2]) >>> 0) >>> 16) >>> 0);
  val[2] = (val[2] & ((65535) >>> 0)) >>> 0;
  while (((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) < __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(bp, be)) {
    tmp[0] = (Math.imul(((val[0]) >>> 0), (((Math.trunc(+(435))) >>> 0))) >>> 0);
    tmp[1] = (Math.imul(((val[1]) >>> 0), (((Math.trunc(+(435))) >>> 0))) >>> 0);
    tmp[2] = (Math.imul(((val[2]) >>> 0), (((Math.trunc(+(435))) >>> 0))) >>> 0);
    tmp[3] = (Math.imul(((val[3]) >>> 0), (((Math.trunc(+(435))) >>> 0))) >>> 0);
    tmp[2] = u32(tmp[2] + (((val[0]) >>> 0) << (8)) >>> 0);
    tmp[3] = u32(tmp[3] + (((val[1]) >>> 0) << (8)) >>> 0);
    tmp[1] = u32(tmp[1] + ((((tmp[0]) >>> 0) >>> 16) >>> 0));
    val[0] = (((tmp[0]) >>> 0) & ((65535) >>> 0)) >>> 0;
    tmp[2] = u32(tmp[2] + ((((tmp[1]) >>> 0) >>> 16) >>> 0));
    val[1] = (((tmp[1]) >>> 0) & ((65535) >>> 0)) >>> 0;
    val[3] = u32(((tmp[3]) >>> 0) + ((((tmp[2]) >>> 0) >>> 16) >>> 0));
    val[2] = (((tmp[2]) >>> 0) & ((65535) >>> 0)) >>> 0;
    val[0] = (val[0] ^ ((Math.trunc(+((((bp.buf[bp.off++])) & 0xFF)))) >>> 0)) >>> 0;
  }
  hval.w32[1] = ((((((((val[3]) >>> 0) << 16) >>> 0) | ((val[2]) >>> 0)) >>> 0)) >>> 0);
  hval.w32[0] = ((((((((val[1]) >>> 0) << 16) >>> 0) | ((val[0]) >>> 0)) >>> 0)) >>> 0);
  return hval;
}

export function fnv_64_str(str: string, hval: Fnv64_t): Fnv64_t {
  let s = cptr_clone(cptr_clone((str))); /* &ref */
  let val = new Array(4).fill(0);
  let tmp = new Array(4).fill(0);
  val[0] = ((((hval.w32[0]) >>> 0)) >>> 0);
  val[1] = ((((val[0]) >>> 0) >>> 16) >>> 0);
  val[0] = (val[0] & ((65535) >>> 0)) >>> 0;
  val[2] = ((((hval.w32[1]) >>> 0)) >>> 0);
  val[3] = ((((val[2]) >>> 0) >>> 16) >>> 0);
  val[2] = (val[2] & ((65535) >>> 0)) >>> 0;
  while (((s.buf[s.off]) & 0xFF)) {
    tmp[0] = (Math.imul(((val[0]) >>> 0), (((Math.trunc(+(435))) >>> 0))) >>> 0);
    tmp[1] = (Math.imul(((val[1]) >>> 0), (((Math.trunc(+(435))) >>> 0))) >>> 0);
    tmp[2] = (Math.imul(((val[2]) >>> 0), (((Math.trunc(+(435))) >>> 0))) >>> 0);
    tmp[3] = (Math.imul(((val[3]) >>> 0), (((Math.trunc(+(435))) >>> 0))) >>> 0);
    tmp[2] = u32(tmp[2] + (((val[0]) >>> 0) << (8)) >>> 0);
    tmp[3] = u32(tmp[3] + (((val[1]) >>> 0) << (8)) >>> 0);
    tmp[1] = u32(tmp[1] + ((((tmp[0]) >>> 0) >>> 16) >>> 0));
    val[0] = (((tmp[0]) >>> 0) & ((65535) >>> 0)) >>> 0;
    tmp[2] = u32(tmp[2] + ((((tmp[1]) >>> 0) >>> 16) >>> 0));
    val[1] = (((tmp[1]) >>> 0) & ((65535) >>> 0)) >>> 0;
    val[3] = u32(((tmp[3]) >>> 0) + ((((tmp[2]) >>> 0) >>> 16) >>> 0));
    val[2] = (((tmp[2]) >>> 0) & ((65535) >>> 0)) >>> 0;
    val[0] = (val[0] ^ ((Math.trunc(+(((((s.buf[s.off++]))) & 0xFF)))) >>> 0)) >>> 0;
  }
  hval.w32[1] = ((((((((val[3]) >>> 0) << 16) >>> 0) | ((val[2]) >>> 0)) >>> 0)) >>> 0);
  hval.w32[0] = ((((((((val[1]) >>> 0) << 16) >>> 0) | ((val[0]) >>> 0)) >>> 0)) >>> 0);
  return hval;
}