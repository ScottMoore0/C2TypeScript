import { UnityConcludeFixtureTest, UnityGetCommandLineOptions, UnityIgnoreTest, UnityMain, UnityMalloc_MakeMallocFailAfterCount, UnityPointer_Init, UnityPointer_UndoAllSets } from './unity_fixture.js';
import { UnityOutputCharSpy_Create, UnityOutputCharSpy_Destroy, UnityOutputCharSpy_Enable, UnityOutputCharSpy_OutputChar } from './unity_output_Spy.js';

function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function trunc(x: number): number { return Math.trunc(x); }
function realloc(ptr: any, size: any): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 const sz = typeof size === 'bigint' ? Number(size) : Number(size ?? 0); if (ptr && ptr.__cptr_overlay === true) { const cp = ptr.__cptr; ptr = { buf: cp.buf, off: (cp.off ?? 0) + (ptr.__byteOff ?? 0) }; return cptr_realloc(ptr, sz); } if (ptr && typeof ptr === 'object' && !ptr.buf && ptr.constructor && (ptr.constructor as any).__fieldNames) { /* BRIDGE: struct-as-class realloc */ const existing = ptr.__cptr; const newBuf = new Uint8Array(sz); if (existing && existing.buf) { const srcOff = existing.off ?? 0; const copyLen = Math.min(existing.buf.length - srcOff, sz); if (copyLen > 0) newBuf.set(existing.buf.subarray(srcOff, srcOff + copyLen)); } ptr.__cptr = { buf: newBuf, off: 0 }; ptr.__byteOff = 0; return ptr; } return cptr_realloc(ptr, sz); }
function calloc(n: any, size: any): CPtr { const ni = typeof n === 'bigint' ? Number(n) : Number(n ?? 0); const si = typeof size === 'bigint' ? Number(size) : Number(size ?? 0); return cptr_create(ni * si); }
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
function strcpy(dst: any, src: any): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 const srcStr = typeof src === 'string' ? src : src?.buf ? cptr_to_string(src) : src?.toString?.() ?? ''; if (dst?.buf) { for (let i = 0; i < srcStr.length; i++) dst.buf[dst.off + i] = srcStr.charCodeAt(i); dst.buf[dst.off + srcStr.length] = 0; return dst; } if (Array.isArray(dst)) { for (let i = 0; i < srcStr.length; i++) dst[i] = srcStr.charCodeAt(i); dst[srcStr.length] = 0; return dst; } if (dst && typeof dst === 'object' && 'value' in dst) dst.value = srcStr; return srcStr; }
const __rt_objId_map = new WeakMap<object, number>(); const __rt_objId_inverse = new Map<number, any>(); let __rt_objId_next = 64; function __rt_objId(o: any): number { if (o == null || typeof o !== 'object') return 0; let id = __rt_objId_map.get(o); if (id === undefined) { id = __rt_objId_next; __rt_objId_next += 64; __rt_objId_map.set(o, id); __rt_objId_inverse.set(id, o); } return id; } const __rt_cptrInt_byBuf = new WeakMap<object, Map<number, number>>(); const __rt_cptrInt_inverse = new Map<number, any>(); let __rt_cptrInt_next = -64; function __rt_ptr_to_intptr(p: any): number {
  if (typeof p === 'string') p = cptr_from_string(p);
 if (p == null) return 0; if (p && p.buf && typeof p.off !== 'undefined') { let m = __rt_cptrInt_byBuf.get(p.buf); if (!m) { m = new Map(); __rt_cptrInt_byBuf.set(p.buf, m); } const off = p.off ?? 0; let id = m.get(off); if (id === undefined) { id = __rt_cptrInt_next; __rt_cptrInt_next -= 64; m.set(off, id); __rt_cptrInt_inverse.set(id, { buf: p.buf, off }); } return id; } return __rt_objId(p); } function __rt_intptr_to_ptr(i: any): any { if (i === 0 || i === 0n || i == null) return null; const n = typeof i === 'bigint' ? Number(i) : i; if (__rt_cptrInt_inverse.has(n)) return __rt_cptrInt_inverse.get(n); if (__rt_objId_inverse.has(n)) return __rt_objId_inverse.get(n); return n; }

