function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
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
function cptr_offset(ptr: any, n: number): any { if (typeof ptr === 'string') { /* C17 §6.5.6 pointer arithmetic chains: s+ls-lp lowers to cptr_offset(cptr_offset(s,ls),-lp). On a JS string the first substring drops absolute position; convert to CPtr so the chain composes. */ const __b = new Uint8Array(ptr.length + 1); for (let __i = 0; __i < ptr.length; __i++) __b[__i] = ptr.charCodeAt(__i); return { buf: __b, off: Number(n) }; } if (ptr && ptr.__field_ref === true) { return { __field_ref: true, __owner: ptr.__owner, __owner_type: ptr.__owner_type, __field_name: ptr.__field_name, __field_offset: ptr.__field_offset, __byte_delta: (ptr.__byte_delta ?? 0) + Number(n) }; } if (ptr && ptr.__field_at_offset === true) { return { __field_at_offset: true, __owner: ptr.__owner, __byte_offset: (ptr.__byte_offset ?? 0) + Number(n) }; } /* BRIDGE: pointer-array — C17 §6.7.6.2 array-of-pointers (T*[N]) decays to T** (§6.3.2.1). When a slot-bearing CPtr (slots+__ptr_arr) is incremented, scale n by 8 (LLP64 sizeof(void*)) so cptr_read_ptr's off>>3 advances slot-by-slot, not byte-by-byte. */ if (ptr?.buf && ptr.__ptr_arr === true) return { buf: ptr.buf, off: (ptr.off ?? 0) + Number(n) * 8, slots: ptr.slots, __ptr_arr: true }; if (ptr?.buf) return { buf: ptr.buf, off: (ptr.off ?? 0) + n, __src_arr: ptr.__src_arr, __src_writer: ptr.__src_writer, __elem_size: ptr.__elem_size, __class_byte_view: ptr.__class_byte_view, __instance: ptr.__instance, __layout: ptr.__layout }; if (Array.isArray(ptr)) { /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: const T *arr[N] init-then-decay produces a T** that survives cptr_offset/cptr_read_ptr. Detect "JS array of pointers" by element shape (CPtr-like {buf,...} or null) and lift to a slot-bearing CPtr. Plain numeric arrays fall through to the int32-DataView path. */ const isPtrArr = ptr.length > 0 && ptr.some((e: any) => e == null || (typeof e === 'object' && (e?.buf || e?.slots))); if (isPtrArr) { return { buf: new Uint8Array(ptr.length * 8), off: Number(n) * 8, slots: ptr.slice(), __ptr_arr: true }; } const b = new Uint8Array(ptr.length * 4); const v = new DataView(b.buffer); for (let i = 0; i < ptr.length; i++) v.setInt32(i * 4, ptr[i], true); return { buf: b, off: n }; } if (ptr && typeof ptr === 'object' && !ptr.__cptr_overlay && !ptr.__arr && ptr.constructor && (ptr.constructor as any).__fieldNames) { return { __field_at_offset: true, __owner: ptr, __byte_offset: Number(n) }; } return ptr; }
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
function memcpy(dst: any, src: any, n: number): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 if (dst?.buf && src?.buf) { cptr_copy(dst, src, n); /* C17 §6.7.6.1: when src is a slot-bearing CPtr (T** array), copy the parallel slot references into dst so pointer identity survives the byte-copy. Slot stride is 8 bytes (LLP64 sizeof(void*)); slot indices align with byte offset >> 3. */ if ((src as any).slots) { const dstAny: any = dst; if (!dstAny.slots) dstAny.slots = []; const srcSlotBase = ((src.off ?? 0) >> 3); const dstSlotBase = ((dst.off ?? 0) >> 3); const slotCount = Math.floor(n / 8); for (let i = 0; i < slotCount; i++) dstAny.slots[dstSlotBase + i] = (src as any).slots[srcSlotBase + i] ?? null; } return dst; } if (dst?.buf && typeof src === 'string') { for (let i = 0; i < n && i < src.length; i++) dst.buf[dst.off + i] = src.charCodeAt(i); return dst; } if (dst?.buf && src && typeof src === 'object' && 'value' in src && typeof src.value === 'number') { const dv = new DataView(dst.buf.buffer, dst.buf.byteOffset + dst.off); if (n >= 4) dv.setInt32(0, src.value, true); else if (n >= 2) dv.setInt16(0, src.value, true); else dv.setInt8(0, src.value); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src?.buf) { /* BRIDGE: memcpy(box, cptr, n) — read N bytes from a CPtr into a {value} box. C17 §7.24.2.1. n=8 → bigint64 (signed). n=4 → int32. n=2 → int16. n=1 → int8. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const off = src.off ?? 0; if (n >= 8) { const bv = dv.getBigInt64(off, true); dst.value = (typeof dst.value === 'bigint') ? bv : Number(bv); } else if (n >= 4) dst.value = dv.getInt32(off, true); else if (n >= 2) dst.value = dv.getInt16(off, true); else dst.value = dv.getInt8(off); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src && typeof src === 'object' && 'value' in src) { /* C17 §6.5 type-pun via memcpy: reinterpret src.value bytes as dst's type. n=4: int32<->float32. n=8: int64<->float64 (via bigint). */ const __b = new Uint8Array(8); const __dv = new DataView(__b.buffer); const __s = src.value; const __d = dst.value; if (n === 4) { if (Number.isInteger(__s) && !Number.isInteger(__d) && typeof __d === 'number') { __dv.setInt32(0, __s | 0, true); dst.value = __dv.getFloat32(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat32(0, __s, true); dst.value = __dv.getInt32(0, true); } else { dst.value = __s; } } else if (n === 8) { if (typeof __s === 'bigint' && typeof __d !== 'bigint') { __dv.setBigInt64(0, __s, true); dst.value = __dv.getFloat64(0, true); } else if (typeof __s !== 'bigint' && typeof __d === 'bigint') { __dv.setFloat64(0, Number(__s), true); dst.value = __dv.getBigInt64(0, true); } else if (Number.isInteger(__s) && !Number.isInteger(__d)) { __dv.setBigInt64(0, BigInt(Math.trunc(__s)), true); dst.value = __dv.getFloat64(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat64(0, __s, true); dst.value = Number(__dv.getBigInt64(0, true)); } else { dst.value = __s; } } else { dst.value = __s; } return dst; } if (Array.isArray(dst) && src && src.buf) { /* BRIDGE: memcpy(Array, CPtr, n) — destination is a JS Array decayed from a struct/array of i64/i32/etc., source is a CPtr backed by a Uint8Array. Read element-wise via DataView using src.__elem_size when available, defaulting to 8 (int64 — covers curve25519 fcontract / fmonty origx<-x and BLAKE2 buffer staging). C17 §7.24.2.1: memcpy copies n bytes; element-size routing is the byte-addressable lowering for an i64 destination. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const baseOff = src.off ?? 0; const elemSize = (src.__elem_size as number) || 8; const count = Math.floor(n / elemSize); for (let i = 0; i < count; i++) { const eoff = baseOff + i * elemSize; if (elemSize === 8) dst[i] = dv.getBigInt64(eoff, true); else if (elemSize === 4) dst[i] = dv.getInt32(eoff, true); else if (elemSize === 2) dst[i] = dv.getInt16(eoff, true); else dst[i] = dv.getInt8(eoff); } return dst; } if (Array.isArray(dst) && Array.isArray(src)) { for (let i = 0; i < n; i++) dst[i] = src[i]; } else if (typeof dst === 'object' && typeof src === 'object') Object.assign(dst, src); return dst; }
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
function count(first: any, last: any, value: any): number { const A = __cpp_arr(first, last); let n = 0; for (let i = A.start; i < A.end; i++) if (A.arr[i] === value) n++; return n; }
function fill(first: any, last: any, value: any): void { const A = __cpp_arr(first, last); for (let i = A.start; i < A.end; i++) A.arr[i] = value; }
function __builtin_expect(x: any, v: any): any { return x; }
function memmove(dst: any, src: any, n: number): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
  if (typeof src === 'string') src = cptr_from_string(src);
 if (dst?.buf && src?.buf) { const tmp = new Uint8Array(n); for (let i = 0; i < n; i++) tmp[i] = src.buf[src.off + i] ?? 0; for (let i = 0; i < n; i++) dst.buf[dst.off + i] = tmp[i]; return dst; } if (Array.isArray(dst) && Array.isArray(src)) { const tmp = src.slice(0, n); for (let i = 0; i < n; i++) dst[i] = tmp[i]; } else if (typeof dst === 'object' && typeof src === 'object') Object.assign(dst, src); return dst; }
function trunc(x: number): number { return Math.trunc(x); }
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

function fastlz_memmove(dest: any | null, src: any | null, count: number): void {
  if (typeof dest === 'string') dest = cptr_from_string(dest);
  if (typeof src === 'string') src = cptr_from_string(src);

  if ((((((count) >>> 0) > ((4) >>> 0)) && (((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) >= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) >= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) >= (__r ?? 0)); })(dest, cptr_offset(src, ((count) >>> 0))))) ? 1 : 0)) {
    memmove(dest, src, ((count) >>> 0));
  } else {
    switch (((count) >>> 0)) {
      default:
        {
          do {
            (dest.buf[dest.off++]) = ((((src.buf[src.off++])) & 0xFF)) & 0xFF;
          } while ((count = u32(count - 1)));
        }
      break;
      case ((3) >>> 0):
      {
        (dest.buf[dest.off++]) = ((((src.buf[src.off++])) & 0xFF)) & 0xFF;
      }
      case ((2) >>> 0):
      {
        (dest.buf[dest.off++]) = ((((src.buf[src.off++])) & 0xFF)) & 0xFF;
      }
      case ((1) >>> 0):
      {
        (dest.buf[dest.off++]) = ((((src.buf[src.off++])) & 0xFF)) & 0xFF;
      }
      case ((0) >>> 0):
      {
        break;
      }
    }
  }
}

function fastlz_memcpy(dest: any | null, src: any | null, count: number): void {
  memcpy(dest, src, ((count) >>> 0));
}

function flz_readu32(ptr: any | null): number {
  return ((cptr_read_uint32((ptr))) >>> 0);
}

function flz_cmp(p: any | null, q: any | null, r: any | null): number {
  if (typeof p === 'string') p = cptr_from_string(p);
  if (typeof q === 'string') q = cptr_from_string(q);

  let start = cptr_clone(cptr_clone(p)); /* &ref */
  if (flz_readu32(p) == flz_readu32(q)) {
    p = cptr_offset(p, 4);
    q = cptr_offset(q, 4);
  }
  while (((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) < __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(q, r)) {
    if ((((p.buf[p.off++])) & 0xFF) != (((q.buf[q.off++])) & 0xFF)) {
      break;
    }
  }
  return ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(p, start)) >>> 0);
}

function flz_hash(v: number): number {
  let h = ((Number(BigInt.asUintN(32, __as_bigint(__i64(__as_bigint((__i64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((v) >>> 0)) * __as_bigint(2654435769n)))) >> __as_bigint((i32(32 - 13)))))))) >>> 0);
  return (((((h) >>> 0) & (((i32((((1 << 13) | 0)) - 1))) >>> 0)) >>> 0) & 0xFFFF);
}

