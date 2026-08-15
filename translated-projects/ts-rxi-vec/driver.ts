function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function remove(path: any): number { try { const p = (path?.buf) ? cptr_to_string(path) : String(path ?? ''); require('fs').unlinkSync(p); return 0; } catch { return -1; } }
function qsort(base: any, nmemb: number, size: number, compar: Function): void {
  if (nmemb <= 1) return;
  if (Array.isArray(base)) { const sub = base.slice(0, nmemb); sub.sort((a: any, b: any) => compar(a, b)); for (let i = 0; i < nmemb; i++) base[i] = sub[i]; }
}
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function div(numer: number, denom: number): any { return { quot: Math.trunc(numer / denom), rem: numer % denom }; }
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
function memset(dst: any, val: number, n: number): any { const __zeroObject = (obj: any): void => { for (const k of Object.keys(obj)) { const v = obj[k]; if (typeof v === 'number') obj[k] = val | 0; else if (typeof v === 'boolean') obj[k] = val !== 0; else if (typeof v === 'string') obj[k] = ''; else if (v && typeof v === 'object' && v.buf) cptr_memset(v, val, v.buf.length); else if (Array.isArray(v) && v.length > 0 && typeof Object.values(v).find(x => x !== null && typeof x === 'object') !== 'undefined') { for (const item of v) { if (item && typeof item === 'object') __zeroObject(item); } } else if (Array.isArray(v)) { for (let i = 0; i < Math.min(n, v.length); i++) v[i] = val; } else if (v && typeof v === 'object') __zeroObject(v); else if (v != null) obj[k] = null; } }; if (dst?.buf) { cptr_memset(dst, val, n); return dst; } if (Array.isArray(dst) && dst.length > 0 && typeof Object.values(dst).find(x => x !== null && typeof x === 'object') !== 'undefined') { for (const obj of dst) { if (obj && typeof obj === 'object') __zeroObject(obj); } return dst; } if (Array.isArray(dst)) { for (let _mi = 0; _mi < Math.min(n, dst.length); _mi++) dst[_mi] = val; return dst; } if (dst && typeof dst === 'object') { __zeroObject(dst); return dst; } return dst; }
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
function reduce(first: any, last: any, init?: any, op?: Function): any { const A = __cpp_arr(first, last); const f = op ?? ((a: any, b: any) => a + b); let acc = init ?? 0; for (let i = A.start; i < A.end; i++) acc = f(acc, A.arr[i]); return acc; }
function memmove(dst: any, src: any, n: number): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
  if (typeof src === 'string') src = cptr_from_string(src);
 if (dst?.buf && src?.buf) { const tmp = new Uint8Array(n); for (let i = 0; i < n; i++) tmp[i] = src.buf[src.off + i] ?? 0; for (let i = 0; i < n; i++) dst.buf[dst.off + i] = tmp[i]; return dst; } if (Array.isArray(dst) && Array.isArray(src)) { const tmp = src.slice(0, n); for (let i = 0; i < n; i++) dst[i] = tmp[i]; } else if (typeof dst === 'object' && typeof src === 'object') Object.assign(dst, src); return dst; }
function max(a: any, b?: any, comp?: Function): any { if (b === undefined) { if (Array.isArray(a)) return a.reduce((m, x) => x > m ? x : m, a[0]); return a; } const lt = comp ?? ((x: any, y: any) => x < y); return lt(a, b) ? b : a; }
function trunc(x: number): number { return Math.trunc(x); }
/* stdbool: true/false are native in TypeScript */
function i32(x: number) { return x | 0; }
function u32(x: number) { return x >>> 0; }
function __as_bigint(x: any): bigint { if (typeof x === 'bigint') return x; if (typeof x === 'number') return BigInt(Math.trunc(x)); if (x && typeof x === 'object' && 'value' in x) { const v = (x as any).value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof x === 'boolean') return x ? 1n : 0n; return BigInt(Math.trunc(Number(x ?? 0))); }
function __u64(x: bigint): bigint { return BigInt.asUintN(64, x); }
function __i64(x: bigint): bigint { return BigInt.asIntN(64, x); }
function __safe_div_i64(a: bigint, b: bigint): bigint { if (b === 0n) throw new Error('Division by zero'); return a / b; }
function __safe_mod_i64(a: bigint, b: bigint): bigint { if (b === 0n) throw new Error('Division by zero'); return a % b; }

function __struct_ptr_at(p: any, i: any): any { if (p == null) return p; const idx = Number(i) | 0; if (Array.isArray(p)) return p[idx]; if (p && p.__arr !== undefined) return p.__arr[(p.__idx ?? 0) + idx]; if (p && p.__cptr_overlay === true && idx !== 0) { return cptr_struct_overlay(p.__structT, p.__cptr, (p.__byteOff ?? 0) + idx * (p.__layout?.totalSize ?? 0)); } if (p && p.__field_ref === true && idx === 0) { /* C17 §6.3.2.3 p7: container_of round-trip recovery. Fire ONLY when explicit pointer arithmetic happened (byte_delta != 0) and the accumulated delta + field_offset cancels to 0. The byte_delta=0 case is direct field-ref dereference (`(&t.f)->subfield`) — the field-ref Proxy itself handles sub-field access via property forwarding, so returning the owner here would incorrectly resolve `(g.nilvalue_field_ref)->value_` to `g.value_` (undefined) instead of `g.nilvalue.value_`. The cast-back form `(T*)((char*)&t.m - offsetof(T,m))` still works through cptr_struct_overlay's separate round-trip path. */ const bd = p.__byte_delta ?? 0; if (bd !== 0 && bd + (p.__field_offset ?? 0) === 0) return p.__owner; } if (p && p.__field_at_offset === true && idx === 0) { /* C17 §6.3.2.3 p7 + §7.19: resolve inverse-container_of shape. byte_offset 0 with cast target == owner's type is round-trip back to owner; otherwise look up the field at byte offset on the owner's class. */ const ctor = p.__owner ? p.__owner.constructor : null; const target = p.__byte_offset ?? 0; if (target === 0 && p.__cast_target === ctor) return p.__owner; if (ctor && ctor.__fieldNames) { if (ctor.__fieldOffsets) { for (let k = 0; k < ctor.__fieldNames.length; k++) { if (ctor.__fieldOffsets[k] === target) return p.__owner[ctor.__fieldNames[k]]; } } else if (ctor.__fieldTypes) { const SZ: any = { bool:1, int8:1, uint8:1, char:1, bytes:1, int16:2, uint16:2, int32:4, uint32:4, float:4, int64:8, uint64:8, double:8, ptr:8 }; let off = 0; for (let k = 0; k < ctor.__fieldNames.length; k++) { if (off === target) return p.__owner[ctor.__fieldNames[k]]; off += SZ[ctor.__fieldTypes[k]] ?? 4; } } } if (target === 0) return p.__owner; } return p; }
function __struct_array_with_tail(n: number, ctor: () => any, tail: number): any { const a: any = Array.from({ length: n }, ctor); a[n] = { buf: new Uint8Array(Math.max(0, tail | 0)), off: 0 }; return a; }