export function TEST_SETUP(UnityFixture: number): number {
}

export function TEST_TEAR_DOWN(UnityFixture: number): number {
}

let pointer1 = null; /* &ref */
let pointer2 = __rt_intptr_to_ptr(2); /* &ref */
let pointer3 = __rt_intptr_to_ptr(3); /* &ref */
let int1 = 0;
let int2 = 0;
let int3 = 0;
let int4 = 0;
export function TEST(UnityFixture: number, PointerSetting: number): number {
  TEST_ASSERT_POINTERS_EQUAL(pointer1, 0);
  UT_PTR_SET(pointer1, int1);
  UT_PTR_SET(pointer2, int2);
  UT_PTR_SET(pointer3, int3);
  TEST_ASSERT_POINTERS_EQUAL(pointer1, int1);
  TEST_ASSERT_POINTERS_EQUAL(pointer2, int2);
  TEST_ASSERT_POINTERS_EQUAL(pointer3, int3);
  UT_PTR_SET(pointer1, int4);
  UnityPointer_UndoAllSets();
  TEST_ASSERT_POINTERS_EQUAL(pointer1, 0);
  TEST_ASSERT_POINTERS_EQUAL(pointer2, __rt_intptr_to_ptr(2));
  TEST_ASSERT_POINTERS_EQUAL(pointer3, __rt_intptr_to_ptr(3));
}

export function TEST_1(UnityFixture: number, ForceMallocFail: number): number {
  let m = null;
  let mfails = null;
  UnityMalloc_MakeMallocFailAfterCount(1);
  m = malloc(10);
  CHECK(m);
  mfails = malloc(10);
  TEST_ASSERT_POINTERS_EQUAL(0, mfails);
  free(m);
}

export function TEST_2(UnityFixture: number, ReallocSmallerIsUnchanged: number): number {
  let m1 = malloc(10); /* &ref */
  let m2 = realloc(m1, 5); /* &ref */
  TEST_ASSERT_POINTERS_EQUAL(m1, m2);
  free(m2);
}

export function TEST_3(UnityFixture: number, ReallocSameIsUnchanged: number): number {
  let m1 = malloc(10); /* &ref */
  let m2 = realloc(m1, 10); /* &ref */
  TEST_ASSERT_POINTERS_EQUAL(m1, m2);
  free(m2);
}

export function TEST_4(UnityFixture: number, ReallocLargerNeeded: number): number {
  let m1 = malloc(10); /* &ref */
  let m2 = null;
  CHECK(m1);
  strcpy((m1), "123456789");
  m2 = realloc(m1, 15);
  STRCMP_EQUAL("123456789", m2);
  free(m2);
}

export function TEST_5(UnityFixture: number, ReallocNullPointerIsLikeMalloc: number): number {
  let m = realloc(null, 15); /* &ref */
  CHECK(m != null);
  free(m);
}

export function TEST_6(UnityFixture: number, ReallocSizeZeroFreesMemAndReturnsNullPointer: number): number {
  let m1 = malloc(10); /* &ref */
  let m2 = realloc(m1, 0); /* &ref */
  TEST_ASSERT_POINTERS_EQUAL(0, m2);
}

export function TEST_7(UnityFixture: number, CallocFillsWithZero: number): number {
  let m = calloc(3, 1); /* &ref */
  let s = cptr_clone((m)); /* &ref */
  CHECK(m);
  TEST_ASSERT_BYTES_EQUAL(0, ((s.buf[(s.off ?? 0) + 0]) << 24 >> 24));
  TEST_ASSERT_BYTES_EQUAL(0, ((s.buf[(s.off ?? 0) + 1]) << 24 >> 24));
  TEST_ASSERT_BYTES_EQUAL(0, ((s.buf[(s.off ?? 0) + 2]) << 24 >> 24));
  free(m);
}

