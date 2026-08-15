import { UNITY_STORAGE_T } from './cjson_add.js';
import { Unity } from './unity.js';

function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function trunc(x: number): number { return Math.trunc(x); }
function round(x: number): number { return x >= 0 ? Math.floor(x + 0.5) : Math.ceil(x - 0.5); }
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
// This lowers `v[Symbol.iterator]()` to `v.values()` (C++20 §22.3.11). We patch
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
// within the same range. This is lowered to __cpp_iter(v, v.length) and similar
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
function unique(first: any, last: any, pred?: Function): any { const A = __cpp_arr(first, last); const eq = pred ?? ((a: any, b: any) => a === b); if (A.end <= A.start) return __cpp_iter(A.arr, A.start); let w = A.start + 1; for (let i = A.start + 1; i < A.end; i++) if (!eq(A.arr[w - 1], A.arr[i])) A.arr[w++] = A.arr[i]; return __cpp_iter(A.arr, w); }

const f_zero = undefined /* recovery */;
const d_zero = undefined /* recovery */;
let SetToOneToFailInTearDown = 0;
let SetToOneMeanWeAlreadyCheckedThisGuy = 0;
export function setUp(): void {
  SetToOneToFailInTearDown = 0;
  SetToOneMeanWeAlreadyCheckedThisGuy = 0;
}

export function tearDown(): void {
  endPutcharSpy();
  if (SetToOneToFailInTearDown == 1) {
  }
  if (undefined /* recovery */) {
  }
}

export function testUnitySizeInitializationReminder(): void {
  let message = cptr_from_string("Unexpected size for UNITY_STORAGE_T struct. Please check that the initialization of the Unity symbol in unity.c is still correct."); /* &ref */
  let _Expected_Unity = {};
}

export function testPassShouldEndImmediatelyWithPass(): void {
}

export function testTrue(): void {
}

export function testFalse(): void {
}

export function testPreviousPass(): void {
}

