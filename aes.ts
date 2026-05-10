function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function div(numer: number, denom: number): any { return { quot: Math.trunc(numer / denom), rem: numer % denom }; }
function time(ptr: any): number { const t = Math.floor(Date.now() / 1000); if (ptr) ptr.value = t; return t; }
function realloc(ptr: any, size: any): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 const sz = typeof size === 'bigint' ? Number(size) : Number(size ?? 0); if (ptr && ptr.__cptr_overlay === true) { const cp = ptr.__cptr; ptr = { buf: cp.buf, off: (cp.off ?? 0) + (ptr.__byteOff ?? 0) }; return cptr_realloc(ptr, sz); } if (ptr && typeof ptr === 'object' && !ptr.buf && ptr.constructor && (ptr.constructor as any).__fieldNames) { /* BRIDGE: struct-as-class realloc */ const existing = ptr.__cptr; const newBuf = new Uint8Array(sz); if (existing && existing.buf) { const srcOff = existing.off ?? 0; const copyLen = Math.min(existing.buf.length - srcOff, sz); if (copyLen > 0) newBuf.set(existing.buf.subarray(srcOff, srcOff + copyLen)); } ptr.__cptr = { buf: newBuf, off: 0 }; ptr.__byteOff = 0; return ptr; } return cptr_realloc(ptr, sz); }

// CPtr runtime for C pointer semantics
const __LITTLE_ENDIAN = true;
interface CPtr { buf: Uint8Array; off: number; }
function cptr_create(size: any): any { const n = typeof size === "bigint" ? Number(size) : Number(size ?? 0); return { buf: new Uint8Array(n), off: 0 }; }
function cptr_box_int32(val: number): any { const b = new Uint8Array(4); new DataView(b.buffer).setInt32(0, val, true); return {buf: b, off: 0}; }
function cptr_box_int8(val: number): any { const b = new Uint8Array(1); b[0] = val & 0xFF; return {buf: b, off: 0}; }
function cptr_box_float32(val: number): any { const b = new Uint8Array(4); new DataView(b.buffer).setFloat32(0, val, true); return {buf: b, off: 0}; }
function cptr_box_float64(val: number): any { const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, val, true); return {buf: b, off: 0}; }
function __cptr_cached_array(arr: any, key: any, byteLen: number, writer: (view: DataView, index: number, value: number) => void, elemSize?: number): CPtr {
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
function cptr_from_int_array(arr: number[]): any { return __cptr_cached_array(arr, "__cptr_int32", arr.length * 4, (v, i, x) => v.setInt32(i * 4, x, true), 4); }
function cptr_from_uint32_array(arr: number[]): any { return __cptr_cached_array(arr, "__cptr_uint32", arr.length * 4, (v, i, x) => v.setUint32(i * 4, x >>> 0, true), 4); }
function cptr_from_int16_array(arr: number[]): any { return __cptr_cached_array(arr, "__cptr_int16", arr.length * 2, (v, i, x) => v.setInt16(i * 2, x, true), 2); }
function cptr_from_uint16_array(arr: number[]): any { return __cptr_cached_array(arr, "__cptr_uint16", arr.length * 2, (v, i, x) => v.setUint16(i * 2, x & 0xFFFF, true), 2); }
function cptr_from_int8_array(arr: number[]): any { return __cptr_cached_array(arr, "__cptr_int8", arr.length, (v, i, x) => v.setInt8(i, x), 1); }
function cptr_from_uint8_array(arr: number[]): any { return __cptr_cached_array(arr, "__cptr_uint8", arr.length, (v, i, x) => v.setUint8(i, x & 0xFF), 1); }
function cptr_from_float32_array(arr: number[]): any { return __cptr_cached_array(arr, "__cptr_float32", arr.length * 4, (v, i, x) => v.setFloat32(i * 4, x, true), 4); }
function cptr_from_float64_array(arr: number[]): any { return __cptr_cached_array(arr, "__cptr_float64", arr.length * 8, (v, i, x) => v.setFloat64(i * 8, x, true), 8); }
// C17 §6.2.5 p5 / §7.20: uint64_t / int64_t are exactly 64 bits. Use BigInt accessors
// to preserve full precision through DataView.setBigUint64 / setBigInt64.
function __cptr_cached_array_bigint(arr: any, key: any, byteLen: number, writer: (view: DataView, index: number, value: bigint) => void): CPtr {
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
function cptr_from_uint64_array(arr: any[]): any { return __cptr_cached_array_bigint(arr, "__cptr_uint64", arr.length * 8, (v, i, x) => v.setBigUint64(i * 8, BigInt.asUintN(64, x), true)); }
function cptr_from_int64_array(arr: any[]): any { return __cptr_cached_array_bigint(arr, "__cptr_int64", arr.length * 8, (v, i, x) => v.setBigInt64(i * 8, BigInt.asIntN(64, x), true)); }
function cptr_offset(ptr: any, n: number): any { if (typeof ptr === 'string') { /* C17 §6.5.6 pointer arithmetic chains: s+ls-lp lowers to cptr_offset(cptr_offset(s,ls),-lp). On a JS string the first substring drops absolute position; convert to CPtr so the chain composes. */ const __b = new Uint8Array(ptr.length + 1); for (let __i = 0; __i < ptr.length; __i++) __b[__i] = ptr.charCodeAt(__i); return { buf: __b, off: Number(n) }; } if (ptr && ptr.__field_ref === true) { return { __field_ref: true, __owner: ptr.__owner, __owner_type: ptr.__owner_type, __field_name: ptr.__field_name, __field_offset: ptr.__field_offset, __byte_delta: (ptr.__byte_delta ?? 0) + Number(n) }; } if (ptr && ptr.__field_at_offset === true) { return { __field_at_offset: true, __owner: ptr.__owner, __byte_offset: (ptr.__byte_offset ?? 0) + Number(n) }; } /* BRIDGE: pointer-array — C17 §6.7.6.2 array-of-pointers (T*[N]) decays to T** (§6.3.2.1). When a slot-bearing CPtr (slots+__ptr_arr) is incremented, scale n by 8 (LLP64 sizeof(void*)) so cptr_read_ptr's off>>3 advances slot-by-slot, not byte-by-byte. */ if (ptr?.buf && ptr.__ptr_arr === true) return { buf: ptr.buf, off: (ptr.off ?? 0) + Number(n) * 8, slots: ptr.slots, __ptr_arr: true }; if (ptr?.buf) return { buf: ptr.buf, off: (ptr.off ?? 0) + n, __src_arr: ptr.__src_arr, __src_writer: ptr.__src_writer, __elem_size: ptr.__elem_size, __class_byte_view: ptr.__class_byte_view, __instance: ptr.__instance, __layout: ptr.__layout }; if (Array.isArray(ptr)) { /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: const T *arr[N] init-then-decay produces a T** that survives cptr_offset/cptr_read_ptr. Detect "JS array of pointers" by element shape (CPtr-like {buf,...} or null) and lift to a slot-bearing CPtr. Plain numeric arrays fall through to the int32-DataView path. */ const isPtrArr = ptr.length > 0 && ptr.some((e: any) => e == null || (typeof e === 'object' && (e?.buf || e?.slots))); if (isPtrArr) { return { buf: new Uint8Array(ptr.length * 8), off: Number(n) * 8, slots: ptr.slice(), __ptr_arr: true }; } const b = new Uint8Array(ptr.length * 4); const v = new DataView(b.buffer); for (let i = 0; i < ptr.length; i++) v.setInt32(i * 4, ptr[i], true); return { buf: b, off: n }; } if (ptr && typeof ptr === 'object' && !ptr.__cptr_overlay && !ptr.__arr && ptr.constructor && (ptr.constructor as any).__fieldNames) { return { __field_at_offset: true, __owner: ptr, __byte_offset: Number(n) }; } return ptr; }
// C17 §6.5.16.1: writes through a CPtr derived from a JS array must mirror
// to the source array so subsequent arr[i] reads see the written value.
function __cptr_writeback(ptr: any, byteOff: number): void { const arr = ptr.__src_arr; if (!arr) return; const es = ptr.__elem_size ?? 1; if (byteOff % es !== 0) return; const idx = byteOff / es; if (idx < 0 || idx >= arr.length) return; const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); if (es === 1) arr[idx] = dv.getInt8(byteOff); else if (es === 2) arr[idx] = dv.getInt16(byteOff, true); else if (es === 4) arr[idx] = dv.getInt32(byteOff, true); else if (es === 8) arr[idx] = dv.getFloat64(byteOff, true); }
function cptr_read(ptr: any, i: number = 0): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (Array.isArray(ptr)) return ptr[i]; if (!ptr?.buf) return 0; return ptr.buf[ptr.off + i] ?? 0; }
function cptr_write(ptr: any, i: number, val: number): void {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr?.buf) return; ptr.buf[ptr.off + i] = val & 0xFF; }
function cptr_to_string(ptr: any | null): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr) return ''; const bytes: number[] = []; for (let i = ptr.off; i < ptr.buf.length; i++) { if (ptr.buf[i] === 0) break; bytes.push(ptr.buf[i]); } return String.fromCharCode(...bytes); }
function cptr_from_string(str: any): any { const buf = new Uint8Array(str.length + 1); for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i); buf[str.length] = 0; return { buf, off: 0 }; }
function cptr_strlen(ptr: any | null): number {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr) return 0; let i = 0; while (ptr.off + i < ptr.buf.length && ptr.buf[ptr.off + i] !== 0) i++; return i; }
function cptr_memset(ptr: any, val: number, n: number): void {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 for (let i = 0; i < n; i++) ptr.buf[ptr.off + i] = val & 0xFF; }
function cptr_copy(dst: any, src: any, n: number): void {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
  if (typeof src === 'string') src = cptr_from_string(src);
 for (let i = 0; i < n; i++) dst.buf[dst.off + i] = src.buf[src.off + i] ?? 0; }