let p1 = null;
let p2 = null;
export function TEST_8(UnityFixture: number, PointerSet: number): number {
  let c1_box = { value: 0 };
  let c2_box = { value: 0 };
  let newC1_box = { value: 0 };
  let newC2_box = { value: 0 };
  p1 = c1_box;
  p2 = c2_box;
  UnityPointer_Init();
  UT_PTR_SET(cptr_clone(p1), newC1_box);
  UT_PTR_SET(cptr_clone(p2), newC2_box);
  TEST_ASSERT_POINTERS_EQUAL(newC1_box, cptr_clone(p1));
  TEST_ASSERT_POINTERS_EQUAL(newC2_box, cptr_clone(p2));
  UnityPointer_UndoAllSets();
  TEST_ASSERT_POINTERS_EQUAL(c1_box, cptr_clone(p1));
  TEST_ASSERT_POINTERS_EQUAL(c2_box, cptr_clone(p2));
}

export function TEST_9(UnityFixture: number, FreeNULLSafety: number): number {
  free((null));
}

export function TEST_10(UnityFixture: number, ConcludeTestIncrementsFailCount: number): number {
  UnityOutputCharSpy_Enable(1);
  UnityConcludeFixtureTest();
  UnityConcludeFixtureTest();
  UnityOutputCharSpy_Enable(0);
  TEST_ASSERT_EQUAL();
  TEST_ASSERT_EQUAL();
}

let savedVerbose = 0;
let savedRepeat = 0;
const savedName = null;
const savedGroup = null;
export function TEST_SETUP_1(UnityCommandOptions: number): number {
}

export function TEST_TEAR_DOWN_1(UnityCommandOptions: number): number {
}

const noOptions = ["testrunner.exe"]; /* &ref */
export function TEST_11(UnityCommandOptions: number, DefaultOptions: number): number {
  UnityGetCommandLineOptions(1, cptr_clone(noOptions));
  TEST_ASSERT_EQUAL(0);
  TEST_ASSERT_POINTERS_EQUAL(0);
  TEST_ASSERT_POINTERS_EQUAL(0);
  TEST_ASSERT_EQUAL(1);
}

const verbose = ["testrunner.exe", "-v"]; /* &ref */
export function TEST_12(UnityCommandOptions: number, OptionVerbose: number): number {
  TEST_ASSERT_EQUAL(0, UnityGetCommandLineOptions(2, cptr_clone(verbose)));
  TEST_ASSERT_EQUAL(1);
}

const group = ["testrunner.exe", "-g", "groupname"]; /* &ref */
export function TEST_13(UnityCommandOptions: number, OptionSelectTestByGroup: number): number {
  TEST_ASSERT_EQUAL(0, UnityGetCommandLineOptions(3, cptr_clone(group)));
  STRCMP_EQUAL("groupname");
}

const name = ["testrunner.exe", "-n", "testname"]; /* &ref */
export function TEST_14(UnityCommandOptions: number, OptionSelectTestByName: number): number {
  TEST_ASSERT_EQUAL(0, UnityGetCommandLineOptions(3, cptr_clone(name)));
  STRCMP_EQUAL("testname");
}

const repeat = ["testrunner.exe", "-r", "99"]; /* &ref */
export function TEST_15(UnityCommandOptions: number, OptionSelectRepeatTestsDefaultCount: number): number {
  TEST_ASSERT_EQUAL(0, UnityGetCommandLineOptions(2, cptr_clone(repeat)));
  TEST_ASSERT_EQUAL(2);
}

export function TEST_16(UnityCommandOptions: number, OptionSelectRepeatTestsSpecificCount: number): number {
  TEST_ASSERT_EQUAL(0, UnityGetCommandLineOptions(3, cptr_clone(repeat)));
  TEST_ASSERT_EQUAL(99);
}

const multiple = ["testrunner.exe", "-v", "-g", "groupname", "-n", "testname", "-r", "98"]; /* &ref */
export function TEST_17(UnityCommandOptions: number, MultipleOptions: number): number {
  TEST_ASSERT_EQUAL(0, UnityGetCommandLineOptions(8, cptr_clone(multiple)));
  TEST_ASSERT_EQUAL(1);
  STRCMP_EQUAL("groupname");
  STRCMP_EQUAL("testname");
  TEST_ASSERT_EQUAL(98);
}

