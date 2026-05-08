function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function assert(expr: any, msg?: string): void { if (!expr) { const m = 'Assertion failed' + (msg ? ': ' + msg : ''); process.stderr.write(m + '\n'); throw new Error(m); } }
function _wassert(_expr: any, _file: any, _line: any): void { const m = 'Assertion failed: ' + String(_expr); process.stderr.write(m + '\n'); throw new Error(m); }
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
function trunc(x: number): number { return Math.trunc(x); }
function i32(x: number) { return x | 0; }
function u32(x: number) { return x >>> 0; }
function __as_bigint(x: any): bigint { if (typeof x === 'bigint') return x; if (typeof x === 'number') return BigInt(Math.trunc(x)); if (x && typeof x === 'object' && 'value' in x) { const v = (x as any).value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof x === 'boolean') return x ? 1n : 0n; return BigInt(Math.trunc(Number(x ?? 0))); }
function __u64(x: bigint): bigint { return BigInt.asUintN(64, x); }
function __i64(x: bigint): bigint { return BigInt.asIntN(64, x); }
function __safe_div_i64(a: bigint, b: bigint): bigint { if (b === 0n) throw new Error('Division by zero'); return a / b; }
function __safe_mod_i64(a: bigint, b: bigint): bigint { if (b === 0n) throw new Error('Division by zero'); return a % b; }