function cptr_realloc(ptr: any, newSize: any): any { const sz = typeof newSize === "bigint" ? Number(newSize) : Number(newSize ?? 0); const n = new Uint8Array(sz); if (ptr) { const copyLen = Math.min(ptr.buf.length - ptr.off, sz); n.set(ptr.buf.subarray(ptr.off, ptr.off + copyLen)); } const r: any = { buf: n, off: 0 }; if (ptr && (ptr as any).slots) r.slots = (ptr as any).slots.slice(); return r; }
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
function malloc(size: any): any { return cptr_create(size); }
function memcpy(dst: any, src: any, n: number): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 if (dst?.buf && src?.buf) { cptr_copy(dst, src, n); /* C17 §6.7.6.1: when src is a slot-bearing CPtr (T** array), copy the parallel slot references into dst so pointer identity survives the byte-copy. Slot stride is 8 bytes (LLP64 sizeof(void*)); slot indices align with byte offset >> 3. */ if ((src as any).slots) { const dstAny: any = dst; if (!dstAny.slots) dstAny.slots = []; const srcSlotBase = ((src.off ?? 0) >> 3); const dstSlotBase = ((dst.off ?? 0) >> 3); const slotCount = Math.floor(n / 8); for (let i = 0; i < slotCount; i++) dstAny.slots[dstSlotBase + i] = (src as any).slots[srcSlotBase + i] ?? null; } return dst; } if (dst?.buf && typeof src === 'string') { for (let i = 0; i < n && i < src.length; i++) dst.buf[dst.off + i] = src.charCodeAt(i); return dst; } if (dst?.buf && src && typeof src === 'object' && 'value' in src && typeof src.value === 'number') { const dv = new DataView(dst.buf.buffer, dst.buf.byteOffset + dst.off); if (n >= 4) dv.setInt32(0, src.value, true); else if (n >= 2) dv.setInt16(0, src.value, true); else dv.setInt8(0, src.value); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src?.buf) { /* BRIDGE: memcpy(box, cptr, n) — read N bytes from a CPtr into a {value} box. C17 §7.24.2.1. n=8 → bigint64 (signed). n=4 → int32. n=2 → int16. n=1 → int8. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const off = src.off ?? 0; if (n >= 8) { const bv = dv.getBigInt64(off, true); dst.value = (typeof dst.value === 'bigint') ? bv : Number(bv); } else if (n >= 4) dst.value = dv.getInt32(off, true); else if (n >= 2) dst.value = dv.getInt16(off, true); else dst.value = dv.getInt8(off); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src && typeof src === 'object' && 'value' in src) { /* C17 §6.5 type-pun via memcpy: reinterpret src.value bytes as dst's type. n=4: int32<->float32. n=8: int64<->float64 (via bigint). */ const __b = new Uint8Array(8); const __dv = new DataView(__b.buffer); const __s = src.value; const __d = dst.value; if (n === 4) { if (Number.isInteger(__s) && !Number.isInteger(__d) && typeof __d === 'number') { __dv.setInt32(0, __s | 0, true); dst.value = __dv.getFloat32(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat32(0, __s, true); dst.value = __dv.getInt32(0, true); } else { dst.value = __s; } } else if (n === 8) { if (typeof __s === 'bigint' && typeof __d !== 'bigint') { __dv.setBigInt64(0, __s, true); dst.value = __dv.getFloat64(0, true); } else if (typeof __s !== 'bigint' && typeof __d === 'bigint') { __dv.setFloat64(0, Number(__s), true); dst.value = __dv.getBigInt64(0, true); } else if (Number.isInteger(__s) && !Number.isInteger(__d)) { __dv.setBigInt64(0, BigInt(Math.trunc(__s)), true); dst.value = __dv.getFloat64(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat64(0, __s, true); dst.value = Number(__dv.getBigInt64(0, true)); } else { dst.value = __s; } } else { dst.value = __s; } return dst; } if (Array.isArray(dst) && src && src.buf) { /* BRIDGE: memcpy(Array, CPtr, n) — destination is a JS Array decayed from a struct/array of i64/i32/etc., source is a CPtr backed by a Uint8Array. Read element-wise via DataView using src.__elem_size when available, defaulting to 8 (int64 — covers curve25519 fcontract / fmonty origx<-x and BLAKE2 buffer staging). C17 §7.24.2.1: memcpy copies n bytes; element-size routing is the byte-addressable lowering for an i64 destination. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const baseOff = src.off ?? 0; const elemSize = (src.__elem_size as number) || 8; const count = Math.floor(n / elemSize); for (let i = 0; i < count; i++) { const eoff = baseOff + i * elemSize; if (elemSize === 8) dst[i] = dv.getBigInt64(eoff, true); else if (elemSize === 4) dst[i] = dv.getInt32(eoff, true); else if (elemSize === 2) dst[i] = dv.getInt16(eoff, true); else dst[i] = dv.getInt8(eoff); } return dst; } if (Array.isArray(dst) && Array.isArray(src)) { for (let i = 0; i < n; i++) dst[i] = src[i]; } else if (typeof dst === 'object' && typeof src === 'object') Object.assign(dst, src); return dst; }
// C++20 iterator helpers — shared by <algorithm> / <numeric>.
// Lowering: `v[Symbol.iterator]()` to `v.values()` (C++20 §22.3.11). We patch
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
// within the same range. Lowering: it == __cpp_iter(v, v.length) and similar
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
  // C17 §6.5 p7 + §7.19: inverse-container_of via class-byte-view.
  // When p was produced by `(unsigned char *)container_ptr` followed
  // by `cptr_offset(view, off)` and is now being recast to a struct
  // pointer, route to the live container's field at byte offset `off`
  // — same recovery semantics as the __field_at_offset path. This
  // keeps writes through the resulting pointer propagating to the
  // original container.field instead of dead-ending on the snapshot
  // buffer. Round-trip when off === 0 and T === container's class.
  if (p && p.__class_byte_view === true && p.__instance) {
    const totalOff = (p.off ?? 0) + (byteOff ?? 0);
    const ownerCtor2 = p.__instance.constructor;
    if (totalOff === 0 && T === ownerCtor2) return p.__instance;
    return { __field_at_offset: true, __owner: p.__instance, __byte_offset: totalOff, __cast_target: T };
  }
  // C17 §6.3.2.3 p7 + §7.19: container_of round-trip recovery. If p
  // is a field reference whose accumulated byte_delta exactly cancels
  // its field_offset (`(T*)((char*)&t.m - offsetof(T, m))`), return
  // the containing struct. Otherwise the cast is UB per §6.3.2.3 p7;
  // best-effort: still return owner so misshapen code at least
  // doesn't crash. Future: emit a compile-time diagnostic.
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

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class AES_ctx {
  RoundKey: any = cptr_create(176);
  Iv: any = cptr_create(16);
  constructor() {
    this.RoundKey = cptr_create(176);
    this.Iv = cptr_create(16);
  }
}
(AES_ctx as any).__fieldTypes = ["bytes","bytes"];
(AES_ctx as any).__fieldNames = ["RoundKey","Iv"];
(AES_ctx as any).__fieldOffsets = [0,176];

type state_t = any;
const sbox = (() => { const __b = cptr_create(256); __b.buf[0] = (((99) & 0xFF)) & 0xFF; __b.buf[1] = (((124) & 0xFF)) & 0xFF; __b.buf[2] = (((119) & 0xFF)) & 0xFF; __b.buf[3] = (((123) & 0xFF)) & 0xFF; __b.buf[4] = (((242) & 0xFF)) & 0xFF; __b.buf[5] = (((107) & 0xFF)) & 0xFF; __b.buf[6] = (((111) & 0xFF)) & 0xFF; __b.buf[7] = (((197) & 0xFF)) & 0xFF; __b.buf[8] = (((48) & 0xFF)) & 0xFF; __b.buf[9] = (((1) & 0xFF)) & 0xFF; __b.buf[10] = (((103) & 0xFF)) & 0xFF; __b.buf[11] = (((43) & 0xFF)) & 0xFF; __b.buf[12] = (((254) & 0xFF)) & 0xFF; __b.buf[13] = (((215) & 0xFF)) & 0xFF; __b.buf[14] = (((171) & 0xFF)) & 0xFF; __b.buf[15] = (((118) & 0xFF)) & 0xFF; __b.buf[16] = (((202) & 0xFF)) & 0xFF; __b.buf[17] = (((130) & 0xFF)) & 0xFF; __b.buf[18] = (((201) & 0xFF)) & 0xFF; __b.buf[19] = (((125) & 0xFF)) & 0xFF; __b.buf[20] = (((250) & 0xFF)) & 0xFF; __b.buf[21] = (((89) & 0xFF)) & 0xFF; __b.buf[22] = (((71) & 0xFF)) & 0xFF; __b.buf[23] = (((240) & 0xFF)) & 0xFF; __b.buf[24] = (((173) & 0xFF)) & 0xFF; __b.buf[25] = (((212) & 0xFF)) & 0xFF; __b.buf[26] = (((162) & 0xFF)) & 0xFF; __b.buf[27] = (((175) & 0xFF)) & 0xFF; __b.buf[28] = (((156) & 0xFF)) & 0xFF; __b.buf[29] = (((164) & 0xFF)) & 0xFF; __b.buf[30] = (((114) & 0xFF)) & 0xFF; __b.buf[31] = (((192) & 0xFF)) & 0xFF; __b.buf[32] = (((183) & 0xFF)) & 0xFF; __b.buf[33] = (((253) & 0xFF)) & 0xFF; __b.buf[34] = (((147) & 0xFF)) & 0xFF; __b.buf[35] = (((38) & 0xFF)) & 0xFF; __b.buf[36] = (((54) & 0xFF)) & 0xFF; __b.buf[37] = (((63) & 0xFF)) & 0xFF; __b.buf[38] = (((247) & 0xFF)) & 0xFF; __b.buf[39] = (((204) & 0xFF)) & 0xFF; __b.buf[40] = (((52) & 0xFF)) & 0xFF; __b.buf[41] = (((165) & 0xFF)) & 0xFF; __b.buf[42] = (((229) & 0xFF)) & 0xFF; __b.buf[43] = (((241) & 0xFF)) & 0xFF; __b.buf[44] = (((113) & 0xFF)) & 0xFF; __b.buf[45] = (((216) & 0xFF)) & 0xFF; __b.buf[46] = (((49) & 0xFF)) & 0xFF; __b.buf[47] = (((21) & 0xFF)) & 0xFF; __b.buf[48] = (((4) & 0xFF)) & 0xFF; __b.buf[49] = (((199) & 0xFF)) & 0xFF; __b.buf[50] = (((35) & 0xFF)) & 0xFF; __b.buf[51] = (((195) & 0xFF)) & 0xFF; __b.buf[52] = (((24) & 0xFF)) & 0xFF; __b.buf[53] = (((150) & 0xFF)) & 0xFF; __b.buf[54] = (((5) & 0xFF)) & 0xFF; __b.buf[55] = (((154) & 0xFF)) & 0xFF; __b.buf[56] = (((7) & 0xFF)) & 0xFF; __b.buf[57] = (((18) & 0xFF)) & 0xFF; __b.buf[58] = (((128) & 0xFF)) & 0xFF; __b.buf[59] = (((226) & 0xFF)) & 0xFF; __b.buf[60] = (((235) & 0xFF)) & 0xFF; __b.buf[61] = (((39) & 0xFF)) & 0xFF; __b.buf[62] = (((178) & 0xFF)) & 0xFF; __b.buf[63] = (((117) & 0xFF)) & 0xFF; __b.buf[64] = (((9) & 0xFF)) & 0xFF; __b.buf[65] = (((131) & 0xFF)) & 0xFF; __b.buf[66] = (((44) & 0xFF)) & 0xFF; __b.buf[67] = (((26) & 0xFF)) & 0xFF; __b.buf[68] = (((27) & 0xFF)) & 0xFF; __b.buf[69] = (((110) & 0xFF)) & 0xFF; __b.buf[70] = (((90) & 0xFF)) & 0xFF; __b.buf[71] = (((160) & 0xFF)) & 0xFF; __b.buf[72] = (((82) & 0xFF)) & 0xFF; __b.buf[73] = (((59) & 0xFF)) & 0xFF; __b.buf[74] = (((214) & 0xFF)) & 0xFF; __b.buf[75] = (((179) & 0xFF)) & 0xFF; __b.buf[76] = (((41) & 0xFF)) & 0xFF; __b.buf[77] = (((227) & 0xFF)) & 0xFF; __b.buf[78] = (((47) & 0xFF)) & 0xFF; __b.buf[79] = (((132) & 0xFF)) & 0xFF; __b.buf[80] = (((83) & 0xFF)) & 0xFF; __b.buf[81] = (((209) & 0xFF)) & 0xFF; __b.buf[82] = (((0) & 0xFF)) & 0xFF; __b.buf[83] = (((237) & 0xFF)) & 0xFF; __b.buf[84] = (((32) & 0xFF)) & 0xFF; __b.buf[85] = (((252) & 0xFF)) & 0xFF; __b.buf[86] = (((177) & 0xFF)) & 0xFF; __b.buf[87] = (((91) & 0xFF)) & 0xFF; __b.buf[88] = (((106) & 0xFF)) & 0xFF; __b.buf[89] = (((203) & 0xFF)) & 0xFF; __b.buf[90] = (((190) & 0xFF)) & 0xFF; __b.buf[91] = (((57) & 0xFF)) & 0xFF; __b.buf[92] = (((74) & 0xFF)) & 0xFF; __b.buf[93] = (((76) & 0xFF)) & 0xFF; __b.buf[94] = (((88) & 0xFF)) & 0xFF; __b.buf[95] = (((207) & 0xFF)) & 0xFF; __b.buf[96] = (((208) & 0xFF)) & 0xFF; __b.buf[97] = (((239) & 0xFF)) & 0xFF; __b.buf[98] = (((170) & 0xFF)) & 0xFF; __b.buf[99] = (((251) & 0xFF)) & 0xFF; __b.buf[100] = (((67) & 0xFF)) & 0xFF; __b.buf[101] = (((77) & 0xFF)) & 0xFF; __b.buf[102] = (((51) & 0xFF)) & 0xFF; __b.buf[103] = (((133) & 0xFF)) & 0xFF; __b.buf[104] = (((69) & 0xFF)) & 0xFF; __b.buf[105] = (((249) & 0xFF)) & 0xFF; __b.buf[106] = (((2) & 0xFF)) & 0xFF; __b.buf[107] = (((127) & 0xFF)) & 0xFF; __b.buf[108] = (((80) & 0xFF)) & 0xFF; __b.buf[109] = (((60) & 0xFF)) & 0xFF; __b.buf[110] = (((159) & 0xFF)) & 0xFF; __b.buf[111] = (((168) & 0xFF)) & 0xFF; __b.buf[112] = (((81) & 0xFF)) & 0xFF; __b.buf[113] = (((163) & 0xFF)) & 0xFF; __b.buf[114] = (((64) & 0xFF)) & 0xFF; __b.buf[115] = (((143) & 0xFF)) & 0xFF; __b.buf[116] = (((146) & 0xFF)) & 0xFF; __b.buf[117] = (((157) & 0xFF)) & 0xFF; __b.buf[118] = (((56) & 0xFF)) & 0xFF; __b.buf[119] = (((245) & 0xFF)) & 0xFF; __b.buf[120] = (((188) & 0xFF)) & 0xFF; __b.buf[121] = (((182) & 0xFF)) & 0xFF; __b.buf[122] = (((218) & 0xFF)) & 0xFF; __b.buf[123] = (((33) & 0xFF)) & 0xFF; __b.buf[124] = (((16) & 0xFF)) & 0xFF; __b.buf[125] = (((255) & 0xFF)) & 0xFF; __b.buf[126] = (((243) & 0xFF)) & 0xFF; __b.buf[127] = (((210) & 0xFF)) & 0xFF; __b.buf[128] = (((205) & 0xFF)) & 0xFF; __b.buf[129] = (((12) & 0xFF)) & 0xFF; __b.buf[130] = (((19) & 0xFF)) & 0xFF; __b.buf[131] = (((236) & 0xFF)) & 0xFF; __b.buf[132] = (((95) & 0xFF)) & 0xFF; __b.buf[133] = (((151) & 0xFF)) & 0xFF; __b.buf[134] = (((68) & 0xFF)) & 0xFF; __b.buf[135] = (((23) & 0xFF)) & 0xFF; __b.buf[136] = (((196) & 0xFF)) & 0xFF; __b.buf[137] = (((167) & 0xFF)) & 0xFF; __b.buf[138] = (((126) & 0xFF)) & 0xFF; __b.buf[139] = (((61) & 0xFF)) & 0xFF; __b.buf[140] = (((100) & 0xFF)) & 0xFF; __b.buf[141] = (((93) & 0xFF)) & 0xFF; __b.buf[142] = (((25) & 0xFF)) & 0xFF; __b.buf[143] = (((115) & 0xFF)) & 0xFF; __b.buf[144] = (((96) & 0xFF)) & 0xFF; __b.buf[145] = (((129) & 0xFF)) & 0xFF; __b.buf[146] = (((79) & 0xFF)) & 0xFF; __b.buf[147] = (((220) & 0xFF)) & 0xFF; __b.buf[148] = (((34) & 0xFF)) & 0xFF; __b.buf[149] = (((42) & 0xFF)) & 0xFF; __b.buf[150] = (((144) & 0xFF)) & 0xFF; __b.buf[151] = (((136) & 0xFF)) & 0xFF; __b.buf[152] = (((70) & 0xFF)) & 0xFF; __b.buf[153] = (((238) & 0xFF)) & 0xFF; __b.buf[154] = (((184) & 0xFF)) & 0xFF; __b.buf[155] = (((20) & 0xFF)) & 0xFF; __b.buf[156] = (((222) & 0xFF)) & 0xFF; __b.buf[157] = (((94) & 0xFF)) & 0xFF; __b.buf[158] = (((11) & 0xFF)) & 0xFF; __b.buf[159] = (((219) & 0xFF)) & 0xFF; __b.buf[160] = (((224) & 0xFF)) & 0xFF; __b.buf[161] = (((50) & 0xFF)) & 0xFF; __b.buf[162] = (((58) & 0xFF)) & 0xFF; __b.buf[163] = (((10) & 0xFF)) & 0xFF; __b.buf[164] = (((73) & 0xFF)) & 0xFF; __b.buf[165] = (((6) & 0xFF)) & 0xFF; __b.buf[166] = (((36) & 0xFF)) & 0xFF; __b.buf[167] = (((92) & 0xFF)) & 0xFF; __b.buf[168] = (((194) & 0xFF)) & 0xFF; __b.buf[169] = (((211) & 0xFF)) & 0xFF; __b.buf[170] = (((172) & 0xFF)) & 0xFF; __b.buf[171] = (((98) & 0xFF)) & 0xFF; __b.buf[172] = (((145) & 0xFF)) & 0xFF; __b.buf[173] = (((149) & 0xFF)) & 0xFF; __b.buf[174] = (((228) & 0xFF)) & 0xFF; __b.buf[175] = (((121) & 0xFF)) & 0xFF; __b.buf[176] = (((231) & 0xFF)) & 0xFF; __b.buf[177] = (((200) & 0xFF)) & 0xFF; __b.buf[178] = (((55) & 0xFF)) & 0xFF; __b.buf[179] = (((109) & 0xFF)) & 0xFF; __b.buf[180] = (((141) & 0xFF)) & 0xFF; __b.buf[181] = (((213) & 0xFF)) & 0xFF; __b.buf[182] = (((78) & 0xFF)) & 0xFF; __b.buf[183] = (((169) & 0xFF)) & 0xFF; __b.buf[184] = (((108) & 0xFF)) & 0xFF; __b.buf[185] = (((86) & 0xFF)) & 0xFF; __b.buf[186] = (((244) & 0xFF)) & 0xFF; __b.buf[187] = (((234) & 0xFF)) & 0xFF; __b.buf[188] = (((101) & 0xFF)) & 0xFF; __b.buf[189] = (((122) & 0xFF)) & 0xFF; __b.buf[190] = (((174) & 0xFF)) & 0xFF; __b.buf[191] = (((8) & 0xFF)) & 0xFF; __b.buf[192] = (((186) & 0xFF)) & 0xFF; __b.buf[193] = (((120) & 0xFF)) & 0xFF; __b.buf[194] = (((37) & 0xFF)) & 0xFF; __b.buf[195] = (((46) & 0xFF)) & 0xFF; __b.buf[196] = (((28) & 0xFF)) & 0xFF; __b.buf[197] = (((166) & 0xFF)) & 0xFF; __b.buf[198] = (((180) & 0xFF)) & 0xFF; __b.buf[199] = (((198) & 0xFF)) & 0xFF; __b.buf[200] = (((232) & 0xFF)) & 0xFF; __b.buf[201] = (((221) & 0xFF)) & 0xFF; __b.buf[202] = (((116) & 0xFF)) & 0xFF; __b.buf[203] = (((31) & 0xFF)) & 0xFF; __b.buf[204] = (((75) & 0xFF)) & 0xFF; __b.buf[205] = (((189) & 0xFF)) & 0xFF; __b.buf[206] = (((139) & 0xFF)) & 0xFF; __b.buf[207] = (((138) & 0xFF)) & 0xFF; __b.buf[208] = (((112) & 0xFF)) & 0xFF; __b.buf[209] = (((62) & 0xFF)) & 0xFF; __b.buf[210] = (((181) & 0xFF)) & 0xFF; __b.buf[211] = (((102) & 0xFF)) & 0xFF; __b.buf[212] = (((72) & 0xFF)) & 0xFF; __b.buf[213] = (((3) & 0xFF)) & 0xFF; __b.buf[214] = (((246) & 0xFF)) & 0xFF; __b.buf[215] = (((14) & 0xFF)) & 0xFF; __b.buf[216] = (((97) & 0xFF)) & 0xFF; __b.buf[217] = (((53) & 0xFF)) & 0xFF; __b.buf[218] = (((87) & 0xFF)) & 0xFF; __b.buf[219] = (((185) & 0xFF)) & 0xFF; __b.buf[220] = (((134) & 0xFF)) & 0xFF; __b.buf[221] = (((193) & 0xFF)) & 0xFF; __b.buf[222] = (((29) & 0xFF)) & 0xFF; __b.buf[223] = (((158) & 0xFF)) & 0xFF; __b.buf[224] = (((225) & 0xFF)) & 0xFF; __b.buf[225] = (((248) & 0xFF)) & 0xFF; __b.buf[226] = (((152) & 0xFF)) & 0xFF; __b.buf[227] = (((17) & 0xFF)) & 0xFF; __b.buf[228] = (((105) & 0xFF)) & 0xFF; __b.buf[229] = (((217) & 0xFF)) & 0xFF; __b.buf[230] = (((142) & 0xFF)) & 0xFF; __b.buf[231] = (((148) & 0xFF)) & 0xFF; __b.buf[232] = (((155) & 0xFF)) & 0xFF; __b.buf[233] = (((30) & 0xFF)) & 0xFF; __b.buf[234] = (((135) & 0xFF)) & 0xFF; __b.buf[235] = (((233) & 0xFF)) & 0xFF; __b.buf[236] = (((206) & 0xFF)) & 0xFF; __b.buf[237] = (((85) & 0xFF)) & 0xFF; __b.buf[238] = (((40) & 0xFF)) & 0xFF; __b.buf[239] = (((223) & 0xFF)) & 0xFF; __b.buf[240] = (((140) & 0xFF)) & 0xFF; __b.buf[241] = (((161) & 0xFF)) & 0xFF; __b.buf[242] = (((137) & 0xFF)) & 0xFF; __b.buf[243] = (((13) & 0xFF)) & 0xFF; __b.buf[244] = (((191) & 0xFF)) & 0xFF; __b.buf[245] = (((230) & 0xFF)) & 0xFF; __b.buf[246] = (((66) & 0xFF)) & 0xFF; __b.buf[247] = (((104) & 0xFF)) & 0xFF; __b.buf[248] = (((65) & 0xFF)) & 0xFF; __b.buf[249] = (((153) & 0xFF)) & 0xFF; __b.buf[250] = (((45) & 0xFF)) & 0xFF; __b.buf[251] = (((15) & 0xFF)) & 0xFF; __b.buf[252] = (((176) & 0xFF)) & 0xFF; __b.buf[253] = (((84) & 0xFF)) & 0xFF; __b.buf[254] = (((187) & 0xFF)) & 0xFF; __b.buf[255] = (((22) & 0xFF)) & 0xFF; return __b; })();
const rsbox = (() => { const __b = cptr_create(256); __b.buf[0] = (((82) & 0xFF)) & 0xFF; __b.buf[1] = (((9) & 0xFF)) & 0xFF; __b.buf[2] = (((106) & 0xFF)) & 0xFF; __b.buf[3] = (((213) & 0xFF)) & 0xFF; __b.buf[4] = (((48) & 0xFF)) & 0xFF; __b.buf[5] = (((54) & 0xFF)) & 0xFF; __b.buf[6] = (((165) & 0xFF)) & 0xFF; __b.buf[7] = (((56) & 0xFF)) & 0xFF; __b.buf[8] = (((191) & 0xFF)) & 0xFF; __b.buf[9] = (((64) & 0xFF)) & 0xFF; __b.buf[10] = (((163) & 0xFF)) & 0xFF; __b.buf[11] = (((158) & 0xFF)) & 0xFF; __b.buf[12] = (((129) & 0xFF)) & 0xFF; __b.buf[13] = (((243) & 0xFF)) & 0xFF; __b.buf[14] = (((215) & 0xFF)) & 0xFF; __b.buf[15] = (((251) & 0xFF)) & 0xFF; __b.buf[16] = (((124) & 0xFF)) & 0xFF; __b.buf[17] = (((227) & 0xFF)) & 0xFF; __b.buf[18] = (((57) & 0xFF)) & 0xFF; __b.buf[19] = (((130) & 0xFF)) & 0xFF; __b.buf[20] = (((155) & 0xFF)) & 0xFF; __b.buf[21] = (((47) & 0xFF)) & 0xFF; __b.buf[22] = (((255) & 0xFF)) & 0xFF; __b.buf[23] = (((135) & 0xFF)) & 0xFF; __b.buf[24] = (((52) & 0xFF)) & 0xFF; __b.buf[25] = (((142) & 0xFF)) & 0xFF; __b.buf[26] = (((67) & 0xFF)) & 0xFF; __b.buf[27] = (((68) & 0xFF)) & 0xFF; __b.buf[28] = (((196) & 0xFF)) & 0xFF; __b.buf[29] = (((222) & 0xFF)) & 0xFF; __b.buf[30] = (((233) & 0xFF)) & 0xFF; __b.buf[31] = (((203) & 0xFF)) & 0xFF; __b.buf[32] = (((84) & 0xFF)) & 0xFF; __b.buf[33] = (((123) & 0xFF)) & 0xFF; __b.buf[34] = (((148) & 0xFF)) & 0xFF; __b.buf[35] = (((50) & 0xFF)) & 0xFF; __b.buf[36] = (((166) & 0xFF)) & 0xFF; __b.buf[37] = (((194) & 0xFF)) & 0xFF; __b.buf[38] = (((35) & 0xFF)) & 0xFF; __b.buf[39] = (((61) & 0xFF)) & 0xFF; __b.buf[40] = (((238) & 0xFF)) & 0xFF; __b.buf[41] = (((76) & 0xFF)) & 0xFF; __b.buf[42] = (((149) & 0xFF)) & 0xFF; __b.buf[43] = (((11) & 0xFF)) & 0xFF; __b.buf[44] = (((66) & 0xFF)) & 0xFF; __b.buf[45] = (((250) & 0xFF)) & 0xFF; __b.buf[46] = (((195) & 0xFF)) & 0xFF; __b.buf[47] = (((78) & 0xFF)) & 0xFF; __b.buf[48] = (((8) & 0xFF)) & 0xFF; __b.buf[49] = (((46) & 0xFF)) & 0xFF; __b.buf[50] = (((161) & 0xFF)) & 0xFF; __b.buf[51] = (((102) & 0xFF)) & 0xFF; __b.buf[52] = (((40) & 0xFF)) & 0xFF; __b.buf[53] = (((217) & 0xFF)) & 0xFF; __b.buf[54] = (((36) & 0xFF)) & 0xFF; __b.buf[55] = (((178) & 0xFF)) & 0xFF; __b.buf[56] = (((118) & 0xFF)) & 0xFF; __b.buf[57] = (((91) & 0xFF)) & 0xFF; __b.buf[58] = (((162) & 0xFF)) & 0xFF; __b.buf[59] = (((73) & 0xFF)) & 0xFF; __b.buf[60] = (((109) & 0xFF)) & 0xFF; __b.buf[61] = (((139) & 0xFF)) & 0xFF; __b.buf[62] = (((209) & 0xFF)) & 0xFF; __b.buf[63] = (((37) & 0xFF)) & 0xFF; __b.buf[64] = (((114) & 0xFF)) & 0xFF; __b.buf[65] = (((248) & 0xFF)) & 0xFF; __b.buf[66] = (((246) & 0xFF)) & 0xFF; __b.buf[67] = (((100) & 0xFF)) & 0xFF; __b.buf[68] = (((134) & 0xFF)) & 0xFF; __b.buf[69] = (((104) & 0xFF)) & 0xFF; __b.buf[70] = (((152) & 0xFF)) & 0xFF; __b.buf[71] = (((22) & 0xFF)) & 0xFF; __b.buf[72] = (((212) & 0xFF)) & 0xFF; __b.buf[73] = (((164) & 0xFF)) & 0xFF; __b.buf[74] = (((92) & 0xFF)) & 0xFF; __b.buf[75] = (((204) & 0xFF)) & 0xFF; __b.buf[76] = (((93) & 0xFF)) & 0xFF; __b.buf[77] = (((101) & 0xFF)) & 0xFF; __b.buf[78] = (((182) & 0xFF)) & 0xFF; __b.buf[79] = (((146) & 0xFF)) & 0xFF; __b.buf[80] = (((108) & 0xFF)) & 0xFF; __b.buf[81] = (((112) & 0xFF)) & 0xFF; __b.buf[82] = (((72) & 0xFF)) & 0xFF; __b.buf[83] = (((80) & 0xFF)) & 0xFF; __b.buf[84] = (((253) & 0xFF)) & 0xFF; __b.buf[85] = (((237) & 0xFF)) & 0xFF; __b.buf[86] = (((185) & 0xFF)) & 0xFF; __b.buf[87] = (((218) & 0xFF)) & 0xFF; __b.buf[88] = (((94) & 0xFF)) & 0xFF; __b.buf[89] = (((21) & 0xFF)) & 0xFF; __b.buf[90] = (((70) & 0xFF)) & 0xFF; __b.buf[91] = (((87) & 0xFF)) & 0xFF; __b.buf[92] = (((167) & 0xFF)) & 0xFF; __b.buf[93] = (((141) & 0xFF)) & 0xFF; __b.buf[94] = (((157) & 0xFF)) & 0xFF; __b.buf[95] = (((132) & 0xFF)) & 0xFF; __b.buf[96] = (((144) & 0xFF)) & 0xFF; __b.buf[97] = (((216) & 0xFF)) & 0xFF; __b.buf[98] = (((171) & 0xFF)) & 0xFF; __b.buf[99] = (((0) & 0xFF)) & 0xFF; __b.buf[100] = (((140) & 0xFF)) & 0xFF; __b.buf[101] = (((188) & 0xFF)) & 0xFF; __b.buf[102] = (((211) & 0xFF)) & 0xFF; __b.buf[103] = (((10) & 0xFF)) & 0xFF; __b.buf[104] = (((247) & 0xFF)) & 0xFF; __b.buf[105] = (((228) & 0xFF)) & 0xFF; __b.buf[106] = (((88) & 0xFF)) & 0xFF; __b.buf[107] = (((5) & 0xFF)) & 0xFF; __b.buf[108] = (((184) & 0xFF)) & 0xFF; __b.buf[109] = (((179) & 0xFF)) & 0xFF; __b.buf[110] = (((69) & 0xFF)) & 0xFF; __b.buf[111] = (((6) & 0xFF)) & 0xFF; __b.buf[112] = (((208) & 0xFF)) & 0xFF; __b.buf[113] = (((44) & 0xFF)) & 0xFF; __b.buf[114] = (((30) & 0xFF)) & 0xFF; __b.buf[115] = (((143) & 0xFF)) & 0xFF; __b.buf[116] = (((202) & 0xFF)) & 0xFF; __b.buf[117] = (((63) & 0xFF)) & 0xFF; __b.buf[118] = (((15) & 0xFF)) & 0xFF; __b.buf[119] = (((2) & 0xFF)) & 0xFF; __b.buf[120] = (((193) & 0xFF)) & 0xFF; __b.buf[121] = (((175) & 0xFF)) & 0xFF; __b.buf[122] = (((189) & 0xFF)) & 0xFF; __b.buf[123] = (((3) & 0xFF)) & 0xFF; __b.buf[124] = (((1) & 0xFF)) & 0xFF; __b.buf[125] = (((19) & 0xFF)) & 0xFF; __b.buf[126] = (((138) & 0xFF)) & 0xFF; __b.buf[127] = (((107) & 0xFF)) & 0xFF; __b.buf[128] = (((58) & 0xFF)) & 0xFF; __b.buf[129] = (((145) & 0xFF)) & 0xFF; __b.buf[130] = (((17) & 0xFF)) & 0xFF; __b.buf[131] = (((65) & 0xFF)) & 0xFF; __b.buf[132] = (((79) & 0xFF)) & 0xFF; __b.buf[133] = (((103) & 0xFF)) & 0xFF; __b.buf[134] = (((220) & 0xFF)) & 0xFF; __b.buf[135] = (((234) & 0xFF)) & 0xFF; __b.buf[136] = (((151) & 0xFF)) & 0xFF; __b.buf[137] = (((242) & 0xFF)) & 0xFF; __b.buf[138] = (((207) & 0xFF)) & 0xFF; __b.buf[139] = (((206) & 0xFF)) & 0xFF; __b.buf[140] = (((240) & 0xFF)) & 0xFF; __b.buf[141] = (((180) & 0xFF)) & 0xFF; __b.buf[142] = (((230) & 0xFF)) & 0xFF; __b.buf[143] = (((115) & 0xFF)) & 0xFF; __b.buf[144] = (((150) & 0xFF)) & 0xFF; __b.buf[145] = (((172) & 0xFF)) & 0xFF; __b.buf[146] = (((116) & 0xFF)) & 0xFF; __b.buf[147] = (((34) & 0xFF)) & 0xFF; __b.buf[148] = (((231) & 0xFF)) & 0xFF; __b.buf[149] = (((173) & 0xFF)) & 0xFF; __b.buf[150] = (((53) & 0xFF)) & 0xFF; __b.buf[151] = (((133) & 0xFF)) & 0xFF; __b.buf[152] = (((226) & 0xFF)) & 0xFF; __b.buf[153] = (((249) & 0xFF)) & 0xFF; __b.buf[154] = (((55) & 0xFF)) & 0xFF; __b.buf[155] = (((232) & 0xFF)) & 0xFF; __b.buf[156] = (((28) & 0xFF)) & 0xFF; __b.buf[157] = (((117) & 0xFF)) & 0xFF; __b.buf[158] = (((223) & 0xFF)) & 0xFF; __b.buf[159] = (((110) & 0xFF)) & 0xFF; __b.buf[160] = (((71) & 0xFF)) & 0xFF; __b.buf[161] = (((241) & 0xFF)) & 0xFF; __b.buf[162] = (((26) & 0xFF)) & 0xFF; __b.buf[163] = (((113) & 0xFF)) & 0xFF; __b.buf[164] = (((29) & 0xFF)) & 0xFF; __b.buf[165] = (((41) & 0xFF)) & 0xFF; __b.buf[166] = (((197) & 0xFF)) & 0xFF; __b.buf[167] = (((137) & 0xFF)) & 0xFF; __b.buf[168] = (((111) & 0xFF)) & 0xFF; __b.buf[169] = (((183) & 0xFF)) & 0xFF; __b.buf[170] = (((98) & 0xFF)) & 0xFF; __b.buf[171] = (((14) & 0xFF)) & 0xFF; __b.buf[172] = (((170) & 0xFF)) & 0xFF; __b.buf[173] = (((24) & 0xFF)) & 0xFF; __b.buf[174] = (((190) & 0xFF)) & 0xFF; __b.buf[175] = (((27) & 0xFF)) & 0xFF; __b.buf[176] = (((252) & 0xFF)) & 0xFF; __b.buf[177] = (((86) & 0xFF)) & 0xFF; __b.buf[178] = (((62) & 0xFF)) & 0xFF; __b.buf[179] = (((75) & 0xFF)) & 0xFF; __b.buf[180] = (((198) & 0xFF)) & 0xFF; __b.buf[181] = (((210) & 0xFF)) & 0xFF; __b.buf[182] = (((121) & 0xFF)) & 0xFF; __b.buf[183] = (((32) & 0xFF)) & 0xFF; __b.buf[184] = (((154) & 0xFF)) & 0xFF; __b.buf[185] = (((219) & 0xFF)) & 0xFF; __b.buf[186] = (((192) & 0xFF)) & 0xFF; __b.buf[187] = (((254) & 0xFF)) & 0xFF; __b.buf[188] = (((120) & 0xFF)) & 0xFF; __b.buf[189] = (((205) & 0xFF)) & 0xFF; __b.buf[190] = (((90) & 0xFF)) & 0xFF; __b.buf[191] = (((244) & 0xFF)) & 0xFF; __b.buf[192] = (((31) & 0xFF)) & 0xFF; __b.buf[193] = (((221) & 0xFF)) & 0xFF; __b.buf[194] = (((168) & 0xFF)) & 0xFF; __b.buf[195] = (((51) & 0xFF)) & 0xFF; __b.buf[196] = (((136) & 0xFF)) & 0xFF; __b.buf[197] = (((7) & 0xFF)) & 0xFF; __b.buf[198] = (((199) & 0xFF)) & 0xFF; __b.buf[199] = (((49) & 0xFF)) & 0xFF; __b.buf[200] = (((177) & 0xFF)) & 0xFF; __b.buf[201] = (((18) & 0xFF)) & 0xFF; __b.buf[202] = (((16) & 0xFF)) & 0xFF; __b.buf[203] = (((89) & 0xFF)) & 0xFF; __b.buf[204] = (((39) & 0xFF)) & 0xFF; __b.buf[205] = (((128) & 0xFF)) & 0xFF; __b.buf[206] = (((236) & 0xFF)) & 0xFF; __b.buf[207] = (((95) & 0xFF)) & 0xFF; __b.buf[208] = (((96) & 0xFF)) & 0xFF; __b.buf[209] = (((81) & 0xFF)) & 0xFF; __b.buf[210] = (((127) & 0xFF)) & 0xFF; __b.buf[211] = (((169) & 0xFF)) & 0xFF; __b.buf[212] = (((25) & 0xFF)) & 0xFF; __b.buf[213] = (((181) & 0xFF)) & 0xFF; __b.buf[214] = (((74) & 0xFF)) & 0xFF; __b.buf[215] = (((13) & 0xFF)) & 0xFF; __b.buf[216] = (((45) & 0xFF)) & 0xFF; __b.buf[217] = (((229) & 0xFF)) & 0xFF; __b.buf[218] = (((122) & 0xFF)) & 0xFF; __b.buf[219] = (((159) & 0xFF)) & 0xFF; __b.buf[220] = (((147) & 0xFF)) & 0xFF; __b.buf[221] = (((201) & 0xFF)) & 0xFF; __b.buf[222] = (((156) & 0xFF)) & 0xFF; __b.buf[223] = (((239) & 0xFF)) & 0xFF; __b.buf[224] = (((160) & 0xFF)) & 0xFF; __b.buf[225] = (((224) & 0xFF)) & 0xFF; __b.buf[226] = (((59) & 0xFF)) & 0xFF; __b.buf[227] = (((77) & 0xFF)) & 0xFF; __b.buf[228] = (((174) & 0xFF)) & 0xFF; __b.buf[229] = (((42) & 0xFF)) & 0xFF; __b.buf[230] = (((245) & 0xFF)) & 0xFF; __b.buf[231] = (((176) & 0xFF)) & 0xFF; __b.buf[232] = (((200) & 0xFF)) & 0xFF; __b.buf[233] = (((235) & 0xFF)) & 0xFF; __b.buf[234] = (((187) & 0xFF)) & 0xFF; __b.buf[235] = (((60) & 0xFF)) & 0xFF; __b.buf[236] = (((131) & 0xFF)) & 0xFF; __b.buf[237] = (((83) & 0xFF)) & 0xFF; __b.buf[238] = (((153) & 0xFF)) & 0xFF; __b.buf[239] = (((97) & 0xFF)) & 0xFF; __b.buf[240] = (((23) & 0xFF)) & 0xFF; __b.buf[241] = (((43) & 0xFF)) & 0xFF; __b.buf[242] = (((4) & 0xFF)) & 0xFF; __b.buf[243] = (((126) & 0xFF)) & 0xFF; __b.buf[244] = (((186) & 0xFF)) & 0xFF; __b.buf[245] = (((119) & 0xFF)) & 0xFF; __b.buf[246] = (((214) & 0xFF)) & 0xFF; __b.buf[247] = (((38) & 0xFF)) & 0xFF; __b.buf[248] = (((225) & 0xFF)) & 0xFF; __b.buf[249] = (((105) & 0xFF)) & 0xFF; __b.buf[250] = (((20) & 0xFF)) & 0xFF; __b.buf[251] = (((99) & 0xFF)) & 0xFF; __b.buf[252] = (((85) & 0xFF)) & 0xFF; __b.buf[253] = (((33) & 0xFF)) & 0xFF; __b.buf[254] = (((12) & 0xFF)) & 0xFF; __b.buf[255] = (((125) & 0xFF)) & 0xFF; return __b; })();
const Rcon = (() => { const __b = cptr_create(11); __b.buf[0] = (((141) & 0xFF)) & 0xFF; __b.buf[1] = (((1) & 0xFF)) & 0xFF; __b.buf[2] = (((2) & 0xFF)) & 0xFF; __b.buf[3] = (((4) & 0xFF)) & 0xFF; __b.buf[4] = (((8) & 0xFF)) & 0xFF; __b.buf[5] = (((16) & 0xFF)) & 0xFF; __b.buf[6] = (((32) & 0xFF)) & 0xFF; __b.buf[7] = (((64) & 0xFF)) & 0xFF; __b.buf[8] = (((128) & 0xFF)) & 0xFF; __b.buf[9] = (((27) & 0xFF)) & 0xFF; __b.buf[10] = (((54) & 0xFF)) & 0xFF; return __b; })();
function KeyExpansion(RoundKey: any | null, Key: any | null): void {
  if (typeof RoundKey === 'string') RoundKey = cptr_from_string(RoundKey);
  if (typeof Key === 'string') Key = cptr_from_string(Key);

  let i = 0;
  let j = 0;
  let k = 0;
  let tempa = cptr_create(4);
  for (i = ((0) >>> 0); (((i) >>> 0) < ((4) >>> 0) ? 1 : 0); (i = u32(i + 1))) {
    RoundKey.buf[(RoundKey.off ?? 0) + u32(((Math.imul(((i) >>> 0), ((4) >>> 0)) >>> 0)) + ((0) >>> 0))] = (((Key.buf[(Key.off ?? 0) + u32(((Math.imul(((i) >>> 0), ((4) >>> 0)) >>> 0)) + ((0) >>> 0))]) & 0xFF)) & 0xFF;
    RoundKey.buf[(RoundKey.off ?? 0) + u32(((Math.imul(((i) >>> 0), ((4) >>> 0)) >>> 0)) + ((1) >>> 0))] = (((Key.buf[(Key.off ?? 0) + u32(((Math.imul(((i) >>> 0), ((4) >>> 0)) >>> 0)) + ((1) >>> 0))]) & 0xFF)) & 0xFF;
    RoundKey.buf[(RoundKey.off ?? 0) + u32(((Math.imul(((i) >>> 0), ((4) >>> 0)) >>> 0)) + ((2) >>> 0))] = (((Key.buf[(Key.off ?? 0) + u32(((Math.imul(((i) >>> 0), ((4) >>> 0)) >>> 0)) + ((2) >>> 0))]) & 0xFF)) & 0xFF;
    RoundKey.buf[(RoundKey.off ?? 0) + u32(((Math.imul(((i) >>> 0), ((4) >>> 0)) >>> 0)) + ((3) >>> 0))] = (((Key.buf[(Key.off ?? 0) + u32(((Math.imul(((i) >>> 0), ((4) >>> 0)) >>> 0)) + ((3) >>> 0))]) & 0xFF)) & 0xFF;
  }
  for (i = ((4) >>> 0); (((i) >>> 0) < ((Math.imul(4, (i32(10 + 1)))) >>> 0) ? 1 : 0); (i = u32(i + 1))) {
    {
      {
        k = (Math.imul((u32(((i) >>> 0) - ((1) >>> 0))), ((4) >>> 0)) >>> 0);
        tempa.buf[(tempa.off ?? 0) + 0] = (((RoundKey.buf[(RoundKey.off ?? 0) + u32(((k) >>> 0) + ((0) >>> 0))]) & 0xFF)) & 0xFF;
        tempa.buf[(tempa.off ?? 0) + 1] = (((RoundKey.buf[(RoundKey.off ?? 0) + u32(((k) >>> 0) + ((1) >>> 0))]) & 0xFF)) & 0xFF;
        tempa.buf[(tempa.off ?? 0) + 2] = (((RoundKey.buf[(RoundKey.off ?? 0) + u32(((k) >>> 0) + ((2) >>> 0))]) & 0xFF)) & 0xFF;
        tempa.buf[(tempa.off ?? 0) + 3] = (((RoundKey.buf[(RoundKey.off ?? 0) + u32(((k) >>> 0) + ((3) >>> 0))]) & 0xFF)) & 0xFF;
      }
    }
    if ((u32(((i) >>> 0) % ((4) >>> 0)) == ((0) >>> 0) ? 1 : 0)) {
      {
        {
          let u8tmp = ((tempa.buf[(tempa.off ?? 0) + 0]) & 0xFF);
          tempa.buf[(tempa.off ?? 0) + 0] = (((tempa.buf[(tempa.off ?? 0) + 1]) & 0xFF)) & 0xFF;
          tempa.buf[(tempa.off ?? 0) + 1] = (((tempa.buf[(tempa.off ?? 0) + 2]) & 0xFF)) & 0xFF;
          tempa.buf[(tempa.off ?? 0) + 2] = (((tempa.buf[(tempa.off ?? 0) + 3]) & 0xFF)) & 0xFF;
          tempa.buf[(tempa.off ?? 0) + 3] = (((u8tmp) & 0xFF)) & 0xFF;
        }
      }
      {
        {
          tempa.buf[(tempa.off ?? 0) + 0] = ((((sbox.buf[(sbox.off ?? 0) + (((tempa.buf[(tempa.off ?? 0) + 0])) & 0xFF)])) & 0xFF)) & 0xFF;
          tempa.buf[(tempa.off ?? 0) + 1] = ((((sbox.buf[(sbox.off ?? 0) + (((tempa.buf[(tempa.off ?? 0) + 1])) & 0xFF)])) & 0xFF)) & 0xFF;
          tempa.buf[(tempa.off ?? 0) + 2] = ((((sbox.buf[(sbox.off ?? 0) + (((tempa.buf[(tempa.off ?? 0) + 2])) & 0xFF)])) & 0xFF)) & 0xFF;
          tempa.buf[(tempa.off ?? 0) + 3] = ((((sbox.buf[(sbox.off ?? 0) + (((tempa.buf[(tempa.off ?? 0) + 3])) & 0xFF)])) & 0xFF)) & 0xFF;
        }
      }
      tempa.buf[(tempa.off ?? 0) + 0] = (((((tempa.buf[(tempa.off ?? 0) + 0]) & 0xFF) ^ ((Rcon.buf[(Rcon.off ?? 0) + __safe_div(((i) >>> 0), ((4) >>> 0))]) & 0xFF)) & 0xFF)) & 0xFF;
    }
    j = (Math.imul(((i) >>> 0), ((4) >>> 0)) >>> 0);
    k = (Math.imul((u32(((i) >>> 0) - ((4) >>> 0))), ((4) >>> 0)) >>> 0);
    RoundKey.buf[(RoundKey.off ?? 0) + u32(((j) >>> 0) + ((0) >>> 0))] = (((((RoundKey.buf[(RoundKey.off ?? 0) + u32(((k) >>> 0) + ((0) >>> 0))]) & 0xFF) ^ ((tempa.buf[(tempa.off ?? 0) + 0]) & 0xFF)) & 0xFF)) & 0xFF;
    RoundKey.buf[(RoundKey.off ?? 0) + u32(((j) >>> 0) + ((1) >>> 0))] = (((((RoundKey.buf[(RoundKey.off ?? 0) + u32(((k) >>> 0) + ((1) >>> 0))]) & 0xFF) ^ ((tempa.buf[(tempa.off ?? 0) + 1]) & 0xFF)) & 0xFF)) & 0xFF;
    RoundKey.buf[(RoundKey.off ?? 0) + u32(((j) >>> 0) + ((2) >>> 0))] = (((((RoundKey.buf[(RoundKey.off ?? 0) + u32(((k) >>> 0) + ((2) >>> 0))]) & 0xFF) ^ ((tempa.buf[(tempa.off ?? 0) + 2]) & 0xFF)) & 0xFF)) & 0xFF;
    RoundKey.buf[(RoundKey.off ?? 0) + u32(((j) >>> 0) + ((3) >>> 0))] = (((((RoundKey.buf[(RoundKey.off ?? 0) + u32(((k) >>> 0) + ((3) >>> 0))]) & 0xFF) ^ ((tempa.buf[(tempa.off ?? 0) + 3]) & 0xFF)) & 0xFF)) & 0xFF;
  }
}

export function AES_init_ctx(ctx: AES_ctx | null, key: any): void {
  KeyExpansion(cptr_clone((__struct_ptr_at(ctx, 0)).RoundKey), cptr_clone(key));
}

export function AES_init_ctx_iv(ctx: AES_ctx | null, key: any, iv: any | null): void {
  KeyExpansion(cptr_clone((__struct_ptr_at(ctx, 0)).RoundKey), cptr_clone(key));
  memcpy((__struct_ptr_at(ctx, 0)).Iv, iv, 16);
}

export function AES_ctx_set_iv(ctx: AES_ctx | null, iv: any | null): void {
  memcpy((__struct_ptr_at(ctx, 0)).Iv, iv, 16);
}

function AddRoundKey(round: number, state: state_t | null, RoundKey: any | null): void {
  if (typeof RoundKey === 'string') RoundKey = cptr_from_string(RoundKey);

  let i = 0;
  let j = 0;
  for (i = (((0) & 0xFF)) & 0xFF; (((i) & 0xFF) < 4 ? 1 : 0); (i = u32(i + 1))) {
    for (j = (((0) & 0xFF)) & 0xFF; (((j) & 0xFF) < 4 ? 1 : 0); (j = u32(j + 1))) {
      cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + ((j) & 0xFF)] = (cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + ((j) & 0xFF)] ^ ((RoundKey.buf[(RoundKey.off ?? 0) + i32(i32((Math.imul(Math.imul(((round) & 0xFF), 4), 4)) + (Math.imul(((i) & 0xFF), 4))) + ((j) & 0xFF))]) & 0xFF)) >>> 0;
    }
  }
}

function SubBytes(state: state_t | null): void {
  let i = 0;
  let j = 0;
  for (i = (((0) & 0xFF)) & 0xFF; (((i) & 0xFF) < 4 ? 1 : 0); (i = u32(i + 1))) {
    for (j = (((0) & 0xFF)) & 0xFF; (((j) & 0xFF) < 4 ? 1 : 0); (j = u32(j + 1))) {
      cptr_offset((state), (((j) & 0xFF)) * 4).buf[(cptr_offset((state), (((j) & 0xFF)) * 4).off ?? 0) + ((i) & 0xFF)] = ((((sbox.buf[(sbox.off ?? 0) + (((cptr_offset((state), (((j) & 0xFF)) * 4).buf[(cptr_offset((state), (((j) & 0xFF)) * 4).off ?? 0) + ((i) & 0xFF)])) & 0xFF)])) & 0xFF)) & 0xFF;
    }
  }
}

function ShiftRows(state: state_t | null): void {
  let temp = 0;
  temp = (((cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 1]) & 0xFF)) & 0xFF;
  cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 1] = (((cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 1]) & 0xFF)) & 0xFF;
  cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 1] = (((cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 1]) & 0xFF)) & 0xFF;
  cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 1] = (((cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 1]) & 0xFF)) & 0xFF;
  cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 1] = (((temp) & 0xFF)) & 0xFF;
  temp = (((cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 2]) & 0xFF)) & 0xFF;
  cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 2] = (((cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 2]) & 0xFF)) & 0xFF;
  cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 2] = (((temp) & 0xFF)) & 0xFF;
  temp = (((cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 2]) & 0xFF)) & 0xFF;
  cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 2] = (((cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 2]) & 0xFF)) & 0xFF;
  cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 2] = (((temp) & 0xFF)) & 0xFF;
  temp = (((cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF;
  cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 3] = (((cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF;
  cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 3] = (((cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF;
  cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 3] = (((cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF;
  cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 3] = (((temp) & 0xFF)) & 0xFF;
}

function xtime(x: number): number {
  return ((((((((x) & 0xFF) << 1) | 0)) ^ (Math.imul(((((((x) & 0xFF) >> 7) | 0)) & 1), 27)))) & 0xFF);
}

function MixColumns(state: state_t | null): void {
  let i = 0;
  let Tmp = 0;
  let Tm = 0;
  let t = 0;
  for (i = (((0) & 0xFF)) & 0xFF; (((i) & 0xFF) < 4 ? 1 : 0); (i = u32(i + 1))) {
    t = (((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 0]) & 0xFF)) & 0xFF;
    Tmp = (((((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 0]) & 0xFF) ^ ((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 1]) & 0xFF) ^ ((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 2]) & 0xFF) ^ ((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF)) & 0xFF;
    Tm = (((((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 0]) & 0xFF) ^ ((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 1]) & 0xFF)) & 0xFF)) & 0xFF;
    Tm = (xtime(((Tm) & 0xFF))) & 0xFF;
    cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 0] = (cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 0] ^ ((Tm) & 0xFF) ^ ((Tmp) & 0xFF)) >>> 0;
    Tm = (((((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 1]) & 0xFF) ^ ((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 2]) & 0xFF)) & 0xFF)) & 0xFF;
    Tm = (xtime(((Tm) & 0xFF))) & 0xFF;
    cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 1] = (cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 1] ^ ((Tm) & 0xFF) ^ ((Tmp) & 0xFF)) >>> 0;
    Tm = (((((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 2]) & 0xFF) ^ ((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF)) & 0xFF;
    Tm = (xtime(((Tm) & 0xFF))) & 0xFF;
    cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 2] = (cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 2] ^ ((Tm) & 0xFF) ^ ((Tmp) & 0xFF)) >>> 0;
    Tm = (((((cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 3]) & 0xFF) ^ ((t) & 0xFF)) & 0xFF)) & 0xFF;
    Tm = (xtime(((Tm) & 0xFF))) & 0xFF;
    cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 3] = (cptr_offset((state), (((i) & 0xFF)) * 4).buf[(cptr_offset((state), (((i) & 0xFF)) * 4).off ?? 0) + 3] ^ ((Tm) & 0xFF) ^ ((Tmp) & 0xFF)) >>> 0;
  }
}

function InvMixColumns(state: state_t | null): void {
  let i = 0;
  let a = 0;
  let b = 0;
  let c = 0;
  let d = 0;
  for (i = 0; (i < 4 ? 1 : 0); ++i) {
    a = (((cptr_offset((state), (i) * 4).buf[(cptr_offset((state), (i) * 4).off ?? 0) + 0]) & 0xFF)) & 0xFF;
    b = (((cptr_offset((state), (i) * 4).buf[(cptr_offset((state), (i) * 4).off ?? 0) + 1]) & 0xFF)) & 0xFF;
    c = (((cptr_offset((state), (i) * 4).buf[(cptr_offset((state), (i) * 4).off ?? 0) + 2]) & 0xFF)) & 0xFF;
    d = (((cptr_offset((state), (i) * 4).buf[(cptr_offset((state), (i) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF;
    cptr_offset((state), (i) * 4).buf[(cptr_offset((state), (i) * 4).off ?? 0) + 0] = (((((Math.imul((14 & 1), ((a) & 0xFF))) ^ (Math.imul((((14 >> 1) | 0) & 1), xtime(((a) & 0xFF)))) ^ (Math.imul((((14 >> 2) | 0) & 1), xtime(xtime(((a) & 0xFF))))) ^ (Math.imul((((14 >> 3) | 0) & 1), xtime(xtime(xtime(((a) & 0xFF)))))) ^ (Math.imul((((14 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((a) & 0xFF)))))))) ^ ((Math.imul((11 & 1), ((b) & 0xFF))) ^ (Math.imul((((11 >> 1) | 0) & 1), xtime(((b) & 0xFF)))) ^ (Math.imul((((11 >> 2) | 0) & 1), xtime(xtime(((b) & 0xFF))))) ^ (Math.imul((((11 >> 3) | 0) & 1), xtime(xtime(xtime(((b) & 0xFF)))))) ^ (Math.imul((((11 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((b) & 0xFF)))))))) ^ ((Math.imul((13 & 1), ((c) & 0xFF))) ^ (Math.imul((((13 >> 1) | 0) & 1), xtime(((c) & 0xFF)))) ^ (Math.imul((((13 >> 2) | 0) & 1), xtime(xtime(((c) & 0xFF))))) ^ (Math.imul((((13 >> 3) | 0) & 1), xtime(xtime(xtime(((c) & 0xFF)))))) ^ (Math.imul((((13 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((c) & 0xFF)))))))) ^ ((Math.imul((9 & 1), ((d) & 0xFF))) ^ (Math.imul((((9 >> 1) | 0) & 1), xtime(((d) & 0xFF)))) ^ (Math.imul((((9 >> 2) | 0) & 1), xtime(xtime(((d) & 0xFF))))) ^ (Math.imul((((9 >> 3) | 0) & 1), xtime(xtime(xtime(((d) & 0xFF)))))) ^ (Math.imul((((9 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((d) & 0xFF))))))))) & 0xFF)) & 0xFF;
    cptr_offset((state), (i) * 4).buf[(cptr_offset((state), (i) * 4).off ?? 0) + 1] = (((((Math.imul((9 & 1), ((a) & 0xFF))) ^ (Math.imul((((9 >> 1) | 0) & 1), xtime(((a) & 0xFF)))) ^ (Math.imul((((9 >> 2) | 0) & 1), xtime(xtime(((a) & 0xFF))))) ^ (Math.imul((((9 >> 3) | 0) & 1), xtime(xtime(xtime(((a) & 0xFF)))))) ^ (Math.imul((((9 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((a) & 0xFF)))))))) ^ ((Math.imul((14 & 1), ((b) & 0xFF))) ^ (Math.imul((((14 >> 1) | 0) & 1), xtime(((b) & 0xFF)))) ^ (Math.imul((((14 >> 2) | 0) & 1), xtime(xtime(((b) & 0xFF))))) ^ (Math.imul((((14 >> 3) | 0) & 1), xtime(xtime(xtime(((b) & 0xFF)))))) ^ (Math.imul((((14 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((b) & 0xFF)))))))) ^ ((Math.imul((11 & 1), ((c) & 0xFF))) ^ (Math.imul((((11 >> 1) | 0) & 1), xtime(((c) & 0xFF)))) ^ (Math.imul((((11 >> 2) | 0) & 1), xtime(xtime(((c) & 0xFF))))) ^ (Math.imul((((11 >> 3) | 0) & 1), xtime(xtime(xtime(((c) & 0xFF)))))) ^ (Math.imul((((11 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((c) & 0xFF)))))))) ^ ((Math.imul((13 & 1), ((d) & 0xFF))) ^ (Math.imul((((13 >> 1) | 0) & 1), xtime(((d) & 0xFF)))) ^ (Math.imul((((13 >> 2) | 0) & 1), xtime(xtime(((d) & 0xFF))))) ^ (Math.imul((((13 >> 3) | 0) & 1), xtime(xtime(xtime(((d) & 0xFF)))))) ^ (Math.imul((((13 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((d) & 0xFF))))))))) & 0xFF)) & 0xFF;
    cptr_offset((state), (i) * 4).buf[(cptr_offset((state), (i) * 4).off ?? 0) + 2] = (((((Math.imul((13 & 1), ((a) & 0xFF))) ^ (Math.imul((((13 >> 1) | 0) & 1), xtime(((a) & 0xFF)))) ^ (Math.imul((((13 >> 2) | 0) & 1), xtime(xtime(((a) & 0xFF))))) ^ (Math.imul((((13 >> 3) | 0) & 1), xtime(xtime(xtime(((a) & 0xFF)))))) ^ (Math.imul((((13 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((a) & 0xFF)))))))) ^ ((Math.imul((9 & 1), ((b) & 0xFF))) ^ (Math.imul((((9 >> 1) | 0) & 1), xtime(((b) & 0xFF)))) ^ (Math.imul((((9 >> 2) | 0) & 1), xtime(xtime(((b) & 0xFF))))) ^ (Math.imul((((9 >> 3) | 0) & 1), xtime(xtime(xtime(((b) & 0xFF)))))) ^ (Math.imul((((9 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((b) & 0xFF)))))))) ^ ((Math.imul((14 & 1), ((c) & 0xFF))) ^ (Math.imul((((14 >> 1) | 0) & 1), xtime(((c) & 0xFF)))) ^ (Math.imul((((14 >> 2) | 0) & 1), xtime(xtime(((c) & 0xFF))))) ^ (Math.imul((((14 >> 3) | 0) & 1), xtime(xtime(xtime(((c) & 0xFF)))))) ^ (Math.imul((((14 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((c) & 0xFF)))))))) ^ ((Math.imul((11 & 1), ((d) & 0xFF))) ^ (Math.imul((((11 >> 1) | 0) & 1), xtime(((d) & 0xFF)))) ^ (Math.imul((((11 >> 2) | 0) & 1), xtime(xtime(((d) & 0xFF))))) ^ (Math.imul((((11 >> 3) | 0) & 1), xtime(xtime(xtime(((d) & 0xFF)))))) ^ (Math.imul((((11 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((d) & 0xFF))))))))) & 0xFF)) & 0xFF;
    cptr_offset((state), (i) * 4).buf[(cptr_offset((state), (i) * 4).off ?? 0) + 3] = (((((Math.imul((11 & 1), ((a) & 0xFF))) ^ (Math.imul((((11 >> 1) | 0) & 1), xtime(((a) & 0xFF)))) ^ (Math.imul((((11 >> 2) | 0) & 1), xtime(xtime(((a) & 0xFF))))) ^ (Math.imul((((11 >> 3) | 0) & 1), xtime(xtime(xtime(((a) & 0xFF)))))) ^ (Math.imul((((11 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((a) & 0xFF)))))))) ^ ((Math.imul((13 & 1), ((b) & 0xFF))) ^ (Math.imul((((13 >> 1) | 0) & 1), xtime(((b) & 0xFF)))) ^ (Math.imul((((13 >> 2) | 0) & 1), xtime(xtime(((b) & 0xFF))))) ^ (Math.imul((((13 >> 3) | 0) & 1), xtime(xtime(xtime(((b) & 0xFF)))))) ^ (Math.imul((((13 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((b) & 0xFF)))))))) ^ ((Math.imul((9 & 1), ((c) & 0xFF))) ^ (Math.imul((((9 >> 1) | 0) & 1), xtime(((c) & 0xFF)))) ^ (Math.imul((((9 >> 2) | 0) & 1), xtime(xtime(((c) & 0xFF))))) ^ (Math.imul((((9 >> 3) | 0) & 1), xtime(xtime(xtime(((c) & 0xFF)))))) ^ (Math.imul((((9 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((c) & 0xFF)))))))) ^ ((Math.imul((14 & 1), ((d) & 0xFF))) ^ (Math.imul((((14 >> 1) | 0) & 1), xtime(((d) & 0xFF)))) ^ (Math.imul((((14 >> 2) | 0) & 1), xtime(xtime(((d) & 0xFF))))) ^ (Math.imul((((14 >> 3) | 0) & 1), xtime(xtime(xtime(((d) & 0xFF)))))) ^ (Math.imul((((14 >> 4) | 0) & 1), xtime(xtime(xtime(xtime(((d) & 0xFF))))))))) & 0xFF)) & 0xFF;
  }
}

function InvSubBytes(state: state_t | null): void {
  let i = 0;
  let j = 0;
  for (i = (((0) & 0xFF)) & 0xFF; (((i) & 0xFF) < 4 ? 1 : 0); (i = u32(i + 1))) {
    for (j = (((0) & 0xFF)) & 0xFF; (((j) & 0xFF) < 4 ? 1 : 0); (j = u32(j + 1))) {
      cptr_offset((state), (((j) & 0xFF)) * 4).buf[(cptr_offset((state), (((j) & 0xFF)) * 4).off ?? 0) + ((i) & 0xFF)] = ((((rsbox.buf[(rsbox.off ?? 0) + (((cptr_offset((state), (((j) & 0xFF)) * 4).buf[(cptr_offset((state), (((j) & 0xFF)) * 4).off ?? 0) + ((i) & 0xFF)])) & 0xFF)])) & 0xFF)) & 0xFF;
    }
  }
}

function InvShiftRows(state: state_t | null): void {
  let temp = 0;
  temp = (((cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 1]) & 0xFF)) & 0xFF;
  cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 1] = (((cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 1]) & 0xFF)) & 0xFF;
  cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 1] = (((cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 1]) & 0xFF)) & 0xFF;
  cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 1] = (((cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 1]) & 0xFF)) & 0xFF;
  cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 1] = (((temp) & 0xFF)) & 0xFF;
  temp = (((cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 2]) & 0xFF)) & 0xFF;
  cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 2] = (((cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 2]) & 0xFF)) & 0xFF;
  cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 2] = (((temp) & 0xFF)) & 0xFF;
  temp = (((cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 2]) & 0xFF)) & 0xFF;
  cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 2] = (((cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 2]) & 0xFF)) & 0xFF;
  cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 2] = (((temp) & 0xFF)) & 0xFF;
  temp = (((cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF;
  cptr_offset((state), (0) * 4).buf[(cptr_offset((state), (0) * 4).off ?? 0) + 3] = (((cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF;
  cptr_offset((state), (1) * 4).buf[(cptr_offset((state), (1) * 4).off ?? 0) + 3] = (((cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF;
  cptr_offset((state), (2) * 4).buf[(cptr_offset((state), (2) * 4).off ?? 0) + 3] = (((cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 3]) & 0xFF)) & 0xFF;
  cptr_offset((state), (3) * 4).buf[(cptr_offset((state), (3) * 4).off ?? 0) + 3] = (((temp) & 0xFF)) & 0xFF;
}

function Cipher(state: state_t | null, RoundKey: any | null): void {
  let round = ((0) & 0xFF);
  AddRoundKey(((0) & 0xFF), state, cptr_clone(RoundKey));
  for (round = (((1) & 0xFF)) & 0xFF; ; (round = u32(round + 1))) {
    SubBytes(state);
    ShiftRows(state);
    if ((((round) & 0xFF) == 10 ? 1 : 0)) {
      break;
    }
    MixColumns(state);
    AddRoundKey(((round) & 0xFF), state, cptr_clone(RoundKey));
  }
  AddRoundKey(((10) & 0xFF), state, cptr_clone(RoundKey));
}

function InvCipher(state: state_t | null, RoundKey: any | null): void {
  let round = ((0) & 0xFF);
  AddRoundKey(((10) & 0xFF), state, cptr_clone(RoundKey));
  for (round = ((((i32(10 - 1))) & 0xFF)) & 0xFF; ; (round = u32(round - 1))) {
    InvShiftRows(state);
    InvSubBytes(state);
    AddRoundKey(((round) & 0xFF), state, cptr_clone(RoundKey));
    if ((((round) & 0xFF) == 0 ? 1 : 0)) {
      break;
    }
    InvMixColumns(state);
  }
}

export function AES_ECB_encrypt(ctx: AES_ctx | null, buf: any | null): void {
  Cipher((buf), cptr_clone((__struct_ptr_at(ctx, 0)).RoundKey));
}

export function AES_ECB_decrypt(ctx: AES_ctx | null, buf: any): void {
  InvCipher((buf), cptr_clone((__struct_ptr_at(ctx, 0)).RoundKey));
}

function XorWithIv(buf: any | null, Iv: any | null): void {
  if (typeof buf === 'string') buf = cptr_from_string(buf);
  if (typeof Iv === 'string') Iv = cptr_from_string(Iv);

  let i = 0;
  for (i = (((0) & 0xFF)) & 0xFF; (((i) & 0xFF) < 16 ? 1 : 0); (i = u32(i + 1))) {
    buf.buf[(buf.off ?? 0) + ((i) & 0xFF)] = (buf.buf[(buf.off ?? 0) + ((i) & 0xFF)] ^ ((Iv.buf[(Iv.off ?? 0) + ((i) & 0xFF)]) & 0xFF)) >>> 0;
  }
}

export function AES_CBC_encrypt_buffer(ctx: AES_ctx | null, buf: any | null, length: number): void {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  let i = 0;
  let Iv = cptr_clone((__struct_ptr_at(ctx, 0)).Iv); /* &ref */
  for (i = ((0) >>> 0); (((i) >>> 0) < ((length) >>> 0) ? 1 : 0); i += ((16) >>> 0)) {
    XorWithIv(cptr_clone(buf), cptr_clone(Iv));
    Cipher((buf), cptr_clone((__struct_ptr_at(ctx, 0)).RoundKey));
    Iv = cptr_clone(buf);
    buf = cptr_offset(buf, 16);
  }
  memcpy((__struct_ptr_at(ctx, 0)).Iv, Iv, 16);
}

export function AES_CBC_decrypt_buffer(ctx: AES_ctx | null, buf: any | null, length: number): void {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  let i = 0;
  let storeNextIv = cptr_create(16);
  for (i = ((0) >>> 0); (((i) >>> 0) < ((length) >>> 0) ? 1 : 0); i += ((16) >>> 0)) {
    memcpy(storeNextIv, buf, 16);
    InvCipher((buf), cptr_clone((__struct_ptr_at(ctx, 0)).RoundKey));
    XorWithIv(cptr_clone(buf), cptr_clone((__struct_ptr_at(ctx, 0)).Iv));
    memcpy((__struct_ptr_at(ctx, 0)).Iv, storeNextIv, 16);
    buf = cptr_offset(buf, 16);
  }
}

export function AES_CTR_xcrypt_buffer(ctx: AES_ctx | null, buf: any | null, length: number): void {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  let buffer = cptr_create(16);
  let i = 0;
  let bi = 0;
  for (i = ((0) >>> 0), bi = 16; (((i) >>> 0) < ((length) >>> 0) ? 1 : 0); (i = u32(i + 1)), ++bi) {
    if ((bi == 16 ? 1 : 0)) {
      memcpy(buffer, (__struct_ptr_at(ctx, 0)).Iv, 16);
      Cipher((buffer), cptr_clone((__struct_ptr_at(ctx, 0)).RoundKey));
      for (bi = (i32(16 - 1)); (bi >= 0 ? 1 : 0); --bi) {
        if (((((__struct_ptr_at(ctx, 0)).Iv.buf[((__struct_ptr_at(ctx, 0)).Iv.off ?? 0) + bi]) & 0xFF) == 255 ? 1 : 0)) {
          (__struct_ptr_at(ctx, 0)).Iv.buf[((__struct_ptr_at(ctx, 0)).Iv.off ?? 0) + bi] = (((0) & 0xFF)) & 0xFF;
          continue;
        }
        (__struct_ptr_at(ctx, 0)).Iv.buf[((__struct_ptr_at(ctx, 0)).Iv.off ?? 0) + bi] = u32((__struct_ptr_at(ctx, 0)).Iv.buf[((__struct_ptr_at(ctx, 0)).Iv.off ?? 0) + bi] + 1);
        break;
      }
      bi = 0;
    }
    buf.buf[(buf.off ?? 0) + ((i) >>> 0)] = ((((((buf.buf[(buf.off ?? 0) + ((i) >>> 0)]) & 0xFF) ^ ((buffer.buf[(buffer.off ?? 0) + bi]) & 0xFF))) & 0xFF)) & 0xFF;
  }
}