function __cptr_overlay_layout(T: any): any {
  if (T.__overlay_layout) return T.__overlay_layout;
  const types: string[] = T.__fieldTypes ?? [];
  const names: string[] = T.__fieldNames ?? [];
  const SZ: Record<string, number> = { 'bool':1,'int8':1,'int16':2,'int32':4,'int64':8,'float':4,'double':8,'bytes':0 };
  const AL: Record<string, number> = { 'bool':1,'int8':1,'int16':2,'int32':4,'int64':8,'float':4,'double':8,'bytes':1 };
  const isPacked = T.__packed === true;
  const isUnion = T.__union === true;
  const fields: any[] = []; let off = 0; let maxAl = 1;
  for (let i = 0; i < types.length; i++) {
    const ty = types[i]; const sz = SZ[ty] ?? 4; const al = AL[ty] ?? sz;
    const isLast = i === types.length - 1;
    if (isUnion) {
      // C17 §6.7.2.1 p16: every union member shares offset 0.
      fields.push({ name: names[i], type: ty, offset: 0, size: sz });
      if (sz > off) off = sz;
      continue;
    }
    if (ty === 'bytes' && isLast) { fields.push({ name: names[i], type: ty, offset: off, size: 0 }); continue; }
    if (!isPacked) { const pad = (al - (off % al)) % al; off += pad; if (al > maxAl) maxAl = al; }
    fields.push({ name: names[i], type: ty, offset: off, size: sz });
    off += sz;
  }
  T.__overlay_layout = { fields, totalSize: off };
  return T.__overlay_layout;
}
function cptr_struct_overlay(T: any, p: any, byteOff?: number): any {
  if (typeof p === 'string') p = cptr_from_string(p);

  if (p == null) return p;
  // C17 §6.3.2.3 p7 + §7.19: inverse-container_of bridge. When p was
  // produced by `(InnerT*)((char*)container + offsetof(ContainerT, f))`
  // (the inverse of container_of, used by intrusive-list libs like
  // uthash's HH_FROM_ELMT, Linux hlist, BSD sys/queue.h), resolve the
  // byte offset to the named field on the JS-class-backed container
  // and return the live nested struct. This makes writes through the
  // resulting pointer propagate to container.field.
  if (p && p.__field_at_offset === true) {
    const newOff = (p.__byte_offset ?? 0) + (byteOff ?? 0);
    const ownerCtor = p.__owner ? p.__owner.constructor : null;
    // Round-trip recovery: when the cast target matches the owner's
    // class and the accumulated offset is 0, return the owner directly
    // so pointer-equality (recovered == original) holds.
    if (newOff === 0 && T === ownerCtor) return p.__owner;
    // Tag with the cast target type and accumulate byteOff. Resolution
    // for non-round-trip cases happens in __struct_ptr_at when the
    // consumer dereferences. This preserves the back-reference chain
    // so a subsequent cptr_offset (the reverse direction in a
    // forward+reverse round-trip) can still recover the container.
    return { __field_at_offset: true, __owner: p.__owner, __byte_offset: newOff, __cast_target: T };
  }
  // C17 §6.3.2.3 p7 + §7.19: container_of round-trip recovery. If p
  // is a field reference whose accumulated byte_delta exactly cancels
  // its field_offset (`(T*)((char*)&t.m - offsetof(T, m))`), return
  // the containing struct. Otherwise the cast is UB per §6.3.2.3 p7;
  // best-effort: still return owner so misshapen code at least
  // doesn't crash. Future: emit a translate-time diagnostic.
  if (p && p.__field_ref === true) {
    return p.__owner;
  }
  if (Array.isArray(p)) return p[0];
  if (p && p.__arr !== undefined) return p.__arr[(p.__idx ?? 0)];
  if (!(p && p.buf !== undefined)) return p;
  // Bit-field struct: the class encodes per-field shift+mask; route the
  // class's internal DataView at the external buffer so its accessors
  // operate directly on the caller's bytes. C17 §6.7.2.1 p11.
  if (T.__bitfield === true && p.buf && (p.buf.buffer instanceof ArrayBuffer)) {
    return new T(p.buf, (p.off ?? 0) + (byteOff ?? 0));
  }
  const layout = __cptr_overlay_layout(T);
  const baseByteOff = byteOff ?? 0;
  const view: any = { __cptr_overlay: true, __cptr: p, __layout: layout, __byteOff: baseByteOff, __structT: T };
  for (const f of layout.fields) {
    const off = f.offset, ty = f.type, name = f.name;
    Object.defineProperty(view, name, {
      enumerable: true, configurable: false,
      get(): any {
        const buf = p.buf; const at = (p.off ?? 0) + baseByteOff + off;
        switch (ty) {
          case 'bool': case 'int8': { const v = buf[at] & 0xFF; return (v << 24) >> 24; }
          case 'int16': { const v = (buf[at] & 0xFF) | ((buf[at+1] & 0xFF) << 8); return (v << 16) >> 16; }
          case 'int32': { return ((buf[at] & 0xFF) | ((buf[at+1] & 0xFF) << 8) | ((buf[at+2] & 0xFF) << 16) | ((buf[at+3] & 0xFF) << 24)) | 0; }
          case 'int64': { const lo = ((buf[at] & 0xFF) | ((buf[at+1] & 0xFF) << 8) | ((buf[at+2] & 0xFF) << 16)) + ((buf[at+3] & 0xFF) * 0x1000000); const hi = ((buf[at+4] & 0xFF) | ((buf[at+5] & 0xFF) << 8) | ((buf[at+6] & 0xFF) << 16)) + ((buf[at+7] & 0xFF) * 0x1000000); return lo + hi * 0x100000000; }
          case 'float': { const dv = new DataView(new ArrayBuffer(4)); for (let k = 0; k < 4; k++) dv.setUint8(k, buf[at+k] & 0xFF); return dv.getFloat32(0, true); }
          case 'double': { const dv = new DataView(new ArrayBuffer(8)); for (let k = 0; k < 8; k++) dv.setUint8(k, buf[at+k] & 0xFF); return dv.getFloat64(0, true); }
          case 'bytes': { return new Proxy({} as any, { get: (_t, k) => { if (k === 'buf') return buf; if (k === 'off') return at; const ii = Number(k); if (!isNaN(ii)) return buf[at + ii] & 0xFF; return undefined; }, set: (_t, k, val) => { const ii = Number(k); if (!isNaN(ii)) buf[at + ii] = Number(val) & 0xFF; return true; } }); }
        }
        return undefined;
      },
      set(val: any): void {
        const buf = p.buf; const at = (p.off ?? 0) + baseByteOff + off;
        switch (ty) {
          case 'bool': case 'int8': { const v = Number(val) | 0; buf[at] = v & 0xFF; return; }
          case 'int16': { const v = Number(val) | 0; buf[at] = v & 0xFF; buf[at+1] = (v >> 8) & 0xFF; return; }
          case 'int32': { const v = Number(val) | 0; buf[at] = v & 0xFF; buf[at+1] = (v >> 8) & 0xFF; buf[at+2] = (v >> 16) & 0xFF; buf[at+3] = (v >> 24) & 0xFF; return; }
          case 'int64': { let big = typeof val === 'bigint' ? val : BigInt(Math.trunc(Number(val))); for (let k = 0; k < 8; k++) { buf[at+k] = Number(big & 0xFFn) & 0xFF; big = big >> 8n; } return; }
          case 'float': { const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, Number(val), true); for (let k = 0; k < 4; k++) buf[at+k] = dv.getUint8(k); return; }
          case 'double': { const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, Number(val), true); for (let k = 0; k < 8; k++) buf[at+k] = dv.getUint8(k); return; }
        }
      },
    });
  }
  return view;
}

function __field_ref_scalar(getOwner: () => any, ownerType: string, fieldName: string, fieldOffset: number): any {
  return {
    __field_ref: true,
    __owner_type: ownerType, __field_name: fieldName,
    __field_offset: fieldOffset, __byte_delta: 0,
    get __owner() { return getOwner(); },
    get value() { return getOwner()[fieldName]; },
    set value(v: any) { getOwner()[fieldName] = v; },
  };
}
function __field_ref_aggregate(getOwner: () => any, ownerType: string, fieldName: string, fieldOffset: number): any {
  const meta: any = {
    __field_ref: true,
    __owner_type: ownerType, __field_name: fieldName,
    __field_offset: fieldOffset, __byte_delta: 0,
  };
  return new Proxy({} as any, {
    get(_t, prop) {
      if (prop === '__owner') return getOwner();
      if (prop in meta) return meta[prop];
      const inner = getOwner()[fieldName];
      return inner == null ? undefined : (inner as any)[prop];
    },
    set(_t, prop, val) {
      if (prop in meta) { meta[prop] = val; return true; }
      const inner = getOwner()[fieldName];
      if (inner != null) (inner as any)[prop] = val;
      return true;
    },
    has(_t, prop) { return prop in meta || (prop in (getOwner()[fieldName] ?? {})); },
  });
}
function container_of(p: any, _T: any, _member: string): any {
  if (p == null) return null;
  if (p.__field_ref === true) return p.__owner;
  return p; /* best-effort identity; UB per C17 §6.3.2.3 p7 */
}

