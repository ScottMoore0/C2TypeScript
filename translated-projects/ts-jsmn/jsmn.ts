function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function div(numer: number, denom: number): any { return { quot: Math.trunc(numer / denom), rem: numer % denom }; }
function realloc(ptr: any, size: any): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 const sz = typeof size === 'bigint' ? Number(size) : Number(size ?? 0); if (ptr && ptr.__cptr_overlay === true) { const cp = ptr.__cptr; ptr = { buf: cp.buf, off: (cp.off ?? 0) + (ptr.__byteOff ?? 0) }; return cptr_realloc(ptr, sz); } if (ptr && typeof ptr === 'object' && !ptr.buf && ptr.constructor && (ptr.constructor as any).__fieldNames) { /* BRIDGE: struct-as-class realloc */ const existing = ptr.__cptr; const newBuf = new Uint8Array(sz); if (existing && existing.buf) { const srcOff = existing.off ?? 0; const copyLen = Math.min(existing.buf.length - srcOff, sz); if (copyLen > 0) newBuf.set(existing.buf.subarray(srcOff, srcOff + copyLen)); } ptr.__cptr = { buf: newBuf, off: 0 }; ptr.__byteOff = 0; return ptr; } return cptr_realloc(ptr, sz); }

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
function strncmp(a: any, b: any, n: number): number { const sa = ((typeof a === 'string') ? a : (a?.buf ? cptr_to_string(a) : a?.toString?.() ?? '')).substring(0, n); const sb = ((typeof b === 'string') ? b : (b?.buf ? cptr_to_string(b) : b?.toString?.() ?? '')).substring(0, n); return sa < sb ? -1 : sa > sb ? 1 : 0; }
function write(fd: any, buf: any, count: number): number { if (fd === 1) { const s = (buf?.buf) ? cptr_to_string(buf) : (typeof buf === 'string' ? buf : String.fromCharCode(...new Uint8Array(buf, 0, count))); process.stdout.write(s.substring(0, count)); return count; } if (fd === 2) { const s = (buf?.buf) ? cptr_to_string(buf) : (typeof buf === 'string' ? buf : String(buf)); process.stderr.write(s.substring(0, count)); return count; } try { const data = (buf?.buf) ? Buffer.from(buf.buf.buffer, buf.buf.byteOffset + buf.off, count) : (typeof buf === 'string' ? Buffer.from(buf) : Buffer.from(buf)); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function abs(x: number): number { return Math.abs(x); }
function includes(first1: any, last1: any, first2: any, last2: any, comp?: Function): boolean { const A = __cpp_arr(first1, last1); const B = __cpp_arr(first2, last2); const lt = comp ?? ((a: any, b: any) => a < b); let i = A.start, j = B.start; while (i < A.end && j < B.end) { if (lt(B.arr[j], A.arr[i])) return false; if (lt(A.arr[i], B.arr[j])) i++; else { i++; j++; } } return j === B.end; }
function max(a: any, b?: any, comp?: Function): any { if (b === undefined) { if (Array.isArray(a)) return a.reduce((m, x) => x > m ? x : m, a[0]); return a; } const lt = comp ?? ((x: any, y: any) => x < y); return lt(a, b) ? b : a; }
function trunc(x: number): number { return Math.trunc(x); }
/* stdbool: true/false are native in TypeScript */
const stdin = { __fd: 0, __name: 'stdin' }, stdout = { __fd: 1, __name: 'stdout' }, stderr = { __fd: 2, __name: 'stderr' };
const NULL = null;
const NAN = NaN, INFINITY_C = Infinity, HUGE_VAL = Infinity, HUGE_VALF = Infinity, HUGE_VALL = Infinity, M_PI = 3.141592653589793, M_PI_2 = 1.5707963267948966, M_PI_4 = 0.7853981633974483, M_1_PI = 0.3183098861837907, M_2_PI = 0.6366197723675814, M_2_SQRTPI = 1.1283791670955126, M_E = 2.718281828459045, M_LOG2E = 1.4426950408889634, M_LOG10E = 0.4342944819032518, M_LN2 = 0.6931471805599453, M_LN10 = 2.302585092994046, M_SQRT2 = 1.4142135623730951, M_SQRT1_2 = 0.7071067811865476;
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

function __struct_ptr_advance(p: any, n: any): any { if (p == null) return p; const delta = Number(n) | 0; if (Array.isArray(p)) return { __arr: p, __idx: delta }; if (p && p.__arr !== undefined) return { __arr: p.__arr, __idx: (p.__idx ?? 0) + delta }; if (p && p.__cptr_overlay === true) { return cptr_struct_overlay(p.__structT, p.__cptr, (p.__byteOff ?? 0) + delta * (p.__layout?.totalSize ?? 0)); } if (p && p.buf) return { buf: p.buf, off: (p.off ?? 0) + delta }; return p; }

function printf(fmt: string, ...args: any[]): number {
  let result = "", argIdx = 0, i = 0;
  while (i < fmt.length) {
    if (fmt[i] === "%" && i + 1 < fmt.length) {
      i++;
      let flags = ""; while ("-+ 0#".includes(fmt[i])) flags += fmt[i++];
      let width = ""; if (fmt[i] === "*") { width = String(args[argIdx++]); i++; } else { while (fmt[i] >= "0" && fmt[i] <= "9") width += fmt[i++]; }
      let prec = ""; if (fmt[i] === ".") { i++; if (fmt[i] === "*") { prec = String(args[argIdx++]); i++; } else { while (fmt[i] >= "0" && fmt[i] <= "9") prec += fmt[i++]; } }
      let lenMod = ""; if ("hlLzjt".includes(fmt[i])) { lenMod = fmt[i]; i++; if (fmt[i] === fmt[i-1]) { lenMod += fmt[i]; i++; } }
      const is64 = (lenMod === "z" || lenMod === "ll" || lenMod === "j" || lenMod === "L");
      const spec = fmt[i++], a = args[argIdx++], w = width ? parseInt(width) : 0;
      const av = (a && typeof a === "object" && a.__arr !== undefined) ? a.__arr[a.__pos ?? 0] : a;
      let s: string;
      // C17 7.21.6.1: negative values under u/x/X/o with z, ll, j length modifiers
      // render with full 64-bit unsigned wrap so size_t(-1) prints as 18446744073709551615.
      const toUnsignedStr = (v: any, radix: number, upper: boolean): string => {
        if (typeof v === "bigint") {
          const r = BigInt.asUintN(is64 ? 64 : 32, v).toString(radix);
          return upper ? r.toUpperCase() : r;
        }
        const n = Number(v);
        if (is64 && n < 0) {
          let big = BigInt.asUintN(64, BigInt(Math.trunc(n)));
          let r = big.toString(radix);
          return upper ? r.toUpperCase() : r;
        }
        let r = (Math.trunc(n) >>> 0).toString(radix);
        return upper ? r.toUpperCase() : r;
      };
      switch (spec) {
        case "d": case "i": { if (typeof av === "bigint") { const n = is64 ? BigInt.asIntN(64, av) : av; let mag = (n < 0n ? -n : n).toString(); if (prec) { const p = parseInt(prec); if (mag.length < p) mag = mag.padStart(p, "0"); } s = (n < 0n ? "-" : "") + mag; if (n >= 0n && flags.includes("+")) s = "+" + s; else if (n >= 0n && flags.includes(" ")) s = " " + s; break; } const n = Math.trunc(Number(av)); let mag = Math.abs(n).toString(); if (prec) { const p = parseInt(prec); if (mag.length < p) mag = mag.padStart(p, "0"); } s = (n < 0 ? "-" : "") + mag; if (n >= 0 && flags.includes("+")) s = "+" + s; else if (n >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "u": s = toUnsignedStr(av, 10, false); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } break;
        case "x": s = toUnsignedStr(av, 16, false); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } if (flags.includes("#") && s !== "0") s = "0x" + s; break;
        case "X": s = toUnsignedStr(av, 16, true); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } if (flags.includes("#") && s !== "0") s = "0X" + s; break;
        case "o": s = toUnsignedStr(av, 8, false); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } if (flags.includes("#") && !s.startsWith("0")) s = "0" + s; break;
        case "f": case "F": { const aObj: any = av; const nn = Number(aObj); if (Number.isNaN(nn)) { s = spec === "F" ? "NAN" : "nan"; break; } if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + (spec === "F" ? "INF" : "inf"); break; } const isDec = !!(aObj && typeof aObj.toFixed === "function" && typeof aObj.toNumber === "function"); const p = prec ? parseInt(prec) : 6; if (isDec) { s = aObj.toFixed(p); } else { s = nn.toFixed(p); } const isNegZero = !isDec && Object.is(nn, -0); const sign = isDec ? (aObj.isNegative && aObj.isNegative() ? -1 : 1) : (nn < 0 || isNegZero ? -1 : 1); if (isNegZero && !s.startsWith("-")) s = "-" + s; if (sign >= 0 && flags.includes("+")) s = "+" + s; else if (sign >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "e": { const aObj: any = av; const nn = Number(aObj); if (Number.isNaN(nn)) { s = "nan"; break; } if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + "inf"; break; } const isDec = !!(aObj && typeof aObj.toExponential === "function" && typeof aObj.toNumber === "function"); const p = prec ? parseInt(prec) : 6; if (isDec) { s = aObj.toExponential(p); } else { s = nn.toExponential(p); } s = s.replace(/e([+-])(\d)$/, "e$1" + "0$2"); const sign = isDec ? (aObj.isNegative && aObj.isNegative() ? -1 : 1) : (nn < 0 ? -1 : 1); if (sign >= 0 && flags.includes("+")) s = "+" + s; else if (sign >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "E": { const aObj: any = av; const nn = Number(aObj); if (Number.isNaN(nn)) { s = "NAN"; break; } if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + "INF"; break; } const isDec = !!(aObj && typeof aObj.toExponential === "function" && typeof aObj.toNumber === "function"); const p = prec ? parseInt(prec) : 6; if (isDec) { s = aObj.toExponential(p); } else { s = nn.toExponential(p); } s = s.replace(/e([+-])(\d)$/, "e$1" + "0$2").toUpperCase(); const sign = isDec ? (aObj.isNegative && aObj.isNegative() ? -1 : 1) : (nn < 0 ? -1 : 1); if (sign >= 0 && flags.includes("+")) s = "+" + s; else if (sign >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "g": case "G": { const aObj: any = av; const nn = Number(aObj); if (Number.isNaN(nn)) { s = spec === "G" ? "NAN" : "nan"; break; } if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + (spec === "G" ? "INF" : "inf"); break; } const isDec = !!(aObj && typeof aObj.toPrecision === "function" && typeof aObj.toNumber === "function"); const gPrec = prec ? parseInt(prec) : 6; if (isDec) { s = aObj.toPrecision(gPrec); } else { s = nn.toPrecision(gPrec); } s = s.replace(/(\.\d*?)0+(?=e|$)/, "$1").replace(/\.(?=e|$)/, "").replace(/e([+-])(\d)$/, "e$1" + "0$2"); if (spec === "G") s = s.toUpperCase(); const sign = isDec ? (aObj.isNegative && aObj.isNegative() ? -1 : 1) : (nn < 0 ? -1 : 1); if (sign >= 0 && flags.includes("+")) s = "+" + s; else if (sign >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "s": {
          // C17 §7.21.6.1: %s prints a char string; %ls (lenMod 'l') prints
          // a wchar_t string. For wide strings, decode the wchar_t array to
          // UTF-16 code points (null-terminated). Plain JS array of numbers
          // = wchar_t buffer; CPtr or string = char string.
          if (lenMod === "l" && Array.isArray(a)) {
            let r = "";
            for (let i = 0; i < a.length; i++) {
              const cp = Number(a[i] ?? 0);
              if (cp === 0) break;
              r += String.fromCodePoint(cp);
            }
            s = r;
          } else if (a?.buf) {
            s = cptr_to_string(a);
          } else if (a && typeof a === "object" && typeof a.c_str === "function") {
            s = a;
          } else {
            s = "" + (a ?? "");
          }
          if (prec) s = s.slice(0, parseInt(prec));
          break;
        }
        case "a": case "A": { const v = Number(av); if (v === 0) { s = (spec === "A" ? "0X0P+0" : "0x0p+0"); break; } const __bb = new ArrayBuffer(8); new DataView(__bb).setFloat64(0, v, true); const __dv = new DataView(__bb); const __lo = __dv.getUint32(0, true), __hi = __dv.getUint32(4, true); const __sg = (__hi >>> 31) & 1; const __ex = ((__hi >>> 20) & 0x7FF) - 1023; let __m = (__hi & 0xFFFFF).toString(16).padStart(5, "0") + __lo.toString(16).padStart(8, "0"); __m = __m.replace(/0+$/, ""); const __exStr = __ex >= 0 ? ("+" + __ex) : String(__ex); const __head = spec === "A" ? "0X1" : "0x1"; const __mid = __m ? ("." + (spec === "A" ? __m.toUpperCase() : __m)) : ""; const __p = spec === "A" ? "P" : "p"; s = (__sg ? "-" : "") + __head + __mid + __p + __exStr; break; }
        case "c": s = typeof av === "string" ? av.charAt(0) : String.fromCharCode(Number(av)); break;
        case "p": s = "0x" + (Number(av) >>> 0).toString(16); break;
        case "n": { if (a?.buf) new DataView(a.buf.buffer, a.buf.byteOffset).setInt32(a.off ?? 0, result.length, true); else if (a && typeof a === "object" && "value" in a) a.value = result.length; s = ""; break; }
        case "%": s = "%"; argIdx--; break;
        default: s = "%" + spec; argIdx--;
      }
      { let ww = w; let leftAlign = flags.includes("-"); if (ww < 0) { leftAlign = true; ww = -ww; } if (ww > s.length) { const zero = flags.includes("0") && !leftAlign && "diouxXeEfFgG".includes(spec); const padChar = zero ? "0" : " "; const padLen = ww - s.length; const pad = padChar.repeat(padLen); /* C17 §7.21.6.1: zero-pad goes BETWEEN the sign and the magnitude, not before the sign. Same for 0x/0X prefixes added by # flag. */ if (zero && !leftAlign && (s.startsWith("-") || s.startsWith("+") || s.startsWith(" "))) { s = s[0] + pad + s.slice(1); } else if (zero && !leftAlign && (s.startsWith("0x") || s.startsWith("0X"))) { s = s.slice(0, 2) + pad + s.slice(2); } else { s = leftAlign ? s + pad : pad + s; } } }
      result += s;
    } else { result += fmt[i++]; }
  }
  // Reference _fileHandles via globalThis to avoid TS2304 in TUs that don't
  // include the file-IO injection block (no fopen/fclose/fgets in the source).
  // The runtime check still works either way.
  const __fh: any = (globalThis as any)._fileHandles;
  if (typeof stdout === "object" && stdout && typeof (stdout as any).__fd === "number" && __fh) {
    const h = __fh.get((stdout as any).__fd);
    if (h) {
      const buf = Buffer.from(result);
      require("fs").writeSync(h.fd, buf, 0, buf.length, h.pos);
      h.pos += buf.length;
      return result.length;
    }
  }
  process.stdout.write(result);
  return result.length;
}
function strlen(s: any): number { if (s == null) return 0; if (typeof s === 'string') return s.length; if (s.buf) return cptr_strlen(s); if (Array.isArray(s)) { let i = 0; while (s[i] !== 0 && s[i] !== undefined && i < s.length) i++; return i; } return s?.length ?? 0; }
export const JSMN_UNDEFINED: number = 0;
export const JSMN_OBJECT: number = ((1 << 0) | 0);
export const JSMN_ARRAY: number = ((1 << 1) | 0);
export const JSMN_STRING: number = ((1 << 2) | 0);
export const JSMN_PRIMITIVE: number = ((1 << 3) | 0);

type jsmntype_t = number;
export type jsmnerr = number;
export const JSMN_ERROR_NOMEM: number = -1;
export const JSMN_ERROR_INVAL: number = -2;
export const JSMN_ERROR_PART: number = -3;

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class jsmntok {
  type: jsmntype_t;
  start: number;
  end: number;
  size: number;
  constructor() {
    this.type = undefined;
    this.start = 0;
    this.end = 0;
    this.size = 0;
  }
}
const jsmntok_t = jsmntok;
type jsmntok_t = jsmntok;
(jsmntok as any).__fieldTypes = ["int32","int32","int32","int32"];
(jsmntok as any).__fieldNames = ["type","start","end","size"];
(jsmntok as any).__fieldOffsets = [0,8,12,16];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class jsmn_parser {
  pos: number;
  toknext: number;
  toksuper: number;
  constructor() {
    this.pos = 0;
    this.toknext = 0;
    this.toksuper = 0;
  }
}
(jsmn_parser as any).__fieldTypes = ["int32","int32","int32"];
(jsmn_parser as any).__fieldNames = ["pos","toknext","toksuper"];
(jsmn_parser as any).__fieldOffsets = [0,4,8];

function jsmn_alloc_token(parser: jsmn_parser | null, tokens: jsmntok_t | null, num_tokens: number): jsmntok_t | null {
  let tok = null;
  if ((((((__struct_ptr_at(parser, 0)).toknext) >>> 0)) >>> 0) >= ((num_tokens) >>> 0)) {
    return null;
  }
  tok = __struct_ptr_advance(tokens, (() => { const _t = (__struct_ptr_at(parser, 0)).toknext; (__struct_ptr_at(parser, 0)).toknext = u32((__struct_ptr_at(parser, 0)).toknext + 1); return _t; })());
  (__struct_ptr_at(tok, 0)).start = (__struct_ptr_at(tok, 0)).end = -1;
  (__struct_ptr_at(tok, 0)).size = 0;
  return tok;
}

function jsmn_fill_token(token: jsmntok_t | null, type: jsmntype_t, start: number, end: number): void {
  (__struct_ptr_at(token, 0)).type = type;
  (__struct_ptr_at(token, 0)).start = start;
  (__struct_ptr_at(token, 0)).end = end;
  (__struct_ptr_at(token, 0)).size = 0;
}

function jsmn_parse_primitive(parser: jsmn_parser | null, js: any, len: number, tokens: jsmntok_t | null, num_tokens: number): number {
  if (typeof js === 'string') js = cptr_from_string(js);

  let token: jsmntok_t | null = null;
  let start: number = 0;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      token = null;
      start = 0;
      start = (((((__struct_ptr_at(parser, 0)).pos) >>> 0)) | 0);
      for (; (((((((__struct_ptr_at(parser, 0)).pos) >>> 0)) >>> 0) < ((len) >>> 0) && ((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) != 0) ? 1 : 0); (() => { const _t = (__struct_ptr_at(parser, 0)).pos; (__struct_ptr_at(parser, 0)).pos = u32((__struct_ptr_at(parser, 0)).pos + 1); return _t; })()) {
        switch (((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24)) {
          case 58:
            case 9:
              case 13:
                case 10:
                  case 32:
                    case 44:
                      case 93:
                        case 125:
                        {
                          _state = 1; continue _sm; /* goto found */
                        }
          default:
          {
            break;
          }
        }
        if (((((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) < 32 || ((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) >= 127) ? 1 : 0)) {
          (__struct_ptr_at(parser, 0)).pos = ((start) >>> 0);
          return JSMN_ERROR_INVAL;
        }
      }
    case 1: /* found */
      if (tokens == (null)) {
        (() => { const _t = (__struct_ptr_at(parser, 0)).pos; (__struct_ptr_at(parser, 0)).pos = u32((__struct_ptr_at(parser, 0)).pos - 1); return _t; })();
        return 0;
      }
      token = jsmn_alloc_token(parser, tokens, ((num_tokens) >>> 0));
      if (token == (null)) {
        (__struct_ptr_at(parser, 0)).pos = ((start) >>> 0);
        return JSMN_ERROR_NOMEM;
      }
      jsmn_fill_token(token, JSMN_PRIMITIVE, start, (((((__struct_ptr_at(parser, 0)).pos) >>> 0)) | 0));
      (() => { const _t = (__struct_ptr_at(parser, 0)).pos; (__struct_ptr_at(parser, 0)).pos = u32((__struct_ptr_at(parser, 0)).pos - 1); return _t; })();
      return 0;
      break _sm;
    }
  }
}

function jsmn_parse_string(parser: jsmn_parser | null, js: any, len: number, tokens: jsmntok_t | null, num_tokens: number): number {
  if (typeof js === 'string') js = cptr_from_string(js);

  let token = null;
  let start = (((((__struct_ptr_at(parser, 0)).pos) >>> 0)) | 0);
  (() => { const _t = (__struct_ptr_at(parser, 0)).pos; (__struct_ptr_at(parser, 0)).pos = u32((__struct_ptr_at(parser, 0)).pos + 1); return _t; })();
  for (; (((((((__struct_ptr_at(parser, 0)).pos) >>> 0)) >>> 0) < ((len) >>> 0) && ((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) != 0) ? 1 : 0); (() => { const _t = (__struct_ptr_at(parser, 0)).pos; (__struct_ptr_at(parser, 0)).pos = u32((__struct_ptr_at(parser, 0)).pos + 1); return _t; })()) {
    let c = ((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24);
    if (((c) << 24 >> 24) == 34) {
      if (tokens == (null)) {
        return 0;
      }
      token = jsmn_alloc_token(parser, tokens, ((num_tokens) >>> 0));
      if (token == (null)) {
        (__struct_ptr_at(parser, 0)).pos = ((start) >>> 0);
        return JSMN_ERROR_NOMEM;
      }
      jsmn_fill_token(token, JSMN_STRING, i32(start + 1), (((((__struct_ptr_at(parser, 0)).pos) >>> 0)) | 0));
      return 0;
    }
    if (((((c) << 24 >> 24) == 92 && ((u32((((__struct_ptr_at(parser, 0)).pos) >>> 0) + ((1) >>> 0))) >>> 0) < ((len) >>> 0)) ? 1 : 0)) {
      let i = 0;
      (() => { const _t = (__struct_ptr_at(parser, 0)).pos; (__struct_ptr_at(parser, 0)).pos = u32((__struct_ptr_at(parser, 0)).pos + 1); return _t; })();
      switch (((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24)) {
        case 34:
          case 47:
            case 92:
              case 98:
                case 102:
                  case 114:
                    case 110:
                      case 116:
                      {
                        break;
                      }
        case 117:
        {
          (() => { const _t = (__struct_ptr_at(parser, 0)).pos; (__struct_ptr_at(parser, 0)).pos = u32((__struct_ptr_at(parser, 0)).pos + 1); return _t; })();
        for (i = 0; ((((i < 4 && (((((__struct_ptr_at(parser, 0)).pos) >>> 0)) >>> 0) < ((len) >>> 0)) ? 1 : 0) && ((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) != 0) ? 1 : 0); i++) {
          if (!((((((((((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) >= 48 && ((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) <= 57) ? 1 : 0)) || (((((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) >= 65 && ((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) <= 70) ? 1 : 0))) ? 1 : 0) || (((((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) >= 97 && ((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) <= 102) ? 1 : 0))) ? 1 : 0))) {
            (__struct_ptr_at(parser, 0)).pos = ((start) >>> 0);
            return JSMN_ERROR_INVAL;
          }
          (() => { const _t = (__struct_ptr_at(parser, 0)).pos; (__struct_ptr_at(parser, 0)).pos = u32((__struct_ptr_at(parser, 0)).pos + 1); return _t; })();
        }
        (() => { const _t = (__struct_ptr_at(parser, 0)).pos; (__struct_ptr_at(parser, 0)).pos = u32((__struct_ptr_at(parser, 0)).pos - 1); return _t; })();
        break;
        }
        default:
        {
          (__struct_ptr_at(parser, 0)).pos = ((start) >>> 0);
        return JSMN_ERROR_INVAL;
        }
      }
    }
  }
  (__struct_ptr_at(parser, 0)).pos = ((start) >>> 0);
  return JSMN_ERROR_PART;
}

export function jsmn_parse(parser: jsmn_parser | null, js: CPtr, len: number, tokens: jsmntok_t | null, num_tokens: number): number {
  if (typeof js === 'string') js = cptr_from_string(js);

  let r = 0;
  let i = 0;
  let token = null;
  let count = (((((__struct_ptr_at(parser, 0)).toknext) >>> 0)) | 0);
  for (; (((((((__struct_ptr_at(parser, 0)).pos) >>> 0)) >>> 0) < ((len) >>> 0) && ((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24) != 0) ? 1 : 0); (() => { const _t = (__struct_ptr_at(parser, 0)).pos; (__struct_ptr_at(parser, 0)).pos = u32((__struct_ptr_at(parser, 0)).pos + 1); return _t; })()) {
    let c = 0;
    let type = undefined;
    c = (((js.buf[(js.off ?? 0) + (((__struct_ptr_at(parser, 0)).pos) >>> 0)]) << 24 >> 24)) << 24 >> 24;
    switch (((c) << 24 >> 24)) {
      case 123:
        case 91:
        {
          count++;
      if (tokens == (null)) {
        break;
      }
      token = jsmn_alloc_token(parser, tokens, ((((num_tokens) >>> 0)) >>> 0));
      if (token == (null)) {
        return JSMN_ERROR_NOMEM;
      }
      if ((__struct_ptr_at(parser, 0)).toksuper != -1) {
        let t = __struct_ptr_advance(tokens, (__struct_ptr_at(parser, 0)).toksuper); /* &ref */
        (__struct_ptr_at(t, 0)).size++;
      }
      (__struct_ptr_at(token, 0)).type = ((((c) << 24 >> 24) == 123 ? JSMN_OBJECT : JSMN_ARRAY));
      (__struct_ptr_at(token, 0)).start = (((((__struct_ptr_at(parser, 0)).pos) >>> 0)) | 0);
      (__struct_ptr_at(parser, 0)).toksuper = ((u32((((__struct_ptr_at(parser, 0)).toknext) >>> 0) - ((1) >>> 0))) | 0);
      break;
        }
      case 125:
        case 93:
          {
            if (tokens == (null)) {
              break;
            }
          }
      type = ((((c) << 24 >> 24) == 125 ? JSMN_OBJECT : JSMN_ARRAY));
      for (i = ((u32((((__struct_ptr_at(parser, 0)).toknext) >>> 0) - ((1) >>> 0))) | 0); i >= 0; i--) {
        token = __struct_ptr_advance(tokens, i);
        if ((((__struct_ptr_at(token, 0)).start != -1 && (__struct_ptr_at(token, 0)).end == -1) ? 1 : 0)) {
          if ((__struct_ptr_at(token, 0)).type != type) {
            return JSMN_ERROR_INVAL;
          }
          (__struct_ptr_at(parser, 0)).toksuper = -1;
          (__struct_ptr_at(token, 0)).end = ((u32((((__struct_ptr_at(parser, 0)).pos) >>> 0) + ((1) >>> 0))) | 0);
          break;
        }
      }
      if (i == -1) {
        return JSMN_ERROR_INVAL;
      }
      for (; i >= 0; i--) {
        token = __struct_ptr_advance(tokens, i);
        if ((((__struct_ptr_at(token, 0)).start != -1 && (__struct_ptr_at(token, 0)).end == -1) ? 1 : 0)) {
          (__struct_ptr_at(parser, 0)).toksuper = i;
          break;
        }
      }
      break;
      case 34:
      {
        r = jsmn_parse_string(parser, cptr_clone(js), ((len) >>> 0), tokens, ((((num_tokens) >>> 0)) >>> 0));
      if (r < 0) {
        return r;
      }
      count++;
      if ((((__struct_ptr_at(parser, 0)).toksuper != -1 && tokens != (null)) ? 1 : 0)) {
        __struct_ptr_at(tokens, (__struct_ptr_at(parser, 0)).toksuper).size++;
      }
      break;
      }
      case 9:
        case 13:
          case 10:
            case 32:
            {
              break;
            }
      case 58:
      {
        (__struct_ptr_at(parser, 0)).toksuper = ((u32((((__struct_ptr_at(parser, 0)).toknext) >>> 0) - ((1) >>> 0))) | 0);
      break;
      }
      case 44:
        {
          if (((((((tokens != (null) && (__struct_ptr_at(parser, 0)).toksuper != -1) ? 1 : 0) && __struct_ptr_at(tokens, (__struct_ptr_at(parser, 0)).toksuper).type != JSMN_ARRAY) ? 1 : 0) && __struct_ptr_at(tokens, (__struct_ptr_at(parser, 0)).toksuper).type != JSMN_OBJECT) ? 1 : 0)) {
            for (i = ((u32((((__struct_ptr_at(parser, 0)).toknext) >>> 0) - ((1) >>> 0))) | 0); i >= 0; i--) {
              if (((__struct_ptr_at(tokens, i).type == JSMN_ARRAY || __struct_ptr_at(tokens, i).type == JSMN_OBJECT) ? 1 : 0)) {
                if (((__struct_ptr_at(tokens, i).start != -1 && __struct_ptr_at(tokens, i).end == -1) ? 1 : 0)) {
                  (__struct_ptr_at(parser, 0)).toksuper = i;
                  break;
                }
              }
            }
          }
        }
      break;
      default:
      {
        r = jsmn_parse_primitive(parser, cptr_clone(js), ((len) >>> 0), tokens, ((((num_tokens) >>> 0)) >>> 0));
      if (r < 0) {
        return r;
      }
      count++;
      if ((((__struct_ptr_at(parser, 0)).toksuper != -1 && tokens != (null)) ? 1 : 0)) {
        __struct_ptr_at(tokens, (__struct_ptr_at(parser, 0)).toksuper).size++;
      }
      break;
      }
    }
  }
  if (tokens != (null)) {
    for (i = ((u32((((__struct_ptr_at(parser, 0)).toknext) >>> 0) - ((1) >>> 0))) | 0); i >= 0; i--) {
      if (((__struct_ptr_at(tokens, i).start != -1 && __struct_ptr_at(tokens, i).end == -1) ? 1 : 0)) {
        return JSMN_ERROR_PART;
      }
    }
  }
  return count;
}

export function jsmn_init(parser: jsmn_parser | null): void {
  (__struct_ptr_at(parser, 0)).pos = ((0) >>> 0);
  (__struct_ptr_at(parser, 0)).toknext = ((0) >>> 0);
  (__struct_ptr_at(parser, 0)).toksuper = -1;
}

const JSON_STRING = cptr_clone("{\"user\": \"johndoe\", \"admin\": false, \"uid\": 1000,\n  \"groups\": [\"users\", \"wheel\", \"audio\", \"video\"]}"); /* &ref */
function jsoneq(json: string, tok: jsmntok_t | null, s: string): number {
  if ((((((__struct_ptr_at(tok, 0)).type == JSMN_STRING && (Math.trunc(+(strlen(cptr_clone(s)))) | 0) == i32((__struct_ptr_at(tok, 0)).end - (__struct_ptr_at(tok, 0)).start)) ? 1 : 0) && strncmp(cptr_offset(json, (__struct_ptr_at(tok, 0)).start), cptr_clone(s), i32((__struct_ptr_at(tok, 0)).end - (__struct_ptr_at(tok, 0)).start)) == 0) ? 1 : 0)) {
    return 0;
  }
  return -1;
}

export function main(): number {
  let i = 0;
  let r = 0;
  let p = new jsmn_parser();
  let t = Array.from({length: 128}, () => new jsmntok_t());
  jsmn_init(p);
  r = jsmn_parse(p, cptr_clone(JSON_STRING), strlen(cptr_clone(JSON_STRING)), t, ((__safe_div(3072, 24)) >>> 0));
  if (r < 0) {
    printf("Failed to parse JSON: %d\n", r);
    return 1;
  }
  if (((r < 1 || t[0].type != JSMN_OBJECT) ? 1 : 0)) {
    printf("Object expected\n");
    return 1;
  }
  for (i = 1; i < r; i++) {
    if (jsoneq(cptr_clone(JSON_STRING), __struct_ptr_advance(t, i), "user") == 0) {
      printf("- User: %.*s\n", i32(t[i32(i + 1)].end - t[i32(i + 1)].start), cptr_offset(JSON_STRING, t[i32(i + 1)].start));
      i++;
    } else {
      if (jsoneq(cptr_clone(JSON_STRING), __struct_ptr_advance(t, i), "admin") == 0) {
        printf("- Admin: %.*s\n", i32(t[i32(i + 1)].end - t[i32(i + 1)].start), cptr_offset(JSON_STRING, t[i32(i + 1)].start));
        i++;
      } else {
        if (jsoneq(cptr_clone(JSON_STRING), __struct_ptr_advance(t, i), "uid") == 0) {
          printf("- UID: %.*s\n", i32(t[i32(i + 1)].end - t[i32(i + 1)].start), cptr_offset(JSON_STRING, t[i32(i + 1)].start));
          i++;
        } else {
          if (jsoneq(cptr_clone(JSON_STRING), __struct_ptr_advance(t, i), "groups") == 0) {
            let j = 0;
            printf("- Groups:\n");
            if (t[i32(i + 1)].type != JSMN_ARRAY) {
              continue;
            }
            for (j = 0; j < t[i32(i + 1)].size; j++) {
              let g = __struct_ptr_advance(t, i32(i32(i + j) + 2)); /* &ref */
              printf("  * %.*s\n", i32((__struct_ptr_at(g, 0)).end - (__struct_ptr_at(g, 0)).start), cptr_offset(JSON_STRING, (__struct_ptr_at(g, 0)).start));
            }
            i = i32(i + i32(t[i32(i + 1)].size + 1));
          } else {
            printf("Unexpected key: %.*s\n", i32(t[i].end - t[i].start), cptr_offset(JSON_STRING, t[i].start));
          }
        }
      }
    }
  }
  return 0;
}