function flz_smallcopy(dest: any | null, src: any | null, count: number): void {
  if (((count) >>> 0) >= ((4) >>> 0)) {
    let p = cptr_clone((src)); /* &ref */
    let q = cptr_clone((dest)); /* &ref */
    while (((count) >>> 0) > ((4) >>> 0)) {
      cptr_write_uint32((() => { const __v = q; q = cptr_offset(q, 4); return __v; })(), 0, (((() => { const __v = cptr_read_uint32(p); p.off += 4; return __v; })()) >>> 0));
      count = u32(count - ((4) >>> 0));
      dest = cptr_offset(dest, 4);
      src = cptr_offset(src, 4);
    }
  }
  fastlz_memcpy(cptr_clone(dest), cptr_clone(src), ((count) >>> 0));
}

function flz_maxcopy(dest: any | null, src: any | null): void {
  let p = cptr_clone((src)); /* &ref */
  let q = cptr_clone((dest)); /* &ref */
  cptr_write_uint32((() => { const __v = q; q = cptr_offset(q, 4); return __v; })(), 0, (((() => { const __v = cptr_read_uint32(p); p.off += 4; return __v; })()) >>> 0));
  cptr_write_uint32((() => { const __v = q; q = cptr_offset(q, 4); return __v; })(), 0, (((() => { const __v = cptr_read_uint32(p); p.off += 4; return __v; })()) >>> 0));
  cptr_write_uint32((() => { const __v = q; q = cptr_offset(q, 4); return __v; })(), 0, (((() => { const __v = cptr_read_uint32(p); p.off += 4; return __v; })()) >>> 0));
  cptr_write_uint32((() => { const __v = q; q = cptr_offset(q, 4); return __v; })(), 0, (((() => { const __v = cptr_read_uint32(p); p.off += 4; return __v; })()) >>> 0));
  cptr_write_uint32((() => { const __v = q; q = cptr_offset(q, 4); return __v; })(), 0, (((() => { const __v = cptr_read_uint32(p); p.off += 4; return __v; })()) >>> 0));
  cptr_write_uint32((() => { const __v = q; q = cptr_offset(q, 4); return __v; })(), 0, (((() => { const __v = cptr_read_uint32(p); p.off += 4; return __v; })()) >>> 0));
  cptr_write_uint32((() => { const __v = q; q = cptr_offset(q, 4); return __v; })(), 0, (((() => { const __v = cptr_read_uint32(p); p.off += 4; return __v; })()) >>> 0));
  cptr_write_uint32((() => { const __v = q; q = cptr_offset(q, 4); return __v; })(), 0, (((() => { const __v = cptr_read_uint32(p); p.off += 4; return __v; })()) >>> 0));
}