function strcmp(a: any, b: any): number {
  if (typeof a === 'string') a = cptr_from_string(a);
  if (typeof b === 'string') b = cptr_from_string(b);
 const sa = (typeof a === 'string') ? a : (a?.buf ? cptr_to_string(a) : a?.toString?.() ?? ''); const sb = (typeof b === 'string') ? b : (b?.buf ? cptr_to_string(b) : b?.toString?.() ?? ''); return sa < sb ? -1 : sa > sb ? 1 : 0; }
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class vec_void_t {
  data: CPtr | null;
  length: number;
  capacity: number;
  constructor() {
    this.data = null;
    this.length = 0;
    this.capacity = 0;
  }
}
(vec_void_t as any).__fieldTypes = ["int64","int32","int32"];
(vec_void_t as any).__fieldNames = ["data","length","capacity"];
(vec_void_t as any).__fieldOffsets = [0,8,12];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class vec_str_t {
  data: CPtr | null;
  length: number;
  capacity: number;
  constructor() {
    this.data = null;
    this.length = 0;
    this.capacity = 0;
  }
}
(vec_str_t as any).__fieldTypes = ["int64","int32","int32"];
(vec_str_t as any).__fieldNames = ["data","length","capacity"];
(vec_str_t as any).__fieldOffsets = [0,8,12];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class vec_int_t {
  data: number | null;
  length: number;
  capacity: number;
  constructor() {
    this.data = null;
    this.length = 0;
    this.capacity = 0;
  }
}
(vec_int_t as any).__fieldTypes = ["int64","int32","int32"];
(vec_int_t as any).__fieldNames = ["data","length","capacity"];
(vec_int_t as any).__fieldOffsets = [0,8,12];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class vec_char_t {
  data: string;
  length: number;
  capacity: number;
  constructor() {
    this.data = null;
    this.length = 0;
    this.capacity = 0;
  }
}
(vec_char_t as any).__fieldTypes = ["int64","int32","int32"];
(vec_char_t as any).__fieldNames = ["data","length","capacity"];
(vec_char_t as any).__fieldOffsets = [0,8,12];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class vec_float_t {
  data: number | null;
  length: number;
  capacity: number;
  constructor() {
    this.data = null;
    this.length = 0;
    this.capacity = 0;
  }
}
(vec_float_t as any).__fieldTypes = ["float","int32","int32"];
(vec_float_t as any).__fieldNames = ["data","length","capacity"];
(vec_float_t as any).__fieldOffsets = [0,8,12];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class vec_double_t {
  data: number | null;
  length: number;
  capacity: number;
  constructor() {
    this.data = null;
    this.length = 0;
    this.capacity = 0;
  }
}
(vec_double_t as any).__fieldTypes = ["double","int32","int32"];
(vec_double_t as any).__fieldNames = ["data","length","capacity"];
(vec_double_t as any).__fieldOffsets = [0,8,12];

export function vec_expand_(data: { value: string }, length: number | null, capacity: { value: number }, memsz: number): number {
  if (i32(cptr_read_int32(length) + 1) > capacity.value) {
    let ptr = null;
    let n = ((capacity.value == 0) ? 1 : ((capacity.value << 1) | 0));
    ptr = realloc(data.value, Math.imul(n, memsz));
    if (cptr_eq(ptr, (null))) {
      return -1;
    }
    data.value = ptr;
    (() => { const __p: any = (capacity); const __v: any = (n); if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
  }
  return 0;
}

export function vec_reserve_(data: { value: string }, length: number | null, capacity: { value: number }, memsz: number, n: number): number {
  (length);
  if (n > capacity.value) {
    let ptr = realloc(data.value, Math.imul(n, memsz)); /* &ref */
    if (cptr_eq(ptr, (null))) {
      return -1;
    }
    data.value = ptr;
    (() => { const __p: any = (capacity); const __v: any = (n); if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
  }
  return 0;
}

export function vec_reserve_po2_(data: { value: string }, length: number | null, capacity: { value: number }, memsz: number, n: number): number {
  let n2 = 1;
  if (n == 0) {
    return 0;
  }
  while (n2 < n) {
    n2 <<= 1;
  }
  return vec_reserve_(data, length, capacity, memsz, n2);
}

export function vec_compact_(data: { value: string }, length: number | null, capacity: { value: number }, memsz: number): number {
  if (cptr_read_int32(length) == 0) {
    free(data.value);
    data.value = null;
    (() => { const __p: any = (capacity); const __v: any = (0); if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return 0;
  } else {
    let ptr = null;
    let n = cptr_read_int32(length);
    ptr = realloc(data.value, Math.imul(n, memsz));
    if (cptr_eq(ptr, (null))) {
      return -1;
    }
    (() => { const __p: any = (capacity); const __v: any = (n); if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    data.value = ptr;
  }
  return 0;
}

export function vec_insert_(data: { value: string }, length: number | null, capacity: { value: number }, memsz: number, idx: number): number {
  let err = vec_expand_(data, length, capacity, memsz);
  if (err) {
    return err;
  }
  memmove(cptr_offset(data.value, Math.imul((i32(idx + 1)), memsz)), cptr_offset(data.value, Math.imul(idx, memsz)), Math.imul((i32(cptr_read_int32(length) - idx)), memsz));
  return 0;
}

export function vec_splice_(data: { value: string }, length: number | null, capacity: number | null, memsz: number, start: number, count: number): void {
  (capacity);
  memmove(cptr_offset(data.value, Math.imul(start, memsz)), cptr_offset(data.value, Math.imul((i32(start + count)), memsz)), Math.imul((i32(i32(cptr_read_int32(length) - start) - count)), memsz));
}

export function vec_swapsplice_(data: { value: string }, length: number | null, capacity: number | null, memsz: number, start: number, count: number): void {
  (capacity);
  memmove(cptr_offset(data.value, Math.imul(start, memsz)), cptr_offset(data.value, Math.imul((i32(cptr_read_int32(length) - count)), memsz)), Math.imul(count, memsz));
}

export function vec_swap_(data: { value: string }, length: number | null, capacity: number | null, memsz: number, idx1: number, idx2: number): void {
  let a = null;
  let b = null;
  let tmp = 0;
  let count = 0;
  (length);
  (capacity);
  if (idx1 == idx2) {
    return;
  }
  a = cptr_offset((data.value), Math.imul(idx1, memsz));
  b = cptr_offset((data.value), Math.imul(idx2, memsz));
  count = memsz;
  while (count--) {
    tmp = (((a.buf[a.off]) & 0xFF)) & 0xFF;
    a.buf[a.off] = (((b.buf[b.off]) & 0xFF)) & 0xFF;
    b.buf[b.off] = (((tmp) & 0xFF)) & 0xFF;
    a.off++;
    b.off++;
  }
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class vec_uint_t {
  data: number | null;
  length: number;
  capacity: number;
  constructor() {
    this.data = null;
    this.length = 0;
    this.capacity = 0;
  }
}
(vec_uint_t as any).__fieldTypes = ["int64","int32","int32"];
(vec_uint_t as any).__fieldNames = ["data","length","capacity"];
(vec_uint_t as any).__fieldOffsets = [0,8,12];

function int_cmp(a: any | null, b: any | null): number {
  let x = cptr_read_int32((a));
  let y = cptr_read_int32((b));
  return i32((x > y) - (x < y));
}

function uint_cmp(a: any | null, b: any | null): number {
  let x = ((cptr_read_uint32((a))) >>> 0);
  let y = ((cptr_read_uint32((b))) >>> 0);
  return i32((((x) >>> 0) > ((y) >>> 0)) - (((x) >>> 0) < ((y) >>> 0)));
}

function double_cmp(a: any | null, b: any | null): number {
  let x = cptr_read_float64((a));
  let y = cptr_read_float64((b));
  return i32((x > y) - (x < y));
}

function float_cmp(a: any | null, b: any | null): number {
  let x = cptr_read_float32((a));
  let y = cptr_read_float32((b));
  return i32((x > y) - (x < y));
}

function str_cmp(a: any | null, b: any | null): number {
  let x = (a).buf[(a).off]; /* &ref */
  let y = (b).buf[(b).off]; /* &ref */
  return strcmp(cptr_clone(x), cptr_clone(y));
}

export function rxi_vec_int_init(v: vec_int_t | null): void {
  memset((v), 0, 16);
}

export function rxi_vec_int_deinit(v: vec_int_t | null): void {
  free((__struct_ptr_at((v), 0)).data);
  memset((v), 0, 16);
}

export function rxi_vec_int_push(v: vec_int_t | null, x: number): number {
  return (((): any => { (vec_expand_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "capacity", 12), 4) ? -1 : (((): any => { cptr_write_int32((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, (x)); return 0; })())); return 0; })());
}

export function rxi_vec_int_pop(v: vec_int_t | null): number {
  return cptr_read_int32((__struct_ptr_at((v), 0)).data, --(__struct_ptr_at((v), 0)).length);
}

export function rxi_vec_int_length(v: vec_int_t | null): number {
  return (__struct_ptr_at(v, 0)).length;
}

export function rxi_vec_int_capacity(v: vec_int_t | null): number {
  return (__struct_ptr_at(v, 0)).capacity;
}

export function rxi_vec_int_get(v: vec_int_t | null, i: number): number {
  return cptr_read_int32((__struct_ptr_at(v, 0)).data, i);
}

export function rxi_vec_int_set(v: vec_int_t | null, i: number, x: number): void {
  cptr_write_int32((__struct_ptr_at(v, 0)).data, i, x);
}

export function rxi_vec_int_first(v: vec_int_t | null): number {
  return cptr_read_int32((__struct_ptr_at((v), 0)).data, 0);
}

export function rxi_vec_int_last(v: vec_int_t | null): number {
  return cptr_read_int32((__struct_ptr_at((v), 0)).data, i32((__struct_ptr_at((v), 0)).length - 1));
}

export function rxi_vec_int_insert(v: vec_int_t | null, idx: number, x: number): number {
  return (((): any => { ((): any => { (vec_insert_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "capacity", 12), 4, idx) ? -1 : (((): any => { cptr_write_int32((__struct_ptr_at((v), 0)).data, idx, (x)); return 0; })())); return (__struct_ptr_at((v), 0)).length++; })(); return 0; })());
}

export function rxi_vec_int_splice(v: vec_int_t | null, start: number, count: number): void {
  vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "capacity", 12), 4, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_int_swapsplice(v: vec_int_t | null, start: number, count: number): void {
  vec_swapsplice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "capacity", 12), 4, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_int_swap(v: vec_int_t | null, idx1: number, idx2: number): void {
  vec_swap_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "capacity", 12), 4, idx1, idx2);
}

export function rxi_vec_int_truncate(v: vec_int_t | null, len: number): void {
  ((__struct_ptr_at((v), 0)).length = ((len) < (__struct_ptr_at((v), 0)).length ? (len) : (__struct_ptr_at((v), 0)).length));
}

export function rxi_vec_int_clear(v: vec_int_t | null): void {
  ((__struct_ptr_at((v), 0)).length = 0);
}

export function rxi_vec_int_reserve(v: vec_int_t | null, n: number): number {
  return vec_reserve_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "capacity", 12), 4, n);
}

export function rxi_vec_int_compact(v: vec_int_t | null): number {
  return vec_compact_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "capacity", 12), 4);
}

