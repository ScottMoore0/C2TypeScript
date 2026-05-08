function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function rand(): number { _rng_state = (_rng_state * 1103515245 + 12345) & 0x7fffffff; return (_rng_state >>> 16) & 0x7fff; }
let _rng_state = 42;
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

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class pcg_state_setseq_64 {
  state: number;
  inc: number;
  constructor() {
    this.state = 0;
    this.inc = 0;
  }
}
const pcg32_random_t = pcg_state_setseq_64;
type pcg32_random_t = pcg_state_setseq_64;
(pcg_state_setseq_64 as any).__fieldTypes = ["int64","int64"];
(pcg_state_setseq_64 as any).__fieldNames = ["state","inc"];
(pcg_state_setseq_64 as any).__fieldOffsets = [0,8];

let pcg32_global = Object.assign(new pcg_state_setseq_64(), { state: 9600629759793949339n, inc: 15726070495360670683n });
export function pcg32_srandom_r(rng: pcg32_random_t | null, initstate: number, initseq: number): void {
  (__struct_ptr_at(rng, 0)).state = /* WARNING: 64-bit integer may lose precision beyond 2^53 */ 0;
  (__struct_ptr_at(rng, 0)).inc = __u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ initseq) << __as_bigint(1)))) | __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 1));
  pcg32_random_r(rng);
  (__struct_ptr_at(rng, 0)).state = __u64(__as_bigint((__struct_ptr_at(rng, 0)).state) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ initstate));
  pcg32_random_r(rng);
}

export function pcg32_srandom(seed: number, seq: number): void {
  pcg32_srandom_r(pcg32_global, /* WARNING: 64-bit integer may lose precision beyond 2^53 */ seed, /* WARNING: 64-bit integer may lose precision beyond 2^53 */ seq);
}

export function pcg32_random_r(rng: pcg32_random_t | null): number {
  let oldstate = /* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(rng, 0)).state;
  (__struct_ptr_at(rng, 0)).state = __u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ oldstate) * __as_bigint(6364136223846793005n))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(rng, 0)).inc));
  let xorshifted = ((Number(BigInt.asUintN(32, __as_bigint(__u64(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ oldstate)) >> __as_bigint(18)))) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ oldstate))))) >> __as_bigint(27)))))) >>> 0);
  let rot = ((Number(BigInt.asUintN(32, __as_bigint(__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ oldstate)) >> __as_bigint(59)))))) >>> 0);
  return (((((xorshifted) >>> 0) >>> ((rot) >>> 0)) >>> 0) | ((((xorshifted) >>> 0) << (((u32(-((rot) >>> 0))) & ((31) >>> 0)) >>> 0)) >>> 0)) >>> 0;
}

export function pcg32_random(): number {
  return pcg32_random_r(pcg32_global);
}

export function pcg32_boundedrand_r(rng: pcg32_random_t | null, bound: number): number {
  let threshold = u32(u32(-((bound) >>> 0)) % ((bound) >>> 0));
  for (; ; ) {
    let r = pcg32_random_r(rng);
    if (((r) >>> 0) >= ((threshold) >>> 0)) {
      return u32(((r) >>> 0) % ((bound) >>> 0));
    }
  }
}

export function pcg32_boundedrand(bound: number): number {
  return pcg32_boundedrand_r(pcg32_global, ((bound) >>> 0));
}