function flz_literals(runs: number, src: any | null, dest: any | null): any | null {
  if (typeof dest === 'string') dest = cptr_from_string(dest);

  while (((runs) >>> 0) >= ((32) >>> 0)) {
    (dest.buf[dest.off++]) = (((i32(32 - 1)) & 0xFF)) & 0xFF;
    flz_maxcopy(dest, src);
    src = cptr_offset(src, 32);
    dest = cptr_offset(dest, 32);
    runs = u32(runs - ((32) >>> 0));
  }
  if (((runs) >>> 0) > ((0) >>> 0)) {
    (dest.buf[dest.off++]) = (((u32(((runs) >>> 0) - ((1) >>> 0))) & 0xFF)) & 0xFF;
    flz_smallcopy(cptr_clone(dest), cptr_clone(src), ((runs) >>> 0));
    dest = cptr_offset(dest, ((runs) >>> 0));
  }
  return cptr_clone(dest);
}

function flz1_match(len: number, distance: number, op: any | null): any | null {
  if (typeof op === 'string') op = cptr_from_string(op);

  (distance = u32(distance - 1));
  if ((__builtin_expect(!!(((len) >>> 0) > ((i32(264 - 2)) >>> 0)), 0))) {
    while (((len) >>> 0) > ((i32(264 - 2)) >>> 0)) {
      (op.buf[op.off++]) = (((u32((((((7 << 5) | 0))) >>> 0) + ((((distance) >>> 0) >>> 8) >>> 0))) & 0xFF)) & 0xFF;
      (op.buf[op.off++]) = (((i32(i32(i32(264 - 2) - 7) - 2)) & 0xFF)) & 0xFF;
      (op.buf[op.off++]) = (((((((distance) >>> 0) & ((255) >>> 0)) >>> 0)) & 0xFF)) & 0xFF;
      len = u32(len - ((i32(264 - 2)) >>> 0));
    }
  }
  if (((len) >>> 0) < ((7) >>> 0)) {
    (op.buf[op.off++]) = (((u32(((((len) >>> 0) << 5) >>> 0) + ((((distance) >>> 0) >>> 8) >>> 0))) & 0xFF)) & 0xFF;
    (op.buf[op.off++]) = (((((((distance) >>> 0) & ((255) >>> 0)) >>> 0)) & 0xFF)) & 0xFF;
  } else {
    (op.buf[op.off++]) = (((u32((((((7 << 5) | 0))) >>> 0) + ((((distance) >>> 0) >>> 8) >>> 0))) & 0xFF)) & 0xFF;
    (op.buf[op.off++]) = (((u32(((len) >>> 0) - ((7) >>> 0))) & 0xFF)) & 0xFF;
    (op.buf[op.off++]) = (((((((distance) >>> 0) & ((255) >>> 0)) >>> 0)) & 0xFF)) & 0xFF;
  }
  return cptr_clone(op);
}