export function testNotVanilla(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotTrue(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotFalse(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotUnless(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotNotEqual(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFail(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testIsNull(): void {
  let ptr1 = null; /* &ref */
  let ptr2 = cptr_from_string("hello"); /* &ref */
}

export function testIsNullShouldFailIfNot(): void {
  let ptr1 = cptr_from_string("hello"); /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotNullShouldFailIfNULL(): void {
  let ptr1 = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testIgnore(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testIgnoreMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualInts(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualInt8s(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualInt16s(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualInt32s(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualBits(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUInts(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUInt8s(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUInt16s(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUInt32s(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHex8s(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHex8sIfSigned(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHex16s(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHex16sIfSigned(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHex32s(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHex32sIfSigned(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualInts(): void {
  let v0_box = { value: 0 };
  let v1_box = { value: 0 };
  let p0 = null;
  let p1 = null;
  v0_box.value = 19467;
  v1_box.value = 19467;
  p0 = v0_box;
  p1 = v1_box;
}

export function testEqualInt8s(): void {
}

export function testEqualInt8sWhenThereAreDifferencesOutside8Bits(): void {
}

export function testEqualInt16s(): void {
}

export function testEqualInt16sNegatives(): void {
}

export function testEqualInt16sWhenThereAreDifferencesOutside16Bits(): void {
}

export function testEqualInt32s(): void {
}

export function testEqualInt32sNegatives(): void {
}

export function testEqualUints(): void {
  let v0_box = { value: 0 };
  let v1_box = { value: 0 };
  let p0 = null;
  let p1 = null;
  v0_box.value = ((19467) >>> 0);
  v1_box.value = ((19467) >>> 0);
  p0 = v0_box;
  p1 = v1_box;
}

export function testEqualUint8s(): void {
}

export function testEqualUint8sWhenThereAreDifferencesOutside8Bits(): void {
}

export function testEqualUint16s(): void {
}

export function testEqualUint16sWhenThereAreDifferencesOutside16Bits(): void {
}

export function testEqualUint32s(): void {
}

export function testNotEqual(): void {
}

export function testEqualHex8s(): void {
}

export function testEqualHex8sWhenThereAreDifferencesOutside8Bits(): void {
}

export function testEqualHex8sNegatives(): void {
}

export function testEqualHex16s(): void {
}

export function testEqualHex16sWhenThereAreDifferencesOutside16Bits(): void {
}

export function testEqualHex32s(): void {
}

export function testEqualBits(): void {
}

export function testNotEqualBitHigh(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualBitLow(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualBitsHigh(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualBitsLow(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualShorts(): void {
  let v0_box = { value: 0 };
  let v1_box = { value: 0 };
  let p0 = null;
  let p1 = null;
  v0_box.value = (((19467) << 16 >> 16)) << 16 >> 16;
  v1_box.value = (((19467) << 16 >> 16)) << 16 >> 16;
  p0 = v0_box;
  p1 = v1_box;
}

export function testEqualUShorts(): void {
  let v0_box = { value: 0 };
  let v1_box = { value: 0 };
  let p0 = null;
  let p1 = null;
  v0_box.value = (((19467) & 0xFFFF)) & 0xFFFF;
  v1_box.value = (((19467) & 0xFFFF)) & 0xFFFF;
  p0 = v0_box;
  p1 = v1_box;
}

export function testEqualChars(): void {
  let v0_box = { value: 0 };
  let v1_box = { value: 0 };
  let p0 = null;
  let p1 = null;
  v0_box.value = (((109) << 24 >> 24)) << 24 >> 24;
  v1_box.value = (((109) << 24 >> 24)) << 24 >> 24;
  p0 = v0_box;
  p1 = v1_box;
}

export function testEqualUChars(): void {
  let v0_box = { value: 0 };
  let v1_box = { value: 0 };
  let p0 = null;
  let p1 = null;
  v0_box.value = (((251) & 0xFF)) & 0xFF;
  v1_box.value = (((251) & 0xFF)) & 0xFF;
  p0 = v0_box;
  p1 = v1_box;
}

export function testEqualPointers(): void {
  let v0_box = { value: 0 };
  let v1_box = { value: 0 };
  let p0 = null;
  let p1 = null;
  let p2 = null;
  v0_box.value = 19467;
  v1_box.value = 18271;
  p0 = v0_box;
  p1 = v1_box;
  p2 = v1_box;
}

export function testNotEqualPointers(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testIntsWithinDelta(): void {
}

export function testIntsWithinDeltaAndCustomMessage(): void {
}

export function testIntsNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testIntsNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUIntsWithinDelta(): void {
}

export function testUIntsWithinDeltaAndCustomMessage(): void {
}

export function testUIntsNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUIntsNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUIntsNotWithinDeltaEvenThoughASignedIntWouldPassSmallFirst(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUIntsNotWithinDeltaEvenThoughASignedIntWouldPassSmallFirstAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUIntsNotWithinDeltaEvenThoughASignedIntWouldPassBigFirst(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUIntsNotWithinDeltaEvenThoughASignedIntWouldPassBigFirstAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testHEX32sWithinDelta(): void {
}

export function testHEX32sWithinDeltaAndCustomMessage(): void {
}

export function testHEX32sNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testHEX32sNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testHEX32sNotWithinDeltaEvenThoughASignedIntWouldPass(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testHEX32sNotWithinDeltaEvenThoughASignedIntWouldPassAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testHEX16sWithinDelta(): void {
}

export function testHEX16sWithinDeltaAndCustomMessage(): void {
}

export function testHEX16sWithinDeltaWhenThereAreDifferenceOutsideOf16Bits(): void {
}

export function testHEX16sWithinDeltaWhenThereAreDifferenceOutsideOf16BitsAndCustomMessage(): void {
}

export function testHEX16sNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testHEX16sNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testHEX8sWithinDelta(): void {
}

export function testHEX8sWithinDeltaAndCustomMessage(): void {
}

export function testHEX8sWithinDeltaWhenThereAreDifferenceOutsideOf8Bits(): void {
}

export function testHEX8sWithinDeltaWhenThereAreDifferenceOutsideOf8BitsAndCustomMessage(): void {
}

export function testHEX8sNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testHEX8sNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUINT32sWithinDelta(): void {
}

export function testUINT32sWithinDeltaAndCustomMessage(): void {
}

export function testUINT32sNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUINT32sNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUINT32sNotWithinDeltaEvenThoughASignedIntWouldPass(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUINT32sNotWithinDeltaEvenThoughASignedIntWouldPassAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUINT16sWithinDelta(): void {
}

export function testUINT16sWithinDeltaAndCustomMessage(): void {
}

export function testUINT16sWithinDeltaWhenThereAreDifferenceOutsideOf16Bits(): void {
}

export function testUINT16sWithinDeltaWhenThereAreDifferenceOutsideOf16BitsAndCustomMessage(): void {
}

export function testUINT16sNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUINT16sNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUINT8sWithinDelta(): void {
}

export function testUINT8sWithinDeltaAndCustomMessage(): void {
}

export function testUINT8sWithinDeltaWhenThereAreDifferenceOutsideOf8Bits(): void {
}

export function testUINT8sWithinDeltaWhenThereAreDifferenceOutsideOf8BitsAndCustomMessage(): void {
}

export function testUINT8sNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testUINT8sNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testINT32sWithinDelta(): void {
}

export function testINT32sWithinDeltaAndCustomMessage(): void {
}

export function testINT32sNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testINT32sNotWithinDeltaAndDifferenceOverflows(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testINT32sNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testINT16sWithinDelta(): void {
}

export function testINT16sWithinDeltaAndCustomMessage(): void {
}

export function testINT16sWithinDeltaWhenThereAreDifferenceOutsideOf16Bits(): void {
}

export function testINT16sWithinDeltaWhenThereAreDifferenceOutsideOf16BitsAndCustomMessage(): void {
}

export function testINT16sNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testINT16sNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testINT8sWithinDelta(): void {
}

export function testINT8sWithinDeltaAndCustomMessage(): void {
}

export function testINT8sWithinDeltaWhenThereAreDifferenceOutsideOf8Bits(): void {
}

export function testINT8sWithinDeltaWhenThereAreDifferenceOutsideOf8BitsAndCustomMessage(): void {
}

export function testINT8sNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testINT8sNotWithinDeltaAndCustomMessage(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testGreaterThan(): void {
}

export function testGreaterThanINT(): void {
}

export function testGreaterThanINT8(): void {
}

export function testGreaterThanINT16(): void {
}

export function testGreaterThanINT32(): void {
}

export function testGreaterThanUINT(): void {
}

export function testGreaterThanUINT8(): void {
}

export function testGreaterThanUINT16(): void {
}

export function testGreaterThanUINT32(): void {
}

export function testGreaterThanHEX8(): void {
}

export function testGreaterThanHEX16(): void {
}

export function testGreaterThanHEX32(): void {
}

export function testNotGreaterThan(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testLessThan(): void {
}

export function testLessThanINT(): void {
}

export function testLessThanINT8(): void {
}

export function testLessThanINT16(): void {
}

export function testLessThanINT32(): void {
}

export function testLessThanUINT(): void {
}

export function testLessThanUINT8(): void {
}

export function testLessThanUINT16(): void {
}

export function testLessThanUINT32(): void {
}

export function testLessThanHEX8(): void {
}

export function testLessThanHEX16(): void {
}

export function testLessThanHEX32(): void {
}

export function testNotLessThan(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualStrings(): void {
  let testString = cptr_from_string("foo"); /* &ref */
}

export function testEqualStringsLen(): void {
  let testString = cptr_from_string("foobar"); /* &ref */
}

export function testEqualStringsWithCarriageReturnsAndLineFeeds(): void {
  let testString = cptr_from_string("foo\r\nbar"); /* &ref */
}

export function testNotEqualString1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringLen1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualString2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringLen2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualString3(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringLen3(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualString4(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringLen4(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualString5(): void {
  let str1 = (() => { const __b = cptr_create(4); __b.buf[0] = (((65) << 24 >> 24)) & 0xFF; __b.buf[1] = (((66) << 24 >> 24)) & 0xFF; __b.buf[2] = (((3) << 24 >> 24)) & 0xFF; __b.buf[3] = (((0) << 24 >> 24)) & 0xFF; return __b; })();
  let str2 = (() => { const __b = cptr_create(4); __b.buf[0] = (((65) << 24 >> 24)) & 0xFF; __b.buf[1] = (((66) << 24 >> 24)) & 0xFF; __b.buf[2] = (((4) << 24 >> 24)) & 0xFF; __b.buf[3] = (((0) << 24 >> 24)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualString_ExpectedStringIsNull(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringLen_ExpectedStringIsNull(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualString_ActualStringIsNull(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringLen_ActualStringIsNull(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualStringArrays(): void {
  let testStrings = ["foo", "boo", "woo", "moo"]; /* &ref */
  let expStrings = ["foo", "boo", "woo", "zoo"]; /* &ref */
}

export function testNotEqualStringArray1(): void {
  let testStrings = ["foo", "boo", "woo", "moo"]; /* &ref */
  let expStrings = ["foo", "boo", "woo", "zoo"]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringArray2(): void {
  let testStrings = ["zoo", "boo", "woo", "moo"]; /* &ref */
  let expStrings = ["foo", "boo", "woo", "moo"]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringArray3(): void {
  let testStrings = ["foo", "boo", "woo", null]; /* &ref */
  let expStrings = ["foo", "boo", "woo", "zoo"]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringArray4(): void {
  let testStrings = ["foo", "boo", "woo", "moo"]; /* &ref */
  let expStrings = ["foo", null, "woo", "moo"]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringArray5(): void {
  let testStrings = null; /* &ref */
  let expStrings = ["foo", "boo", "woo", "zoo"]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringArray6(): void {
  let testStrings = ["foo", "boo", "woo", "zoo"]; /* &ref */
  let expStrings = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualStringArrayIfBothNulls(): void {
  let testStrings = null; /* &ref */
  let expStrings = null; /* &ref */
}

export function testNotEqualStringArrayLengthZero(): void {
  let testStrings = [null]; /* &ref */
  let expStrings = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualStringEachEqual(): void {
  let testStrings1 = ["foo", "foo", "foo", "foo"]; /* &ref */
  let testStrings2 = ["boo", "boo", "boo", "zoo"]; /* &ref */
  let testStrings3 = ["", "", "", ""]; /* &ref */
}

export function testNotEqualStringEachEqual1(): void {
  let testStrings = ["foo", "foo", "foo", "moo"]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringEachEqual2(): void {
  let testStrings = ["boo", "foo", "foo", "foo"]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringEachEqual3(): void {
  let testStrings = ["foo", "foo", "foo", null]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringEachEqual4(): void {
  let testStrings = ["foo", "foo", "woo", "foo"]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualStringEachEqual5(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualMemory(): void {
  let testString = cptr_from_string("whatever"); /* &ref */
}

export function testNotEqualMemory1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemory2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemory3(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemory4(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemoryLengthZero(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualIntArrays(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [1, 8, 987, -2];
  let p2 = [1, 8, 987, 2];
  let p3 = [1, 500, 600, 700];
}

export function testNotEqualIntArraysNullExpected(): void {
  let p0 = null; /* &ref */
  let p1 = [1, 8, 987, 2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualIntArraysNullActual(): void {
  let p1 = null; /* &ref */
  let p0 = [1, 8, 987, 2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualIntArrays1(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [1, 8, 987, 2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualIntArrays2(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [2, 8, 987, -2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualIntArrays3(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [1, 8, 986, -2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualIntArraysLengthZero(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualIntEachEqual(): void {
  let p0 = [1, 1, 1, 1];
  let p1 = [987, 987, 987, 987];
  let p2 = [-2, -2, -2, -3];
  let p3 = [1, 5, 600, 700];
}

export function testNotEqualIntEachEqualNullActual(): void {
  let p1 = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualIntEachEqual1(): void {
  let p0 = [1, 1, 1, -2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualIntEachEqual2(): void {
  let p0 = [-5, -5, -1, -5];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualIntEachEqual3(): void {
  let p0 = [1, 88, 88, 88];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualEachEqualLengthZero(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualPtrArrays(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((2) << 24 >> 24) };
  let C_box = { value: ((3) << 24 >> 24) };
  let p0 = [A_box, B_box, C_box]; /* &ref */
  let p1 = [A_box, B_box, C_box, A_box]; /* &ref */
  let p2 = [A_box, B_box]; /* &ref */
  let p3 = [A_box]; /* &ref */
}

export function testNotEqualPtrArraysNullExpected(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((2) << 24 >> 24) };
  let p0 = null; /* &ref */
  let p1 = [A_box, B_box]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualPtrArraysNullActual(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((2) << 24 >> 24) };
  let p0 = null; /* &ref */
  let p1 = [A_box, B_box]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualPtrArrays1(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((2) << 24 >> 24) };
  let C_box = { value: ((3) << 24 >> 24) };
  let p0 = [A_box, B_box, C_box, B_box]; /* &ref */
  let p1 = [A_box, B_box, C_box, A_box]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualPtrArrays2(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((2) << 24 >> 24) };
  let C_box = { value: ((3) << 24 >> 24) };
  let p0 = [B_box, B_box, C_box, A_box]; /* &ref */
  let p1 = [A_box, B_box, C_box, A_box]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualPtrArrays3(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((2) << 24 >> 24) };
  let C_box = { value: ((3) << 24 >> 24) };
  let p0 = [A_box, B_box, B_box, A_box]; /* &ref */
  let p1 = [A_box, B_box, C_box, A_box]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualPtrEachEqual(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((2) << 24 >> 24) };
  let C_box = { value: ((3) << 24 >> 24) };
  let p0 = [A_box, A_box, A_box]; /* &ref */
  let p1 = [A_box, B_box, C_box, A_box]; /* &ref */
  let p2 = [B_box, B_box]; /* &ref */
  let p3 = [C_box]; /* &ref */
}

export function testNotEqualPtrEachEqualNullExpected(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((1) << 24 >> 24) };
  let p0 = [A_box, B_box]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualPtrEachEqualNullActual(): void {
  let A = ((1) << 24 >> 24);
  let p0 = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualPtrEachEqual1(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((1) << 24 >> 24) };
  let p0 = [A_box, A_box, A_box, B_box]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualPtrEachEqual2(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((1) << 24 >> 24) };
  let p0 = [B_box, B_box, A_box, B_box]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualPtrEachEqual3(): void {
  let A_box = { value: ((1) << 24 >> 24) };
  let B_box = { value: ((1) << 24 >> 24) };
  let p0 = [A_box, B_box, B_box, B_box]; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualInt8Arrays(): void {
}

export function testNotEqualInt8Arrays(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualInt8EachEqual(): void {
}

export function testNotEqualInt8EachEqual(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualUIntArrays(): void {
  let p0 = [((1) >>> 0), ((8) >>> 0), ((987) >>> 0), 65132];
  let p1 = [((1) >>> 0), ((8) >>> 0), ((987) >>> 0), 65132];
  let p2 = [((1) >>> 0), ((8) >>> 0), ((987) >>> 0), ((2) >>> 0)];
  let p3 = [((1) >>> 0), ((500) >>> 0), ((600) >>> 0), ((700) >>> 0)];
}

export function testNotEqualUIntArrays1(): void {
  let p0 = [((1) >>> 0), ((8) >>> 0), ((987) >>> 0), 65132];
  let p1 = [((1) >>> 0), ((8) >>> 0), ((987) >>> 0), 65131];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUIntArrays2(): void {
  let p0 = [((1) >>> 0), ((8) >>> 0), ((987) >>> 0), 65132];
  let p1 = [((2) >>> 0), ((8) >>> 0), ((987) >>> 0), 65132];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUIntArrays3(): void {
  let p0 = [((1) >>> 0), ((8) >>> 0), ((987) >>> 0), 65132];
  let p1 = [((1) >>> 0), ((8) >>> 0), ((986) >>> 0), 65132];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualUIntEachEqual(): void {
  let p0 = [((1) >>> 0), ((1) >>> 0), ((1) >>> 0), ((1) >>> 0)];
  let p1 = [65132, 65132, 65132, 65132];
  let p2 = [((8) >>> 0), ((8) >>> 0), ((987) >>> 0), ((2) >>> 0)];
  let p3 = [((1) >>> 0), ((500) >>> 0), ((600) >>> 0), ((700) >>> 0)];
}

export function testNotEqualUIntEachEqual1(): void {
  let p0 = [((1) >>> 0), 65132, 65132, 65132];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUIntEachEqual2(): void {
  let p0 = [((987) >>> 0), ((8) >>> 0), ((987) >>> 0), ((987) >>> 0)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUIntEachEqual3(): void {
  let p0 = [((1) >>> 0), ((1) >>> 0), ((1) >>> 0), 65132];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualInt16Arrays(): void {
}

export function testNotEqualInt16Arrays(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualInt16EachEqual(): void {
}

export function testNotEqualInt16EachEqual(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualInt32Arrays(): void {
}

export function testNotEqualInt32Arrays(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualInt32EachEqual(): void {
}

export function testNotEqualInt32EachEqual(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualUINT8Arrays(): void {
}

export function testNotEqualUINT8Arrays1(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((100) & 0xFF)) & 0xFF; __b.buf[3] = (((127) & 0xFF)) & 0xFF; return __b; })();
  let p1 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((100) & 0xFF)) & 0xFF; __b.buf[3] = (((255) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT8Arrays2(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((100) & 0xFF)) & 0xFF; __b.buf[3] = (((127) & 0xFF)) & 0xFF; return __b; })();
  let p1 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((100) & 0xFF)) & 0xFF; __b.buf[3] = (((255) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT8Arrays3(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((100) & 0xFF)) & 0xFF; __b.buf[3] = (((127) & 0xFF)) & 0xFF; return __b; })();
  let p1 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((100) & 0xFF)) & 0xFF; __b.buf[3] = (((255) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualUINT16Arrays(): void {
  let p0 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  let p1 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  let p2 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((2) & 0xFFFF)];
  let p3 = [((1) & 0xFFFF), ((500) & 0xFFFF), ((600) & 0xFFFF), ((700) & 0xFFFF)];
}

export function testNotEqualUINT16Arrays1(): void {
  let p0 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  let p1 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65131) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT16Arrays2(): void {
  let p0 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  let p1 = [((2) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT16Arrays3(): void {
  let p0 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  let p1 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((986) & 0xFFFF), ((65132) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualUINT32Arrays(): void {
}

export function testNotEqualUINT32Arrays1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT32Arrays2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT32Arrays3(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualHEXArrays(): void {
}

export function testNotEqualHEXArrays1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEXArrays2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEXArrays3(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualHEX32Arrays(): void {
}

export function testNotEqualHEX32Arrays1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX32Arrays2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX32Arrays3(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualHEX16Arrays(): void {
  let p0 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  let p1 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  let p2 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((2) & 0xFFFF)];
  let p3 = [((1) & 0xFFFF), ((500) & 0xFFFF), ((600) & 0xFFFF), ((700) & 0xFFFF)];
}

export function testNotEqualHEX16Arrays1(): void {
  let p0 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  let p1 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65131) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX16Arrays2(): void {
  let p0 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  let p1 = [((2) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX16Arrays3(): void {
  let p0 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  let p1 = [((1) & 0xFFFF), ((8) & 0xFFFF), ((986) & 0xFFFF), ((65132) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualHEX8Arrays(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((123) & 0xFF)) & 0xFF; return __b; })();
  let p1 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((123) & 0xFF)) & 0xFF; return __b; })();
  let p2 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((2) & 0xFF)) & 0xFF; return __b; })();
  let p3 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((23) & 0xFF)) & 0xFF; __b.buf[2] = (((25) & 0xFF)) & 0xFF; __b.buf[3] = (((26) & 0xFF)) & 0xFF; return __b; })();
}

export function testNotEqualHEX8Arrays1(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((253) & 0xFF)) & 0xFF; return __b; })();
  let p1 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((252) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX8Arrays2(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((253) & 0xFF)) & 0xFF; return __b; })();
  let p1 = (() => { const __b = cptr_create(4); __b.buf[0] = (((2) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((253) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX8Arrays3(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((253) & 0xFF)) & 0xFF; return __b; })();
  let p1 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((255) & 0xFF)) & 0xFF; __b.buf[3] = (((253) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualUINT8EachEqual(): void {
}

export function testNotEqualUINT8EachEqual1(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((127) & 0xFF)) & 0xFF; __b.buf[1] = (((127) & 0xFF)) & 0xFF; __b.buf[2] = (((128) & 0xFF)) & 0xFF; __b.buf[3] = (((127) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT8EachEqual2(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((1) & 0xFF)) & 0xFF; __b.buf[2] = (((1) & 0xFF)) & 0xFF; __b.buf[3] = (((127) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT8EachEqual3(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((54) & 0xFF)) & 0xFF; __b.buf[1] = (((55) & 0xFF)) & 0xFF; __b.buf[2] = (((55) & 0xFF)) & 0xFF; __b.buf[3] = (((55) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualUINT16EachEqual(): void {
  let p0 = [((65132) & 0xFFFF), ((65132) & 0xFFFF), ((65132) & 0xFFFF), ((65132) & 0xFFFF)];
  let p1 = [((987) & 0xFFFF), ((987) & 0xFFFF), ((987) & 0xFFFF), ((987) & 0xFFFF)];
  let p2 = [((1) & 0xFFFF), ((1) & 0xFFFF), ((1) & 0xFFFF), ((2) & 0xFFFF)];
  let p3 = [((1) & 0xFFFF), ((500) & 0xFFFF), ((600) & 0xFFFF), ((700) & 0xFFFF)];
}

export function testNotEqualUINT16EachEqual1(): void {
  let p0 = [((1) & 0xFFFF), ((65132) & 0xFFFF), ((65132) & 0xFFFF), ((65132) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT16EachEqual2(): void {
  let p0 = [((65132) & 0xFFFF), ((65132) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT16EachEqual3(): void {
  let p0 = [((65132) & 0xFFFF), ((65132) & 0xFFFF), ((65132) & 0xFFFF), ((65133) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualUINT32EachEqual(): void {
}

export function testNotEqualUINT32EachEqual1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT32EachEqual2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualUINT32EachEqual3(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualHEXEachEqual(): void {
}

export function testNotEqualHEXEachEqual1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEXEachEqual2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEXEachEqual3(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualHEX32EachEqual(): void {
}

export function testNotEqualHEX32EachEqual1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX32EachEqual2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX32EachEqual3(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualHEX16EachEqual(): void {
}

export function testNotEqualHEX16EachEqual1(): void {
  let p0 = [((65132) & 0xFFFF), ((65132) & 0xFFFF), ((987) & 0xFFFF), ((65132) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX16EachEqual2(): void {
  let p0 = [((1) & 0xFFFF), ((987) & 0xFFFF), ((987) & 0xFFFF), ((987) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX16EachEqual3(): void {
  let p0 = [((8) & 0xFFFF), ((8) & 0xFFFF), ((8) & 0xFFFF), ((65132) & 0xFFFF)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualHEX8EachEqual(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((254) & 0xFF)) & 0xFF; __b.buf[1] = (((254) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((254) & 0xFF)) & 0xFF; return __b; })();
  let p1 = (() => { const __b = cptr_create(4); __b.buf[0] = (((123) & 0xFF)) & 0xFF; __b.buf[1] = (((123) & 0xFF)) & 0xFF; __b.buf[2] = (((123) & 0xFF)) & 0xFF; __b.buf[3] = (((123) & 0xFF)) & 0xFF; return __b; })();
  let p2 = (() => { const __b = cptr_create(4); __b.buf[0] = (((8) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((8) & 0xFF)) & 0xFF; __b.buf[3] = (((2) & 0xFF)) & 0xFF; return __b; })();
  let p3 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((23) & 0xFF)) & 0xFF; __b.buf[2] = (((25) & 0xFF)) & 0xFF; __b.buf[3] = (((26) & 0xFF)) & 0xFF; return __b; })();
}

export function testNotEqualHEX8EachEqual1(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((253) & 0xFF)) & 0xFF; __b.buf[1] = (((253) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((253) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX8EachEqual2(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((254) & 0xFF)) & 0xFF; __b.buf[1] = (((254) & 0xFF)) & 0xFF; __b.buf[2] = (((254) & 0xFF)) & 0xFF; __b.buf[3] = (((253) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualHEX8EachEqual3(): void {
  let p0 = (() => { const __b = cptr_create(4); __b.buf[0] = (((1) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((8) & 0xFF)) & 0xFF; __b.buf[3] = (((8) & 0xFF)) & 0xFF; return __b; })();
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualMemoryArrays(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [1, 8, 987, -2];
  let p2 = [1, 8, 987, 2];
  let p3 = [1, 500, 600, 700];
}

export function testNotEqualMemoryArraysExpectedNull(): void {
  let p0 = null; /* &ref */
  let p1 = [1, 8, 987, 2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemoryArraysActualNull(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemoryArrays1(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [1, 8, 987, 2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemoryArrays2(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [2, 8, 987, -2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemoryArrays3(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [1, 8, 986, -2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualMemoryEachEqual(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [1, 8, 987, -2, 1, 8, 987, -2];
  let p2 = [8, 8, 8, 2];
  let p3 = [8, 500, 600, 700];
  let v = 8;
}

export function testNotEqualMemoryEachEqualExpectedNull(): void {
  let p0 = null; /* &ref */
  let p1 = [1, 8, 987, 2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemoryEachEqualActualNull(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemoryEachEqual1(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [9, 8, 987, -2, 1, 8, 987, -2, 1, 8, 987, -2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemoryEachEqual2(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [1, 8, 987, -2, 1, 8, 987, -2, 1, 8, 987, 9];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualMemoryEachEqual3(): void {
  let p0 = [1, 8, 987, -2];
  let p1 = [1, 8, 987, -2, 1, 9, 987, -2, 1, 8, 987, -2];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testProtection(): void {
  /* WARNING: volatile semantics not enforceable in JS */
  let mask = 0;
  if (undefined /* recovery */) {
    mask |= 1;
  } else {
    mask |= 2;
  }
}

export function testIgnoredAndThenFailInTearDown(): void {
  SetToOneToFailInTearDown = 1;
}

let indexSpyBuffer = 0;
let putcharSpyEnabled = 0;
export function startPutcharSpy(): void {
  indexSpyBuffer = 0;
  putcharSpyEnabled = 1;
}

export function endPutcharSpy(): void {
  putcharSpyEnabled = 0;
}

export function getBufferPutcharSpy(): string {
  return null;
}

export function putcharSpy(c: number): void {
}

export function testFailureCountIncrementsAndIsReturnedAtEnd(): void {
  startPutcharSpy();
  endPutcharSpy();
  startPutcharSpy();
  let failures = 0;
  endPutcharSpy();
}

export function testCstringsEscapeSequence(): void {
}

export function testHexPrintsUpToMaxNumberOfNibbles(): void {
}

export function testPrintNumbers32(): void {
}

export function testPrintNumbersUnsigned32(): void {
}

export function testPrintNumbersInt64(): void {
}

export function testPrintNumbersUInt64(): void {
}

export function testEqualHex64s(): void {
}

export function testEqualUint64s(): void {
}

export function testEqualInt64s(): void {
}

export function testNotEqualHex64s(): void {
}

export function testNotEqualUint64s(): void {
}

export function testNotEqualInt64s(): void {
}

export function testNotEqualHex64sIfSigned(): void {
}

export function testHEX64sWithinDelta(): void {
}

export function testHEX64sNotWithinDelta(): void {
}

export function testHEX64sNotWithinDeltaEvenThoughASignedIntWouldPass(): void {
}

export function testUINT64sWithinDelta(): void {
}

export function testUINT64sNotWithinDelta(): void {
}

export function testUINT64sNotWithinDeltaEvenThoughASignedIntWouldPass(): void {
}

export function testINT64sWithinDelta(): void {
}

export function testINT64sNotWithinDelta(): void {
}

export function testINT64sNotWithinDeltaAndDifferenceOverflows(): void {
}

export function testEqualHEX64Arrays(): void {
}

export function testEqualUint64Arrays(): void {
}

export function testEqualInt64Arrays(): void {
}

export function testNotEqualHEX64Arrays1(): void {
}

export function testNotEqualHEX64Arrays2(): void {
}

export function testNotEqualUint64Arrays(): void {
}

export function testNotEqualInt64Arrays(): void {
}

export function testFloatsWithinDelta(): void {
}

export function testFloatsNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatsEqual(): void {
}

export function testFloatsNotEqual(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatsNotEqualNegative1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatsNotEqualNegative2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatsNotEqualActualNaN(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatsNotEqualExpectedNaN(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatsEqualBothNaN(): void {
}

export function testFloatsNotEqualInfNaN(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatsNotEqualNaNInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatsNotEqualActualInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatsNotEqualExpectedInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatsEqualBothInf(): void {
}

export function testFloatsNotEqualPlusMinusInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatIsPosInf1(): void {
}

export function testFloatIsPosInf2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatIsNegInf1(): void {
}

export function testFloatIsNegInf2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatIsNotPosInf1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatIsNotPosInf2(): void {
}

export function testFloatIsNotNegInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatIsNan1(): void {
}

export function testFloatIsNan2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatIsNotNan1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatIsNotNan2(): void {
}

export function testFloatInfIsNotNan(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatNanIsNotInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatIsDeterminate1(): void {
}

export function testFloatIsDeterminate2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatIsNotDeterminate1(): void {
}

export function testFloatIsNotDeterminate2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatTraitFailsOnInvalidTrait(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualFloatArrays(): void {
  let p0 = [Math.fround(1), -Math.fround(8), Math.fround(25.3999996), -Math.fround(0.123000003)];
  let p1 = [Math.fround(1), -Math.fround(8), Math.fround(25.3999996), -Math.fround(0.123000003)];
  let p2 = [Math.fround(1), -Math.fround(8), Math.fround(25.3999996), -Math.fround(0.200000003)];
  let p3 = [Math.fround(1), -Math.fround(23), Math.fround(25), -Math.fround(0.25999999)];
}

export function testNotEqualFloatArraysExpectedNull(): void {
  let p0 = null; /* &ref */
  let p1 = [Math.fround(1), Math.fround(8), Math.fround(25.3999996), Math.fround(0.252000004)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatArraysActualNull(): void {
  let p0 = [Math.fround(1), Math.fround(8), Math.fround(25.3999996), Math.fround(0.252999991)];
  let p1 = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatArrays1(): void {
  let p0 = [Math.fround(1), Math.fround(8), Math.fround(25.3999996), Math.fround(0.252999991)];
  let p1 = [Math.fround(1), Math.fround(8), Math.fround(25.3999996), Math.fround(0.252000004)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatArrays2(): void {
  let p0 = [Math.fround(1), Math.fround(8), Math.fround(25.3999996), Math.fround(0.252999991)];
  let p1 = [Math.fround(2), Math.fround(8), Math.fround(25.3999996), Math.fround(0.252999991)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatArrays3(): void {
  let p0 = [Math.fround(1), Math.fround(8), Math.fround(25.3999996), Math.fround(0.252999991)];
  let p1 = [Math.fround(1), Math.fround(8), Math.fround(25.5), Math.fround(0.252999991)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatArraysNegative1(): void {
  let p0 = [-Math.fround(1), -Math.fround(8), -Math.fround(25.3999996), -Math.fround(0.252999991)];
  let p1 = [-Math.fround(1), -Math.fround(8), -Math.fround(25.3999996), -Math.fround(0.252000004)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatArraysNegative2(): void {
  let p0 = [-Math.fround(1), -Math.fround(8), -Math.fround(25.3999996), -Math.fround(0.252999991)];
  let p1 = [-Math.fround(2), -Math.fround(8), -Math.fround(25.3999996), -Math.fround(0.252999991)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatArraysNegative3(): void {
  let p0 = [-Math.fround(1), -Math.fround(8), -Math.fround(25.3999996), -Math.fround(0.252999991)];
  let p1 = [-Math.fround(1), -Math.fround(8), -Math.fround(25.5), -Math.fround(0.252999991)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualFloatArraysNaN(): void {
  let p0 = { TestFile: Math.fround(1), CurrentTestName: Math.fround(0) / undefined /* recovery */, CurrentDetails1: Math.fround(25.3999996), CurrentDetails2: Math.fround(0.252999991) };
  let p1 = { TestFile: Math.fround(1), CurrentTestName: Math.fround(0) / undefined /* recovery */, CurrentDetails1: Math.fround(25.3999996), CurrentDetails2: Math.fround(0.252999991) };
}

export function testEqualFloatArraysInf(): void {
  let p0 = { TestFile: Math.fround(1), CurrentTestName: Math.fround(1) / undefined /* recovery */, CurrentDetails1: Math.fround(25.3999996), CurrentDetails2: Math.fround(0.252999991) };
  let p1 = { TestFile: Math.fround(1), CurrentTestName: Math.fround(1) / undefined /* recovery */, CurrentDetails1: Math.fround(25.3999996), CurrentDetails2: Math.fround(0.252999991) };
}

export function testNotEqualFloatArraysLengthZero(): void {
  let p0 = [Math.fround(0)];
  let p1 = [Math.fround(0)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualFloatEachEqual(): void {
  let p0 = [Math.fround(1), Math.fround(1), Math.fround(1), Math.fround(1)];
  let p1 = [-Math.fround(0.123000003), -Math.fround(0.123000003), -Math.fround(0.123000003), -Math.fround(0.123000003)];
  let p2 = [Math.fround(25.3999996), Math.fround(25.3999996), Math.fround(25.3999996), -Math.fround(0.200000003)];
  let p3 = [Math.fround(1), -Math.fround(23), Math.fround(25), -Math.fround(0.25999999)];
}

export function testNotEqualFloatEachEqualActualNull(): void {
  let p0 = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatEachEqual1(): void {
  let p0 = [Math.fround(0.252999991), Math.fround(8), Math.fround(0.252999991), Math.fround(0.252999991)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatEachEqual2(): void {
  let p0 = [Math.fround(8), Math.fround(8), Math.fround(8), Math.fround(0.252999991)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatEachEqual3(): void {
  let p0 = [Math.fround(1), Math.fround(1), Math.fround(1), Math.fround(0.252999991)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatEachEqualNegative1(): void {
  let p0 = [-Math.fround(1), -Math.fround(0.252999991), -Math.fround(0.252999991), -Math.fround(0.252999991)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatEachEqualNegative2(): void {
  let p0 = [-Math.fround(25.3999996), -Math.fround(8), -Math.fround(25.3999996), -Math.fround(25.3999996)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualFloatEachEqualNegative3(): void {
  let p0 = [-Math.fround(8), -Math.fround(8), -Math.fround(8), -Math.fround(0.252999991)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualFloatEachEqualNaN(): void {
  let p0 = { TestFile: Math.fround(0) / undefined /* recovery */, CurrentTestName: Math.fround(0) / undefined /* recovery */, CurrentDetails1: Math.fround(0) / undefined /* recovery */, CurrentDetails2: Math.fround(0) / undefined /* recovery */ };
}

export function testEqualFloatEachEqualInf(): void {
  let p0 = { TestFile: Math.fround(1) / undefined /* recovery */, CurrentTestName: Math.fround(1) / undefined /* recovery */, CurrentDetails1: Math.fround(25.3999996), CurrentDetails2: Math.fround(0.252999991) };
}

export function testNotEqualFloatEachEqualLengthZero(): void {
  let p0 = [Math.fround(0)];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testFloatPrinting(): void {
}

export function testFloatPrintingInfinityAndNaN(): void {
}

export function testFloatPrintingRandomSamples(): void {
}

export function testDoublesWithinDelta(): void {
}

export function testDoublesNotWithinDelta(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublesEqual(): void {
}

export function testDoublesNotEqual(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublesNotEqualNegative1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublesNotEqualNegative2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublesNotEqualActualNaN(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublesNotEqualExpectedNaN(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublesEqualBothNaN(): void {
}

export function testDoublesNotEqualInfNaN(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublesNotEqualNaNInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublesNotEqualActualInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublesNotEqualExpectedInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublesEqualBothInf(): void {
}

export function testDoublesNotEqualPlusMinusInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleIsPosInf1(): void {
}

export function testDoubleIsPosInf2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleIsNegInf1(): void {
}

export function testDoubleIsNegInf2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleIsNotPosInf1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleIsNotPosInf2(): void {
}

export function testDoubleIsNotNegInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleIsNan1(): void {
}

export function testDoubleIsNan2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleIsNotNan1(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleIsNotNan2(): void {
}

export function testDoubleInfIsNotNan(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleNanIsNotInf(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleIsDeterminate1(): void {
}

export function testDoubleIsDeterminate2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleIsNotDeterminate1(): void {
}

export function testDoubleIsNotDeterminate2(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoubleTraitFailsOnInvalidTrait(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualDoubleArrays(): void {
  let p0 = [1, -8, 25.399999999999999, -0.123];
  let p1 = [1, -8, 25.399999999999999, -0.123];
  let p2 = [1, -8, 25.399999999999999, -0.20000000000000001];
  let p3 = [1, -23, 25, -0.26000000000000001];
}

export function testNotEqualDoubleArraysExpectedNull(): void {
  let p0 = null; /* &ref */
  let p1 = [1, 8, 25.399999999999999, 0.252];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleArraysActualNull(): void {
  let p0 = [1, 8, 25.399999999999999, 0.253];
  let p1 = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleArrays1(): void {
  let p0 = [1, 8, 25.399999999999999, 0.25666666666999999];
  let p1 = [1, 8, 25.399999999999999, 0.25666666665999999];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleArrays2(): void {
  let p0 = [1, 8, 25.399999999999999, 0.253];
  let p1 = [2, 8, 25.399999999999999, 0.253];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleArrays3(): void {
  let p0 = [1, 8, 25.399999999999999, 0.253];
  let p1 = [1, 8, 25.5, 0.253];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleArraysNegative1(): void {
  let p0 = [-1, -8, -25.399999999999999, -0.25666666669999999];
  let p1 = [-1, -8, -25.399999999999999, -0.25666666659999998];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleArraysNegative2(): void {
  let p0 = [-1, -8, -25.399999999999999, -0.253];
  let p1 = [-2, -8, -25.399999999999999, -0.253];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleArraysNegative3(): void {
  let p0 = [-1, -8, -25.399999999999999, -0.253];
  let p1 = [-1, -8, -25.5, -0.253];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualDoubleArraysNaN(): void {
  let p0 = { TestFile: 1, CurrentTestName: 0 / undefined /* recovery */, CurrentDetails1: 25.399999999999999, CurrentDetails2: 0.253 };
  let p1 = { TestFile: 1, CurrentTestName: 0 / undefined /* recovery */, CurrentDetails1: 25.399999999999999, CurrentDetails2: 0.253 };
}

export function testEqualDoubleArraysInf(): void {
  let p0 = { TestFile: 1, CurrentTestName: 1 / undefined /* recovery */, CurrentDetails1: 25.399999999999999, CurrentDetails2: 0.253 };
  let p1 = { TestFile: 1, CurrentTestName: 1 / undefined /* recovery */, CurrentDetails1: 25.399999999999999, CurrentDetails2: 0.253 };
}

export function testNotEqualDoubleArraysLengthZero(): void {
  let p0 = [0];
  let p1 = [0];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualDoubleEachEqual(): void {
  let p0 = [1, 1, 1, 1];
  let p1 = [-0.123, -0.123, -0.123, -0.123];
  let p2 = [25.399999999999999, 25.399999999999999, 25.399999999999999, -0.20000000000000001];
  let p3 = [1, -23, 25, -0.26000000000000001];
}

export function testNotEqualDoubleEachEqualActualNull(): void {
  let p0 = null; /* &ref */
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleEachEqual1(): void {
  let p0 = [0.253, 8, 0.253, 0.253];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleEachEqual2(): void {
  let p0 = [8, 8, 8, 0.253];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleEachEqual3(): void {
  let p0 = [1, 1, 1, 0.253];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleEachEqualNegative1(): void {
  let p0 = [-1, -0.253, -0.253, -0.253];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleEachEqualNegative2(): void {
  let p0 = [-25.399999999999999, -8, -25.399999999999999, -25.399999999999999];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testNotEqualDoubleEachEqualNegative3(): void {
  let p0 = [-8, -8, -8, -0.253];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testEqualDoubleEachEqualNaN(): void {
  let p0 = { TestFile: 0 / undefined /* recovery */, CurrentTestName: 0 / undefined /* recovery */, CurrentDetails1: 0 / undefined /* recovery */, CurrentDetails2: 0 / undefined /* recovery */ };
}

export function testEqualDoubleEachEqualInf(): void {
  let p0 = { TestFile: 1 / undefined /* recovery */, CurrentTestName: 1 / undefined /* recovery */, CurrentDetails1: 25.399999999999999, CurrentDetails2: 0.253 };
}

export function testNotEqualDoubleEachEqualLengthZero(): void {
  let p0 = [0];
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testDoublePrinting(): void {
}

export function testDoublePrintingInfinityAndNaN(): void {
}

export function testThatDetailsCanBeHandleOneDetail(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testThatDetailsCanHandleTestFail(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testThatDetailsCanBeHandleTwoDetails(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}

export function testThatDetailsCanBeHandleSingleDetailClearingTwoDetails(): void {
  startPutcharSpy();
  if (undefined /* recovery */) {
  }
  endPutcharSpy();
  if (undefined /* recovery */) {
    SetToOneMeanWeAlreadyCheckedThisGuy = 1;
  }
}