export function rxi_vec_int_pusharr(v: vec_int_t | null, arr: number | null, n: number): void {
  do {
    let i__ = 0;
    let n__ = (n);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "capacity", 12), 4, i32((__struct_ptr_at((v), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_int32((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, cptr_read_int32((arr), i__));
    }
  } while (0);
}

export function rxi_vec_int_extend(v: vec_int_t | null, v2: vec_int_t | null): void {
  do {
    let i__ = 0;
    let n__ = ((__struct_ptr_at((v2), 0)).length);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_int_t", "capacity", 12), 4, i32((__struct_ptr_at(((v)), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_int32((__struct_ptr_at(((v)), 0)).data, (__struct_ptr_at(((v)), 0)).length++, cptr_read_int32(((__struct_ptr_at((v2), 0)).data), i__));
    }
  } while (0);
}

export function rxi_vec_int_find(v: vec_int_t | null, x: number): number {
  let idx = 0;
  do {
    for ((idx) = 0; (idx) < (__struct_ptr_at((v), 0)).length; (idx)++) {
      if (cptr_read_int32((__struct_ptr_at((v), 0)).data, (idx)) == (x)) {
        break;
      }
    }
    if ((idx) == (__struct_ptr_at((v), 0)).length) {
      (idx) = -1;
    }
  } while (0);
  return idx;
}

export function rxi_vec_int_remove(v: vec_int_t | null, x: number): void {
  do {
    let idx__ = 0;
    do {
      for ((idx__) = 0; (idx__) < (__struct_ptr_at((v), 0)).length; (idx__)++) {
        if (cptr_read_int32((__struct_ptr_at((v), 0)).data, (idx__)) == (x)) {
          break;
        }
      }
      if ((idx__) == (__struct_ptr_at((v), 0)).length) {
        (idx__) = -1;
      }
    } while (0);
    if (idx__ != -1) {
      vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_int_t", "capacity", 12), 4, idx__, 1);
      (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (1));
    }
  } while (0);
}

export function rxi_vec_int_reverse(v: vec_int_t | null): void {
  do {
    let i__ = __safe_div((__struct_ptr_at((v), 0)).length, 2);
    while (i__--) {
      vec_swap_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_int_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_int_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_int_t", "capacity", 12), 4, i__, i32((__struct_ptr_at((v), 0)).length - (i32(i__ + 1))));
    }
  } while (0);
}

export function rxi_vec_int_sort(v: vec_int_t | null): void {
  qsort((__struct_ptr_at((v), 0)).data, (((__struct_ptr_at((v), 0)).length) >>> 0), 4, int_cmp);
}

export function rxi_vec_int_sum(v: vec_int_t | null): number {
  let sum = 0;
  let x = 0;
  let i = 0;
  if ((__struct_ptr_at((v), 0)).length > 0) {
    for ((i) = 0; (((i) < (__struct_ptr_at((v), 0)).length && (((): any => { ((x) = cptr_read_int32((__struct_ptr_at((v), 0)).data, (i))); return 1; })())) ? 1 : 0); ++(i)) {
      sum = i32(sum + x);
    }
  }
  return sum;
}

export function rxi_vec_int_sum_rev(v: vec_int_t | null): number {
  let sum = 0;
  let x = 0;
  let i = 0;
  if ((__struct_ptr_at((v), 0)).length > 0) {
    for ((i) = i32((__struct_ptr_at((v), 0)).length - 1); (((i) >= 0 && (((): any => { ((x) = cptr_read_int32((__struct_ptr_at((v), 0)).data, (i))); return 1; })())) ? 1 : 0); --(i)) {
      sum = i32(sum + x);
    }
  }
  return sum;
}

export function rxi_vec_uint_init(v: vec_uint_t | null): void {
  memset((v), 0, 16);
}

export function rxi_vec_uint_deinit(v: vec_uint_t | null): void {
  free((__struct_ptr_at((v), 0)).data);
  memset((v), 0, 16);
}

export function rxi_vec_uint_push(v: vec_uint_t | null, x: number): number {
  return (((): any => { (vec_expand_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "capacity", 12), 4) ? -1 : (((): any => { cptr_write_uint32((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, (((x)) >>> 0)); return 0; })())); return 0; })());
}

export function rxi_vec_uint_pop(v: vec_uint_t | null): number {
  return ((cptr_read_uint32((__struct_ptr_at((v), 0)).data, --(__struct_ptr_at((v), 0)).length)) >>> 0);
}

export function rxi_vec_uint_length(v: vec_uint_t | null): number {
  return (__struct_ptr_at(v, 0)).length;
}

export function rxi_vec_uint_capacity(v: vec_uint_t | null): number {
  return (__struct_ptr_at(v, 0)).capacity;
}

export function rxi_vec_uint_get(v: vec_uint_t | null, i: number): number {
  return ((cptr_read_uint32((__struct_ptr_at(v, 0)).data, i)) >>> 0);
}

export function rxi_vec_uint_set(v: vec_uint_t | null, i: number, x: number): void {
  cptr_write_uint32((__struct_ptr_at(v, 0)).data, i, ((x) >>> 0));
}

export function rxi_vec_uint_first(v: vec_uint_t | null): number {
  return ((cptr_read_uint32((__struct_ptr_at((v), 0)).data, 0)) >>> 0);
}

export function rxi_vec_uint_last(v: vec_uint_t | null): number {
  return ((cptr_read_uint32((__struct_ptr_at((v), 0)).data, i32((__struct_ptr_at((v), 0)).length - 1))) >>> 0);
}