export function siphash(_in: any | null, inlen: number, k: CPtr | null, out: CPtr | null, outlen: number): number {
  let ni = cptr_clone(cptr_clone((_in))); /* &ref */
  let kk = cptr_clone(cptr_clone((k))); /* &ref */
  (((((!!((((((outlen) >>> 0) == ((8) >>> 0)) || (((outlen) >>> 0) == ((16) >>> 0))) ? 1 : 0))) || (((): any => { _wassert("(outlen == 8) || (outlen == 16)", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/siphash/src/siphash.c", ((Math.trunc(+((95)))) >>> 0)); return 0; })())) ? 1 : 0)));
  let v0 = (8317987319222330741n);
  let v1 = (7237128888997146477n);
  let v2 = (7816392313619706465n);
  let v3 = (8387220255154660723n);
  let k0 = (__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint(((((kk).buf[((kk).off ?? 0) + 0])) & 0xFF))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((kk).buf[((kk).off ?? 0) + 1])) & 0xFF)))) << __as_bigint(8)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((kk).buf[((kk).off ?? 0) + 2])) & 0xFF)))) << __as_bigint(16)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((kk).buf[((kk).off ?? 0) + 3])) & 0xFF)))) << __as_bigint(24)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((kk).buf[((kk).off ?? 0) + 4])) & 0xFF)))) << __as_bigint(32)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((kk).buf[((kk).off ?? 0) + 5])) & 0xFF)))) << __as_bigint(40)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((kk).buf[((kk).off ?? 0) + 6])) & 0xFF)))) << __as_bigint(48)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((kk).buf[((kk).off ?? 0) + 7])) & 0xFF)))) << __as_bigint(56))))));
  let k1 = (__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint(((((cptr_offset(kk, 8)).buf[((cptr_offset(kk, 8)).off ?? 0) + 0])) & 0xFF))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((cptr_offset(kk, 8)).buf[((cptr_offset(kk, 8)).off ?? 0) + 1])) & 0xFF)))) << __as_bigint(8)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((cptr_offset(kk, 8)).buf[((cptr_offset(kk, 8)).off ?? 0) + 2])) & 0xFF)))) << __as_bigint(16)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((cptr_offset(kk, 8)).buf[((cptr_offset(kk, 8)).off ?? 0) + 3])) & 0xFF)))) << __as_bigint(24)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((cptr_offset(kk, 8)).buf[((cptr_offset(kk, 8)).off ?? 0) + 4])) & 0xFF)))) << __as_bigint(32)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((cptr_offset(kk, 8)).buf[((cptr_offset(kk, 8)).off ?? 0) + 5])) & 0xFF)))) << __as_bigint(40)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((cptr_offset(kk, 8)).buf[((cptr_offset(kk, 8)).off ?? 0) + 6])) & 0xFF)))) << __as_bigint(48)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((cptr_offset(kk, 8)).buf[((cptr_offset(kk, 8)).off ?? 0) + 7])) & 0xFF)))) << __as_bigint(56))))));
  let m = 0;
  let i = 0;
  let end = cptr_offset(cptr_offset(ni, ((inlen) >>> 0)), -((__safe_mod(((inlen) >>> 0), 8)))); /* &ref */
  let left = ((((inlen) >>> 0) & ((7) >>> 0)) | 0);
  let b = __u64(__as_bigint((__u64(__as_bigint(((inlen) >>> 0))))) << __as_bigint(56));
  v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ k1));
  v2 = __u64(__as_bigint(v2) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ k0));
  v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ k1));
  v0 = __u64(__as_bigint(v0) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ k0));
  if (((outlen) >>> 0) == ((16) >>> 0)) {
    v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 238));
  }
  for (; !cptr_eq(ni, end); ni = cptr_offset(ni, 8)) {
    m = (__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint(((((ni).buf[((ni).off ?? 0) + 0])) & 0xFF))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((ni).buf[((ni).off ?? 0) + 1])) & 0xFF)))) << __as_bigint(8)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((ni).buf[((ni).off ?? 0) + 2])) & 0xFF)))) << __as_bigint(16)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((ni).buf[((ni).off ?? 0) + 3])) & 0xFF)))) << __as_bigint(24)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((ni).buf[((ni).off ?? 0) + 4])) & 0xFF)))) << __as_bigint(32)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((ni).buf[((ni).off ?? 0) + 5])) & 0xFF)))) << __as_bigint(40)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((ni).buf[((ni).off ?? 0) + 6])) & 0xFF)))) << __as_bigint(48)))))) | __as_bigint((__u64(__as_bigint(__u64(__as_bigint(((((ni).buf[((ni).off ?? 0) + 7])) & 0xFF)))) << __as_bigint(56))))));
    v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ m));
    for (i = 0; i < 2; ++i) {
      do {
        v0 = __u64(__as_bigint(v0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v1));
        v1 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1)) << __as_bigint((13))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1))) >> __as_bigint((i32(64 - (13)))))))))));
        v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v0));
        v0 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v0)) << __as_bigint((32))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v0))) >> __as_bigint((i32(64 - (32)))))))))));
        v2 = __u64(__as_bigint(v2) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v3));
        v3 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3)) << __as_bigint((16))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3))) >> __as_bigint((i32(64 - (16)))))))))));
        v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v2));
        v0 = __u64(__as_bigint(v0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v3));
        v3 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3)) << __as_bigint((21))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3))) >> __as_bigint((i32(64 - (21)))))))))));
        v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v0));
        v2 = __u64(__as_bigint(v2) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v1));
        v1 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1)) << __as_bigint((17))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1))) >> __as_bigint((i32(64 - (17)))))))))));
        v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v2));
        v2 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v2)) << __as_bigint((32))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v2))) >> __as_bigint((i32(64 - (32)))))))))));
      } while (0);
    }
    v0 = __u64(__as_bigint(v0) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ m));
  }
  switch (left) {
    case 7:
    {
      b = __u64(__as_bigint(b) | __as_bigint(__u64(__as_bigint((__u64(__as_bigint(((ni.buf[(ni.off ?? 0) + 6]) & 0xFF))))) << __as_bigint(48))));
    }
    case 6:
    {
      b = __u64(__as_bigint(b) | __as_bigint(__u64(__as_bigint((__u64(__as_bigint(((ni.buf[(ni.off ?? 0) + 5]) & 0xFF))))) << __as_bigint(40))));
    }
    case 5:
    {
      b = __u64(__as_bigint(b) | __as_bigint(__u64(__as_bigint((__u64(__as_bigint(((ni.buf[(ni.off ?? 0) + 4]) & 0xFF))))) << __as_bigint(32))));
    }
    case 4:
    {
      b = __u64(__as_bigint(b) | __as_bigint(__u64(__as_bigint((__u64(__as_bigint(((ni.buf[(ni.off ?? 0) + 3]) & 0xFF))))) << __as_bigint(24))));
    }
    case 3:
    {
      b = __u64(__as_bigint(b) | __as_bigint(__u64(__as_bigint((__u64(__as_bigint(((ni.buf[(ni.off ?? 0) + 2]) & 0xFF))))) << __as_bigint(16))));
    }
    case 2:
    {
      b = __u64(__as_bigint(b) | __as_bigint(__u64(__as_bigint((__u64(__as_bigint(((ni.buf[(ni.off ?? 0) + 1]) & 0xFF))))) << __as_bigint(8))));
    }
    case 1:
    {
      b = __u64(__as_bigint(b) | __as_bigint((__u64(__as_bigint(((ni.buf[(ni.off ?? 0) + 0]) & 0xFF))))));
    break;
    }
    case 0:
    {
      break;
    }
  }
  v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ b));
  for (i = 0; i < 2; ++i) {
    do {
      v0 = __u64(__as_bigint(v0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v1));
      v1 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1)) << __as_bigint((13))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1))) >> __as_bigint((i32(64 - (13)))))))))));
      v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v0));
      v0 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v0)) << __as_bigint((32))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v0))) >> __as_bigint((i32(64 - (32)))))))))));
      v2 = __u64(__as_bigint(v2) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v3));
      v3 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3)) << __as_bigint((16))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3))) >> __as_bigint((i32(64 - (16)))))))))));
      v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v2));
      v0 = __u64(__as_bigint(v0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v3));
      v3 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3)) << __as_bigint((21))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3))) >> __as_bigint((i32(64 - (21)))))))))));
      v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v0));
      v2 = __u64(__as_bigint(v2) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v1));
      v1 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1)) << __as_bigint((17))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1))) >> __as_bigint((i32(64 - (17)))))))))));
      v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v2));
      v2 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v2)) << __as_bigint((32))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v2))) >> __as_bigint((i32(64 - (32)))))))))));
    } while (0);
  }
  v0 = __u64(__as_bigint(v0) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ b));
  if (((outlen) >>> 0) == ((16) >>> 0)) {
    v2 = __u64(__as_bigint(v2) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 238));
  } else {
    v2 = __u64(__as_bigint(v2) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255));
  }
  for (i = 0; i < 4; ++i) {
    do {
      v0 = __u64(__as_bigint(v0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v1));
      v1 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1)) << __as_bigint((13))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1))) >> __as_bigint((i32(64 - (13)))))))))));
      v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v0));
      v0 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v0)) << __as_bigint((32))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v0))) >> __as_bigint((i32(64 - (32)))))))))));
      v2 = __u64(__as_bigint(v2) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v3));
      v3 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3)) << __as_bigint((16))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3))) >> __as_bigint((i32(64 - (16)))))))))));
      v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v2));
      v0 = __u64(__as_bigint(v0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v3));
      v3 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3)) << __as_bigint((21))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3))) >> __as_bigint((i32(64 - (21)))))))))));
      v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v0));
      v2 = __u64(__as_bigint(v2) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v1));
      v1 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1)) << __as_bigint((17))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1))) >> __as_bigint((i32(64 - (17)))))))))));
      v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v2));
      v2 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v2)) << __as_bigint((32))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v2))) >> __as_bigint((i32(64 - (32)))))))))));
    } while (0);
  }
  b = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v0) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v1))) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v2))) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v3));
  ((out)).buf[(((out)).off ?? 0) + 0] = (((Math.trunc(+(((((Number(BigInt.asIntN(32, __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((b)))))) >>> 0)))))) & 0xFF)) & 0xFF;
  ((out)).buf[(((out)).off ?? 0) + 1] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((b)))))) >>> 0)) >>> 8) >>> 0)))) & 0xFF)) & 0xFF;
  ((out)).buf[(((out)).off ?? 0) + 2] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((b)))))) >>> 0)) >>> 16) >>> 0)))) & 0xFF)) & 0xFF;
  ((out)).buf[(((out)).off ?? 0) + 3] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((b)))))) >>> 0)) >>> 24) >>> 0)))) & 0xFF)) & 0xFF;
  (cptr_offset((out), 4)).buf[((cptr_offset((out), 4)).off ?? 0) + 0] = (((Math.trunc(+(((((Number(BigInt.asIntN(32, __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (b))) >> __as_bigint(32))))))) >>> 0)))))) & 0xFF)) & 0xFF;
  (cptr_offset((out), 4)).buf[((cptr_offset((out), 4)).off ?? 0) + 1] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (b))) >> __as_bigint(32))))))) >>> 0)) >>> 8) >>> 0)))) & 0xFF)) & 0xFF;
  (cptr_offset((out), 4)).buf[((cptr_offset((out), 4)).off ?? 0) + 2] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (b))) >> __as_bigint(32))))))) >>> 0)) >>> 16) >>> 0)))) & 0xFF)) & 0xFF;
  (cptr_offset((out), 4)).buf[((cptr_offset((out), 4)).off ?? 0) + 3] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (b))) >> __as_bigint(32))))))) >>> 0)) >>> 24) >>> 0)))) & 0xFF)) & 0xFF;
  if (((outlen) >>> 0) == ((8) >>> 0)) {
    return 0;
  }
  v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 221));
  for (i = 0; i < 4; ++i) {
    do {
      v0 = __u64(__as_bigint(v0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v1));
      v1 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1)) << __as_bigint((13))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1))) >> __as_bigint((i32(64 - (13)))))))))));
      v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v0));
      v0 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v0)) << __as_bigint((32))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v0))) >> __as_bigint((i32(64 - (32)))))))))));
      v2 = __u64(__as_bigint(v2) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v3));
      v3 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3)) << __as_bigint((16))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3))) >> __as_bigint((i32(64 - (16)))))))))));
      v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v2));
      v0 = __u64(__as_bigint(v0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v3));
      v3 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3)) << __as_bigint((21))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v3))) >> __as_bigint((i32(64 - (21)))))))))));
      v3 = __u64(__as_bigint(v3) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v0));
      v2 = __u64(__as_bigint(v2) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v1));
      v1 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1)) << __as_bigint((17))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v1))) >> __as_bigint((i32(64 - (17)))))))))));
      v1 = __u64(__as_bigint(v1) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v2));
      v2 = __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v2)) << __as_bigint((32))))) | __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (v2))) >> __as_bigint((i32(64 - (32)))))))))));
    } while (0);
  }
  b = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v0) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v1))) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v2))) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v3));
  ((cptr_offset(out, 8))).buf[(((cptr_offset(out, 8))).off ?? 0) + 0] = (((Math.trunc(+(((((Number(BigInt.asIntN(32, __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((b)))))) >>> 0)))))) & 0xFF)) & 0xFF;
  ((cptr_offset(out, 8))).buf[(((cptr_offset(out, 8))).off ?? 0) + 1] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((b)))))) >>> 0)) >>> 8) >>> 0)))) & 0xFF)) & 0xFF;
  ((cptr_offset(out, 8))).buf[(((cptr_offset(out, 8))).off ?? 0) + 2] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((b)))))) >>> 0)) >>> 16) >>> 0)))) & 0xFF)) & 0xFF;
  ((cptr_offset(out, 8))).buf[(((cptr_offset(out, 8))).off ?? 0) + 3] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((b)))))) >>> 0)) >>> 24) >>> 0)))) & 0xFF)) & 0xFF;
  (cptr_offset((cptr_offset(out, 8)), 4)).buf[((cptr_offset((cptr_offset(out, 8)), 4)).off ?? 0) + 0] = (((Math.trunc(+(((((Number(BigInt.asIntN(32, __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (b))) >> __as_bigint(32))))))) >>> 0)))))) & 0xFF)) & 0xFF;
  (cptr_offset((cptr_offset(out, 8)), 4)).buf[((cptr_offset((cptr_offset(out, 8)), 4)).off ?? 0) + 1] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (b))) >> __as_bigint(32))))))) >>> 0)) >>> 8) >>> 0)))) & 0xFF)) & 0xFF;
  (cptr_offset((cptr_offset(out, 8)), 4)).buf[((cptr_offset((cptr_offset(out, 8)), 4)).off ?? 0) + 2] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (b))) >> __as_bigint(32))))))) >>> 0)) >>> 16) >>> 0)))) & 0xFF)) & 0xFF;
  (cptr_offset((cptr_offset(out, 8)), 4)).buf[((cptr_offset((cptr_offset(out, 8)), 4)).off ?? 0) + 3] = (((Math.trunc(+((((((Number(BigInt.asIntN(32, __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (b))) >> __as_bigint(32))))))) >>> 0)) >>> 24) >>> 0)))) & 0xFF)) & 0xFF;
  return 0;
}