function fastlz1_compress(input: any | null, length: number, output: any | null): number {
  let ip = cptr_clone(cptr_clone((input))); /* &ref */
  let ip_start = cptr_clone(cptr_clone(ip)); /* &ref */
  let ip_bound = cptr_offset(cptr_offset(ip, length), -(4)); /* &ref */
  let ip_limit = cptr_offset(cptr_offset(cptr_offset(ip, length), -(12)), -(1)); /* &ref */
  let op = cptr_clone(cptr_clone((output))); /* &ref */
  let htab = new Array(8192).fill(0);
  let seq = 0;
  let hash = 0;
  for (hash = ((0) >>> 0); ((hash) >>> 0) < (((((1 << 13) | 0))) >>> 0); (hash = u32(hash + 1))) {
    htab[((hash) >>> 0)] = ((0) >>> 0);
  }
  let anchor = cptr_clone(cptr_clone(ip)); /* &ref */
  ip = cptr_offset(ip, 2);
  while ((__builtin_expect(!!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) < __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(ip, ip_limit)), 1))) {
    let ref = null;
    let distance = 0;
    let cmp = 0;
    do {
      seq = (flz_readu32(ip) & ((16777215) >>> 0)) >>> 0;
      hash = ((flz_hash(((seq) >>> 0))) >>> 0);
      ref = cptr_offset(ip_start, ((htab[((hash) >>> 0)]) >>> 0));
      htab[((hash) >>> 0)] = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ip, ip_start)) >>> 0);
      distance = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ip, ref)) >>> 0);
      cmp = ((__builtin_expect(!!(((distance) >>> 0) < ((8192) >>> 0)), 1)) ? (flz_readu32(ref) & ((16777215) >>> 0)) >>> 0 : ((16777216) >>> 0));
      if ((__builtin_expect(!!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) >= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) >= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) >= (__r ?? 0)); })(ip, ip_limit)), 0))) {
        break;
      }
      ++ip.off;
    } while (((seq) >>> 0) != ((cmp) >>> 0));
    if ((__builtin_expect(!!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) >= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) >= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) >= (__r ?? 0)); })(ip, ip_limit)), 0))) {
      break;
    }
    --ip.off;
    if ((__builtin_expect(!!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) > (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) > __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) > (__r ?? 0)); })(ip, anchor)), 1))) {
      op = flz_literals(((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ip, anchor)) >>> 0), cptr_clone(anchor), cptr_clone(op));
    }
    let len = flz_cmp(cptr_offset(ref, 3), cptr_offset(ip, 3), cptr_clone(ip_bound));
    op = flz1_match(((len) >>> 0), ((distance) >>> 0), cptr_clone(op));
    ip = cptr_offset(ip, ((len) >>> 0));
    seq = flz_readu32(ip);
    hash = ((flz_hash((((seq) >>> 0) & ((16777215) >>> 0)) >>> 0)) >>> 0);
    htab[((hash) >>> 0)] = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ip.off++, ip_start)) >>> 0);
    seq = (seq >>> 8) >>> 0;
    hash = ((flz_hash(((seq) >>> 0))) >>> 0);
    htab[((hash) >>> 0)] = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ip.off++, ip_start)) >>> 0);
    anchor = cptr_clone(ip);
  }
  let copy = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(cptr_offset((input), length), anchor)) >>> 0);
  op = flz_literals(((copy) >>> 0), cptr_clone(anchor), cptr_clone(op));
  return ((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(op, (output));
}

function fastlz1_decompress(input: any | null, length: number, output: any | null, maxout: number): number {
  let ip = cptr_clone(cptr_clone((input))); /* &ref */
  let ip_limit = cptr_offset(ip, length); /* &ref */
  let ip_bound = cptr_offset(ip_limit, -(2)); /* &ref */
  let op = cptr_clone(cptr_clone((output))); /* &ref */
  let op_limit = cptr_offset(op, maxout); /* &ref */
  let ctrl = ((((((ip.buf[ip.off++]))) & 0xFF) & 31) >>> 0);
  while (1) {
    if (((ctrl) >>> 0) >= ((32) >>> 0)) {
      let len = u32(((((ctrl) >>> 0) >>> 5) >>> 0) - ((1) >>> 0));
      let ofs = (((((ctrl) >>> 0) & ((31) >>> 0)) >>> 0) << 8) >>> 0;
      let ref = cptr_offset(cptr_offset(op, -(((ofs) >>> 0))), -(1)); /* &ref */
      if (((len) >>> 0) == ((i32(7 - 1)) >>> 0)) {
        if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) <= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(ip, ip_bound))), 0))) {
          return 0;
        }
        len = u32(len + (((((ip.buf[ip.off++])) & 0xFF)) >>> 0));
      }
      ref = cptr_offset(ref, -((((ip.buf[ip.off++])) & 0xFF)));
      len = u32(len + ((3) >>> 0));
      if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) <= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(cptr_offset(op, ((len) >>> 0)), op_limit))), 0))) {
        return 0;
      }
      if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) >= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) >= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) >= (__r ?? 0)); })(ref, (output)))), 0))) {
        return 0;
      }
      fastlz_memmove(cptr_clone(op), cptr_clone(ref), ((len) >>> 0));
      op = cptr_offset(op, ((len) >>> 0));
    } else {
      (() => { const _t = ctrl; ctrl = u32(ctrl + 1); return _t; })();
      if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) <= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(cptr_offset(op, ((ctrl) >>> 0)), op_limit))), 0))) {
        return 0;
      }
      if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) <= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(cptr_offset(ip, ((ctrl) >>> 0)), ip_limit))), 0))) {
        return 0;
      }
      fastlz_memcpy(cptr_clone(op), cptr_clone(ip), ((ctrl) >>> 0));
      ip = cptr_offset(ip, ((ctrl) >>> 0));
      op = cptr_offset(op, ((ctrl) >>> 0));
    }
    if ((__builtin_expect(!!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) > (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) > __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) > (__r ?? 0)); })(ip, ip_bound)), 0))) {
      break;
    }
    ctrl = (((((ip.buf[ip.off++])) & 0xFF)) >>> 0);
  }
  return ((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(op, (output));
}

function flz2_match(len: number, distance: number, op: any | null): any | null {
  if (typeof op === 'string') op = cptr_from_string(op);

  (distance = u32(distance - 1));
  if (((distance) >>> 0) < ((8191) >>> 0)) {
    if (((len) >>> 0) < ((7) >>> 0)) {
      (op.buf[op.off++]) = (((u32(((((len) >>> 0) << 5) >>> 0) + ((((distance) >>> 0) >>> 8) >>> 0))) & 0xFF)) & 0xFF;
      (op.buf[op.off++]) = (((((((distance) >>> 0) & ((255) >>> 0)) >>> 0)) & 0xFF)) & 0xFF;
    } else {
      (op.buf[op.off++]) = (((u32((((((7 << 5) | 0))) >>> 0) + ((((distance) >>> 0) >>> 8) >>> 0))) & 0xFF)) & 0xFF;
      for (len = u32(len - ((7) >>> 0)); ((len) >>> 0) >= ((255) >>> 0); len = u32(len - ((255) >>> 0))) {
        (op.buf[op.off++]) = (((255) & 0xFF)) & 0xFF;
      }
      (op.buf[op.off++]) = (((((len) >>> 0)) & 0xFF)) & 0xFF;
      (op.buf[op.off++]) = (((((((distance) >>> 0) & ((255) >>> 0)) >>> 0)) & 0xFF)) & 0xFF;
    }
  } else {
    if (((len) >>> 0) < ((7) >>> 0)) {
      distance = u32(distance - ((8191) >>> 0));
      (op.buf[op.off++]) = (((u32(((((len) >>> 0) << 5) >>> 0) + ((31) >>> 0))) & 0xFF)) & 0xFF;
      (op.buf[op.off++]) = (((255) & 0xFF)) & 0xFF;
      (op.buf[op.off++]) = ((((((distance) >>> 0) >>> 8) >>> 0) & 0xFF)) & 0xFF;
      (op.buf[op.off++]) = ((((((distance) >>> 0) & ((255) >>> 0)) >>> 0) & 0xFF)) & 0xFF;
    } else {
      distance = u32(distance - ((8191) >>> 0));
      (op.buf[op.off++]) = (((i32((((7 << 5) | 0)) + 31)) & 0xFF)) & 0xFF;
      for (len = u32(len - ((7) >>> 0)); ((len) >>> 0) >= ((255) >>> 0); len = u32(len - ((255) >>> 0))) {
        (op.buf[op.off++]) = (((255) & 0xFF)) & 0xFF;
      }
      (op.buf[op.off++]) = (((((len) >>> 0)) & 0xFF)) & 0xFF;
      (op.buf[op.off++]) = (((255) & 0xFF)) & 0xFF;
      (op.buf[op.off++]) = ((((((distance) >>> 0) >>> 8) >>> 0) & 0xFF)) & 0xFF;
      (op.buf[op.off++]) = ((((((distance) >>> 0) & ((255) >>> 0)) >>> 0) & 0xFF)) & 0xFF;
    }
  }
  return cptr_clone(op);
}

function fastlz2_compress(input: any | null, length: number, output: any | null): number {
  let ip = cptr_clone(cptr_clone((input))); /* &ref */
  let ip_start = cptr_clone(cptr_clone(ip)); /* &ref */
  let ip_bound = cptr_offset(cptr_offset(ip, length), -(4)); /* &ref */
  let ip_limit = cptr_offset(cptr_offset(cptr_offset(ip, length), -(12)), -(1)); /* &ref */
  let op = cptr_clone(cptr_clone((output))); /* &ref */
  let htab = new Array(8192).fill(0);
  let seq = 0;
  let hash = 0;
  for (hash = ((0) >>> 0); ((hash) >>> 0) < (((((1 << 13) | 0))) >>> 0); (hash = u32(hash + 1))) {
    htab[((hash) >>> 0)] = ((0) >>> 0);
  }
  let anchor = cptr_clone(cptr_clone(ip)); /* &ref */
  ip = cptr_offset(ip, 2);
  while ((__builtin_expect(!!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) < __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(ip, ip_limit)), 1))) {
    let ref = null;
    let distance = 0;
    let cmp = 0;
    do {
      seq = (flz_readu32(ip) & ((16777215) >>> 0)) >>> 0;
      hash = ((flz_hash(((seq) >>> 0))) >>> 0);
      ref = cptr_offset(ip_start, ((htab[((hash) >>> 0)]) >>> 0));
      htab[((hash) >>> 0)] = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ip, ip_start)) >>> 0);
      distance = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ip, ref)) >>> 0);
      cmp = ((__builtin_expect(!!(((distance) >>> 0) < (((i32(i32(65535 + 8191) - 1))) >>> 0)), 1)) ? (flz_readu32(ref) & ((16777215) >>> 0)) >>> 0 : ((16777216) >>> 0));
      if ((__builtin_expect(!!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) >= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) >= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) >= (__r ?? 0)); })(ip, ip_limit)), 0))) {
        break;
      }
      ++ip.off;
    } while (((seq) >>> 0) != ((cmp) >>> 0));
    if ((__builtin_expect(!!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) >= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) >= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) >= (__r ?? 0)); })(ip, ip_limit)), 0))) {
      break;
    }
    --ip.off;
    if (((distance) >>> 0) >= ((8191) >>> 0)) {
      if (((((ref.buf[(ref.off ?? 0) + 3]) & 0xFF) != ((ip.buf[(ip.off ?? 0) + 3]) & 0xFF) || ((ref.buf[(ref.off ?? 0) + 4]) & 0xFF) != ((ip.buf[(ip.off ?? 0) + 4]) & 0xFF)) ? 1 : 0)) {
        ++ip.off;
        continue;
      }
    }
    if ((__builtin_expect(!!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) > (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) > __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) > (__r ?? 0)); })(ip, anchor)), 1))) {
      op = flz_literals(((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ip, anchor)) >>> 0), cptr_clone(anchor), cptr_clone(op));
    }
    let len = flz_cmp(cptr_offset(ref, 3), cptr_offset(ip, 3), cptr_clone(ip_bound));
    op = flz2_match(((len) >>> 0), ((distance) >>> 0), cptr_clone(op));
    ip = cptr_offset(ip, ((len) >>> 0));
    seq = flz_readu32(ip);
    hash = ((flz_hash((((seq) >>> 0) & ((16777215) >>> 0)) >>> 0)) >>> 0);
    htab[((hash) >>> 0)] = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ip.off++, ip_start)) >>> 0);
    seq = (seq >>> 8) >>> 0;
    hash = ((flz_hash(((seq) >>> 0))) >>> 0);
    htab[((hash) >>> 0)] = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ip.off++, ip_start)) >>> 0);
    anchor = cptr_clone(ip);
  }
  let copy = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(cptr_offset((input), length), anchor)) >>> 0);
  op = flz_literals(((copy) >>> 0), cptr_clone(anchor), cptr_clone(op));
  (output).buf[(output).off] = ((output).buf[(output).off] | (((1 << 5) | 0))) >>> 0;
  return ((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(op, (output));
}

function fastlz2_decompress(input: any | null, length: number, output: any | null, maxout: number): number {
  let ip = cptr_clone(cptr_clone((input))); /* &ref */
  let ip_limit = cptr_offset(ip, length); /* &ref */
  let ip_bound = cptr_offset(ip_limit, -(2)); /* &ref */
  let op = cptr_clone(cptr_clone((output))); /* &ref */
  let op_limit = cptr_offset(op, maxout); /* &ref */
  let ctrl = ((((((ip.buf[ip.off++]))) & 0xFF) & 31) >>> 0);
  while (1) {
    if (((ctrl) >>> 0) >= ((32) >>> 0)) {
      let len = u32(((((ctrl) >>> 0) >>> 5) >>> 0) - ((1) >>> 0));
      let ofs = (((((ctrl) >>> 0) & ((31) >>> 0)) >>> 0) << 8) >>> 0;
      let ref = cptr_offset(cptr_offset(op, -(((ofs) >>> 0))), -(1)); /* &ref */
      let code = 0;
      if (((len) >>> 0) == ((i32(7 - 1)) >>> 0)) {
        do {
          if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) <= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(ip, ip_bound))), 0))) {
            return 0;
          }
          code = ((((ip.buf[ip.off++])) & 0xFF)) & 0xFF;
          len = u32(len + ((((code) & 0xFF)) >>> 0));
        } while (((code) & 0xFF) == 255);
      }
      code = ((((ip.buf[ip.off++])) & 0xFF)) & 0xFF;
      ref = cptr_offset(ref, -(((code) & 0xFF)));
      len = u32(len + ((3) >>> 0));
      if ((__builtin_expect(!!(((code) & 0xFF) == 255), 0))) {
        if ((__builtin_expect(!!(((ofs) >>> 0) == (((((31 << 8) | 0))) >>> 0)), 1))) {
          if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) < __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(ip, ip_bound))), 0))) {
            return 0;
          }
          ofs = ((((((((ip.buf[ip.off++]))) & 0xFF) << 8) | 0)) >>> 0);
          ofs = u32(ofs + (((((ip.buf[ip.off++])) & 0xFF)) >>> 0));
          ref = cptr_clone(cptr_offset(cptr_offset(cptr_offset(op, -(((ofs) >>> 0))), -(8191)), -(1)));
        }
      }
      if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) <= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(cptr_offset(op, ((len) >>> 0)), op_limit))), 0))) {
        return 0;
      }
      if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) >= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) >= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) >= (__r ?? 0)); })(ref, (output)))), 0))) {
        return 0;
      }
      fastlz_memmove(cptr_clone(op), cptr_clone(ref), ((len) >>> 0));
      op = cptr_offset(op, ((len) >>> 0));
    } else {
      (() => { const _t = ctrl; ctrl = u32(ctrl + 1); return _t; })();
      if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) <= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(cptr_offset(op, ((ctrl) >>> 0)), op_limit))), 0))) {
        return 0;
      }
      if ((__builtin_expect(!!(!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) <= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(cptr_offset(ip, ((ctrl) >>> 0)), ip_limit))), 0))) {
        return 0;
      }
      fastlz_memcpy(cptr_clone(op), cptr_clone(ip), ((ctrl) >>> 0));
      ip = cptr_offset(ip, ((ctrl) >>> 0));
      op = cptr_offset(op, ((ctrl) >>> 0));
    }
    if ((__builtin_expect(!!(((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) >= (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) >= __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) >= (__r ?? 0)); })(ip, ip_limit)), 0))) {
      break;
    }
    ctrl = (((((ip.buf[ip.off++])) & 0xFF)) >>> 0);
  }
  return ((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__cpp2ts_ptr_to_intptr(__lp) - __cpp2ts_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(op, (output));
}

export function fastlz_compress(input: any | null, length: number, output: any | null): number {
  if (length < 65536) {
    return fastlz1_compress(input, length, output);
  }
  return fastlz2_compress(input, length, output);
}

export function fastlz_decompress(input: any | null, length: number, output: any | null, maxout: number): number {
  let level = i32((((((((input).buf[(input).off])) & 0xFF) >> 5) | 0)) + 1);
  if (level == 1) {
    return fastlz1_decompress(input, length, output, maxout);
  }
  if (level == 2) {
    return fastlz2_decompress(input, length, output, maxout);
  }
  return 0;
}

export function fastlz_compress_level(level: number, input: any | null, length: number, output: any | null): number {
  if (level == 1) {
    return fastlz1_compress(input, length, output);
  }
  if (level == 2) {
    return fastlz2_compress(input, length, output);
  }
  return 0;
}