export function rxi_vec_uint_insert(v: vec_uint_t | null, idx: number, x: number): number {
  return (((): any => { ((): any => { (vec_insert_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "capacity", 12), 4, idx) ? -1 : (((): any => { cptr_write_uint32((__struct_ptr_at((v), 0)).data, idx, (((x)) >>> 0)); return 0; })())); return (__struct_ptr_at((v), 0)).length++; })(); return 0; })());
}

export function rxi_vec_uint_splice(v: vec_uint_t | null, start: number, count: number): void {
  vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "capacity", 12), 4, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_uint_swapsplice(v: vec_uint_t | null, start: number, count: number): void {
  vec_swapsplice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "capacity", 12), 4, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_uint_swap(v: vec_uint_t | null, idx1: number, idx2: number): void {
  vec_swap_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "capacity", 12), 4, idx1, idx2);
}

export function rxi_vec_uint_truncate(v: vec_uint_t | null, len: number): void {
  ((__struct_ptr_at((v), 0)).length = ((len) < (__struct_ptr_at((v), 0)).length ? (len) : (__struct_ptr_at((v), 0)).length));
}

export function rxi_vec_uint_clear(v: vec_uint_t | null): void {
  ((__struct_ptr_at((v), 0)).length = 0);
}

export function rxi_vec_uint_reserve(v: vec_uint_t | null, n: number): number {
  return vec_reserve_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "capacity", 12), 4, n);
}

export function rxi_vec_uint_compact(v: vec_uint_t | null): number {
  return vec_compact_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "capacity", 12), 4);
}

export function rxi_vec_uint_pusharr(v: vec_uint_t | null, arr: number | null, n: number): void {
  do {
    let i__ = 0;
    let n__ = (n);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "capacity", 12), 4, i32((__struct_ptr_at((v), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_uint32((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, ((cptr_read_uint32((arr), i__)) >>> 0));
    }
  } while (0);
}

export function rxi_vec_uint_extend(v: vec_uint_t | null, v2: vec_uint_t | null): void {
  do {
    let i__ = 0;
    let n__ = ((__struct_ptr_at((v2), 0)).length);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_uint_t", "capacity", 12), 4, i32((__struct_ptr_at(((v)), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_uint32((__struct_ptr_at(((v)), 0)).data, (__struct_ptr_at(((v)), 0)).length++, ((cptr_read_uint32(((__struct_ptr_at((v2), 0)).data), i__)) >>> 0));
    }
  } while (0);
}

export function rxi_vec_uint_find(v: vec_uint_t | null, x: number): number {
  let idx = 0;
  do {
    for ((idx) = 0; (idx) < (__struct_ptr_at((v), 0)).length; (idx)++) {
      if (((cptr_read_uint32((__struct_ptr_at((v), 0)).data, (idx))) >>> 0) == (((x)) >>> 0)) {
        break;
      }
    }
    if ((idx) == (__struct_ptr_at((v), 0)).length) {
      (idx) = -1;
    }
  } while (0);
  return idx;
}

export function rxi_vec_uint_remove(v: vec_uint_t | null, x: number): void {
  do {
    let idx__ = 0;
    do {
      for ((idx__) = 0; (idx__) < (__struct_ptr_at((v), 0)).length; (idx__)++) {
        if (((cptr_read_uint32((__struct_ptr_at((v), 0)).data, (idx__))) >>> 0) == (((x)) >>> 0)) {
          break;
        }
      }
      if ((idx__) == (__struct_ptr_at((v), 0)).length) {
        (idx__) = -1;
      }
    } while (0);
    if (idx__ != -1) {
      vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_uint_t", "capacity", 12), 4, idx__, 1);
      (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (1));
    }
  } while (0);
}

export function rxi_vec_uint_reverse(v: vec_uint_t | null): void {
  do {
    let i__ = __safe_div((__struct_ptr_at((v), 0)).length, 2);
    while (i__--) {
      vec_swap_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_uint_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_uint_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_uint_t", "capacity", 12), 4, i__, i32((__struct_ptr_at((v), 0)).length - (i32(i__ + 1))));
    }
  } while (0);
}

export function rxi_vec_uint_sort(v: vec_uint_t | null): void {
  qsort((__struct_ptr_at((v), 0)).data, (((__struct_ptr_at((v), 0)).length) >>> 0), 4, uint_cmp);
}

export function rxi_vec_double_init(v: vec_double_t | null): void {
  memset((v), 0, 16);
}

export function rxi_vec_double_deinit(v: vec_double_t | null): void {
  free((__struct_ptr_at((v), 0)).data);
  memset((v), 0, 16);
}

export function rxi_vec_double_push(v: vec_double_t | null, x: number): number {
  return (((): any => { (vec_expand_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "capacity", 12), 8) ? -1 : (((): any => { cptr_write_float64((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, (x)); return 0; })())); return 0; })());
}

export function rxi_vec_double_pop(v: vec_double_t | null): number {
  return cptr_read_float64((__struct_ptr_at((v), 0)).data, --(__struct_ptr_at((v), 0)).length);
}

export function rxi_vec_double_length(v: vec_double_t | null): number {
  return (__struct_ptr_at(v, 0)).length;
}

export function rxi_vec_double_capacity(v: vec_double_t | null): number {
  return (__struct_ptr_at(v, 0)).capacity;
}

export function rxi_vec_double_get(v: vec_double_t | null, i: number): number {
  return cptr_read_float64((__struct_ptr_at(v, 0)).data, i);
}

export function rxi_vec_double_set(v: vec_double_t | null, i: number, x: number): void {
  cptr_write_float64((__struct_ptr_at(v, 0)).data, i, x);
}

export function rxi_vec_double_first(v: vec_double_t | null): number {
  return cptr_read_float64((__struct_ptr_at((v), 0)).data, 0);
}

export function rxi_vec_double_last(v: vec_double_t | null): number {
  return cptr_read_float64((__struct_ptr_at((v), 0)).data, i32((__struct_ptr_at((v), 0)).length - 1));
}

export function rxi_vec_double_insert(v: vec_double_t | null, idx: number, x: number): number {
  return (((): any => { ((): any => { (vec_insert_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "capacity", 12), 8, idx) ? -1 : (((): any => { cptr_write_float64((__struct_ptr_at((v), 0)).data, idx, (x)); return 0; })())); return (__struct_ptr_at((v), 0)).length++; })(); return 0; })());
}

export function rxi_vec_double_splice(v: vec_double_t | null, start: number, count: number): void {
  vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "capacity", 12), 8, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_double_swapsplice(v: vec_double_t | null, start: number, count: number): void {
  vec_swapsplice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "capacity", 12), 8, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_double_swap(v: vec_double_t | null, idx1: number, idx2: number): void {
  vec_swap_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "capacity", 12), 8, idx1, idx2);
}

export function rxi_vec_double_truncate(v: vec_double_t | null, len: number): void {
  ((__struct_ptr_at((v), 0)).length = ((len) < (__struct_ptr_at((v), 0)).length ? (len) : (__struct_ptr_at((v), 0)).length));
}

export function rxi_vec_double_clear(v: vec_double_t | null): void {
  ((__struct_ptr_at((v), 0)).length = 0);
}

export function rxi_vec_double_reserve(v: vec_double_t | null, n: number): number {
  return vec_reserve_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "capacity", 12), 8, n);
}

export function rxi_vec_double_compact(v: vec_double_t | null): number {
  return vec_compact_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "capacity", 12), 8);
}