const dashRNotLast = ["testrunner.exe", "-v", "-g", "gggg", "-r", "-n", "tttt"]; /* &ref */
export function TEST_18(UnityCommandOptions: number, MultipleOptionsDashRNotLastAndNoValueSpecified: number): number {
  TEST_ASSERT_EQUAL(0, UnityGetCommandLineOptions(7, cptr_clone(dashRNotLast)));
  TEST_ASSERT_EQUAL(1);
  STRCMP_EQUAL("gggg");
  STRCMP_EQUAL("tttt");
  TEST_ASSERT_EQUAL(2);
}

const unknownCommand = ["testrunner.exe", "-v", "-g", "groupname", "-n", "testname", "-r", "98", "-z"]; /* &ref */
export function TEST_19(UnityCommandOptions: number, UnknownCommandIsIgnored: number): number {
  TEST_ASSERT_EQUAL(0, UnityGetCommandLineOptions(9, cptr_clone(unknownCommand)));
  TEST_ASSERT_EQUAL(1);
  STRCMP_EQUAL("groupname");
  STRCMP_EQUAL("testname");
  TEST_ASSERT_EQUAL(98);
}

export function TEST_20(UnityCommandOptions: number, GroupOrNameFilterWithoutStringFails: number): number {
  TEST_ASSERT_EQUAL(1, UnityGetCommandLineOptions(3, cptr_clone(unknownCommand)));
  TEST_ASSERT_EQUAL(1, UnityGetCommandLineOptions(5, cptr_clone(unknownCommand)));
  TEST_ASSERT_EQUAL(1, UnityMain(3, cptr_clone(unknownCommand), (null)));
}

export function TEST_21(UnityCommandOptions: number, GroupFilterReallyFilters: number): number {
  TEST_ASSERT_EQUAL(0, UnityGetCommandLineOptions(4, cptr_clone(unknownCommand)));
  UnityIgnoreTest((null), "non-matching", (null));
  TEST_ASSERT_EQUAL();
}

export function IGNORE_TEST(UnityCommandOptions: number, TestShouldBeIgnored: number): number {
  TEST_FAIL_MESSAGE("This test should not run!");
}

export function TEST_SETUP_2(LeakDetection: number): number {
  UnityOutputCharSpy_Create(1000);
}

export function TEST_TEAR_DOWN_2(LeakDetection: number): number {
  UnityOutputCharSpy_Destroy();
}

export function TEST_22(LeakDetection: number, DetectsLeak: number): number {
  TEST_IGNORE_MESSAGE("Build with '-D UNITY_OUTPUT_CHAR=UnityOutputCharSpy_OutputChar' to enable tests");
}

export function TEST_23(LeakDetection: number, BufferOverrunFoundDuringFree: number): number {
  TEST_IGNORE();
}

export function TEST_24(LeakDetection: number, BufferOverrunFoundDuringRealloc: number): number {
  TEST_IGNORE();
}

export function TEST_25(LeakDetection: number, BufferGuardWriteFoundDuringFree: number): number {
  TEST_IGNORE();
}

export function TEST_26(LeakDetection: number, BufferGuardWriteFoundDuringRealloc: number): number {
  TEST_IGNORE();
}

export function TEST_27(LeakDetection: number, PointerSettingMax: number): number {
  TEST_IGNORE();
}

export function TEST_SETUP_3(InternalMalloc: number): number {
}

export function TEST_TEAR_DOWN_3(InternalMalloc: number): number {
}

export function TEST_28(InternalMalloc: number, MallocPastBufferFails: number): number {
}

export function TEST_29(InternalMalloc: number, CallocPastBufferFails: number): number {
}

export function TEST_30(InternalMalloc: number, MallocThenReallocGrowsMemoryInPlace: number): number {
}

export function TEST_31(InternalMalloc: number, ReallocFailDoesNotFreeMem: number): number {
}

