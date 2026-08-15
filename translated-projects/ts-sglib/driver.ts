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
function prev(it: any, n: number = 1): any { if (it == null) return null; if (it && it.__arr !== undefined) return __cpp_iter(it.__arr, (it.__pos ?? 0) - n); if (typeof it === 'number') return it - n; return it; }
function next(it: any, n: number = 1): any { if (it == null) return null; if (it && it.__arr !== undefined) return __cpp_iter(it.__arr, (it.__pos ?? 0) + n); if (typeof it === 'number') return it + n; return it; }
function fill(first: any, last: any, value: any): void { const A = __cpp_arr(first, last); for (let i = A.start; i < A.end; i++) A.arr[i] = value; }
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

const __cpp2ts_objId_map = new WeakMap<object, number>(); const __cpp2ts_objId_inverse = new Map<number, any>(); let __cpp2ts_objId_next = 64; function __cpp2ts_objId(o: any): number { if (o == null || typeof o !== 'object') return 0; let id = __cpp2ts_objId_map.get(o); if (id === undefined) { id = __cpp2ts_objId_next; __cpp2ts_objId_next += 64; __cpp2ts_objId_map.set(o, id); __cpp2ts_objId_inverse.set(id, o); } return id; } const __cpp2ts_cptrInt_byBuf = new WeakMap<object, Map<number, number>>(); const __cpp2ts_cptrInt_inverse = new Map<number, any>(); let __cpp2ts_cptrInt_next = -64; function __cpp2ts_ptr_to_intptr(p: any): number {
  if (typeof p === 'string') p = cptr_from_string(p);
 if (p == null) return 0; if (p && p.buf && typeof p.off !== 'undefined') { let m = __cpp2ts_cptrInt_byBuf.get(p.buf); if (!m) { m = new Map(); __cpp2ts_cptrInt_byBuf.set(p.buf, m); } const off = p.off ?? 0; let id = m.get(off); if (id === undefined) { id = __cpp2ts_cptrInt_next; __cpp2ts_cptrInt_next -= 64; m.set(off, id); __cpp2ts_cptrInt_inverse.set(id, { buf: p.buf, off }); } return id; } return __cpp2ts_objId(p); } function __cpp2ts_intptr_to_ptr(i: any): any { if (i === 0 || i === 0n || i == null) return null; const n = typeof i === 'bigint' ? Number(i) : i; if (__cpp2ts_cptrInt_inverse.has(n)) return __cpp2ts_cptrInt_inverse.get(n); if (__cpp2ts_objId_inverse.has(n)) return __cpp2ts_objId_inverse.get(n); return n; }

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

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class int_node {
  v: number;
  next: int_node | null;
  prev: int_node | null;
  left: int_node | null;
  right: int_node | null;
  color: number;
  constructor() {
    this.v = 0;
    this.next = null;
    this.prev = null;
    this.left = null;
    this.right = null;
    this.color = 0;
  }
}
(int_node as any).__fieldTypes = ["int32","int64","int64","int64","int64","int32"];
(int_node as any).__fieldNames = ["v","next","prev","left","right","color"];
(int_node as any).__fieldOffsets = [0,8,16,24,32,40];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class str_node_list {
  key: string;
  next: str_node_list | null;
  constructor() {
    this.key = null;
    this.next = null;
  }
}
(str_node_list as any).__fieldTypes = ["int64","int64"];
(str_node_list as any).__fieldNames = ["key","next"];
(str_node_list as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class int_node_sl {
  v: number;
  next: int_node_sl | null;
  constructor() {
    this.v = 0;
    this.next = null;
  }
}
(int_node_sl as any).__fieldTypes = ["int32","int64"];
(int_node_sl as any).__fieldNames = ["v","next"];
(int_node_sl as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class int_node_rb {
  v: number;
  left: int_node_rb | null;
  right: int_node_rb | null;
  color: number;
  constructor() {
    this.v = 0;
    this.left = null;
    this.right = null;
    this.color = 0;
  }
}
(int_node_rb as any).__fieldTypes = ["int32","int64","int64","int32"];
(int_node_rb as any).__fieldNames = ["v","left","right","color"];
(int_node_rb as any).__fieldOffsets = [0,8,16,24];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class int_node_dl {
  v: number;
  next: int_node_dl | null;
  prev: int_node_dl | null;
  constructor() {
    this.v = 0;
    this.next = null;
    this.prev = null;
  }
}
(int_node_dl as any).__fieldTypes = ["int32","int64","int64"];
(int_node_dl as any).__fieldNames = ["v","next","prev"];
(int_node_dl as any).__fieldOffsets = [0,8,16];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class intkv_node {
  k: number;
  v: number;
  next_in_chain: intkv_node | null;
  constructor() {
    this.k = 0;
    this.v = 0;
    this.next_in_chain = null;
  }
}
(intkv_node as any).__fieldTypes = ["int32","int32","int64"];
(intkv_node as any).__fieldNames = ["k","v","next_in_chain"];
(intkv_node as any).__fieldOffsets = [0,4,8];

function str_cmp_chars(a: any, b: any): number {
  if (typeof a === 'string') a = cptr_from_string(a);
  if (typeof b === 'string') b = cptr_from_string(b);

  while (((((a.buf[a.off]) << 24 >> 24) && (((a.buf[a.off]) << 24 >> 24) == ((b.buf[b.off]) << 24 >> 24))) ? 1 : 0)) {
    a.off++;
    b.off++;
  }
  return i32((Math.trunc(+(((Math.trunc(+((((a.buf[a.off])) << 24 >> 24)))) & 0xFF))) | 0) - (Math.trunc(+(((Math.trunc(+((((b.buf[b.off])) << 24 >> 24)))) & 0xFF))) | 0));
}

function intkv_node_hash(e: intkv_node | null): number {
  let x = ((Math.trunc(+((__struct_ptr_at(e, 0)).k))) >>> 0);
  x = (((((x) >>> 0) ^ 61) >>> 0) ^ ((((x) >>> 0) >>> 16) >>> 0)) >>> 0;
  x = u32(((x) >>> 0) + ((((x) >>> 0) << 3) >>> 0));
  x = (((x) >>> 0) ^ ((((x) >>> 0) >>> 4) >>> 0)) >>> 0;
  x = (Math.imul(((x) >>> 0), 668265261) >>> 0);
  x = (((x) >>> 0) ^ ((((x) >>> 0) >>> 15) >>> 0)) >>> 0;
  return ((x) >>> 0);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sglib_int_node_iterator {
  currentelem: int_node | null;
  nextelem: int_node | null;
  subcomparator: (arg0: int_node | null, arg1: int_node | null) => number;
  equalto: int_node | null;
  constructor() {
    this.currentelem = null;
    this.nextelem = null;
    this.subcomparator = null;
    this.equalto = null;
  }
}
(sglib_int_node_iterator as any).__fieldTypes = ["int64","int64","int32","int64"];
(sglib_int_node_iterator as any).__fieldNames = ["currentelem","nextelem","subcomparator","equalto"];
(sglib_int_node_iterator as any).__fieldOffsets = [0,8,16,24];

export function sglib_int_node_is_member(list: int_node | null, elem: int_node | null): number {
  let result = 0;
  {
    let _p_ = null;
    for (_p_ = (list); ((_p_ != (null) && _p_ != (elem)) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next) {
    }
    (result) = (_p_ != (null));
  }
  return (result);
}

export function sglib_int_node_find_member(list: int_node | null, elem: int_node | null): int_node | null {
  let result = null;
  {
    let _p_ = null;
    for (_p_ = (list); ((_p_ != (null) && (i32((__struct_ptr_at((_p_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next) {
    }
    (result) = _p_;
  }
  return (result);
}

export function sglib_int_node_add_if_not_member(list: { value: int_node | null }, elem: int_node | null, member: { value: int_node | null }): number {
  {
    let _p_ = null;
    for (_p_ = (list.value); ((_p_ != (null) && (i32((__struct_ptr_at((_p_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next) {
    }
    member.value = _p_;
    if (_p_ == (null)) {
      {
        {
          (__struct_ptr_at((elem), 0)).next = (list.value);
          list.value = (elem);
        }
      }
    }
  }
  return (member.value == (null));
}

export function sglib_int_node_add(list: { value: int_node | null }, elem: int_node | null): void {
  {
    (__struct_ptr_at((elem), 0)).next = (list.value);
    list.value = (elem);
  }
}

export function sglib_int_node_concat(first: { value: int_node | null }, second: int_node | null): void {
  {
    if ((first.value) == (null)) {
      first.value = (second);
    } else {
      let _p_ = null;
      for (_p_ = (first.value); (__struct_ptr_at(_p_, 0)).next != (null); _p_ = (__struct_ptr_at(_p_, 0)).next) {
      }
      (__struct_ptr_at(_p_, 0)).next = (second);
    }
  }
}

export function sglib_int_node_delete(list: { value: int_node | null }, elem: int_node | null): void {
  {
    let _p_ = null;
    for (_p_ = list; ((_p_.value != (null) && _p_.value != (elem)) ? 1 : 0); _p_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "int_node", "next", 8))((_p_.value))) {
    }
    (((((!!(((_p_.value != (null) && !cptr_eq("element is not member of the container, use DELETE_IF_MEMBER instead", (null))) ? 1 : 0))) || (((): any => { _wassert("*_p_!=null && \"element is not member of the container, use DELETE_IF_MEMBER instead\"!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((105)))) >>> 0)); return 0; })())) ? 1 : 0)));
    _p_.value = (_p_.value).next;
  }
}

export function sglib_int_node_delete_if_member(list: { value: int_node | null }, elem: int_node | null, member: { value: int_node | null }): number {
  {
    let _p_ = null;
    for (_p_ = list; ((_p_.value != (null) && (i32(((_p_.value)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _p_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "int_node", "next", 8))((_p_.value))) {
    }
    member.value = _p_.value;
    if (_p_.value != (null)) {
      _p_.value = (_p_.value).next;
    }
  }
  return (member.value != (null));
}

export function sglib_int_node_sort(list: { value: int_node | null }): void {
  {
    let _r_ = null;
    let _a_ = null;
    let _b_ = null;
    let _todo_ = null;
    let _t_ = null;
    let _restail_ = null;
    let _i_ = 0;
    let _n_ = 0;
    let _contFlag_ = 0;
    _r_ = (list.value);
    _contFlag_ = 1;
    for (_n_ = 1; _contFlag_; _n_ = i32(_n_ + _n_)) {
      _todo_ = _r_;
      _r_ = null;
      _restail_ = _r_;
      _contFlag_ = 0;
      while (_todo_ != (null)) {
        _a_ = _todo_;
        for (_i_ = 1, _t_ = _a_; ((_i_ < _n_ && _t_ != (null)) ? 1 : 0); _i_++, _t_ = (__struct_ptr_at(_t_, 0)).next) {
        }
        if (_t_ == (null)) {
          _restail_.value = _a_;
          break;
        }
        _b_ = (__struct_ptr_at(_t_, 0)).next;
        (__struct_ptr_at(_t_, 0)).next = null;
        for (_i_ = 1, _t_ = _b_; ((_i_ < _n_ && _t_ != (null)) ? 1 : 0); _i_++, _t_ = (__struct_ptr_at(_t_, 0)).next) {
        }
        if (_t_ == (null)) {
          _todo_ = null;
        } else {
          _todo_ = (__struct_ptr_at(_t_, 0)).next;
          (__struct_ptr_at(_t_, 0)).next = null;
        }
        while (((_a_ != (null) && _b_ != (null)) ? 1 : 0)) {
          if ((i32((__struct_ptr_at((_a_), 0)).v - (__struct_ptr_at((_b_), 0)).v)) < 0) {
            _restail_.value = _a_;
            _restail_ = __field_ref_scalar(() => (__struct_ptr_at(_a_, 0)), "int_node", "next", 8);
            _a_ = (__struct_ptr_at(_a_, 0)).next;
          } else {
            _restail_.value = _b_;
            _restail_ = __field_ref_scalar(() => (__struct_ptr_at(_b_, 0)), "int_node", "next", 8);
            _b_ = (__struct_ptr_at(_b_, 0)).next;
          }
        }
        if (_a_ != (null)) {
          _restail_.value = _a_;
        } else {
          _restail_.value = _b_;
        }
        while (_restail_.value != (null)) {
          _restail_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "int_node", "next", 8))((_restail_.value));
        }
        _contFlag_ = 1;
      }
    }
    list.value = _r_;
  }
}

export function sglib_int_node_len(list: int_node | null): number {
  let res = 0;
  {
    let _ce_ = null;
    ((_ce_));
    (res) = 0;
    {
      {
        let _ne_ = null;
        let _ce_ = null;
        (_ce_) = (list);
        while ((_ce_) != (null)) {
          _ne_ = (__struct_ptr_at((_ce_), 0)).next;
          {
            {
              (res)++;
            }
          }
          (_ce_) = _ne_;
        }
      }
    }
  }
  return (res);
}

export function sglib_int_node_reverse(list: { value: int_node | null }): void {
  {
    let _list_ = null;
    let _tmp_ = null;
    let _res_ = null;
    _list_ = (list.value);
    _res_ = null;
    while (_list_ != (null)) {
      _tmp_ = (__struct_ptr_at(_list_, 0)).next;
      (__struct_ptr_at(_list_, 0)).next = _res_;
      _res_ = _list_;
      _list_ = _tmp_;
    }
    list.value = _res_;
  }
}

export function sglib_int_node_it_init_on_equal(it: sglib_int_node_iterator | null, list: int_node | null, subcomparator: (arg0: int_node | null, arg1: int_node | null) => number, equalto: int_node | null): int_node | null {
  (__struct_ptr_at(it, 0)).subcomparator = subcomparator;
  (__struct_ptr_at(it, 0)).equalto = equalto;
  (__struct_ptr_at(it, 0)).nextelem = list;
  return (sglib_int_node_it_next(it));
}

export function sglib_int_node_it_init(it: sglib_int_node_iterator | null, list: int_node | null): int_node | null {
  return (sglib_int_node_it_init_on_equal(it, list, null, null));
}

export function sglib_int_node_it_current(it: sglib_int_node_iterator | null): int_node | null {
  return ((__struct_ptr_at(it, 0)).currentelem);
}

export function sglib_int_node_it_next(it: sglib_int_node_iterator | null): int_node | null {
  let ce = null;
  let eq = null;
  let scp = null;
  ce = (__struct_ptr_at(it, 0)).nextelem;
  (__struct_ptr_at(it, 0)).nextelem = null;
  if ((__struct_ptr_at(it, 0)).subcomparator != (null)) {
    eq = (__struct_ptr_at(it, 0)).equalto;
    scp = (__struct_ptr_at(it, 0)).subcomparator;
    while (((ce != (null) && scp(ce, eq) != 0) ? 1 : 0)) {
      ce = (__struct_ptr_at(ce, 0)).next;
    }
  }
  (__struct_ptr_at(it, 0)).currentelem = ce;
  if (ce != (null)) {
    (__struct_ptr_at(it, 0)).nextelem = (__struct_ptr_at(ce, 0)).next;
  }
  return (ce);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sglib_str_node_list_iterator {
  currentelem: str_node_list | null;
  nextelem: str_node_list | null;
  subcomparator: (arg0: str_node_list | null, arg1: str_node_list | null) => number;
  equalto: str_node_list | null;
  constructor() {
    this.currentelem = null;
    this.nextelem = null;
    this.subcomparator = null;
    this.equalto = null;
  }
}
(sglib_str_node_list_iterator as any).__fieldTypes = ["int64","int64","int32","int64"];
(sglib_str_node_list_iterator as any).__fieldNames = ["currentelem","nextelem","subcomparator","equalto"];
(sglib_str_node_list_iterator as any).__fieldOffsets = [0,8,16,24];

export function sglib_str_node_list_is_member(list: str_node_list | null, elem: str_node_list | null): number {
  let result = 0;
  {
    let _p_ = null;
    for (_p_ = (list); ((_p_ != (null) && _p_ != (elem)) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next) {
    }
    (result) = (_p_ != (null));
  }
  return (result);
}

export function sglib_str_node_list_find_member(list: str_node_list | null, elem: str_node_list | null): str_node_list | null {
  let result = null;
  {
    let _p_ = null;
    for (_p_ = (list); ((_p_ != (null) && (str_cmp_chars(cptr_clone((__struct_ptr_at((_p_), 0)).key), cptr_clone((__struct_ptr_at(((elem)), 0)).key))) != 0) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next) {
    }
    (result) = _p_;
  }
  return (result);
}

export function sglib_str_node_list_add_if_not_member(list: { value: str_node_list | null }, elem: str_node_list | null, member: { value: str_node_list | null }): number {
  {
    let _p_ = null;
    for (_p_ = (list.value); ((_p_ != (null) && (str_cmp_chars(cptr_clone((__struct_ptr_at((_p_), 0)).key), cptr_clone((__struct_ptr_at(((elem)), 0)).key))) != 0) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next) {
    }
    member.value = _p_;
    if (_p_ == (null)) {
      {
        {
          (__struct_ptr_at((elem), 0)).next = (list.value);
          list.value = (elem);
        }
      }
    }
  }
  return (member.value == (null));
}

export function sglib_str_node_list_add(list: { value: str_node_list | null }, elem: str_node_list | null): void {
  {
    (__struct_ptr_at((elem), 0)).next = (list.value);
    list.value = (elem);
  }
}

export function sglib_str_node_list_concat(first: { value: str_node_list | null }, second: str_node_list | null): void {
  {
    if ((first.value) == (null)) {
      first.value = (second);
    } else {
      let _p_ = null;
      for (_p_ = (first.value); (__struct_ptr_at(_p_, 0)).next != (null); _p_ = (__struct_ptr_at(_p_, 0)).next) {
      }
      (__struct_ptr_at(_p_, 0)).next = (second);
    }
  }
}

export function sglib_str_node_list_delete(list: { value: str_node_list | null }, elem: str_node_list | null): void {
  {
    let _p_ = null;
    for (_p_ = list; ((_p_.value != (null) && _p_.value != (elem)) ? 1 : 0); _p_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "str_node_list", "next", 8))((_p_.value))) {
    }
    (((((!!(((_p_.value != (null) && !cptr_eq("element is not member of the container, use DELETE_IF_MEMBER instead", (null))) ? 1 : 0))) || (((): any => { _wassert("*_p_!=null && \"element is not member of the container, use DELETE_IF_MEMBER instead\"!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((109)))) >>> 0)); return 0; })())) ? 1 : 0)));
    _p_.value = (_p_.value).next;
  }
}

export function sglib_str_node_list_delete_if_member(list: { value: str_node_list | null }, elem: str_node_list | null, member: { value: str_node_list | null }): number {
  {
    let _p_ = null;
    for (_p_ = list; ((_p_.value != (null) && (str_cmp_chars(cptr_clone(((_p_.value)).key), cptr_clone((__struct_ptr_at(((elem)), 0)).key))) != 0) ? 1 : 0); _p_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "str_node_list", "next", 8))((_p_.value))) {
    }
    member.value = _p_.value;
    if (_p_.value != (null)) {
      _p_.value = (_p_.value).next;
    }
  }
  return (member.value != (null));
}

export function sglib_str_node_list_sort(list: { value: str_node_list | null }): void {
  {
    let _r_ = null;
    let _a_ = null;
    let _b_ = null;
    let _todo_ = null;
    let _t_ = null;
    let _restail_ = null;
    let _i_ = 0;
    let _n_ = 0;
    let _contFlag_ = 0;
    _r_ = (list.value);
    _contFlag_ = 1;
    for (_n_ = 1; _contFlag_; _n_ = i32(_n_ + _n_)) {
      _todo_ = _r_;
      _r_ = null;
      _restail_ = _r_;
      _contFlag_ = 0;
      while (_todo_ != (null)) {
        _a_ = _todo_;
        for (_i_ = 1, _t_ = _a_; ((_i_ < _n_ && _t_ != (null)) ? 1 : 0); _i_++, _t_ = (__struct_ptr_at(_t_, 0)).next) {
        }
        if (_t_ == (null)) {
          _restail_.value = _a_;
          break;
        }
        _b_ = (__struct_ptr_at(_t_, 0)).next;
        (__struct_ptr_at(_t_, 0)).next = null;
        for (_i_ = 1, _t_ = _b_; ((_i_ < _n_ && _t_ != (null)) ? 1 : 0); _i_++, _t_ = (__struct_ptr_at(_t_, 0)).next) {
        }
        if (_t_ == (null)) {
          _todo_ = null;
        } else {
          _todo_ = (__struct_ptr_at(_t_, 0)).next;
          (__struct_ptr_at(_t_, 0)).next = null;
        }
        while (((_a_ != (null) && _b_ != (null)) ? 1 : 0)) {
          if ((str_cmp_chars(cptr_clone((__struct_ptr_at((_a_), 0)).key), cptr_clone((__struct_ptr_at((_b_), 0)).key))) < 0) {
            _restail_.value = _a_;
            _restail_ = __field_ref_scalar(() => (__struct_ptr_at(_a_, 0)), "str_node_list", "next", 8);
            _a_ = (__struct_ptr_at(_a_, 0)).next;
          } else {
            _restail_.value = _b_;
            _restail_ = __field_ref_scalar(() => (__struct_ptr_at(_b_, 0)), "str_node_list", "next", 8);
            _b_ = (__struct_ptr_at(_b_, 0)).next;
          }
        }
        if (_a_ != (null)) {
          _restail_.value = _a_;
        } else {
          _restail_.value = _b_;
        }
        while (_restail_.value != (null)) {
          _restail_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "str_node_list", "next", 8))((_restail_.value));
        }
        _contFlag_ = 1;
      }
    }
    list.value = _r_;
  }
}

export function sglib_str_node_list_len(list: str_node_list | null): number {
  let res = 0;
  {
    let _ce_ = null;
    ((_ce_));
    (res) = 0;
    {
      {
        let _ne_ = null;
        let _ce_ = null;
        (_ce_) = (list);
        while ((_ce_) != (null)) {
          _ne_ = (__struct_ptr_at((_ce_), 0)).next;
          {
            {
              (res)++;
            }
          }
          (_ce_) = _ne_;
        }
      }
    }
  }
  return (res);
}

export function sglib_str_node_list_reverse(list: { value: str_node_list | null }): void {
  {
    let _list_ = null;
    let _tmp_ = null;
    let _res_ = null;
    _list_ = (list.value);
    _res_ = null;
    while (_list_ != (null)) {
      _tmp_ = (__struct_ptr_at(_list_, 0)).next;
      (__struct_ptr_at(_list_, 0)).next = _res_;
      _res_ = _list_;
      _list_ = _tmp_;
    }
    list.value = _res_;
  }
}

export function sglib_str_node_list_it_init_on_equal(it: sglib_str_node_list_iterator | null, list: str_node_list | null, subcomparator: (arg0: str_node_list | null, arg1: str_node_list | null) => number, equalto: str_node_list | null): str_node_list | null {
  (__struct_ptr_at(it, 0)).subcomparator = subcomparator;
  (__struct_ptr_at(it, 0)).equalto = equalto;
  (__struct_ptr_at(it, 0)).nextelem = list;
  return (sglib_str_node_list_it_next(it));
}

export function sglib_str_node_list_it_init(it: sglib_str_node_list_iterator | null, list: str_node_list | null): str_node_list | null {
  return (sglib_str_node_list_it_init_on_equal(it, list, null, null));
}

export function sglib_str_node_list_it_current(it: sglib_str_node_list_iterator | null): str_node_list | null {
  return ((__struct_ptr_at(it, 0)).currentelem);
}

export function sglib_str_node_list_it_next(it: sglib_str_node_list_iterator | null): str_node_list | null {
  let ce = null;
  let eq = null;
  let scp = null;
  ce = (__struct_ptr_at(it, 0)).nextelem;
  (__struct_ptr_at(it, 0)).nextelem = null;
  if ((__struct_ptr_at(it, 0)).subcomparator != (null)) {
    eq = (__struct_ptr_at(it, 0)).equalto;
    scp = (__struct_ptr_at(it, 0)).subcomparator;
    while (((ce != (null) && scp(ce, eq) != 0) ? 1 : 0)) {
      ce = (__struct_ptr_at(ce, 0)).next;
    }
  }
  (__struct_ptr_at(it, 0)).currentelem = ce;
  if (ce != (null)) {
    (__struct_ptr_at(it, 0)).nextelem = (__struct_ptr_at(ce, 0)).next;
  }
  return (ce);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sglib_int_node_dl_iterator {
  currentelem: int_node_dl | null;
  prevelem: int_node_dl | null;
  nextelem: int_node_dl | null;
  subcomparator: (arg0: int_node_dl | null, arg1: int_node_dl | null) => number;
  equalto: int_node_dl | null;
  constructor() {
    this.currentelem = null;
    this.prevelem = null;
    this.nextelem = null;
    this.subcomparator = null;
    this.equalto = null;
  }
}
(sglib_int_node_dl_iterator as any).__fieldTypes = ["int64","int64","int64","int32","int64"];
(sglib_int_node_dl_iterator as any).__fieldNames = ["currentelem","prevelem","nextelem","subcomparator","equalto"];
(sglib_int_node_dl_iterator as any).__fieldOffsets = [0,8,16,24,32];

export function sglib_int_node_dl_add(list: { value: int_node_dl | null }, elem: int_node_dl | null): void {
  {
    {
      {
        if ((list.value) == (null)) {
          {
            {
              list.value = (elem);
              (list.value).next = (list.value).prev = null;
            }
          }
        } else {
          (__struct_ptr_at((elem), 0)).next = (list.value);
          (__struct_ptr_at((elem), 0)).prev = (list.value).prev;
          (list.value).prev = (elem);
          if ((__struct_ptr_at((elem), 0)).prev != (null)) {
            (__struct_ptr_at((__struct_ptr_at((elem), 0)).prev, 0)).next = (elem);
          }
        }
      }
    }
    list.value = (elem);
  }
}

export function sglib_int_node_dl_add_after(list: { value: int_node_dl | null }, elem: int_node_dl | null): void {
  {
    if ((list.value) == (null)) {
      {
        {
          list.value = (elem);
          (list.value).next = (list.value).prev = null;
        }
      }
    } else {
      (__struct_ptr_at((elem), 0)).next = (list.value).next;
      (__struct_ptr_at((elem), 0)).prev = (list.value);
      (list.value).next = (elem);
      if ((__struct_ptr_at((elem), 0)).next != (null)) {
        (__struct_ptr_at((__struct_ptr_at((elem), 0)).next, 0)).prev = (elem);
      }
    }
  }
}

export function sglib_int_node_dl_add_before(list: { value: int_node_dl | null }, elem: int_node_dl | null): void {
  {
    if ((list.value) == (null)) {
      {
        {
          list.value = (elem);
          (list.value).next = (list.value).prev = null;
        }
      }
    } else {
      (__struct_ptr_at((elem), 0)).next = (list.value);
      (__struct_ptr_at((elem), 0)).prev = (list.value).prev;
      (list.value).prev = (elem);
      if ((__struct_ptr_at((elem), 0)).prev != (null)) {
        (__struct_ptr_at((__struct_ptr_at((elem), 0)).prev, 0)).next = (elem);
      }
    }
  }
}

export function sglib_int_node_dl_add_if_not_member(list: { value: int_node_dl | null }, elem: int_node_dl | null, member: { value: int_node_dl | null }): number {
  {
    {
      {
        let _dlp_ = null;
        for (_dlp_ = (list.value); ((_dlp_ != (null) && (i32((__struct_ptr_at((_dlp_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _dlp_ = (__struct_ptr_at(_dlp_, 0)).prev) {
        }
        if (((_dlp_ == (null) && (list.value) != (null)) ? 1 : 0)) {
          for (_dlp_ = (list.value).next; ((_dlp_ != (null) && (i32((__struct_ptr_at((_dlp_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _dlp_ = (__struct_ptr_at(_dlp_, 0)).next) {
          }
        }
        member.value = _dlp_;
        if (_dlp_ == (null)) {
          {
            {
              {
                if ((list.value) == (null)) {
                  {
                    {
                      list.value = (elem);
                      (list.value).next = (list.value).prev = null;
                    }
                  }
                } else {
                  (__struct_ptr_at((elem), 0)).next = (list.value);
                  (__struct_ptr_at((elem), 0)).prev = (list.value).prev;
                  (list.value).prev = (elem);
                  if ((__struct_ptr_at((elem), 0)).prev != (null)) {
                    (__struct_ptr_at((__struct_ptr_at((elem), 0)).prev, 0)).next = (elem);
                  }
                }
              }
              list.value = (elem);
            }
          }
        }
      }
    }
  }
  return (member.value == (null));
}

export function sglib_int_node_dl_add_after_if_not_member(list: { value: int_node_dl | null }, elem: int_node_dl | null, member: { value: int_node_dl | null }): number {
  {
    {
      {
        let _dlp_ = null;
        for (_dlp_ = (list.value); ((_dlp_ != (null) && (i32((__struct_ptr_at((_dlp_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _dlp_ = (__struct_ptr_at(_dlp_, 0)).prev) {
        }
        if (((_dlp_ == (null) && (list.value) != (null)) ? 1 : 0)) {
          for (_dlp_ = (list.value).next; ((_dlp_ != (null) && (i32((__struct_ptr_at((_dlp_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _dlp_ = (__struct_ptr_at(_dlp_, 0)).next) {
          }
        }
        member.value = _dlp_;
        if (_dlp_ == (null)) {
          {
            {
              if ((list.value) == (null)) {
                {
                  {
                    list.value = (elem);
                    (list.value).next = (list.value).prev = null;
                  }
                }
              } else {
                (__struct_ptr_at((elem), 0)).next = (list.value).next;
                (__struct_ptr_at((elem), 0)).prev = (list.value);
                (list.value).next = (elem);
                if ((__struct_ptr_at((elem), 0)).next != (null)) {
                  (__struct_ptr_at((__struct_ptr_at((elem), 0)).next, 0)).prev = (elem);
                }
              }
            }
          }
        }
      }
    }
  }
  return (member.value == (null));
}

export function sglib_int_node_dl_add_before_if_not_member(list: { value: int_node_dl | null }, elem: int_node_dl | null, member: { value: int_node_dl | null }): number {
  {
    {
      {
        let _dlp_ = null;
        for (_dlp_ = (list.value); ((_dlp_ != (null) && (i32((__struct_ptr_at((_dlp_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _dlp_ = (__struct_ptr_at(_dlp_, 0)).prev) {
        }
        if (((_dlp_ == (null) && (list.value) != (null)) ? 1 : 0)) {
          for (_dlp_ = (list.value).next; ((_dlp_ != (null) && (i32((__struct_ptr_at((_dlp_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _dlp_ = (__struct_ptr_at(_dlp_, 0)).next) {
          }
        }
        member.value = _dlp_;
        if (_dlp_ == (null)) {
          {
            {
              if ((list.value) == (null)) {
                {
                  {
                    list.value = (elem);
                    (list.value).next = (list.value).prev = null;
                  }
                }
              } else {
                (__struct_ptr_at((elem), 0)).next = (list.value);
                (__struct_ptr_at((elem), 0)).prev = (list.value).prev;
                (list.value).prev = (elem);
                if ((__struct_ptr_at((elem), 0)).prev != (null)) {
                  (__struct_ptr_at((__struct_ptr_at((elem), 0)).prev, 0)).next = (elem);
                }
              }
            }
          }
        }
      }
    }
  }
  return (member.value == (null));
}

export function sglib_int_node_dl_concat(first: { value: int_node_dl | null }, second: int_node_dl | null): void {
  {
    if ((first.value) == (null)) {
      first.value = (second);
    } else {
      if ((second) != (null)) {
        let _dlp_ = null;
        for (_dlp_ = (first.value); (__struct_ptr_at(_dlp_, 0)).next != (null); _dlp_ = (__struct_ptr_at(_dlp_, 0)).next) {
        }
        {
          {
            if ((_dlp_) == (null)) {
              {
                {
                  (_dlp_) = (second);
                  (__struct_ptr_at((_dlp_), 0)).next = (__struct_ptr_at((_dlp_), 0)).prev = null;
                }
              }
            } else {
              (__struct_ptr_at((second), 0)).next = (__struct_ptr_at((_dlp_), 0)).next;
              (__struct_ptr_at((second), 0)).prev = (_dlp_);
              (__struct_ptr_at((_dlp_), 0)).next = (second);
              if ((__struct_ptr_at((second), 0)).next != (null)) {
                (__struct_ptr_at((__struct_ptr_at((second), 0)).next, 0)).prev = (second);
              }
            }
          }
        }
      }
    }
  }
}

export function sglib_int_node_dl_delete(list: { value: int_node_dl | null }, elem: int_node_dl | null): void {
  {
    let _l_ = null;
    _l_ = (list.value);
    if (_l_ == (elem)) {
      if ((__struct_ptr_at((elem), 0)).prev != (null)) {
        _l_ = (__struct_ptr_at((elem), 0)).prev;
      } else {
        _l_ = (__struct_ptr_at((elem), 0)).next;
      }
    }
    if ((__struct_ptr_at((elem), 0)).next != (null)) {
      (__struct_ptr_at((__struct_ptr_at((elem), 0)).next, 0)).prev = (__struct_ptr_at((elem), 0)).prev;
    }
    if ((__struct_ptr_at((elem), 0)).prev != (null)) {
      (__struct_ptr_at((__struct_ptr_at((elem), 0)).prev, 0)).next = (__struct_ptr_at((elem), 0)).next;
    }
    list.value = _l_;
  }
}

export function sglib_int_node_dl_delete_if_member(list: { value: int_node_dl | null }, elem: int_node_dl | null, member: { value: int_node_dl | null }): number {
  {
    let _dlp_ = null;
    for (_dlp_ = (list.value); ((_dlp_ != (null) && (i32((__struct_ptr_at((_dlp_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _dlp_ = (__struct_ptr_at(_dlp_, 0)).prev) {
    }
    if (((_dlp_ == (null) && (list.value) != (null)) ? 1 : 0)) {
      for (_dlp_ = (list.value).next; ((_dlp_ != (null) && (i32((__struct_ptr_at((_dlp_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _dlp_ = (__struct_ptr_at(_dlp_, 0)).next) {
      }
    }
    member.value = _dlp_;
    if (_dlp_ != (null)) {
      {
        {
          let _l_ = null;
          _l_ = (list.value);
          if (_l_ == (_dlp_)) {
            if ((__struct_ptr_at((_dlp_), 0)).prev != (null)) {
              _l_ = (__struct_ptr_at((_dlp_), 0)).prev;
            } else {
              _l_ = (__struct_ptr_at((_dlp_), 0)).next;
            }
          }
          if ((__struct_ptr_at((_dlp_), 0)).next != (null)) {
            (__struct_ptr_at((__struct_ptr_at((_dlp_), 0)).next, 0)).prev = (__struct_ptr_at((_dlp_), 0)).prev;
          }
          if ((__struct_ptr_at((_dlp_), 0)).prev != (null)) {
            (__struct_ptr_at((__struct_ptr_at((_dlp_), 0)).prev, 0)).next = (__struct_ptr_at((_dlp_), 0)).next;
          }
          list.value = _l_;
        }
      }
    }
  }
  return (member.value != (null));
}

export function sglib_int_node_dl_is_member(list: int_node_dl | null, elem: int_node_dl | null): number {
  let result = 0;
  {
    let _dlp_ = null;
    {
      {
        let _p_ = null;
        for (_p_ = (list); ((_p_ != (null) && _p_ != (elem)) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).prev) {
        }
        (result) = (_p_ != (null));
      }
    }
    if (((result == 0 && (list) != (null)) ? 1 : 0)) {
      _dlp_ = (__struct_ptr_at((list), 0)).next;
      {
        {
          let _p_ = null;
          for (_p_ = (_dlp_); ((_p_ != (null) && _p_ != (elem)) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next) {
          }
          (result) = (_p_ != (null));
        }
      }
    }
  }
  return (result);
}

export function sglib_int_node_dl_find_member(list: int_node_dl | null, elem: int_node_dl | null): int_node_dl | null {
  let result = null;
  {
    let _dlp_ = null;
    {
      {
        let _p_ = null;
        for (_p_ = (list); ((_p_ != (null) && (i32((__struct_ptr_at((_p_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).prev) {
        }
        (result) = _p_;
      }
    }
    if ((((result) == (null) && (list) != (null)) ? 1 : 0)) {
      _dlp_ = (__struct_ptr_at((list), 0)).next;
      {
        {
          let _p_ = null;
          for (_p_ = (_dlp_); ((_p_ != (null) && (i32((__struct_ptr_at((_p_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) != 0) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next) {
          }
          (result) = _p_;
        }
      }
    }
  }
  return (result);
}

export function sglib_int_node_dl_get_first(list: int_node_dl | null): int_node_dl | null {
  let result = null;
  {
    let _dll_ = null;
    _dll_ = (list);
    if (_dll_ != (null)) {
      for (; (__struct_ptr_at(_dll_, 0)).prev != (null); _dll_ = (__struct_ptr_at(_dll_, 0)).prev) {
      }
    }
    (result) = _dll_;
  }
  return (result);
}

export function sglib_int_node_dl_get_last(list: int_node_dl | null): int_node_dl | null {
  let result = null;
  {
    let _dll_ = null;
    _dll_ = (list);
    if (_dll_ != (null)) {
      for (; (__struct_ptr_at(_dll_, 0)).next != (null); _dll_ = (__struct_ptr_at(_dll_, 0)).next) {
      }
    }
    (result) = _dll_;
  }
  return (result);
}

export function sglib_int_node_dl_sort(list: { value: int_node_dl | null }): void {
  {
    let _dll_ = null;
    _dll_ = (list.value);
    if (_dll_ != (null)) {
      for (; (__struct_ptr_at(_dll_, 0)).prev != (null); _dll_ = (__struct_ptr_at(_dll_, 0)).prev) {
      }
      {
        {
          let _r_ = null;
          let _a_ = null;
          let _b_ = null;
          let _todo_ = null;
          let _t_ = null;
          let _restail_ = null;
          let _i_ = 0;
          let _n_ = 0;
          let _contFlag_ = 0;
          _r_ = (_dll_);
          _contFlag_ = 1;
          for (_n_ = 1; _contFlag_; _n_ = i32(_n_ + _n_)) {
            _todo_ = _r_;
            _r_ = null;
            _restail_ = _r_;
            _contFlag_ = 0;
            while (_todo_ != (null)) {
              _a_ = _todo_;
              for (_i_ = 1, _t_ = _a_; ((_i_ < _n_ && _t_ != (null)) ? 1 : 0); _i_++, _t_ = (__struct_ptr_at(_t_, 0)).next) {
              }
              if (_t_ == (null)) {
                _restail_.value = _a_;
                break;
              }
              _b_ = (__struct_ptr_at(_t_, 0)).next;
              (__struct_ptr_at(_t_, 0)).next = null;
              for (_i_ = 1, _t_ = _b_; ((_i_ < _n_ && _t_ != (null)) ? 1 : 0); _i_++, _t_ = (__struct_ptr_at(_t_, 0)).next) {
              }
              if (_t_ == (null)) {
                _todo_ = null;
              } else {
                _todo_ = (__struct_ptr_at(_t_, 0)).next;
                (__struct_ptr_at(_t_, 0)).next = null;
              }
              while (((_a_ != (null) && _b_ != (null)) ? 1 : 0)) {
                if ((i32((__struct_ptr_at((_a_), 0)).v - (__struct_ptr_at((_b_), 0)).v)) < 0) {
                  _restail_.value = _a_;
                  _restail_ = __field_ref_scalar(() => (__struct_ptr_at(_a_, 0)), "int_node_dl", "next", 8);
                  _a_ = (__struct_ptr_at(_a_, 0)).next;
                } else {
                  _restail_.value = _b_;
                  _restail_ = __field_ref_scalar(() => (__struct_ptr_at(_b_, 0)), "int_node_dl", "next", 8);
                  _b_ = (__struct_ptr_at(_b_, 0)).next;
                }
              }
              if (_a_ != (null)) {
                _restail_.value = _a_;
              } else {
                _restail_.value = _b_;
              }
              while (_restail_.value != (null)) {
                _restail_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "int_node_dl", "next", 8))((_restail_.value));
              }
              _contFlag_ = 1;
            }
          }
          (_dll_) = _r_;
        }
      }
      {
        {
          let _dlp_ = null;
          let _dlt_ = null;
          _dlp_ = null;
          for (_dlt_ = (_dll_); _dlt_ != (null); _dlt_ = (__struct_ptr_at(_dlt_, 0)).next) {
            (__struct_ptr_at(_dlt_, 0)).prev = _dlp_;
            _dlp_ = _dlt_;
          }
        }
      }
      list.value = _dll_;
    }
  }
}

export function sglib_int_node_dl_len(list: int_node_dl | null): number {
  let res = 0;
  {
    let _dl_ = null;
    let _r1_ = 0;
    let _r2_ = 0;
    if ((list) == (null)) {
      (res) = 0;
    } else {
      {
        {
          let _ce_ = null;
          ((_ce_));
          (_r1_) = 0;
          {
            let _ne_ = null;
            let _ce_ = null;
            (_ce_) = (list);
            while ((_ce_) != (null)) {
              _ne_ = (__struct_ptr_at((_ce_), 0)).prev;
              {
                {
                  (_r1_)++;
                }
              }
              (_ce_) = _ne_;
            }
          }
        }
      }
      _dl_ = (__struct_ptr_at((list), 0)).next;
      {
        {
          let _ce_ = null;
          ((_ce_));
          (_r2_) = 0;
          {
            let _ne_ = null;
            let _ce_ = null;
            (_ce_) = (_dl_);
            while ((_ce_) != (null)) {
              _ne_ = (__struct_ptr_at((_ce_), 0)).next;
              {
                {
                  (_r2_)++;
                }
              }
              (_ce_) = _ne_;
            }
          }
        }
      }
      (res) = i32(_r1_ + _r2_);
    }
  }
  return (res);
}

export function sglib_int_node_dl_reverse(list: { value: int_node_dl | null }): void {
  {
    let _list_ = null;
    let _nlist_ = null;
    let _dlp_ = null;
    let _dln_ = null;
    _list_ = (list.value);
    if (_list_ != (null)) {
      _nlist_ = (__struct_ptr_at(_list_, 0)).next;
      while (_list_ != (null)) {
        _dln_ = (__struct_ptr_at(_list_, 0)).next;
        _dlp_ = (__struct_ptr_at(_list_, 0)).prev;
        (__struct_ptr_at(_list_, 0)).next = _dlp_;
        (__struct_ptr_at(_list_, 0)).prev = _dln_;
        _list_ = _dlp_;
      }
      while (_nlist_ != (null)) {
        _dln_ = (__struct_ptr_at(_nlist_, 0)).next;
        _dlp_ = (__struct_ptr_at(_nlist_, 0)).prev;
        (__struct_ptr_at(_nlist_, 0)).next = _dlp_;
        (__struct_ptr_at(_nlist_, 0)).prev = _dln_;
        _nlist_ = _dln_;
      }
    }
  }
}

export function sglib_int_node_dl_it_init_on_equal(it: sglib_int_node_dl_iterator | null, list: int_node_dl | null, subcomparator: (arg0: int_node_dl | null, arg1: int_node_dl | null) => number, equalto: int_node_dl | null): int_node_dl | null {
  (__struct_ptr_at(it, 0)).subcomparator = subcomparator;
  (__struct_ptr_at(it, 0)).equalto = equalto;
  (__struct_ptr_at(it, 0)).prevelem = list;
  (__struct_ptr_at(it, 0)).nextelem = list;
  if (list != (null)) {
    (__struct_ptr_at(it, 0)).nextelem = (__struct_ptr_at(list, 0)).next;
  }
  return (sglib_int_node_dl_it_next(it));
}

export function sglib_int_node_dl_it_init(it: sglib_int_node_dl_iterator | null, list: int_node_dl | null): int_node_dl | null {
  return (sglib_int_node_dl_it_init_on_equal(it, list, null, null));
}

export function sglib_int_node_dl_it_current(it: sglib_int_node_dl_iterator | null): int_node_dl | null {
  return ((__struct_ptr_at(it, 0)).currentelem);
}

export function sglib_int_node_dl_it_next(it: sglib_int_node_dl_iterator | null): int_node_dl | null {
  let ce = null;
  let eq = null;
  let scp = null;
  ce = (__struct_ptr_at(it, 0)).prevelem;
  (__struct_ptr_at(it, 0)).prevelem = null;
  if ((__struct_ptr_at(it, 0)).subcomparator != (null)) {
    eq = (__struct_ptr_at(it, 0)).equalto;
    scp = (__struct_ptr_at(it, 0)).subcomparator;
    while (((ce != (null) && scp(eq, ce) != 0) ? 1 : 0)) {
      ce = (__struct_ptr_at(ce, 0)).prev;
    }
  }
  if (ce != (null)) {
    (__struct_ptr_at(it, 0)).prevelem = (__struct_ptr_at(ce, 0)).prev;
  } else {
    ce = (__struct_ptr_at(it, 0)).nextelem;
    (__struct_ptr_at(it, 0)).nextelem = null;
    if ((__struct_ptr_at(it, 0)).subcomparator != (null)) {
      eq = (__struct_ptr_at(it, 0)).equalto;
      scp = (__struct_ptr_at(it, 0)).subcomparator;
      while (((ce != (null) && scp(ce, eq) != 0) ? 1 : 0)) {
        ce = (__struct_ptr_at(ce, 0)).next;
      }
    }
    if (ce != (null)) {
      (__struct_ptr_at(it, 0)).nextelem = (__struct_ptr_at(ce, 0)).next;
    }
  }
  (__struct_ptr_at(it, 0)).currentelem = ce;
  return (ce);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sglib_int_node_rb_iterator {
  currentelem: int_node_rb | null;
  pass: any = cptr_create(128);
  path: any = new Array(128).fill(null);
  pathi: number;
  order: number;
  equalto: int_node_rb | null;
  subcomparator: (arg0: int_node_rb | null, arg1: int_node_rb | null) => number;
  constructor() {
    this.currentelem = null;
    this.pass = cptr_create(128);
    this.path = new Array(128).fill(null);
    this.pathi = 0;
    this.order = 0;
    this.equalto = null;
    this.subcomparator = null;
  }
}
(sglib_int_node_rb_iterator as any).__fieldTypes = ["int64","bytes","bytes","int16","int16","int64","int32"];
(sglib_int_node_rb_iterator as any).__fieldNames = ["currentelem","pass","path","pathi","order","equalto","subcomparator"];
(sglib_int_node_rb_iterator as any).__fieldOffsets = [0,8,136,1160,1162,1168,1176];

function sglib___int_node_rb_fix_left_insertion_discrepancy(tree: { value: int_node_rb | null }): void {
  {
    let t = null;
    let tl = null;
    let a = null;
    let b = null;
    let c = null;
    let ar = null;
    let bl = null;
    let br = null;
    let cl = null;
    let cr = null;
    ((bl));
    ((ar));
    t = tree.value;
    tl = (__struct_ptr_at(t, 0)).left;
    if ((((__struct_ptr_at(t, 0)).right != (null) && ((__struct_ptr_at((__struct_ptr_at(t, 0)).right, 0)).color) == 1) ? 1 : 0)) {
      if (((__struct_ptr_at(tl, 0)).color) == 1) {
        if (((((((__struct_ptr_at(tl, 0)).left != (null) && ((__struct_ptr_at((__struct_ptr_at(tl, 0)).left, 0)).color) == 1) ? 1 : 0)) || ((((__struct_ptr_at(tl, 0)).right != (null) && ((__struct_ptr_at((__struct_ptr_at(tl, 0)).right, 0)).color) == 1) ? 1 : 0))) ? 1 : 0)) {
          {
            {
              ((__struct_ptr_at((__struct_ptr_at(t, 0)).left, 0)).color) = (0);
            }
          }
          {
            {
              ((__struct_ptr_at((__struct_ptr_at(t, 0)).right, 0)).color) = (0);
            }
          }
          {
            {
              ((__struct_ptr_at(t, 0)).color) = (1);
            }
          }
        }
      }
    } else {
      if (((__struct_ptr_at(tl, 0)).color) == 1) {
        if ((((__struct_ptr_at(tl, 0)).left != (null) && ((__struct_ptr_at((__struct_ptr_at(tl, 0)).left, 0)).color) == 1) ? 1 : 0)) {
          a = t;
          b = tl;
          c = (__struct_ptr_at(tl, 0)).left;
          br = (__struct_ptr_at(b, 0)).right;
          (__struct_ptr_at(a, 0)).left = br;
          (__struct_ptr_at(b, 0)).left = c;
          (__struct_ptr_at(b, 0)).right = a;
          {
            {
              ((__struct_ptr_at(a, 0)).color) = (1);
            }
          }
          {
            {
              ((__struct_ptr_at(b, 0)).color) = (0);
            }
          }
          tree.value = b;
        } else {
          if ((((__struct_ptr_at(tl, 0)).right != (null) && ((__struct_ptr_at((__struct_ptr_at(tl, 0)).right, 0)).color) == 1) ? 1 : 0)) {
            a = t;
            b = tl;
            ar = (__struct_ptr_at(a, 0)).right;
            bl = (__struct_ptr_at(b, 0)).left;
            c = (__struct_ptr_at(b, 0)).right;
            cl = (__struct_ptr_at(c, 0)).left;
            cr = (__struct_ptr_at(c, 0)).right;
            (__struct_ptr_at(b, 0)).right = cl;
            (__struct_ptr_at(a, 0)).left = cr;
            (__struct_ptr_at(c, 0)).left = b;
            (__struct_ptr_at(c, 0)).right = a;
            {
              {
                ((__struct_ptr_at(c, 0)).color) = (0);
              }
            }
            {
              {
                ((__struct_ptr_at(a, 0)).color) = (1);
              }
            }
            tree.value = c;
          }
        }
      }
    }
  }
}

function sglib___int_node_rb_fix_right_insertion_discrepancy(tree: { value: int_node_rb | null }): void {
  {
    let t = null;
    let tl = null;
    let a = null;
    let b = null;
    let c = null;
    let ar = null;
    let bl = null;
    let br = null;
    let cl = null;
    let cr = null;
    ((bl));
    ((ar));
    t = tree.value;
    tl = (__struct_ptr_at(t, 0)).right;
    if ((((__struct_ptr_at(t, 0)).left != (null) && ((__struct_ptr_at((__struct_ptr_at(t, 0)).left, 0)).color) == 1) ? 1 : 0)) {
      if (((__struct_ptr_at(tl, 0)).color) == 1) {
        if (((((((__struct_ptr_at(tl, 0)).right != (null) && ((__struct_ptr_at((__struct_ptr_at(tl, 0)).right, 0)).color) == 1) ? 1 : 0)) || ((((__struct_ptr_at(tl, 0)).left != (null) && ((__struct_ptr_at((__struct_ptr_at(tl, 0)).left, 0)).color) == 1) ? 1 : 0))) ? 1 : 0)) {
          {
            {
              ((__struct_ptr_at((__struct_ptr_at(t, 0)).right, 0)).color) = (0);
            }
          }
          {
            {
              ((__struct_ptr_at((__struct_ptr_at(t, 0)).left, 0)).color) = (0);
            }
          }
          {
            {
              ((__struct_ptr_at(t, 0)).color) = (1);
            }
          }
        }
      }
    } else {
      if (((__struct_ptr_at(tl, 0)).color) == 1) {
        if ((((__struct_ptr_at(tl, 0)).right != (null) && ((__struct_ptr_at((__struct_ptr_at(tl, 0)).right, 0)).color) == 1) ? 1 : 0)) {
          a = t;
          b = tl;
          c = (__struct_ptr_at(tl, 0)).right;
          br = (__struct_ptr_at(b, 0)).left;
          (__struct_ptr_at(a, 0)).right = br;
          (__struct_ptr_at(b, 0)).right = c;
          (__struct_ptr_at(b, 0)).left = a;
          {
            {
              ((__struct_ptr_at(a, 0)).color) = (1);
            }
          }
          {
            {
              ((__struct_ptr_at(b, 0)).color) = (0);
            }
          }
          tree.value = b;
        } else {
          if ((((__struct_ptr_at(tl, 0)).left != (null) && ((__struct_ptr_at((__struct_ptr_at(tl, 0)).left, 0)).color) == 1) ? 1 : 0)) {
            a = t;
            b = tl;
            ar = (__struct_ptr_at(a, 0)).left;
            bl = (__struct_ptr_at(b, 0)).right;
            c = (__struct_ptr_at(b, 0)).left;
            cl = (__struct_ptr_at(c, 0)).right;
            cr = (__struct_ptr_at(c, 0)).left;
            (__struct_ptr_at(b, 0)).left = cl;
            (__struct_ptr_at(a, 0)).right = cr;
            (__struct_ptr_at(c, 0)).right = b;
            (__struct_ptr_at(c, 0)).left = a;
            {
              {
                ((__struct_ptr_at(c, 0)).color) = (0);
              }
            }
            {
              {
                ((__struct_ptr_at(a, 0)).color) = (1);
              }
            }
            tree.value = c;
          }
        }
      }
    }
  }
}

function sglib___int_node_rb_fix_left_deletion_discrepancy(tree: { value: int_node_rb | null }): number {
  let res = 0;
  {
    let t = null;
    let a = null;
    let b = null;
    let c = null;
    let d = null;
    let ar = null;
    let bl = null;
    let br = null;
    let cl = null;
    let cr = null;
    let dl = null;
    let dr = null;
    ((ar));
    t = a = tree.value;
    (((((!!(t != (null))) || (((): any => { _wassert("t!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
    ar = (__struct_ptr_at(a, 0)).left;
    b = (__struct_ptr_at(t, 0)).right;
    if (b == (null)) {
      (((((!!(((__struct_ptr_at(t, 0)).color) == 1)) || (((): any => { _wassert("SGLIB___GET_VALUE(t->color)==1", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
      {
        {
          ((__struct_ptr_at(t, 0)).color) = (0);
        }
      }
      res = 0;
    } else {
      bl = (__struct_ptr_at(b, 0)).right;
      br = (__struct_ptr_at(b, 0)).left;
      if (((__struct_ptr_at(b, 0)).color) == 1) {
        if (br == (null)) {
          tree.value = b;
          {
            {
              ((__struct_ptr_at(b, 0)).color) = (0);
            }
          }
          (__struct_ptr_at(b, 0)).left = a;
          (__struct_ptr_at(a, 0)).right = br;
          res = 0;
        } else {
          c = br;
          (((((!!(((c != (null) && ((__struct_ptr_at(c, 0)).color) == 0) ? 1 : 0))) || (((): any => { _wassert("c!=null && SGLIB___GET_VALUE(c->color)==0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
          cl = (__struct_ptr_at(c, 0)).right;
          cr = (__struct_ptr_at(c, 0)).left;
          if ((((((cl == (null) || ((__struct_ptr_at(cl, 0)).color) == 0) ? 1 : 0)) && (((cr == (null) || ((__struct_ptr_at(cr, 0)).color) == 0) ? 1 : 0))) ? 1 : 0)) {
            tree.value = b;
            (__struct_ptr_at(b, 0)).left = a;
            {
              {
                ((__struct_ptr_at(b, 0)).color) = (0);
              }
            }
            (__struct_ptr_at(a, 0)).right = c;
            {
              {
                ((__struct_ptr_at(c, 0)).color) = (1);
              }
            }
            res = 0;
          } else {
            if (((cl != (null) && ((__struct_ptr_at(cl, 0)).color) == 1) ? 1 : 0)) {
              if (((cr != (null) && ((__struct_ptr_at(cr, 0)).color) == 1) ? 1 : 0)) {
                d = cr;
                dl = (__struct_ptr_at(d, 0)).right;
                dr = (__struct_ptr_at(d, 0)).left;
                tree.value = d;
                {
                  {
                    ((__struct_ptr_at(d, 0)).color) = (0);
                  }
                }
                (__struct_ptr_at(d, 0)).right = b;
                (__struct_ptr_at(c, 0)).left = dl;
                (__struct_ptr_at(d, 0)).left = a;
                (__struct_ptr_at(a, 0)).right = dr;
                res = 0;
              } else {
                tree.value = c;
                (__struct_ptr_at(c, 0)).right = b;
                (__struct_ptr_at(c, 0)).left = a;
                (__struct_ptr_at(b, 0)).right = bl;
                (__struct_ptr_at(b, 0)).left = cl;
                (__struct_ptr_at(a, 0)).right = cr;
                {
                  {
                    ((__struct_ptr_at(cl, 0)).color) = (0);
                  }
                }
                res = 0;
              }
            } else {
              if (((cr != (null) && ((__struct_ptr_at(cr, 0)).color) == 1) ? 1 : 0)) {
                (((((!!(((cl == (null) || ((__struct_ptr_at(cl, 0)).color) == 0) ? 1 : 0))) || (((): any => { _wassert("cl==null || SGLIB___GET_VALUE(cl->color)==0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
                d = cr;
                dl = (__struct_ptr_at(d, 0)).right;
                dr = (__struct_ptr_at(d, 0)).left;
                tree.value = d;
                {
                  {
                    ((__struct_ptr_at(d, 0)).color) = (0);
                  }
                }
                (__struct_ptr_at(d, 0)).right = b;
                (__struct_ptr_at(c, 0)).left = dl;
                (__struct_ptr_at(d, 0)).left = a;
                (__struct_ptr_at(a, 0)).right = dr;
                res = 0;
              } else {
                (((((!!(0)) || (((): any => { _wassert("0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
                res = 0;
              }
            }
          }
        }
      } else {
        if ((((((bl == (null) || ((__struct_ptr_at(bl, 0)).color) == 0) ? 1 : 0)) && (((br == (null) || ((__struct_ptr_at(br, 0)).color) == 0) ? 1 : 0))) ? 1 : 0)) {
          res = (((__struct_ptr_at(a, 0)).color) == 0);
          {
            {
              ((__struct_ptr_at(a, 0)).color) = (0);
            }
          }
          {
            {
              ((__struct_ptr_at(b, 0)).color) = (1);
            }
          }
        } else {
          if (((bl != (null) && ((__struct_ptr_at(bl, 0)).color) == 1) ? 1 : 0)) {
            if (((br == (null) || ((__struct_ptr_at(br, 0)).color) == 0) ? 1 : 0)) {
              tree.value = b;
              {
                {
                  ((__struct_ptr_at(b, 0)).color) = (((__struct_ptr_at(a, 0)).color));
                }
              }
              {
                {
                  ((__struct_ptr_at(a, 0)).color) = (0);
                }
              }
              (__struct_ptr_at(b, 0)).left = a;
              (__struct_ptr_at(a, 0)).right = br;
              {
                {
                  ((__struct_ptr_at(bl, 0)).color) = (0);
                }
              }
              res = 0;
            } else {
              (((((!!(bl != (null))) || (((): any => { _wassert("bl!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
              (((((!!(br != (null))) || (((): any => { _wassert("br!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
              (((((!!(((__struct_ptr_at(bl, 0)).color) == 1)) || (((): any => { _wassert("SGLIB___GET_VALUE(bl->color)==1", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
              (((((!!(((__struct_ptr_at(br, 0)).color) == 1)) || (((): any => { _wassert("SGLIB___GET_VALUE(br->color)==1", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
              c = br;
              cl = (__struct_ptr_at(c, 0)).right;
              cr = (__struct_ptr_at(c, 0)).left;
              tree.value = c;
              {
                {
                  ((__struct_ptr_at(c, 0)).color) = (((__struct_ptr_at(a, 0)).color));
                }
              }
              {
                {
                  ((__struct_ptr_at(a, 0)).color) = (0);
                }
              }
              (__struct_ptr_at(c, 0)).right = b;
              (__struct_ptr_at(c, 0)).left = a;
              (__struct_ptr_at(b, 0)).left = cl;
              (__struct_ptr_at(a, 0)).right = cr;
              res = 0;
            }
          } else {
            (((((!!(((br != (null) && ((__struct_ptr_at(br, 0)).color) == 1) ? 1 : 0))) || (((): any => { _wassert("br!=null && SGLIB___GET_VALUE(br->color)==1", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
            c = br;
            cl = (__struct_ptr_at(c, 0)).right;
            cr = (__struct_ptr_at(c, 0)).left;
            tree.value = c;
            {
              {
                ((__struct_ptr_at(c, 0)).color) = (((__struct_ptr_at(a, 0)).color));
              }
            }
            {
              {
                ((__struct_ptr_at(a, 0)).color) = (0);
              }
            }
            (__struct_ptr_at(c, 0)).right = b;
            (__struct_ptr_at(c, 0)).left = a;
            (__struct_ptr_at(b, 0)).left = cl;
            (__struct_ptr_at(a, 0)).right = cr;
            res = 0;
          }
        }
      }
    }
  }
  return (res);
}

function sglib___int_node_rb_fix_right_deletion_discrepancy(tree: { value: int_node_rb | null }): number {
  let res = 0;
  {
    let t = null;
    let a = null;
    let b = null;
    let c = null;
    let d = null;
    let ar = null;
    let bl = null;
    let br = null;
    let cl = null;
    let cr = null;
    let dl = null;
    let dr = null;
    ((ar));
    t = a = tree.value;
    (((((!!(t != (null))) || (((): any => { _wassert("t!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
    ar = (__struct_ptr_at(a, 0)).right;
    b = (__struct_ptr_at(t, 0)).left;
    if (b == (null)) {
      (((((!!(((__struct_ptr_at(t, 0)).color) == 1)) || (((): any => { _wassert("SGLIB___GET_VALUE(t->color)==1", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
      {
        {
          ((__struct_ptr_at(t, 0)).color) = (0);
        }
      }
      res = 0;
    } else {
      bl = (__struct_ptr_at(b, 0)).left;
      br = (__struct_ptr_at(b, 0)).right;
      if (((__struct_ptr_at(b, 0)).color) == 1) {
        if (br == (null)) {
          tree.value = b;
          {
            {
              ((__struct_ptr_at(b, 0)).color) = (0);
            }
          }
          (__struct_ptr_at(b, 0)).right = a;
          (__struct_ptr_at(a, 0)).left = br;
          res = 0;
        } else {
          c = br;
          (((((!!(((c != (null) && ((__struct_ptr_at(c, 0)).color) == 0) ? 1 : 0))) || (((): any => { _wassert("c!=null && SGLIB___GET_VALUE(c->color)==0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
          cl = (__struct_ptr_at(c, 0)).left;
          cr = (__struct_ptr_at(c, 0)).right;
          if ((((((cl == (null) || ((__struct_ptr_at(cl, 0)).color) == 0) ? 1 : 0)) && (((cr == (null) || ((__struct_ptr_at(cr, 0)).color) == 0) ? 1 : 0))) ? 1 : 0)) {
            tree.value = b;
            (__struct_ptr_at(b, 0)).right = a;
            {
              {
                ((__struct_ptr_at(b, 0)).color) = (0);
              }
            }
            (__struct_ptr_at(a, 0)).left = c;
            {
              {
                ((__struct_ptr_at(c, 0)).color) = (1);
              }
            }
            res = 0;
          } else {
            if (((cl != (null) && ((__struct_ptr_at(cl, 0)).color) == 1) ? 1 : 0)) {
              if (((cr != (null) && ((__struct_ptr_at(cr, 0)).color) == 1) ? 1 : 0)) {
                d = cr;
                dl = (__struct_ptr_at(d, 0)).left;
                dr = (__struct_ptr_at(d, 0)).right;
                tree.value = d;
                {
                  {
                    ((__struct_ptr_at(d, 0)).color) = (0);
                  }
                }
                (__struct_ptr_at(d, 0)).left = b;
                (__struct_ptr_at(c, 0)).right = dl;
                (__struct_ptr_at(d, 0)).right = a;
                (__struct_ptr_at(a, 0)).left = dr;
                res = 0;
              } else {
                tree.value = c;
                (__struct_ptr_at(c, 0)).left = b;
                (__struct_ptr_at(c, 0)).right = a;
                (__struct_ptr_at(b, 0)).left = bl;
                (__struct_ptr_at(b, 0)).right = cl;
                (__struct_ptr_at(a, 0)).left = cr;
                {
                  {
                    ((__struct_ptr_at(cl, 0)).color) = (0);
                  }
                }
                res = 0;
              }
            } else {
              if (((cr != (null) && ((__struct_ptr_at(cr, 0)).color) == 1) ? 1 : 0)) {
                (((((!!(((cl == (null) || ((__struct_ptr_at(cl, 0)).color) == 0) ? 1 : 0))) || (((): any => { _wassert("cl==null || SGLIB___GET_VALUE(cl->color)==0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
                d = cr;
                dl = (__struct_ptr_at(d, 0)).left;
                dr = (__struct_ptr_at(d, 0)).right;
                tree.value = d;
                {
                  {
                    ((__struct_ptr_at(d, 0)).color) = (0);
                  }
                }
                (__struct_ptr_at(d, 0)).left = b;
                (__struct_ptr_at(c, 0)).right = dl;
                (__struct_ptr_at(d, 0)).right = a;
                (__struct_ptr_at(a, 0)).left = dr;
                res = 0;
              } else {
                (((((!!(0)) || (((): any => { _wassert("0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
                res = 0;
              }
            }
          }
        }
      } else {
        if ((((((bl == (null) || ((__struct_ptr_at(bl, 0)).color) == 0) ? 1 : 0)) && (((br == (null) || ((__struct_ptr_at(br, 0)).color) == 0) ? 1 : 0))) ? 1 : 0)) {
          res = (((__struct_ptr_at(a, 0)).color) == 0);
          {
            {
              ((__struct_ptr_at(a, 0)).color) = (0);
            }
          }
          {
            {
              ((__struct_ptr_at(b, 0)).color) = (1);
            }
          }
        } else {
          if (((bl != (null) && ((__struct_ptr_at(bl, 0)).color) == 1) ? 1 : 0)) {
            if (((br == (null) || ((__struct_ptr_at(br, 0)).color) == 0) ? 1 : 0)) {
              tree.value = b;
              {
                {
                  ((__struct_ptr_at(b, 0)).color) = (((__struct_ptr_at(a, 0)).color));
                }
              }
              {
                {
                  ((__struct_ptr_at(a, 0)).color) = (0);
                }
              }
              (__struct_ptr_at(b, 0)).right = a;
              (__struct_ptr_at(a, 0)).left = br;
              {
                {
                  ((__struct_ptr_at(bl, 0)).color) = (0);
                }
              }
              res = 0;
            } else {
              (((((!!(bl != (null))) || (((): any => { _wassert("bl!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
              (((((!!(br != (null))) || (((): any => { _wassert("br!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
              (((((!!(((__struct_ptr_at(bl, 0)).color) == 1)) || (((): any => { _wassert("SGLIB___GET_VALUE(bl->color)==1", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
              (((((!!(((__struct_ptr_at(br, 0)).color) == 1)) || (((): any => { _wassert("SGLIB___GET_VALUE(br->color)==1", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
              c = br;
              cl = (__struct_ptr_at(c, 0)).left;
              cr = (__struct_ptr_at(c, 0)).right;
              tree.value = c;
              {
                {
                  ((__struct_ptr_at(c, 0)).color) = (((__struct_ptr_at(a, 0)).color));
                }
              }
              {
                {
                  ((__struct_ptr_at(a, 0)).color) = (0);
                }
              }
              (__struct_ptr_at(c, 0)).left = b;
              (__struct_ptr_at(c, 0)).right = a;
              (__struct_ptr_at(b, 0)).right = cl;
              (__struct_ptr_at(a, 0)).left = cr;
              res = 0;
            }
          } else {
            (((((!!(((br != (null) && ((__struct_ptr_at(br, 0)).color) == 1) ? 1 : 0))) || (((): any => { _wassert("br!=null && SGLIB___GET_VALUE(br->color)==1", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
            c = br;
            cl = (__struct_ptr_at(c, 0)).left;
            cr = (__struct_ptr_at(c, 0)).right;
            tree.value = c;
            {
              {
                ((__struct_ptr_at(c, 0)).color) = (((__struct_ptr_at(a, 0)).color));
              }
            }
            {
              {
                ((__struct_ptr_at(a, 0)).color) = (0);
              }
            }
            (__struct_ptr_at(c, 0)).left = b;
            (__struct_ptr_at(c, 0)).right = a;
            (__struct_ptr_at(b, 0)).right = cl;
            (__struct_ptr_at(a, 0)).left = cr;
            res = 0;
          }
        }
      }
    }
  }
  return (res);
}

function sglib___int_node_rb_add_recursive(tree: { value: int_node_rb | null }, elem: int_node_rb | null): void {
  let cmp = 0;
  let t = null;
  t = tree.value;
  if (t == (null)) {
    {
      {
        ((__struct_ptr_at(elem, 0)).color) = (1);
      }
    }
    tree.value = elem;
  } else {
    cmp = (i32((__struct_ptr_at((elem), 0)).v - (__struct_ptr_at((t), 0)).v));
    if (((cmp < 0 || (((cmp == 0 && ((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) < __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(elem, t)) ? 1 : 0))) ? 1 : 0)) {
      sglib___int_node_rb_add_recursive(__field_ref_scalar(() => (__struct_ptr_at(t, 0)), "int_node_rb", "left", 8), elem);
      if (((__struct_ptr_at(t, 0)).color) == 0) {
        sglib___int_node_rb_fix_left_insertion_discrepancy(tree);
      }
    } else {
      sglib___int_node_rb_add_recursive(__field_ref_scalar(() => (__struct_ptr_at(t, 0)), "int_node_rb", "right", 16), elem);
      if (((__struct_ptr_at(t, 0)).color) == 0) {
        sglib___int_node_rb_fix_right_insertion_discrepancy(tree);
      }
    }
  }
}

function sglib___int_node_rb_delete_rightmost_leaf(tree: { value: int_node_rb | null }, theLeaf: { value: int_node_rb | null }): number {
  let t = null;
  let res = 0;
  let deepDecreased = 0;
  t = tree.value;
  res = 0;
  (((((!!(t != (null))) || (((): any => { _wassert("t!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
  if ((__struct_ptr_at(t, 0)).right == (null)) {
    theLeaf.value = t;
    if ((__struct_ptr_at(t, 0)).left != (null)) {
      if (((((__struct_ptr_at(t, 0)).color) == 0 && ((__struct_ptr_at((__struct_ptr_at(t, 0)).left, 0)).color) == 0) ? 1 : 0)) {
        res = 1;
      }
      {
        {
          ((__struct_ptr_at((__struct_ptr_at(t, 0)).left, 0)).color) = (0);
        }
      }
      tree.value = (__struct_ptr_at(t, 0)).left;
    } else {
      tree.value = null;
      res = (((__struct_ptr_at(t, 0)).color) == 0);
    }
  } else {
    deepDecreased = sglib___int_node_rb_delete_rightmost_leaf(__field_ref_scalar(() => (__struct_ptr_at(t, 0)), "int_node_rb", "right", 16), theLeaf);
    if (deepDecreased) {
      res = sglib___int_node_rb_fix_right_deletion_discrepancy(tree);
    }
  }
  return (res);
}

export function sglib___int_node_rb_delete_recursive(tree: { value: int_node_rb | null }, elem: int_node_rb | null): number {
  let t = null;
  let theLeaf = null;
  let cmp = 0;
  let res = 0;
  let deepDecreased = 0;
  t = tree.value;
  res = 0;
  if (t == (null)) {
    (((((!!(((0 && !cptr_eq("The element to delete not found in the tree,  use 'delete_if_member'", (null))) ? 1 : 0))) || (((): any => { _wassert("0 && \"The element to delete not found in the tree,  use 'delete_if_member'\"!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
  } else {
    cmp = (i32((__struct_ptr_at((elem), 0)).v - (__struct_ptr_at((t), 0)).v));
    if (((cmp < 0 || (((cmp == 0 && ((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) < __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(elem, t)) ? 1 : 0))) ? 1 : 0)) {
      deepDecreased = sglib___int_node_rb_delete_recursive(__field_ref_scalar(() => (__struct_ptr_at(t, 0)), "int_node_rb", "left", 8), elem);
      if (deepDecreased) {
        res = sglib___int_node_rb_fix_left_deletion_discrepancy(tree);
      }
    } else {
      if (((cmp > 0 || (((cmp == 0 && ((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) > (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) > __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) > (__r ?? 0)); })(elem, t)) ? 1 : 0))) ? 1 : 0)) {
        deepDecreased = sglib___int_node_rb_delete_recursive(__field_ref_scalar(() => (__struct_ptr_at(t, 0)), "int_node_rb", "right", 16), elem);
        if (deepDecreased) {
          res = sglib___int_node_rb_fix_right_deletion_discrepancy(tree);
        }
      } else {
        (((((!!(((elem == t && !cptr_eq("Deleting an element which is non member of the tree, use 'delete_if_member'", (null))) ? 1 : 0))) || (((): any => { _wassert("elem==t && \"Deleting an element which is non member of the tree, use 'delete_if_member'\"!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
        if ((__struct_ptr_at(t, 0)).left == (null)) {
          if ((__struct_ptr_at(t, 0)).right == (null)) {
            tree.value = null;
            res = (((__struct_ptr_at(t, 0)).color) == 0);
          } else {
            if (((((__struct_ptr_at(t, 0)).color) == 0 && ((__struct_ptr_at((__struct_ptr_at(t, 0)).right, 0)).color) == 0) ? 1 : 0)) {
              res = 1;
            }
            {
              {
                ((__struct_ptr_at((__struct_ptr_at(t, 0)).right, 0)).color) = (0);
              }
            }
            tree.value = (__struct_ptr_at(t, 0)).right;
          }
        } else {
          deepDecreased = (() => { const _box0 = { value: theLeaf }; const _r = sglib___int_node_rb_delete_rightmost_leaf(__field_ref_scalar(() => (__struct_ptr_at(t, 0)), "int_node_rb", "left", 8), _box0); theLeaf = _box0.value; return _r; })();
          (__struct_ptr_at(theLeaf, 0)).left = (__struct_ptr_at(t, 0)).left;
          (__struct_ptr_at(theLeaf, 0)).right = (__struct_ptr_at(t, 0)).right;
          {
            {
              ((__struct_ptr_at(theLeaf, 0)).color) = (((__struct_ptr_at(t, 0)).color));
            }
          }
          tree.value = theLeaf;
          if (deepDecreased) {
            res = sglib___int_node_rb_fix_left_deletion_discrepancy(tree);
          }
        }
      }
    }
  }
  return (res);
}

export function sglib_int_node_rb_add(tree: { value: int_node_rb | null }, elem: int_node_rb | null): void {
  (__struct_ptr_at(elem, 0)).left = (__struct_ptr_at(elem, 0)).right = null;
  sglib___int_node_rb_add_recursive(tree, elem);
  {
    ((tree.value).color) = (0);
  }
}

export function sglib_int_node_rb_delete(tree: { value: int_node_rb | null }, elem: int_node_rb | null): void {
  sglib___int_node_rb_delete_recursive(tree, elem);
  if (tree.value != (null)) {
    ((tree.value).color) = (0);
  }
}

export function sglib_int_node_rb_find_member(t: int_node_rb | null, elem: int_node_rb | null): int_node_rb | null {
  let res = null;
  {
    let _s_ = null;
    let _c_ = 0;
    _s_ = (t);
    while (_s_ != (null)) {
      _c_ = (i32((__struct_ptr_at(((elem)), 0)).v - (__struct_ptr_at((_s_), 0)).v));
      if (_c_ < 0) {
        _s_ = (__struct_ptr_at(_s_, 0)).left;
      } else {
        if (_c_ > 0) {
          _s_ = (__struct_ptr_at(_s_, 0)).right;
        } else {
          break;
        }
      }
    }
    (res) = _s_;
  }
  return (res);
}

export function sglib_int_node_rb_is_member(t: int_node_rb | null, elem: int_node_rb | null): number {
  let cmp = 0;
  while (t != (null)) {
    cmp = (i32((__struct_ptr_at((elem), 0)).v - (__struct_ptr_at((t), 0)).v));
    if (((cmp < 0 || (((cmp == 0 && ((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) < __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(elem, t)) ? 1 : 0))) ? 1 : 0)) {
      t = (__struct_ptr_at(t, 0)).left;
    } else {
      if (((cmp > 0 || (((cmp == 0 && ((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) > (__r.off ?? 0)); if (__lb || __rb) return (__cpp2ts_ptr_to_intptr(__l) > __cpp2ts_ptr_to_intptr(__r)); return ((__l ?? 0) > (__r ?? 0)); })(elem, t)) ? 1 : 0))) ? 1 : 0)) {
        t = (__struct_ptr_at(t, 0)).right;
      } else {
        (((((!!(t == elem)) || (((): any => { _wassert("t == elem", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
        return (1);
      }
    }
  }
  return (0);
}

export function sglib_int_node_rb_delete_if_member(tree: { value: int_node_rb | null }, elem: int_node_rb | null, memb: { value: int_node_rb | null }): number {
  if ((memb.value = sglib_int_node_rb_find_member(tree.value, elem)) != (null)) {
    sglib_int_node_rb_delete(tree, memb.value);
    return (1);
  } else {
    return (0);
  }
}

export function sglib_int_node_rb_add_if_not_member(tree: { value: int_node_rb | null }, elem: int_node_rb | null, memb: { value: int_node_rb | null }): number {
  if ((memb.value = sglib_int_node_rb_find_member(tree.value, elem)) == (null)) {
    sglib_int_node_rb_add(tree, elem);
    return (1);
  } else {
    return (0);
  }
}

export function sglib_int_node_rb_len(t: int_node_rb | null): number {
  let n = 0;
  let e = null;
  ((e));
  n = 0;
  {
    {
      {
        let _path_ = new Array(128).fill(null);
        let _right_ = new Array(128).fill(null);
        let _pass_ = cptr_create(128);
        let _cn_ = null;
        let _pathi_ = 0;
        let e = null;
        ((e));
        _cn_ = (t);
        _pathi_ = 0;
        while (_cn_ != (null)) {
          while (_cn_ != (null)) {
            _path_[_pathi_] = _cn_;
            _right_[_pathi_] = (__struct_ptr_at(_cn_, 0)).right;
            _pass_.buf[(_pass_.off ?? 0) + _pathi_] = (((0) << 24 >> 24)) << 24 >> 24;
            _cn_ = (__struct_ptr_at(_cn_, 0)).left;
            if (1 == 0) {
              e = _path_[_pathi_];
              {
                {
                  n++;
                }
              }
            }
            _pathi_++;
            if (_pathi_ >= 128) {
              (((((!!(((0 && "the binary_tree is too deep") ? 1 : 0))) || (((): any => { _wassert("0 && \"the binary_tree is too deep\"", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
            }
          }
          do {
            _pathi_--;
            if ((((((1 == 1 && ((_pass_.buf[(_pass_.off ?? 0) + _pathi_]) << 24 >> 24) == 0) ? 1 : 0)) || (((1 == 2 && (((((_pass_.buf[(_pass_.off ?? 0) + _pathi_]) << 24 >> 24) == 1 || _right_[_pathi_] == (null)) ? 1 : 0))) ? 1 : 0))) ? 1 : 0)) {
              e = _path_[_pathi_];
              {
                {
                  n++;
                }
              }
            }
            _pass_.buf[(_pass_.off ?? 0) + _pathi_]++;
          } while (((_pathi_ > 0 && _right_[_pathi_] == (null)) ? 1 : 0));
          _cn_ = _right_[_pathi_];
          _right_[_pathi_] = null;
          _pathi_++;
        }
      }
    }
  }
  return (n);
}

export function sglib__int_node_rb_it_compute_current_elem(it: sglib_int_node_rb_iterator | null): void {
  let i = 0;
  let j = 0;
  let s = null;
  let eqt = null;
  let subcomparator = null;
  eqt = (__struct_ptr_at(it, 0)).equalto;
  subcomparator = (__struct_ptr_at(it, 0)).subcomparator;
  (__struct_ptr_at(it, 0)).currentelem = null;
  while ((((((__struct_ptr_at(it, 0)).pathi) << 16 >> 16) > 0 && (__struct_ptr_at(it, 0)).currentelem == (null)) ? 1 : 0)) {
    i = i32((((__struct_ptr_at(it, 0)).pathi) << 16 >> 16) - 1);
    if (i >= 0) {
      if ((((__struct_ptr_at(it, 0)).pass.buf[((__struct_ptr_at(it, 0)).pass.off ?? 0) + i]) << 24 >> 24) >= 2) {
        (__struct_ptr_at(it, 0)).pathi--;
      } else {
        if ((((__struct_ptr_at(it, 0)).pass.buf[((__struct_ptr_at(it, 0)).pass.off ?? 0) + i]) << 24 >> 24) == 0) {
          s = (__struct_ptr_at(it, 0)).path[i].left;
        } else {
          s = (__struct_ptr_at(it, 0)).path[i].right;
        }
        if (eqt != (null)) {
          if (subcomparator == (null)) {
            {
              {
                let _s_ = null;
                let _c_ = 0;
                _s_ = (s);
                while (_s_ != (null)) {
                  _c_ = (i32((__struct_ptr_at(((eqt)), 0)).v - (__struct_ptr_at((_s_), 0)).v));
                  if (_c_ < 0) {
                    _s_ = (__struct_ptr_at(_s_, 0)).left;
                  } else {
                    if (_c_ > 0) {
                      _s_ = (__struct_ptr_at(_s_, 0)).right;
                    } else {
                      break;
                    }
                  }
                }
                (s) = _s_;
              }
            }
          } else {
            {
              {
                let _s_ = null;
                let _c_ = 0;
                _s_ = (s);
                while (_s_ != (null)) {
                  _c_ = subcomparator((eqt), _s_);
                  if (_c_ < 0) {
                    _s_ = (__struct_ptr_at(_s_, 0)).left;
                  } else {
                    if (_c_ > 0) {
                      _s_ = (__struct_ptr_at(_s_, 0)).right;
                    } else {
                      break;
                    }
                  }
                }
                (s) = _s_;
              }
            }
          }
        }
        if (s != (null)) {
          j = i32(i + 1);
          (__struct_ptr_at(it, 0)).path[j] = s;
          (__struct_ptr_at(it, 0)).pass.buf[((__struct_ptr_at(it, 0)).pass.off ?? 0) + j] = (((0) << 24 >> 24)) << 24 >> 24;
          (__struct_ptr_at(it, 0)).pathi++;
        }
        (__struct_ptr_at(it, 0)).pass.buf[((__struct_ptr_at(it, 0)).pass.off ?? 0) + i]++;
      }
    }
    if ((((((__struct_ptr_at(it, 0)).pathi) << 16 >> 16) > 0 && (((__struct_ptr_at(it, 0)).order) << 16 >> 16) == (((__struct_ptr_at(it, 0)).pass.buf[((__struct_ptr_at(it, 0)).pass.off ?? 0) + i32((((__struct_ptr_at(it, 0)).pathi) << 16 >> 16) - 1)]) << 24 >> 24)) ? 1 : 0)) {
      (__struct_ptr_at(it, 0)).currentelem = (__struct_ptr_at(it, 0)).path[i32((((__struct_ptr_at(it, 0)).pathi) << 16 >> 16) - 1)];
    }
  }
}

export function sglib__int_node_rb_it_init(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null, order: number, subcomparator: (arg0: int_node_rb | null, arg1: int_node_rb | null) => number, equalto: int_node_rb | null): int_node_rb | null {
  let t = null;
  (((((!!(it != (null))) || (((): any => { _wassert("it!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
  (__struct_ptr_at(it, 0)).order = (((order) << 16 >> 16)) << 16 >> 16;
  (__struct_ptr_at(it, 0)).equalto = equalto;
  (__struct_ptr_at(it, 0)).subcomparator = subcomparator;
  if (equalto == (null)) {
    t = tree;
  } else {
    if (subcomparator == (null)) {
      {
        {
          let _s_ = null;
          let _c_ = 0;
          _s_ = (tree);
          while (_s_ != (null)) {
            _c_ = (i32((__struct_ptr_at(((equalto)), 0)).v - (__struct_ptr_at((_s_), 0)).v));
            if (_c_ < 0) {
              _s_ = (__struct_ptr_at(_s_, 0)).left;
            } else {
              if (_c_ > 0) {
                _s_ = (__struct_ptr_at(_s_, 0)).right;
              } else {
                break;
              }
            }
          }
          (t) = _s_;
        }
      }
    } else {
      {
        {
          let _s_ = null;
          let _c_ = 0;
          _s_ = (tree);
          while (_s_ != (null)) {
            _c_ = subcomparator((equalto), _s_);
            if (_c_ < 0) {
              _s_ = (__struct_ptr_at(_s_, 0)).left;
            } else {
              if (_c_ > 0) {
                _s_ = (__struct_ptr_at(_s_, 0)).right;
              } else {
                break;
              }
            }
          }
          (t) = _s_;
        }
      }
    }
  }
  if (t == (null)) {
    (__struct_ptr_at(it, 0)).pathi = (((0) << 16 >> 16)) << 16 >> 16;
    (__struct_ptr_at(it, 0)).currentelem = null;
  } else {
    (__struct_ptr_at(it, 0)).pathi = (((1) << 16 >> 16)) << 16 >> 16;
    (__struct_ptr_at(it, 0)).pass.buf[((__struct_ptr_at(it, 0)).pass.off ?? 0) + 0] = (((0) << 24 >> 24)) << 24 >> 24;
    (__struct_ptr_at(it, 0)).path[0] = t;
    if (order == 0) {
      (__struct_ptr_at(it, 0)).currentelem = t;
    } else {
      sglib__int_node_rb_it_compute_current_elem(it);
    }
  }
  return ((__struct_ptr_at(it, 0)).currentelem);
}

export function sglib_int_node_rb_it_init(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null): int_node_rb | null {
  return (sglib__int_node_rb_it_init(it, tree, 2, null, null));
}

export function sglib_int_node_rb_it_init_preorder(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null): int_node_rb | null {
  return (sglib__int_node_rb_it_init(it, tree, 0, null, null));
}

export function sglib_int_node_rb_it_init_inorder(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null): int_node_rb | null {
  return (sglib__int_node_rb_it_init(it, tree, 1, null, null));
}

export function sglib_int_node_rb_it_init_postorder(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null): int_node_rb | null {
  return (sglib__int_node_rb_it_init(it, tree, 2, null, null));
}

export function sglib_int_node_rb_it_init_on_equal(it: sglib_int_node_rb_iterator | null, tree: int_node_rb | null, subcomparator: (arg0: int_node_rb | null, arg1: int_node_rb | null) => number, equalto: int_node_rb | null): int_node_rb | null {
  return (sglib__int_node_rb_it_init(it, tree, 1, subcomparator, equalto));
}

export function sglib_int_node_rb_it_current(it: sglib_int_node_rb_iterator | null): int_node_rb | null {
  return ((__struct_ptr_at(it, 0)).currentelem);
}

export function sglib_int_node_rb_it_next(it: sglib_int_node_rb_iterator | null): int_node_rb | null {
  sglib__int_node_rb_it_compute_current_elem(it);
  return ((__struct_ptr_at(it, 0)).currentelem);
}

function sglib___int_node_rb_consistency_check_recursive(t: int_node_rb | null, pathdeep: { value: number }, cdeep: number): void {
  if (t == (null)) {
    if (pathdeep.value < 0) {
      (() => { const __p: any = (pathdeep); const __v: any = (cdeep); if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    } else {
      (((((!!(pathdeep.value == cdeep)) || (((): any => { _wassert("*pathdeep == cdeep", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
    }
  } else {
    if ((__struct_ptr_at(t, 0)).left != (null)) {
      (((((!!((i32((__struct_ptr_at(((__struct_ptr_at(t, 0)).left), 0)).v - (__struct_ptr_at((t), 0)).v)) <= 0)) || (((): any => { _wassert("INT_NODE_RB_CMP(t->left, t) <= 0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
    }
    if ((__struct_ptr_at(t, 0)).right != (null)) {
      (((((!!((i32((__struct_ptr_at((t), 0)).v - (__struct_ptr_at(((__struct_ptr_at(t, 0)).right), 0)).v)) <= 0)) || (((): any => { _wassert("INT_NODE_RB_CMP(t, t->right) <= 0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
    }
    if (((__struct_ptr_at(t, 0)).color) == 1) {
      (((((!!((((__struct_ptr_at(t, 0)).left == (null) || ((__struct_ptr_at((__struct_ptr_at(t, 0)).left, 0)).color) == 0) ? 1 : 0))) || (((): any => { _wassert("t->left == null || SGLIB___GET_VALUE(t->left->color)==0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
      (((((!!((((__struct_ptr_at(t, 0)).right == (null) || ((__struct_ptr_at((__struct_ptr_at(t, 0)).right, 0)).color) == 0) ? 1 : 0))) || (((): any => { _wassert("t->right == null || SGLIB___GET_VALUE(t->right->color)==0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
      let _ref0 = { value: pathdeep.value };
      sglib___int_node_rb_consistency_check_recursive((__struct_ptr_at(t, 0)).left, _ref0, cdeep);
      pathdeep.value = _ref0.value;
      let _ref1 = { value: pathdeep.value };
      sglib___int_node_rb_consistency_check_recursive((__struct_ptr_at(t, 0)).right, _ref1, cdeep);
      pathdeep.value = _ref1.value;
    } else {
      let _ref2 = { value: pathdeep.value };
      sglib___int_node_rb_consistency_check_recursive((__struct_ptr_at(t, 0)).left, _ref2, i32(cdeep + 1));
      pathdeep.value = _ref2.value;
      let _ref3 = { value: pathdeep.value };
      sglib___int_node_rb_consistency_check_recursive((__struct_ptr_at(t, 0)).right, _ref3, i32(cdeep + 1));
      pathdeep.value = _ref3.value;
    }
  }
}

export function sglib___int_node_rb_consistency_check(t: int_node_rb | null): void {
  let pathDeep_box = { value: 0 };
  (((((!!(((t == (null) || ((__struct_ptr_at(t, 0)).color) == 0) ? 1 : 0))) || (((): any => { _wassert("t==null || SGLIB___GET_VALUE(t->color) == 0", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((117)))) >>> 0)); return 0; })())) ? 1 : 0)));
  pathDeep_box.value = -1;
  sglib___int_node_rb_consistency_check_recursive(t, pathDeep_box, 0);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sglib_intkv_node_iterator {
  currentelem: intkv_node | null;
  nextelem: intkv_node | null;
  subcomparator: (arg0: intkv_node | null, arg1: intkv_node | null) => number;
  equalto: intkv_node | null;
  constructor() {
    this.currentelem = null;
    this.nextelem = null;
    this.subcomparator = null;
    this.equalto = null;
  }
}
(sglib_intkv_node_iterator as any).__fieldTypes = ["int64","int64","int32","int64"];
(sglib_intkv_node_iterator as any).__fieldNames = ["currentelem","nextelem","subcomparator","equalto"];
(sglib_intkv_node_iterator as any).__fieldOffsets = [0,8,16,24];

export function sglib_intkv_node_is_member(list: intkv_node | null, elem: intkv_node | null): number {
  let result = 0;
  {
    let _p_ = null;
    for (_p_ = (list); ((_p_ != (null) && _p_ != (elem)) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next_in_chain) {
    }
    (result) = (_p_ != (null));
  }
  return (result);
}

export function sglib_intkv_node_find_member(list: intkv_node | null, elem: intkv_node | null): intkv_node | null {
  let result = null;
  {
    let _p_ = null;
    for (_p_ = (list); ((_p_ != (null) && (i32((__struct_ptr_at((_p_), 0)).k - (__struct_ptr_at(((elem)), 0)).k)) != 0) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next_in_chain) {
    }
    (result) = _p_;
  }
  return (result);
}

export function sglib_intkv_node_add_if_not_member(list: { value: intkv_node | null }, elem: intkv_node | null, member: { value: intkv_node | null }): number {
  {
    let _p_ = null;
    for (_p_ = (list.value); ((_p_ != (null) && (i32((__struct_ptr_at((_p_), 0)).k - (__struct_ptr_at(((elem)), 0)).k)) != 0) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next_in_chain) {
    }
    member.value = _p_;
    if (_p_ == (null)) {
      {
        {
          (__struct_ptr_at((elem), 0)).next_in_chain = (list.value);
          list.value = (elem);
        }
      }
    }
  }
  return (member.value == (null));
}

export function sglib_intkv_node_add(list: { value: intkv_node | null }, elem: intkv_node | null): void {
  {
    (__struct_ptr_at((elem), 0)).next_in_chain = (list.value);
    list.value = (elem);
  }
}

export function sglib_intkv_node_concat(first: { value: intkv_node | null }, second: intkv_node | null): void {
  {
    if ((first.value) == (null)) {
      first.value = (second);
    } else {
      let _p_ = null;
      for (_p_ = (first.value); (__struct_ptr_at(_p_, 0)).next_in_chain != (null); _p_ = (__struct_ptr_at(_p_, 0)).next_in_chain) {
      }
      (__struct_ptr_at(_p_, 0)).next_in_chain = (second);
    }
  }
}

export function sglib_intkv_node_delete(list: { value: intkv_node | null }, elem: intkv_node | null): void {
  {
    let _p_ = null;
    for (_p_ = list; ((_p_.value != (null) && _p_.value != (elem)) ? 1 : 0); _p_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "intkv_node", "next_in_chain", 8))((_p_.value))) {
    }
    (((((!!(((_p_.value != (null) && !cptr_eq("element is not member of the container, use DELETE_IF_MEMBER instead", (null))) ? 1 : 0))) || (((): any => { _wassert("*_p_!=null && \"element is not member of the container, use DELETE_IF_MEMBER instead\"!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((121)))) >>> 0)); return 0; })())) ? 1 : 0)));
    _p_.value = (_p_.value).next_in_chain;
  }
}

export function sglib_intkv_node_delete_if_member(list: { value: intkv_node | null }, elem: intkv_node | null, member: { value: intkv_node | null }): number {
  {
    let _p_ = null;
    for (_p_ = list; ((_p_.value != (null) && (i32(((_p_.value)).k - (__struct_ptr_at(((elem)), 0)).k)) != 0) ? 1 : 0); _p_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "intkv_node", "next_in_chain", 8))((_p_.value))) {
    }
    member.value = _p_.value;
    if (_p_.value != (null)) {
      _p_.value = (_p_.value).next_in_chain;
    }
  }
  return (member.value != (null));
}

export function sglib_intkv_node_sort(list: { value: intkv_node | null }): void {
  {
    let _r_ = null;
    let _a_ = null;
    let _b_ = null;
    let _todo_ = null;
    let _t_ = null;
    let _restail_ = null;
    let _i_ = 0;
    let _n_ = 0;
    let _contFlag_ = 0;
    _r_ = (list.value);
    _contFlag_ = 1;
    for (_n_ = 1; _contFlag_; _n_ = i32(_n_ + _n_)) {
      _todo_ = _r_;
      _r_ = null;
      _restail_ = _r_;
      _contFlag_ = 0;
      while (_todo_ != (null)) {
        _a_ = _todo_;
        for (_i_ = 1, _t_ = _a_; ((_i_ < _n_ && _t_ != (null)) ? 1 : 0); _i_++, _t_ = (__struct_ptr_at(_t_, 0)).next_in_chain) {
        }
        if (_t_ == (null)) {
          _restail_.value = _a_;
          break;
        }
        _b_ = (__struct_ptr_at(_t_, 0)).next_in_chain;
        (__struct_ptr_at(_t_, 0)).next_in_chain = null;
        for (_i_ = 1, _t_ = _b_; ((_i_ < _n_ && _t_ != (null)) ? 1 : 0); _i_++, _t_ = (__struct_ptr_at(_t_, 0)).next_in_chain) {
        }
        if (_t_ == (null)) {
          _todo_ = null;
        } else {
          _todo_ = (__struct_ptr_at(_t_, 0)).next_in_chain;
          (__struct_ptr_at(_t_, 0)).next_in_chain = null;
        }
        while (((_a_ != (null) && _b_ != (null)) ? 1 : 0)) {
          if ((i32((__struct_ptr_at((_a_), 0)).k - (__struct_ptr_at((_b_), 0)).k)) < 0) {
            _restail_.value = _a_;
            _restail_ = __field_ref_scalar(() => (__struct_ptr_at(_a_, 0)), "intkv_node", "next_in_chain", 8);
            _a_ = (__struct_ptr_at(_a_, 0)).next_in_chain;
          } else {
            _restail_.value = _b_;
            _restail_ = __field_ref_scalar(() => (__struct_ptr_at(_b_, 0)), "intkv_node", "next_in_chain", 8);
            _b_ = (__struct_ptr_at(_b_, 0)).next_in_chain;
          }
        }
        if (_a_ != (null)) {
          _restail_.value = _a_;
        } else {
          _restail_.value = _b_;
        }
        while (_restail_.value != (null)) {
          _restail_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "intkv_node", "next_in_chain", 8))((_restail_.value));
        }
        _contFlag_ = 1;
      }
    }
    list.value = _r_;
  }
}

export function sglib_intkv_node_len(list: intkv_node | null): number {
  let res = 0;
  {
    let _ce_ = null;
    ((_ce_));
    (res) = 0;
    {
      {
        let _ne_ = null;
        let _ce_ = null;
        (_ce_) = (list);
        while ((_ce_) != (null)) {
          _ne_ = (__struct_ptr_at((_ce_), 0)).next_in_chain;
          {
            {
              (res)++;
            }
          }
          (_ce_) = _ne_;
        }
      }
    }
  }
  return (res);
}

export function sglib_intkv_node_reverse(list: { value: intkv_node | null }): void {
  {
    let _list_ = null;
    let _tmp_ = null;
    let _res_ = null;
    _list_ = (list.value);
    _res_ = null;
    while (_list_ != (null)) {
      _tmp_ = (__struct_ptr_at(_list_, 0)).next_in_chain;
      (__struct_ptr_at(_list_, 0)).next_in_chain = _res_;
      _res_ = _list_;
      _list_ = _tmp_;
    }
    list.value = _res_;
  }
}

export function sglib_intkv_node_it_init_on_equal(it: sglib_intkv_node_iterator | null, list: intkv_node | null, subcomparator: (arg0: intkv_node | null, arg1: intkv_node | null) => number, equalto: intkv_node | null): intkv_node | null {
  (__struct_ptr_at(it, 0)).subcomparator = subcomparator;
  (__struct_ptr_at(it, 0)).equalto = equalto;
  (__struct_ptr_at(it, 0)).nextelem = list;
  return (sglib_intkv_node_it_next(it));
}

export function sglib_intkv_node_it_init(it: sglib_intkv_node_iterator | null, list: intkv_node | null): intkv_node | null {
  return (sglib_intkv_node_it_init_on_equal(it, list, null, null));
}

export function sglib_intkv_node_it_current(it: sglib_intkv_node_iterator | null): intkv_node | null {
  return ((__struct_ptr_at(it, 0)).currentelem);
}

export function sglib_intkv_node_it_next(it: sglib_intkv_node_iterator | null): intkv_node | null {
  let ce = null;
  let eq = null;
  let scp = null;
  ce = (__struct_ptr_at(it, 0)).nextelem;
  (__struct_ptr_at(it, 0)).nextelem = null;
  if ((__struct_ptr_at(it, 0)).subcomparator != (null)) {
    eq = (__struct_ptr_at(it, 0)).equalto;
    scp = (__struct_ptr_at(it, 0)).subcomparator;
    while (((ce != (null) && scp(ce, eq) != 0) ? 1 : 0)) {
      ce = (__struct_ptr_at(ce, 0)).next_in_chain;
    }
  }
  (__struct_ptr_at(it, 0)).currentelem = ce;
  if (ce != (null)) {
    (__struct_ptr_at(it, 0)).nextelem = (__struct_ptr_at(ce, 0)).next_in_chain;
  }
  return (ce);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sglib_hashed_intkv_node_iterator {
  containerIt: sglib_intkv_node_iterator;
  table: CPtr | null;
  currentIndex: number;
  subcomparator: (arg0: intkv_node | null, arg1: intkv_node | null) => number;
  equalto: intkv_node | null;
  constructor() {
    this.containerIt = new sglib_intkv_node_iterator();
    this.table = null;
    this.currentIndex = 0;
    this.subcomparator = null;
    this.equalto = null;
  }
}
(sglib_hashed_intkv_node_iterator as any).__fieldTypes = ["int32","int64","int32","int32","int64"];
(sglib_hashed_intkv_node_iterator as any).__fieldNames = ["containerIt","table","currentIndex","subcomparator","equalto"];
(sglib_hashed_intkv_node_iterator as any).__fieldOffsets = [0,8,16,24,32];

export function sglib_hashed_intkv_node_init(table: { value: intkv_node | null }): void {
  let i = 0;
  for (i = ((0) >>> 0); ((i) >>> 0) < (((7)) >>> 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    cptr_write_ptr(table, ((i) >>> 0), null);
  }
}

export function sglib_hashed_intkv_node_add(table: { value: intkv_node | null }, elem: intkv_node | null): void {
  let i = 0;
  i = u32((((Math.trunc(+(intkv_node_hash(elem)))) >>> 0)) % (((7)) >>> 0));
  sglib_intkv_node_add({ get value(): any { return cptr_read_ptr((table), ((i) >>> 0)); }, set value(__v: any) { cptr_write_ptr((table), ((i) >>> 0), __v); } }, elem);
}

export function sglib_hashed_intkv_node_add_if_not_member(table: { value: intkv_node | null }, elem: intkv_node | null, member: { value: intkv_node | null }): number {
  let i = 0;
  i = u32((((Math.trunc(+(intkv_node_hash(elem)))) >>> 0)) % (((7)) >>> 0));
  return (sglib_intkv_node_add_if_not_member({ get value(): any { return cptr_read_ptr((table), ((i) >>> 0)); }, set value(__v: any) { cptr_write_ptr((table), ((i) >>> 0), __v); } }, elem, member));
}

export function sglib_hashed_intkv_node_delete(table: { value: intkv_node | null }, elem: intkv_node | null): void {
  let i = 0;
  i = u32((((Math.trunc(+(intkv_node_hash(elem)))) >>> 0)) % (((7)) >>> 0));
  sglib_intkv_node_delete({ get value(): any { return cptr_read_ptr((table), ((i) >>> 0)); }, set value(__v: any) { cptr_write_ptr((table), ((i) >>> 0), __v); } }, elem);
}

export function sglib_hashed_intkv_node_delete_if_member(table: { value: intkv_node | null }, elem: intkv_node | null, memb: { value: intkv_node | null }): number {
  let i = 0;
  i = u32((((Math.trunc(+(intkv_node_hash(elem)))) >>> 0)) % (((7)) >>> 0));
  return (sglib_intkv_node_delete_if_member({ get value(): any { return cptr_read_ptr((table), ((i) >>> 0)); }, set value(__v: any) { cptr_write_ptr((table), ((i) >>> 0), __v); } }, elem, memb));
}

export function sglib_hashed_intkv_node_is_member(table: { value: intkv_node | null }, elem: intkv_node | null): number {
  let i = 0;
  i = u32((((Math.trunc(+(intkv_node_hash(elem)))) >>> 0)) % (((7)) >>> 0));
  return (sglib_intkv_node_is_member(cptr_read_ptr((table), ((i) >>> 0)), elem));
}

export function sglib_hashed_intkv_node_find_member(table: { value: intkv_node | null }, elem: intkv_node | null): intkv_node | null {
  let i = 0;
  i = u32((((Math.trunc(+(intkv_node_hash(elem)))) >>> 0)) % (((7)) >>> 0));
  return (sglib_intkv_node_find_member(cptr_read_ptr((table), ((i) >>> 0)), elem));
}

export function sglib_hashed_intkv_node_it_init_on_equal(it: sglib_hashed_intkv_node_iterator | null, table: { value: intkv_node | null }, subcomparator: (arg0: intkv_node | null, arg1: intkv_node | null) => number, equalto: intkv_node | null): intkv_node | null {
  let e = null;
  (__struct_ptr_at(it, 0)).table = table;
  (__struct_ptr_at(it, 0)).currentIndex = 0;
  (__struct_ptr_at(it, 0)).subcomparator = subcomparator;
  (__struct_ptr_at(it, 0)).equalto = equalto;
  e = sglib_intkv_node_it_init_on_equal(__field_ref_aggregate(() => (__struct_ptr_at(it, 0)), "sglib_hashed_intkv_node_iterator", "containerIt", 0), cptr_read_ptr(table, (__struct_ptr_at(it, 0)).currentIndex), (__struct_ptr_at(it, 0)).subcomparator, (__struct_ptr_at(it, 0)).equalto);
  if (e == (null)) {
    e = sglib_hashed_intkv_node_it_next(it);
  }
  return (e);
}

export function sglib_hashed_intkv_node_it_init(it: sglib_hashed_intkv_node_iterator | null, table: { value: intkv_node | null }): intkv_node | null {
  return (sglib_hashed_intkv_node_it_init_on_equal(it, table, null, null));
}

export function sglib_hashed_intkv_node_it_current(it: sglib_hashed_intkv_node_iterator | null): intkv_node | null {
  return (sglib_intkv_node_it_current(__field_ref_aggregate(() => (__struct_ptr_at(it, 0)), "sglib_hashed_intkv_node_iterator", "containerIt", 0)));
}

export function sglib_hashed_intkv_node_it_next(it: sglib_hashed_intkv_node_iterator | null): intkv_node | null {
  let e = null;
  e = sglib_intkv_node_it_next(__field_ref_aggregate(() => (__struct_ptr_at(it, 0)), "sglib_hashed_intkv_node_iterator", "containerIt", 0));
  while (((e == (null) && (++((__struct_ptr_at(it, 0)).currentIndex)) < (7)) ? 1 : 0)) {
    e = sglib_intkv_node_it_init_on_equal(__field_ref_aggregate(() => (__struct_ptr_at(it, 0)), "sglib_hashed_intkv_node_iterator", "containerIt", 0), cptr_read_ptr((__struct_ptr_at(it, 0)).table, (__struct_ptr_at(it, 0)).currentIndex), (__struct_ptr_at(it, 0)).subcomparator, (__struct_ptr_at(it, 0)).equalto);
  }
  return (e);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sglib_int_node_sl_iterator {
  currentelem: int_node_sl | null;
  nextelem: int_node_sl | null;
  subcomparator: (arg0: int_node_sl | null, arg1: int_node_sl | null) => number;
  equalto: int_node_sl | null;
  constructor() {
    this.currentelem = null;
    this.nextelem = null;
    this.subcomparator = null;
    this.equalto = null;
  }
}
(sglib_int_node_sl_iterator as any).__fieldTypes = ["int64","int64","int32","int64"];
(sglib_int_node_sl_iterator as any).__fieldNames = ["currentelem","nextelem","subcomparator","equalto"];
(sglib_int_node_sl_iterator as any).__fieldOffsets = [0,8,16,24];

export function sglib_int_node_sl_is_member(list: int_node_sl | null, elem: int_node_sl | null): number {
  let result = 0;
  {
    let _p_ = null;
    for (_p_ = (list); ((_p_ != (null) && (i32((__struct_ptr_at((_p_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) < 0) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next) {
    }
    while (((((_p_ != (null) && _p_ != (elem)) ? 1 : 0) && (i32((__struct_ptr_at((_p_), 0)).v - (__struct_ptr_at(((elem)), 0)).v)) == 0) ? 1 : 0)) {
      _p_ = (__struct_ptr_at(_p_, 0)).next;
    }
    (result) = (_p_ == (elem));
  }
  return (result);
}

export function sglib_int_node_sl_find_member(list: int_node_sl | null, elem: int_node_sl | null): int_node_sl | null {
  let result = null;
  {
    let _p_ = null;
    let _cmpres_ = 1;
    for (_p_ = (list); ((_p_ != (null) && (_cmpres_ = (i32((__struct_ptr_at((_p_), 0)).v - (__struct_ptr_at(((elem)), 0)).v))) < 0) ? 1 : 0); _p_ = (__struct_ptr_at(_p_, 0)).next) {
    }
    if (_cmpres_ != 0) {
      (result) = null;
    } else {
      (result) = _p_;
    }
  }
  return (result);
}

export function sglib_int_node_sl_add_if_not_member(list: { value: int_node_sl | null }, elem: int_node_sl | null, member: { value: int_node_sl | null }): number {
  {
    let _e_ = null;
    let _cmp_res_ = 0;
    {
      {
        (_cmp_res_) = -1;
        for ((_e_) = list; ((_e_.value != (null) && ((_cmp_res_) = (i32(((_e_.value)).v - (__struct_ptr_at(((elem)), 0)).v))) < 0) ? 1 : 0); (_e_) = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "int_node_sl", "next", 8))((_e_.value))) {
        }
      }
    }
    if (_cmp_res_ != 0) {
      (__struct_ptr_at((elem), 0)).next = _e_.value;
      _e_.value = (elem);
      member.value = null;
    } else {
      member.value = _e_.value;
    }
  }
  return (member.value == (null));
}

export function sglib_int_node_sl_add(list: { value: int_node_sl | null }, elem: int_node_sl | null): void {
  {
    let _e_ = null;
    let _cmpres_ = 0;
    {
      {
        (_cmpres_) = -1;
        for ((_e_) = list; ((_e_.value != (null) && ((_cmpres_) = (i32(((_e_.value)).v - (__struct_ptr_at(((elem)), 0)).v))) < 0) ? 1 : 0); (_e_) = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "int_node_sl", "next", 8))((_e_.value))) {
        }
      }
    }
    (__struct_ptr_at((elem), 0)).next = _e_.value;
    _e_.value = (elem);
  }
}

export function sglib_int_node_sl_delete(list: { value: int_node_sl | null }, elem: int_node_sl | null): void {
  {
    {
      {
        let _p_ = null;
        for (_p_ = list; ((_p_.value != (null) && _p_.value != (elem)) ? 1 : 0); _p_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "int_node_sl", "next", 8))((_p_.value))) {
        }
        (((((!!(((_p_.value != (null) && !cptr_eq("element is not member of the container, use DELETE_IF_MEMBER instead", (null))) ? 1 : 0))) || (((): any => { _wassert("*_p_!=null && \"element is not member of the container, use DELETE_IF_MEMBER instead\"!=null", "C:/Users/scomo/cpp-to-ts/cpp-to-ts/compiler/tests/real-world/sglib-full/src/driver.c", ((Math.trunc(+((130)))) >>> 0)); return 0; })())) ? 1 : 0)));
        _p_.value = (_p_.value).next;
      }
    }
  }
}

export function sglib_int_node_sl_delete_if_member(list: { value: int_node_sl | null }, elem: int_node_sl | null, member: { value: int_node_sl | null }): number {
  {
    let _e_ = null;
    let _cmp_res_ = 0;
    {
      {
        (_cmp_res_) = -1;
        for ((_e_) = list; ((_e_.value != (null) && ((_cmp_res_) = (i32(((_e_.value)).v - (__struct_ptr_at(((elem)), 0)).v))) < 0) ? 1 : 0); (_e_) = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "int_node_sl", "next", 8))((_e_.value))) {
        }
      }
    }
    if (_cmp_res_ == 0) {
      member.value = _e_.value;
      _e_.value = (_e_.value).next;
    } else {
      member.value = null;
    }
  }
  return (member.value != (null));
}

export function sglib_int_node_sl_len(list: int_node_sl | null): number {
  let res = 0;
  {
    {
      {
        let _ce_ = null;
        ((_ce_));
        (res) = 0;
        {
          let _ne_ = null;
          let _ce_ = null;
          (_ce_) = (list);
          while ((_ce_) != (null)) {
            _ne_ = (__struct_ptr_at((_ce_), 0)).next;
            {
              {
                (res)++;
              }
            }
            (_ce_) = _ne_;
          }
        }
      }
    }
  }
  return (res);
}

export function sglib_int_node_sl_sort(list: { value: int_node_sl | null }): void {
  {
    let _r_ = null;
    let _a_ = null;
    let _b_ = null;
    let _todo_ = null;
    let _t_ = null;
    let _restail_ = null;
    let _i_ = 0;
    let _n_ = 0;
    let _contFlag_ = 0;
    _r_ = (list.value);
    _contFlag_ = 1;
    for (_n_ = 1; _contFlag_; _n_ = i32(_n_ + _n_)) {
      _todo_ = _r_;
      _r_ = null;
      _restail_ = _r_;
      _contFlag_ = 0;
      while (_todo_ != (null)) {
        _a_ = _todo_;
        for (_i_ = 1, _t_ = _a_; ((_i_ < _n_ && _t_ != (null)) ? 1 : 0); _i_++, _t_ = (__struct_ptr_at(_t_, 0)).next) {
        }
        if (_t_ == (null)) {
          _restail_.value = _a_;
          break;
        }
        _b_ = (__struct_ptr_at(_t_, 0)).next;
        (__struct_ptr_at(_t_, 0)).next = null;
        for (_i_ = 1, _t_ = _b_; ((_i_ < _n_ && _t_ != (null)) ? 1 : 0); _i_++, _t_ = (__struct_ptr_at(_t_, 0)).next) {
        }
        if (_t_ == (null)) {
          _todo_ = null;
        } else {
          _todo_ = (__struct_ptr_at(_t_, 0)).next;
          (__struct_ptr_at(_t_, 0)).next = null;
        }
        while (((_a_ != (null) && _b_ != (null)) ? 1 : 0)) {
          if ((i32((__struct_ptr_at((_a_), 0)).v - (__struct_ptr_at((_b_), 0)).v)) < 0) {
            _restail_.value = _a_;
            _restail_ = __field_ref_scalar(() => (__struct_ptr_at(_a_, 0)), "int_node_sl", "next", 8);
            _a_ = (__struct_ptr_at(_a_, 0)).next;
          } else {
            _restail_.value = _b_;
            _restail_ = __field_ref_scalar(() => (__struct_ptr_at(_b_, 0)), "int_node_sl", "next", 8);
            _b_ = (__struct_ptr_at(_b_, 0)).next;
          }
        }
        if (_a_ != (null)) {
          _restail_.value = _a_;
        } else {
          _restail_.value = _b_;
        }
        while (_restail_.value != (null)) {
          _restail_ = ((__cur: any) => __field_ref_scalar(() => __struct_ptr_at(__cur, 0), "int_node_sl", "next", 8))((_restail_.value));
        }
        _contFlag_ = 1;
      }
    }
    list.value = _r_;
  }
}

export function sglib_int_node_sl_it_init_on_equal(it: sglib_int_node_sl_iterator | null, list: int_node_sl | null, subcomparator: (arg0: int_node_sl | null, arg1: int_node_sl | null) => number, equalto: int_node_sl | null): int_node_sl | null {
  (__struct_ptr_at(it, 0)).subcomparator = subcomparator;
  (__struct_ptr_at(it, 0)).equalto = equalto;
  (__struct_ptr_at(it, 0)).nextelem = list;
  return (sglib_int_node_sl_it_next(it));
}

export function sglib_int_node_sl_it_init(it: sglib_int_node_sl_iterator | null, list: int_node_sl | null): int_node_sl | null {
  return (sglib_int_node_sl_it_init_on_equal(it, list, null, null));
}

export function sglib_int_node_sl_it_current(it: sglib_int_node_sl_iterator | null): int_node_sl | null {
  return ((__struct_ptr_at(it, 0)).currentelem);
}

export function sglib_int_node_sl_it_next(it: sglib_int_node_sl_iterator | null): int_node_sl | null {
  let ce = null;
  let eq = null;
  let scp = null;
  let c = 0;
  ce = (__struct_ptr_at(it, 0)).nextelem;
  (__struct_ptr_at(it, 0)).nextelem = null;
  if ((__struct_ptr_at(it, 0)).subcomparator != (null)) {
    eq = (__struct_ptr_at(it, 0)).equalto;
    scp = (__struct_ptr_at(it, 0)).subcomparator;
    while (((ce != (null) && (c = scp(ce, eq)) < 0) ? 1 : 0)) {
      ce = (__struct_ptr_at(ce, 0)).next;
    }
    if (((ce != (null) && c > 0) ? 1 : 0)) {
      ce = null;
    }
  }
  (__struct_ptr_at(it, 0)).currentelem = ce;
  if (ce != (null)) {
    (__struct_ptr_at(it, 0)).nextelem = (__struct_ptr_at(ce, 0)).next;
  }
  return (ce);
}

export function sglib_full_smoke(): number {
  let a = Object.assign(new int_node(), { v: 1, next: null, prev: null, left: null, right: null, color: 0 });
  let b = Object.assign(new int_node(), { v: 2, next: null, prev: null, left: null, right: null, color: 0 });
  let c = Object.assign(new int_node(), { v: 3, next: null, prev: null, left: null, right: null, color: 0 });
  let il = null; /* &ref */
  (() => { const _box0 = { value: il }; const _r = sglib_int_node_add(_box0, a); il = _box0.value; return _r; })();
  (() => { const _box0 = { value: il }; const _r = sglib_int_node_add(_box0, b); il = _box0.value; return _r; })();
  (() => { const _box0 = { value: il }; const _r = sglib_int_node_add(_box0, c); il = _box0.value; return _r; })();
  let int_list_len = sglib_int_node_len(il);
  let s1 = Object.assign(new str_node_list(), { key: "alpha", next: null });
  let s2 = Object.assign(new str_node_list(), { key: "beta", next: null });
  let sl = null; /* &ref */
  (() => { const _box0 = { value: sl }; const _r = sglib_str_node_list_add(_box0, s1); sl = _box0.value; return _r; })();
  (() => { const _box0 = { value: sl }; const _r = sglib_str_node_list_add(_box0, s2); sl = _box0.value; return _r; })();
  let str_list_len = sglib_str_node_list_len(sl);
  let d1 = Object.assign(new int_node_dl(), { v: 10, next: null, prev: null });
  let d2 = Object.assign(new int_node_dl(), { v: 20, next: null, prev: null });
  let d3 = Object.assign(new int_node_dl(), { v: 30, next: null, prev: null });
  let dl = null; /* &ref */
  (() => { const _box0 = { value: dl }; const _r = sglib_int_node_dl_add(_box0, d1); dl = _box0.value; return _r; })();
  (() => { const _box0 = { value: dl }; const _r = sglib_int_node_dl_add(_box0, d2); dl = _box0.value; return _r; })();
  (() => { const _box0 = { value: dl }; const _r = sglib_int_node_dl_add(_box0, d3); dl = _box0.value; return _r; })();
  let dl_len = sglib_int_node_dl_len(dl);
  let dl_first = sglib_int_node_dl_get_first(dl); /* &ref */
  let dl_last = sglib_int_node_dl_get_last(dl); /* &ref */
  let dl_first_v = (dl_first != null ? (__struct_ptr_at(dl_first, 0)).v : -1);
  let dl_last_v = (dl_last != null ? (__struct_ptr_at(dl_last, 0)).v : -1);
  let r5 = Object.assign(new int_node_rb(), { v: 5, left: null, right: null, color: 0 });
  let r3 = Object.assign(new int_node_rb(), { v: 3, left: null, right: null, color: 0 });
  let r8 = Object.assign(new int_node_rb(), { v: 8, left: null, right: null, color: 0 });
  let rb = null; /* &ref */
  let _ref4 = { value: rb };
  sglib_int_node_rb_add(_ref4, r5);
  rb = _ref4.value;
  let _ref5 = { value: rb };
  sglib_int_node_rb_add(_ref5, r3);
  rb = _ref5.value;
  let _ref6 = { value: rb };
  sglib_int_node_rb_add(_ref6, r8);
  rb = _ref6.value;
  let probe_rb = Object.assign(new int_node_rb(), { v: 3, left: null, right: null, color: 0 });
  let found_rb = sglib_int_node_rb_find_member(rb, probe_rb); /* &ref */
  let rb_found_v = (found_rb != null ? (__struct_ptr_at(found_rb, 0)).v : -1);
  let h1 = Object.assign(new intkv_node(), { k: 1, v: 100, next_in_chain: null });
  let h2 = Object.assign(new intkv_node(), { k: 2, v: 200, next_in_chain: null });
  let h3 = Object.assign(new intkv_node(), { k: 3, v: 300, next_in_chain: null });
  let htab = new Array(7).fill(null);
  sglib_hashed_intkv_node_init(htab);
  sglib_hashed_intkv_node_add(htab, h1);
  sglib_hashed_intkv_node_add(htab, h2);
  sglib_hashed_intkv_node_add(htab, h3);
  let probe_h = Object.assign(new intkv_node(), { k: 2, v: 0, next_in_chain: null });
  let found_h = sglib_hashed_intkv_node_find_member(htab, probe_h); /* &ref */
  let hash_found_v = (found_h != null ? (__struct_ptr_at(found_h, 0)).v : -1);
  let s_a = Object.assign(new int_node_sl(), { v: 30, next: null });
  let s_b = Object.assign(new int_node_sl(), { v: 10, next: null });
  let s_c = Object.assign(new int_node_sl(), { v: 20, next: null });
  let slist = null; /* &ref */
  (() => { const _box0 = { value: slist }; const _r = sglib_int_node_sl_add(_box0, s_a); slist = _box0.value; return _r; })();
  (() => { const _box0 = { value: slist }; const _r = sglib_int_node_sl_add(_box0, s_b); slist = _box0.value; return _r; })();
  (() => { const _box0 = { value: slist }; const _r = sglib_int_node_sl_add(_box0, s_c); slist = _box0.value; return _r; })();
  let sorted_head_v = (slist != null ? (__struct_ptr_at(slist, 0)).v : -1);
  (int_list_len);
  (str_list_len);
  (dl_len);
  (dl_first_v);
  (dl_last_v);
  (rb_found_v);
  (hash_found_v);
  (sorted_head_v);
  return i32(i32(i32(i32(i32(i32(i32(int_list_len + str_list_len) + dl_len) + dl_first_v) + dl_last_v) + rb_found_v) + hash_found_v) + sorted_head_v);
}

export function sglib_full_probe_int_list_len(): number {
  let a = Object.assign(new int_node(), { v: 1, next: null, prev: null, left: null, right: null, color: 0 });
  let b = Object.assign(new int_node(), { v: 2, next: null, prev: null, left: null, right: null, color: 0 });
  let h = null; /* &ref */
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_add(_box0, a); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_add(_box0, b); h = _box0.value; return _r; })();
  return sglib_int_node_len(h);
}

export function sglib_full_probe_int_list_reverse_first(): number {
  let a = Object.assign(new int_node(), { v: 1, next: null, prev: null, left: null, right: null, color: 0 });
  let b = Object.assign(new int_node(), { v: 2, next: null, prev: null, left: null, right: null, color: 0 });
  let c = Object.assign(new int_node(), { v: 3, next: null, prev: null, left: null, right: null, color: 0 });
  let h = null; /* &ref */
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_add(_box0, a); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_add(_box0, b); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_add(_box0, c); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_reverse(_box0); h = _box0.value; return _r; })();
  return (h != null ? (__struct_ptr_at(h, 0)).v : -1);
}

export function sglib_full_probe_dl_first_last(): number {
  let a = Object.assign(new int_node_dl(), { v: 10, next: null, prev: null });
  let b = Object.assign(new int_node_dl(), { v: 20, next: null, prev: null });
  let c = Object.assign(new int_node_dl(), { v: 30, next: null, prev: null });
  let h = null; /* &ref */
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_dl_add(_box0, a); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_dl_add(_box0, b); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_dl_add(_box0, c); h = _box0.value; return _r; })();
  let first = sglib_int_node_dl_get_first(h); /* &ref */
  let last = sglib_int_node_dl_get_last(h); /* &ref */
  let fv = (first != null ? (__struct_ptr_at(first, 0)).v : -1);
  let lv = (last != null ? (__struct_ptr_at(last, 0)).v : -1);
  return i32(Math.imul(fv, 100) + lv);
}

export function sglib_full_probe_str_list_len(): number {
  let s1 = Object.assign(new str_node_list(), { key: "alpha", next: null });
  let s2 = Object.assign(new str_node_list(), { key: "beta", next: null });
  let s3 = Object.assign(new str_node_list(), { key: "gamma", next: null });
  let h = null; /* &ref */
  (() => { const _box0 = { value: h }; const _r = sglib_str_node_list_add(_box0, s1); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_str_node_list_add(_box0, s2); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_str_node_list_add(_box0, s3); h = _box0.value; return _r; })();
  return sglib_str_node_list_len(h);
}

export function sglib_full_probe_dl_len(): number {
  let a = Object.assign(new int_node_dl(), { v: 1, next: null, prev: null });
  let b = Object.assign(new int_node_dl(), { v: 2, next: null, prev: null });
  let c = Object.assign(new int_node_dl(), { v: 3, next: null, prev: null });
  let d = Object.assign(new int_node_dl(), { v: 4, next: null, prev: null });
  let h = null; /* &ref */
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_dl_add(_box0, a); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_dl_add(_box0, b); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_dl_add(_box0, c); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_dl_add(_box0, d); h = _box0.value; return _r; })();
  return sglib_int_node_dl_len(h);
}

export function sglib_full_probe_rbtree_find(): number {
  let r5 = Object.assign(new int_node_rb(), { v: 5, left: null, right: null, color: 0 });
  let r3 = Object.assign(new int_node_rb(), { v: 3, left: null, right: null, color: 0 });
  let r8 = Object.assign(new int_node_rb(), { v: 8, left: null, right: null, color: 0 });
  let r1 = Object.assign(new int_node_rb(), { v: 1, left: null, right: null, color: 0 });
  let r4 = Object.assign(new int_node_rb(), { v: 4, left: null, right: null, color: 0 });
  let tree = null; /* &ref */
  let _ref7 = { value: tree };
  sglib_int_node_rb_add(_ref7, r5);
  tree = _ref7.value;
  let _ref8 = { value: tree };
  sglib_int_node_rb_add(_ref8, r3);
  tree = _ref8.value;
  let _ref9 = { value: tree };
  sglib_int_node_rb_add(_ref9, r8);
  tree = _ref9.value;
  let _ref10 = { value: tree };
  sglib_int_node_rb_add(_ref10, r1);
  tree = _ref10.value;
  let _ref11 = { value: tree };
  sglib_int_node_rb_add(_ref11, r4);
  tree = _ref11.value;
  let probe = Object.assign(new int_node_rb(), { v: 4, left: null, right: null, color: 0 });
  let found = sglib_int_node_rb_find_member(tree, probe); /* &ref */
  return (found != null ? (__struct_ptr_at(found, 0)).v : -1);
}

export function sglib_full_probe_hash_find(): number {
  let h1 = Object.assign(new intkv_node(), { k: 1, v: 100, next_in_chain: null });
  let h2 = Object.assign(new intkv_node(), { k: 2, v: 200, next_in_chain: null });
  let h3 = Object.assign(new intkv_node(), { k: 3, v: 300, next_in_chain: null });
  let htab = new Array(7).fill(null);
  sglib_hashed_intkv_node_init(htab);
  sglib_hashed_intkv_node_add(htab, h1);
  sglib_hashed_intkv_node_add(htab, h2);
  sglib_hashed_intkv_node_add(htab, h3);
  let probe = Object.assign(new intkv_node(), { k: 2, v: 0, next_in_chain: null });
  let found = sglib_hashed_intkv_node_find_member(htab, probe); /* &ref */
  return (found != null ? (__struct_ptr_at(found, 0)).v : -1);
}

export function sglib_full_probe_sorted_head(): number {
  let a = Object.assign(new int_node_sl(), { v: 30, next: null });
  let b = Object.assign(new int_node_sl(), { v: 10, next: null });
  let c = Object.assign(new int_node_sl(), { v: 20, next: null });
  let h = null; /* &ref */
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_sl_add(_box0, a); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_sl_add(_box0, b); h = _box0.value; return _r; })();
  (() => { const _box0 = { value: h }; const _r = sglib_int_node_sl_add(_box0, c); h = _box0.value; return _r; })();
  return (h != null ? (__struct_ptr_at(h, 0)).v : -1);
}