export function rxi_vec_double_pusharr(v: vec_double_t | null, arr: number | null, n: number): void {
  do {
    let i__ = 0;
    let n__ = (n);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "capacity", 12), 8, i32((__struct_ptr_at((v), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_float64((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, cptr_read_float64((arr), i__));
    }
  } while (0);
}

export function rxi_vec_double_extend(v: vec_double_t | null, v2: vec_double_t | null): void {
  do {
    let i__ = 0;
    let n__ = ((__struct_ptr_at((v2), 0)).length);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_double_t", "capacity", 12), 8, i32((__struct_ptr_at(((v)), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_float64((__struct_ptr_at(((v)), 0)).data, (__struct_ptr_at(((v)), 0)).length++, cptr_read_float64(((__struct_ptr_at((v2), 0)).data), i__));
    }
  } while (0);
}

export function rxi_vec_double_find(v: vec_double_t | null, x: number): number {
  let idx = 0;
  do {
    for ((idx) = 0; (idx) < (__struct_ptr_at((v), 0)).length; (idx)++) {
      if (cptr_read_float64((__struct_ptr_at((v), 0)).data, (idx)) == (x)) {
        break;
      }
    }
    if ((idx) == (__struct_ptr_at((v), 0)).length) {
      (idx) = -1;
    }
  } while (0);
  return idx;
}

export function rxi_vec_double_remove(v: vec_double_t | null, x: number): void {
  do {
    let idx__ = 0;
    do {
      for ((idx__) = 0; (idx__) < (__struct_ptr_at((v), 0)).length; (idx__)++) {
        if (cptr_read_float64((__struct_ptr_at((v), 0)).data, (idx__)) == (x)) {
          break;
        }
      }
      if ((idx__) == (__struct_ptr_at((v), 0)).length) {
        (idx__) = -1;
      }
    } while (0);
    if (idx__ != -1) {
      vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_double_t", "capacity", 12), 8, idx__, 1);
      (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (1));
    }
  } while (0);
}

export function rxi_vec_double_reverse(v: vec_double_t | null): void {
  do {
    let i__ = __safe_div((__struct_ptr_at((v), 0)).length, 2);
    while (i__--) {
      vec_swap_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_double_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_double_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_double_t", "capacity", 12), 8, i__, i32((__struct_ptr_at((v), 0)).length - (i32(i__ + 1))));
    }
  } while (0);
}

export function rxi_vec_double_sort(v: vec_double_t | null): void {
  qsort((__struct_ptr_at((v), 0)).data, (((__struct_ptr_at((v), 0)).length) >>> 0), 8, double_cmp);
}

export function rxi_vec_double_sum(v: vec_double_t | null): number {
  let sum = 0;
  let x = 0.0;
  let i = 0;
  if ((__struct_ptr_at((v), 0)).length > 0) {
    for ((i) = 0; (((i) < (__struct_ptr_at((v), 0)).length && (((): any => { ((x) = cptr_read_float64((__struct_ptr_at((v), 0)).data, (i))); return 1; })())) ? 1 : 0); ++(i)) {
      sum += x;
    }
  }
  return sum;
}

export function rxi_vec_float_init(v: vec_float_t | null): void {
  memset((v), 0, 16);
}

export function rxi_vec_float_deinit(v: vec_float_t | null): void {
  free((__struct_ptr_at((v), 0)).data);
  memset((v), 0, 16);
}

export function rxi_vec_float_push(v: vec_float_t | null, x: number): number {
  return (((): any => { (vec_expand_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "capacity", 12), 4) ? -1 : (((): any => { cptr_write_float32((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, (x)); return 0; })())); return 0; })());
}

export function rxi_vec_float_pop(v: vec_float_t | null): number {
  return cptr_read_float32((__struct_ptr_at((v), 0)).data, --(__struct_ptr_at((v), 0)).length);
}

export function rxi_vec_float_length(v: vec_float_t | null): number {
  return (__struct_ptr_at(v, 0)).length;
}

export function rxi_vec_float_capacity(v: vec_float_t | null): number {
  return (__struct_ptr_at(v, 0)).capacity;
}

export function rxi_vec_float_get(v: vec_float_t | null, i: number): number {
  return cptr_read_float32((__struct_ptr_at(v, 0)).data, i);
}

export function rxi_vec_float_set(v: vec_float_t | null, i: number, x: number): void {
  cptr_write_float32((__struct_ptr_at(v, 0)).data, i, x);
}

export function rxi_vec_float_first(v: vec_float_t | null): number {
  return cptr_read_float32((__struct_ptr_at((v), 0)).data, 0);
}

export function rxi_vec_float_last(v: vec_float_t | null): number {
  return cptr_read_float32((__struct_ptr_at((v), 0)).data, i32((__struct_ptr_at((v), 0)).length - 1));
}

export function rxi_vec_float_insert(v: vec_float_t | null, idx: number, x: number): number {
  return (((): any => { ((): any => { (vec_insert_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "capacity", 12), 4, idx) ? -1 : (((): any => { cptr_write_float32((__struct_ptr_at((v), 0)).data, idx, (x)); return 0; })())); return (__struct_ptr_at((v), 0)).length++; })(); return 0; })());
}

export function rxi_vec_float_splice(v: vec_float_t | null, start: number, count: number): void {
  vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "capacity", 12), 4, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_float_swapsplice(v: vec_float_t | null, start: number, count: number): void {
  vec_swapsplice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "capacity", 12), 4, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_float_swap(v: vec_float_t | null, idx1: number, idx2: number): void {
  vec_swap_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "capacity", 12), 4, idx1, idx2);
}

export function rxi_vec_float_truncate(v: vec_float_t | null, len: number): void {
  ((__struct_ptr_at((v), 0)).length = ((len) < (__struct_ptr_at((v), 0)).length ? (len) : (__struct_ptr_at((v), 0)).length));
}

export function rxi_vec_float_clear(v: vec_float_t | null): void {
  ((__struct_ptr_at((v), 0)).length = 0);
}

export function rxi_vec_float_reserve(v: vec_float_t | null, n: number): number {
  return vec_reserve_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "capacity", 12), 4, n);
}

export function rxi_vec_float_compact(v: vec_float_t | null): number {
  return vec_compact_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "capacity", 12), 4);
}

export function rxi_vec_float_pusharr(v: vec_float_t | null, arr: number | null, n: number): void {
  do {
    let i__ = 0;
    let n__ = (n);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "capacity", 12), 4, i32((__struct_ptr_at((v), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_float32((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, cptr_read_float32((arr), i__));
    }
  } while (0);
}

export function rxi_vec_float_extend(v: vec_float_t | null, v2: vec_float_t | null): void {
  do {
    let i__ = 0;
    let n__ = ((__struct_ptr_at((v2), 0)).length);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_float_t", "capacity", 12), 4, i32((__struct_ptr_at(((v)), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_float32((__struct_ptr_at(((v)), 0)).data, (__struct_ptr_at(((v)), 0)).length++, cptr_read_float32(((__struct_ptr_at((v2), 0)).data), i__));
    }
  } while (0);
}

export function rxi_vec_float_find(v: vec_float_t | null, x: number): number {
  let idx = 0;
  do {
    for ((idx) = 0; (idx) < (__struct_ptr_at((v), 0)).length; (idx)++) {
      if (cptr_read_float32((__struct_ptr_at((v), 0)).data, (idx)) == (x)) {
        break;
      }
    }
    if ((idx) == (__struct_ptr_at((v), 0)).length) {
      (idx) = -1;
    }
  } while (0);
  return idx;
}

export function rxi_vec_float_remove(v: vec_float_t | null, x: number): void {
  do {
    let idx__ = 0;
    do {
      for ((idx__) = 0; (idx__) < (__struct_ptr_at((v), 0)).length; (idx__)++) {
        if (cptr_read_float32((__struct_ptr_at((v), 0)).data, (idx__)) == (x)) {
          break;
        }
      }
      if ((idx__) == (__struct_ptr_at((v), 0)).length) {
        (idx__) = -1;
      }
    } while (0);
    if (idx__ != -1) {
      vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_float_t", "capacity", 12), 4, idx__, 1);
      (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (1));
    }
  } while (0);
}

export function rxi_vec_float_reverse(v: vec_float_t | null): void {
  do {
    let i__ = __safe_div((__struct_ptr_at((v), 0)).length, 2);
    while (i__--) {
      vec_swap_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_float_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_float_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_float_t", "capacity", 12), 4, i__, i32((__struct_ptr_at((v), 0)).length - (i32(i__ + 1))));
    }
  } while (0);
}

export function rxi_vec_float_sort(v: vec_float_t | null): void {
  qsort((__struct_ptr_at((v), 0)).data, (((__struct_ptr_at((v), 0)).length) >>> 0), 4, float_cmp);
}

export function rxi_vec_str_init(v: vec_str_t | null): void {
  memset((v), 0, 16);
}

export function rxi_vec_str_deinit(v: vec_str_t | null): void {
  free((__struct_ptr_at((v), 0)).data);
  memset((v), 0, 16);
}

export function rxi_vec_str_push(v: vec_str_t | null, x: string): number {
  return (((): any => { (vec_expand_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "capacity", 12), 8) ? -1 : (((): any => { cptr_write_ptr((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, (x)); return 0; })())); return 0; })());
}

export function rxi_vec_str_pop(v: vec_str_t | null): CPtr {
  return cptr_clone(cptr_read_ptr((__struct_ptr_at((v), 0)).data, --(__struct_ptr_at((v), 0)).length));
}

export function rxi_vec_str_length(v: vec_str_t | null): number {
  return (__struct_ptr_at(v, 0)).length;
}

export function rxi_vec_str_capacity(v: vec_str_t | null): number {
  return (__struct_ptr_at(v, 0)).capacity;
}

export function rxi_vec_str_get(v: vec_str_t | null, i: number): CPtr {
  return cptr_clone(cptr_read_ptr((__struct_ptr_at(v, 0)).data, i));
}

export function rxi_vec_str_set(v: vec_str_t | null, i: number, x: string): void {
  cptr_write_ptr((__struct_ptr_at(v, 0)).data, i, x);
}

export function rxi_vec_str_first(v: vec_str_t | null): CPtr {
  return cptr_clone(cptr_read_ptr((__struct_ptr_at((v), 0)).data, 0));
}

export function rxi_vec_str_last(v: vec_str_t | null): CPtr {
  return cptr_clone(cptr_read_ptr((__struct_ptr_at((v), 0)).data, i32((__struct_ptr_at((v), 0)).length - 1)));
}

export function rxi_vec_str_insert(v: vec_str_t | null, idx: number, x: string): number {
  return (((): any => { ((): any => { (vec_insert_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "capacity", 12), 8, idx) ? -1 : (((): any => { cptr_write_ptr((__struct_ptr_at((v), 0)).data, idx, (x)); return 0; })())); return (__struct_ptr_at((v), 0)).length++; })(); return 0; })());
}

export function rxi_vec_str_splice(v: vec_str_t | null, start: number, count: number): void {
  vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "capacity", 12), 8, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_str_swapsplice(v: vec_str_t | null, start: number, count: number): void {
  vec_swapsplice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "capacity", 12), 8, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_str_swap(v: vec_str_t | null, idx1: number, idx2: number): void {
  vec_swap_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "capacity", 12), 8, idx1, idx2);
}

export function rxi_vec_str_truncate(v: vec_str_t | null, len: number): void {
  ((__struct_ptr_at((v), 0)).length = ((len) < (__struct_ptr_at((v), 0)).length ? (len) : (__struct_ptr_at((v), 0)).length));
}

export function rxi_vec_str_clear(v: vec_str_t | null): void {
  ((__struct_ptr_at((v), 0)).length = 0);
}

export function rxi_vec_str_reserve(v: vec_str_t | null, n: number): number {
  return vec_reserve_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "capacity", 12), 8, n);
}

export function rxi_vec_str_compact(v: vec_str_t | null): number {
  return vec_compact_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "capacity", 12), 8);
}

export function rxi_vec_str_pusharr(v: vec_str_t | null, arr: { value: string }, n: number): void {
  do {
    let i__ = 0;
    let n__ = (n);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "capacity", 12), 8, i32((__struct_ptr_at((v), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_ptr((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, cptr_read_ptr((arr), i__));
    }
  } while (0);
}

export function rxi_vec_str_extend(v: vec_str_t | null, v2: vec_str_t | null): void {
  do {
    let i__ = 0;
    let n__ = ((__struct_ptr_at((v2), 0)).length);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_str_t", "capacity", 12), 8, i32((__struct_ptr_at(((v)), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_ptr((__struct_ptr_at(((v)), 0)).data, (__struct_ptr_at(((v)), 0)).length++, cptr_read_ptr(((__struct_ptr_at((v2), 0)).data), i__));
    }
  } while (0);
}

export function rxi_vec_str_find(v: vec_str_t | null, x: string): number {
  let idx = 0;
  do {
    for ((idx) = 0; (idx) < (__struct_ptr_at((v), 0)).length; (idx)++) {
      if (cptr_eq(cptr_read_ptr((__struct_ptr_at((v), 0)).data, (idx)), (x))) {
        break;
      }
    }
    if ((idx) == (__struct_ptr_at((v), 0)).length) {
      (idx) = -1;
    }
  } while (0);
  return idx;
}

export function rxi_vec_str_remove(v: vec_str_t | null, x: string): void {
  do {
    let idx__ = 0;
    do {
      for ((idx__) = 0; (idx__) < (__struct_ptr_at((v), 0)).length; (idx__)++) {
        if (cptr_eq(cptr_read_ptr((__struct_ptr_at((v), 0)).data, (idx__)), (x))) {
          break;
        }
      }
      if ((idx__) == (__struct_ptr_at((v), 0)).length) {
        (idx__) = -1;
      }
    } while (0);
    if (idx__ != -1) {
      vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_str_t", "capacity", 12), 8, idx__, 1);
      (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (1));
    }
  } while (0);
}

export function rxi_vec_str_reverse(v: vec_str_t | null): void {
  do {
    let i__ = __safe_div((__struct_ptr_at((v), 0)).length, 2);
    while (i__--) {
      vec_swap_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_str_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_str_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_str_t", "capacity", 12), 8, i__, i32((__struct_ptr_at((v), 0)).length - (i32(i__ + 1))));
    }
  } while (0);
}

export function rxi_vec_str_sort(v: vec_str_t | null): void {
  qsort((__struct_ptr_at((v), 0)).data, (((__struct_ptr_at((v), 0)).length) >>> 0), 8, str_cmp);
}

export function rxi_vec_void_init(v: vec_void_t | null): void {
  memset((v), 0, 16);
}

export function rxi_vec_void_deinit(v: vec_void_t | null): void {
  free((__struct_ptr_at((v), 0)).data);
  memset((v), 0, 16);
}

export function rxi_vec_void_push(v: vec_void_t | null, x: any | null): number {
  return (((): any => { (vec_expand_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "capacity", 12), 8) ? -1 : (((): any => { cptr_write_ptr((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, (x)); return 0; })())); return 0; })());
}

export function rxi_vec_void_pop(v: vec_void_t | null): any | null {
  return cptr_clone(cptr_read_ptr((__struct_ptr_at((v), 0)).data, --(__struct_ptr_at((v), 0)).length));
}

export function rxi_vec_void_length(v: vec_void_t | null): number {
  return (__struct_ptr_at(v, 0)).length;
}

export function rxi_vec_void_capacity(v: vec_void_t | null): number {
  return (__struct_ptr_at(v, 0)).capacity;
}

export function rxi_vec_void_get(v: vec_void_t | null, i: number): any | null {
  return cptr_clone(cptr_read_ptr((__struct_ptr_at(v, 0)).data, i));
}

export function rxi_vec_void_set(v: vec_void_t | null, i: number, x: any | null): void {
  cptr_write_ptr((__struct_ptr_at(v, 0)).data, i, x);
}

export function rxi_vec_void_first(v: vec_void_t | null): any | null {
  return cptr_clone(cptr_read_ptr((__struct_ptr_at((v), 0)).data, 0));
}

export function rxi_vec_void_last(v: vec_void_t | null): any | null {
  return cptr_clone(cptr_read_ptr((__struct_ptr_at((v), 0)).data, i32((__struct_ptr_at((v), 0)).length - 1)));
}

export function rxi_vec_void_insert(v: vec_void_t | null, idx: number, x: any | null): number {
  return (((): any => { ((): any => { (vec_insert_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "capacity", 12), 8, idx) ? -1 : (((): any => { cptr_write_ptr((__struct_ptr_at((v), 0)).data, idx, (x)); return 0; })())); return (__struct_ptr_at((v), 0)).length++; })(); return 0; })());
}

export function rxi_vec_void_splice(v: vec_void_t | null, start: number, count: number): void {
  vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "capacity", 12), 8, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_void_swapsplice(v: vec_void_t | null, start: number, count: number): void {
  vec_swapsplice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "capacity", 12), 8, start, count);
  (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (count));
}

export function rxi_vec_void_swap(v: vec_void_t | null, idx1: number, idx2: number): void {
  vec_swap_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "capacity", 12), 8, idx1, idx2);
}

export function rxi_vec_void_truncate(v: vec_void_t | null, len: number): void {
  ((__struct_ptr_at((v), 0)).length = ((len) < (__struct_ptr_at((v), 0)).length ? (len) : (__struct_ptr_at((v), 0)).length));
}

export function rxi_vec_void_clear(v: vec_void_t | null): void {
  ((__struct_ptr_at((v), 0)).length = 0);
}

export function rxi_vec_void_reserve(v: vec_void_t | null, n: number): number {
  return vec_reserve_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "capacity", 12), 8, n);
}

export function rxi_vec_void_compact(v: vec_void_t | null): number {
  return vec_compact_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "capacity", 12), 8);
}

export function rxi_vec_void_pusharr(v: vec_void_t | null, arr: { value: any | null }, n: number): void {
  do {
    let i__ = 0;
    let n__ = (n);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "capacity", 12), 8, i32((__struct_ptr_at((v), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_ptr((__struct_ptr_at((v), 0)).data, (__struct_ptr_at((v), 0)).length++, cptr_read_ptr((arr), i__));
    }
  } while (0);
}

export function rxi_vec_void_extend(v: vec_void_t | null, v2: vec_void_t | null): void {
  do {
    let i__ = 0;
    let n__ = ((__struct_ptr_at((v2), 0)).length);
    if (vec_reserve_po2_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_void_t", "capacity", 12), 8, i32((__struct_ptr_at(((v)), 0)).length + n__)) != 0) {
      break;
    }
    for (i__ = 0; i__ < n__; i__++) {
      cptr_write_ptr((__struct_ptr_at(((v)), 0)).data, (__struct_ptr_at(((v)), 0)).length++, cptr_read_ptr(((__struct_ptr_at((v2), 0)).data), i__));
    }
  } while (0);
}

export function rxi_vec_void_find(v: vec_void_t | null, x: any | null): number {
  let idx = 0;
  do {
    for ((idx) = 0; (idx) < (__struct_ptr_at((v), 0)).length; (idx)++) {
      if (cptr_eq(cptr_read_ptr((__struct_ptr_at((v), 0)).data, (idx)), (x))) {
        break;
      }
    }
    if ((idx) == (__struct_ptr_at((v), 0)).length) {
      (idx) = -1;
    }
  } while (0);
  return idx;
}

export function rxi_vec_void_remove(v: vec_void_t | null, x: any | null): void {
  do {
    let idx__ = 0;
    do {
      for ((idx__) = 0; (idx__) < (__struct_ptr_at((v), 0)).length; (idx__)++) {
        if (cptr_eq(cptr_read_ptr((__struct_ptr_at((v), 0)).data, (idx__)), (x))) {
          break;
        }
      }
      if ((idx__) == (__struct_ptr_at((v), 0)).length) {
        (idx__) = -1;
      }
    } while (0);
    if (idx__ != -1) {
      vec_splice_((__field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at((v), 0)), "vec_void_t", "capacity", 12), 8, idx__, 1);
      (__struct_ptr_at((v), 0)).length = i32((__struct_ptr_at((v), 0)).length - (1));
    }
  } while (0);
}

export function rxi_vec_void_reverse(v: vec_void_t | null): void {
  do {
    let i__ = __safe_div((__struct_ptr_at((v), 0)).length, 2);
    while (i__--) {
      vec_swap_((__field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_void_t", "data", 0)), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_void_t", "length", 8), __field_ref_scalar(() => (__struct_ptr_at(((v)), 0)), "vec_void_t", "capacity", 12), 8, i__, i32((__struct_ptr_at((v), 0)).length - (i32(i__ + 1))));
    }
  } while (0);
}

export function test_push_size(): number {
  let v = new vec_int_t();
  memset((v), 0, 16);
  for (let i: number = 0; i < 5; i++) {
    (vec_expand_((__field_ref_scalar(() => v, "vec_int_t", "data", 0)), __field_ref_scalar(() => v, "vec_int_t", "length", 8), __field_ref_scalar(() => v, "vec_int_t", "capacity", 12), 4) ? -1 : (((): any => { cptr_write_int32((v).data, (v).length++, (Math.imul(i, i))); return 0; })()));
    0;
  }
  let sum = 0;
  for (let i: number = 0; i < v.length; i++) {
    sum = i32(sum + cptr_read_int32(v.data, i));
  }
  free((v).data);
  memset((v), 0, 16);
  return sum;
}

export function test_pop(): number {
  let v = new vec_int_t();
  memset((v), 0, 16);
  (vec_expand_((__field_ref_scalar(() => v, "vec_int_t", "data", 0)), __field_ref_scalar(() => v, "vec_int_t", "length", 8), __field_ref_scalar(() => v, "vec_int_t", "capacity", 12), 4) ? -1 : (((): any => { cptr_write_int32((v).data, (v).length++, (10)); return 0; })()));
  0;
  (vec_expand_((__field_ref_scalar(() => v, "vec_int_t", "data", 0)), __field_ref_scalar(() => v, "vec_int_t", "length", 8), __field_ref_scalar(() => v, "vec_int_t", "capacity", 12), 4) ? -1 : (((): any => { cptr_write_int32((v).data, (v).length++, (20)); return 0; })()));
  0;
  (vec_expand_((__field_ref_scalar(() => v, "vec_int_t", "data", 0)), __field_ref_scalar(() => v, "vec_int_t", "length", 8), __field_ref_scalar(() => v, "vec_int_t", "capacity", 12), 4) ? -1 : (((): any => { cptr_write_int32((v).data, (v).length++, (30)); return 0; })()));
  0;
  let top = cptr_read_int32((v).data, --(v).length);
  let len = v.length;
  free((v).data);
  memset((v), 0, 16);
  return i32(Math.imul(top, 100) + len);
}

export function test_length_after_init(): number {
  let v = new vec_int_t();
  memset((v), 0, 16);
  let n = v.length;
  free((v).data);
  memset((v), 0, 16);
  return n;
}

export function rxi_vec_smoke(): number {
  let vi = new vec_int_t();
  memset((vi), 0, 16);
  (vec_expand_((__field_ref_scalar(() => vi, "vec_int_t", "data", 0)), __field_ref_scalar(() => vi, "vec_int_t", "length", 8), __field_ref_scalar(() => vi, "vec_int_t", "capacity", 12), 4) ? -1 : (((): any => { cptr_write_int32((vi).data, (vi).length++, (3)); return 0; })()));
  0;
  (vec_expand_((__field_ref_scalar(() => vi, "vec_int_t", "data", 0)), __field_ref_scalar(() => vi, "vec_int_t", "length", 8), __field_ref_scalar(() => vi, "vec_int_t", "capacity", 12), 4) ? -1 : (((): any => { cptr_write_int32((vi).data, (vi).length++, (1)); return 0; })()));
  0;
  (vec_expand_((__field_ref_scalar(() => vi, "vec_int_t", "data", 0)), __field_ref_scalar(() => vi, "vec_int_t", "length", 8), __field_ref_scalar(() => vi, "vec_int_t", "capacity", 12), 4) ? -1 : (((): any => { cptr_write_int32((vi).data, (vi).length++, (2)); return 0; })()));
  0;
  qsort((vi).data, (((vi).length) >>> 0), 4, int_cmp);
  let s = i32(Math.imul(cptr_read_int32((vi).data, 0), 100) + cptr_read_int32((vi).data, i32((vi).length - 1)));
  free((vi).data);
  memset((vi), 0, 16);
  let vd = new vec_double_t();
  memset((vd), 0, 16);
  (vec_expand_((__field_ref_scalar(() => vd, "vec_double_t", "data", 0)), __field_ref_scalar(() => vd, "vec_double_t", "length", 8), __field_ref_scalar(() => vd, "vec_double_t", "capacity", 12), 8) ? -1 : (((): any => { cptr_write_float64((vd).data, (vd).length++, (1.5)); return 0; })()));
  0;
  (vec_expand_((__field_ref_scalar(() => vd, "vec_double_t", "data", 0)), __field_ref_scalar(() => vd, "vec_double_t", "length", 8), __field_ref_scalar(() => vd, "vec_double_t", "capacity", 12), 8) ? -1 : (((): any => { cptr_write_float64((vd).data, (vd).length++, (2.5)); return 0; })()));
  0;
  let t = cptr_read_float64(vd.data, 0) + cptr_read_float64(vd.data, 1);
  free((vd).data);
  memset((vd), 0, 16);
  return i32(s + (Math.trunc(+(t)) | 0));
}

export function main(): number {
  return (rxi_vec_smoke() == 107 ? 0 : 1);
}

