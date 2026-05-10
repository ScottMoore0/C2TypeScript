import { setUp, tearDown } from './testparameterized.js';


function _dclass(x: number): number { if (Number.isNaN(x)) return 2; if (!Number.isFinite(x)) return 1; if (x === 0) return 0; const a = Math.abs(x); if (a < 2.2250738585072014e-308) return -2; return -1; /* MinGW codes: NaN=2, INF=1, ZERO=0, NORMAL=-1, SUBNORMAL=-2; isfinite=(<=0), isnormal=(==-1) */ }
function _fdclass(x: number): number { return _dclass(x); }
function _ldclass(x: number): number { return _dclass(x); }
// BRIDGE: setjmp-as-try-catch — C17 §7.13 (non-local jumps) + POSIX §7.13.2.1
// (sigsetjmp/siglongjmp). longjmp(env,val) and siglongjmp(env,val) both
// emit as `throw new LongjmpException(val, env)`; the matching setjmp/sigsetjmp
// scope is wrapped in `try { ... } catch (e) { if (e instanceof LongjmpException) ... }`.
// For sigsetjmp(env, savemask!=0), env.__sigmask_save is true and env.__sigmask holds
// the mask snapshot; the catch handler restores __current_sigmask.value before retry.
export class LongjmpException extends Error { constructor(public value: number, public env: any) { super('longjmp'); } }
function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function div(numer: number, denom: number): any { return { quot: Math.trunc(numer / denom), rem: numer % denom }; }
function rint(x: number): number { return Math.round(x); }
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
function count(first: any, last: any, value: any): number { const A = __cpp_arr(first, last); let n = 0; for (let i = A.start; i < A.end; i++) if (A.arr[i] === value) n++; return n; }
function write(fd: any, buf: any, count: number): number { if (fd === 1) { const s = (buf?.buf) ? cptr_to_string(buf) : (typeof buf === 'string' ? buf : String.fromCharCode(...new Uint8Array(buf, 0, count))); process.stdout.write(s.substring(0, count)); return count; } if (fd === 2) { const s = (buf?.buf) ? cptr_to_string(buf) : (typeof buf === 'string' ? buf : String(buf)); process.stderr.write(s.substring(0, count)); return count; } try { const data = (buf?.buf) ? Buffer.from(buf.buf.buffer, buf.buf.byteOffset + buf.off, count) : (typeof buf === 'string' ? Buffer.from(buf) : Buffer.from(buf)); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function trunc(x: number): number { return Math.trunc(x); }
const stdin = { __fd: 0, __name: 'stdin' }, stdout = { __fd: 1, __name: 'stdout' }, stderr = { __fd: 2, __name: 'stderr' };
const NULL = null;
function i32(x: number) { return x | 0; }
function u32(x: number) { return x >>> 0; }
function __as_bigint(x: any): bigint { if (typeof x === 'bigint') return x; if (typeof x === 'number') return BigInt(Math.trunc(x)); if (x && typeof x === 'object' && 'value' in x) { const v = (x as any).value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof x === 'boolean') return x ? 1n : 0n; return BigInt(Math.trunc(Number(x ?? 0))); }
function __u64(x: bigint): bigint { return BigInt.asUintN(64, x); }
function __i64(x: bigint): bigint { return BigInt.asIntN(64, x); }
function __safe_div_i64(a: bigint, b: bigint): bigint { if (b === 0n) throw new Error('Division by zero'); return a / b; }
function __safe_mod_i64(a: bigint, b: bigint): bigint { if (b === 0n) throw new Error('Division by zero'); return a % b; }

const __rt_objId_map = new WeakMap<object, number>(); const __rt_objId_inverse = new Map<number, any>(); let __rt_objId_next = 64; function __rt_objId(o: any): number { if (o == null || typeof o !== 'object') return 0; let id = __rt_objId_map.get(o); if (id === undefined) { id = __rt_objId_next; __rt_objId_next += 64; __rt_objId_map.set(o, id); __rt_objId_inverse.set(id, o); } return id; } const __rt_cptrInt_byBuf = new WeakMap<object, Map<number, number>>(); const __rt_cptrInt_inverse = new Map<number, any>(); let __rt_cptrInt_next = -64; function __rt_ptr_to_intptr(p: any): number {
  if (typeof p === 'string') p = cptr_from_string(p);
 if (p == null) return 0; if (p && p.buf && typeof p.off !== 'undefined') { let m = __rt_cptrInt_byBuf.get(p.buf); if (!m) { m = new Map(); __rt_cptrInt_byBuf.set(p.buf, m); } const off = p.off ?? 0; let id = m.get(off); if (id === undefined) { id = __rt_cptrInt_next; __rt_cptrInt_next -= 64; m.set(off, id); __rt_cptrInt_inverse.set(id, { buf: p.buf, off }); } return id; } return __rt_objId(p); } function __rt_intptr_to_ptr(i: any): any { if (i === 0 || i === 0n || i == null) return null; const n = typeof i === 'bigint' ? Number(i) : i; if (__rt_cptrInt_inverse.has(n)) return __rt_cptrInt_inverse.get(n); if (__rt_objId_inverse.has(n)) return __rt_objId_inverse.get(n); return n; }

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

function putchar(c: number): number { process.stdout.write(String.fromCharCode(c)); return c; }
type UNITY_UINT8 = number;
type UNITY_UINT16 = number;
type UNITY_UINT32 = number;
type UNITY_INT8 = number;
type UNITY_INT16 = number;
type UNITY_INT32 = number;
type UNITY_UINT64 = number;
type UNITY_INT64 = number;
type UNITY_UINT = UNITY_UINT64;
type UNITY_INT = UNITY_INT64;
type UNITY_FLOAT = number;
type UNITY_DOUBLE = number;
type UnityTestFunction = (...args: any[]) => any;
export const UNITY_DISPLAY_STYLE_INT: number = 4 + (16);
export const UNITY_DISPLAY_STYLE_INT8: number = i32(1 + (16));
export const UNITY_DISPLAY_STYLE_INT16: number = i32(2 + (16));
export const UNITY_DISPLAY_STYLE_INT32: number = i32(4 + (16));
export const UNITY_DISPLAY_STYLE_INT64: number = i32(8 + (16));
export const UNITY_DISPLAY_STYLE_UINT: number = 4 + (32);
export const UNITY_DISPLAY_STYLE_UINT8: number = i32(1 + (32));
export const UNITY_DISPLAY_STYLE_UINT16: number = i32(2 + (32));
export const UNITY_DISPLAY_STYLE_UINT32: number = i32(4 + (32));
export const UNITY_DISPLAY_STYLE_UINT64: number = i32(8 + (32));
export const UNITY_DISPLAY_STYLE_HEX8: number = i32(1 + (64));
export const UNITY_DISPLAY_STYLE_HEX16: number = i32(2 + (64));
export const UNITY_DISPLAY_STYLE_HEX32: number = i32(4 + (64));
export const UNITY_DISPLAY_STYLE_HEX64: number = i32(8 + (64));
export const UNITY_DISPLAY_STYLE_UNKNOWN: number = 13;

type UNITY_DISPLAY_STYLE_T = number;
export const UNITY_EQUAL_TO: number = 1;
export const UNITY_GREATER_THAN: number = 2;
export const UNITY_GREATER_OR_EQUAL: number = i32(2 + UNITY_EQUAL_TO);
export const UNITY_SMALLER_THAN: number = 4;
export const UNITY_SMALLER_OR_EQUAL: number = i32(4 + UNITY_EQUAL_TO);

type UNITY_COMPARISON_T = number;
export type UNITY_FLOAT_TRAIT = number;
export const UNITY_FLOAT_IS_NOT_INF: number = 0;
export const UNITY_FLOAT_IS_INF: number = 1;
export const UNITY_FLOAT_IS_NOT_NEG_INF: number = 2;
export const UNITY_FLOAT_IS_NEG_INF: number = 3;
export const UNITY_FLOAT_IS_NOT_NAN: number = 4;
export const UNITY_FLOAT_IS_NAN: number = 5;
export const UNITY_FLOAT_IS_NOT_DET: number = 6;
export const UNITY_FLOAT_IS_DET: number = 7;
export const UNITY_FLOAT_INVALID_TRAIT: number = 8;

type UNITY_FLOAT_TRAIT_T = number;
export const UNITY_ARRAY_TO_VAL: number = 0;
export const UNITY_ARRAY_TO_ARRAY: number = 1;

type UNITY_FLAGS_T = number;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class UNITY_STORAGE_T {
  TestFile: string;
  CurrentTestName: string;
  CurrentDetail1: string;
  CurrentDetail2: string;
  CurrentTestLineNumber: UNITY_UINT;
  NumberOfTests: UNITY_UINT;
  TestFailures: UNITY_UINT;
  TestIgnores: UNITY_UINT;
  CurrentTestFailed: UNITY_UINT;
  CurrentTestIgnored: UNITY_UINT;
  AbortFrame: any;
  constructor() {
    this.TestFile = null;
    this.CurrentTestName = null;
    this.CurrentDetail1 = null;
    this.CurrentDetail2 = null;
    this.CurrentTestLineNumber = 0;
    this.NumberOfTests = 0;
    this.TestFailures = 0;
    this.TestIgnores = 0;
    this.CurrentTestFailed = 0;
    this.CurrentTestIgnored = 0;
    this.AbortFrame = undefined;
  }
}
(UNITY_STORAGE_T as any).__fieldTypes = ["int64","int64","int64","int64","int32","int32","int32","int32","int32","int32","int32"];
(UNITY_STORAGE_T as any).__fieldNames = ["TestFile","CurrentTestName","CurrentDetail1","CurrentDetail2","CurrentTestLineNumber","NumberOfTests","TestFailures","TestIgnores","CurrentTestFailed","CurrentTestIgnored","AbortFrame"];
(UNITY_STORAGE_T as any).__fieldOffsets = [0,8,16,24,32,40,48,56,64,72,80];

export let Unity = new UNITY_STORAGE_T();
const UnityStrOk = (() => { const __b = cptr_create(3); const __s = "OK"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrPass = (() => { const __b = cptr_create(5); const __s = "PASS"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrFail = (() => { const __b = cptr_create(5); const __s = "FAIL"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrIgnore = (() => { const __b = cptr_create(7); const __s = "IGNORE"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrNull = (() => { const __b = cptr_create(5); const __s = "NULL"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrSpacer = (() => { const __b = cptr_create(3); const __s = ". "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrExpected = (() => { const __b = cptr_create(11); const __s = " Expected "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrWas = (() => { const __b = cptr_create(6); const __s = " Was "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrGt = (() => { const __b = cptr_create(21); const __s = " to be greater than "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrLt = (() => { const __b = cptr_create(18); const __s = " to be less than "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrOrEqual = (() => { const __b = cptr_create(13); const __s = "or equal to "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrElement = (() => { const __b = cptr_create(10); const __s = " Element "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrByte = (() => { const __b = cptr_create(7); const __s = " Byte "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrMemory = (() => { const __b = cptr_create(18); const __s = " Memory Mismatch."; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrDelta = (() => { const __b = cptr_create(26); const __s = " Values Not Within Delta "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrPointless = (() => { const __b = cptr_create(55); const __s = " You Asked Me To Compare Nothing, Which Was Pointless."; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrNullPointerForExpected = (() => { const __b = cptr_create(29); const __s = " Expected pointer to be NULL"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrNullPointerForActual = (() => { const __b = cptr_create(25); const __s = " Actual pointer was NULL"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrNot = (() => { const __b = cptr_create(5); const __s = "Not "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrInf = (() => { const __b = cptr_create(9); const __s = "Infinity"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrNegInf = (() => { const __b = cptr_create(18); const __s = "Negative Infinity"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrNaN = (() => { const __b = cptr_create(4); const __s = "NaN"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrDet = (() => { const __b = cptr_create(12); const __s = "Determinate"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrInvalidFloatTrait = (() => { const __b = cptr_create(20); const __s = "Invalid Float Trait"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
export const UnityStrErrFloat = (() => { const __b = cptr_create(30); const __s = "Unity Floating Point Disabled"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
export const UnityStrErrDouble = (() => { const __b = cptr_create(32); const __s = "Unity Double Precision Disabled"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
export const UnityStrErr64 = (() => { const __b = cptr_create(30); const __s = "Unity 64-bit Support Disabled"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrBreaker = (() => { const __b = cptr_create(24); const __s = "-----------------------"; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrResultsTests = (() => { const __b = cptr_create(8); const __s = " Tests "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrResultsFailures = (() => { const __b = cptr_create(11); const __s = " Failures "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrResultsIgnored = (() => { const __b = cptr_create(10); const __s = " Ignored "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrDetail1Name = (() => { const __b = cptr_create(10); const __s = "Function "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
const UnityStrDetail2Name = (() => { const __b = cptr_create(11); const __s = " Argument "; for (let __i = 0; __i < __s.length; __i++) __b.buf[__i] = __s.charCodeAt(__i); return __b; })();
export function UnityPrint(string: string): void {
  let pch = cptr_clone(string); /* &ref */
  if (!cptr_eq(pch, (null))) {
    while (((pch.buf[pch.off]) << 24 >> 24)) {
      if ((((((pch.buf[pch.off]) << 24 >> 24) <= 126) && (((pch.buf[pch.off]) << 24 >> 24) >= 32)) ? 1 : 0)) {
        (putchar(((pch.buf[pch.off]) << 24 >> 24)));
      } else {
        if (((pch.buf[pch.off]) << 24 >> 24) == 13) {
          (putchar(92));
          (putchar(114));
        } else {
          if (((pch.buf[pch.off]) << 24 >> 24) == 10) {
            (putchar(92));
            (putchar(110));
          } else {
            (putchar(92));
            (putchar(120));
            UnityPrintNumberHex(__u64(__as_bigint(((pch.buf[pch.off]) << 24 >> 24))), ((2) << 24 >> 24));
          }
        }
      }
      pch.off++;
    }
  }
}

export function UnityPrintLen(string: string, length: UNITY_UINT32): void {
  let pch = cptr_clone(string); /* &ref */
  if (!cptr_eq(pch, (null))) {
    while (((((pch.buf[pch.off]) << 24 >> 24) && Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(pch, string)))) < length) ? 1 : 0)) {
      if ((((((pch.buf[pch.off]) << 24 >> 24) <= 126) && (((pch.buf[pch.off]) << 24 >> 24) >= 32)) ? 1 : 0)) {
        (putchar(((pch.buf[pch.off]) << 24 >> 24)));
      } else {
        if (((pch.buf[pch.off]) << 24 >> 24) == 13) {
          (putchar(92));
          (putchar(114));
        } else {
          if (((pch.buf[pch.off]) << 24 >> 24) == 10) {
            (putchar(92));
            (putchar(110));
          } else {
            (putchar(92));
            (putchar(120));
            UnityPrintNumberHex(__u64(__as_bigint(((pch.buf[pch.off]) << 24 >> 24))), ((2) << 24 >> 24));
          }
        }
      }
      pch.off++;
    }
  }
}

export function UnityPrintNumberByStyle(number: UNITY_INT, style: UNITY_DISPLAY_STYLE_T): void {
  if ((style & (16)) == (16)) {
    UnityPrintNumber(number);
  } else {
    if ((style & (32)) == (32)) {
      UnityPrintNumberUnsigned(__u64(__as_bigint(number)));
    } else {
      (putchar(48));
      (putchar(120));
      UnityPrintNumberHex(__u64(__as_bigint(number)), ((Math.trunc(+((Math.imul((style & 15), 2))))) << 24 >> 24));
    }
  }
}

export function UnityPrintNumber(number_to_print: UNITY_INT): void {
  let number = __u64(__as_bigint(number_to_print));
  if (number_to_print < 0) {
    (putchar(45));
    number = __u64(__as_bigint((-number_to_print)));
  }
  UnityPrintNumberUnsigned(number);
}

export function UnityPrintNumberUnsigned(number: UNITY_UINT): void {
  let divisor = 1;
  while ((__as_bigint(__safe_div_i64(__as_bigint(number), __as_bigint(divisor))) > __as_bigint(9))) {
    divisor = __u64(__as_bigint(divisor) * __as_bigint(10));
  }
  do {
    (putchar(((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint(48) + __as_bigint((__safe_mod_i64(__as_bigint(__safe_div_i64(__as_bigint(number), __as_bigint(divisor))), __as_bigint(10)))))))))) << 24 >> 24)));
    divisor = __safe_div_i64(__as_bigint(divisor), __as_bigint(10));
  } while (divisor > 0);
}

export function UnityPrintNumberHex(number: UNITY_UINT, nibbles_to_print: number): void {
  let nibble = 0;
  let nibbles = ((nibbles_to_print) << 24 >> 24);
  if (((Math.trunc(+(((nibbles) << 24 >> 24)))) >>> 0) > (2 * 8)) {
    nibbles = (((2 * 8) << 24 >> 24)) << 24 >> 24;
  }
  while (((nibbles) << 24 >> 24) > 0) {
    nibbles--;
    nibble = (Number(BigInt.asIntN(32, __as_bigint((__u64(__u64(__as_bigint(number)) >> __as_bigint((Math.imul(((nibbles) << 24 >> 24), 4)))))))) | 0) & 15;
    if (nibble <= 9) {
      (putchar(((Math.trunc(+((i32(48 + nibble))))) << 24 >> 24)));
    } else {
      (putchar(((Math.trunc(+((i32(i32(65 - 10) + nibble))))) << 24 >> 24)));
    }
  }
}

export function UnityPrintMask(mask: UNITY_UINT, number: UNITY_UINT): void {
  let current_bit = __u64(__as_bigint(__u64(__as_bigint(1))) << __as_bigint((i32((32) - 1))));
  let i = 0;
  for (i = 0; i < (32); i++) {
    if (__u64(__as_bigint(current_bit) & __as_bigint(mask))) {
      if (__u64(__as_bigint(current_bit) & __as_bigint(number))) {
        (putchar(49));
      } else {
        (putchar(48));
      }
    } else {
      (putchar(88));
    }
    current_bit = __u64(__u64(__as_bigint(current_bit)) >> __as_bigint(1));
  }
}

export function UnityPrintFloat(input_number: UNITY_DOUBLE): void {
  let number = input_number;
  if (((number < (Math.fround(0)) || (((number == (Math.fround(0)) && (Math.fround(1)) / number < (Math.fround(0))) ? 1 : 0))) ? 1 : 0)) {
    (putchar(45));
    number = -number;
  }
  if (number == (Math.fround(0))) {
    UnityPrint("0");
  } else {
    if (((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((number))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((number))) : _ldclass(((number))))))) == 2)) {
      UnityPrint("nan");
    } else {
      if (((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((number))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((number))) : _ldclass(((number))))))) == 1)) {
        UnityPrint("inf");
      } else {
        let exponent = 0;
        let decimals = 0;
        let digits = 0;
        let n = 0;
        let buf = cptr_create(16);
        while (number < ((Math.fround(Math.fround(1.0E+5) / Math.fround(1.0E+6))))) {
          number *= (Math.fround(1.0E+6));
          exponent = i32(exponent - 6);
        }
        while (number < (Math.fround(1.0E+5))) {
          number *= (Math.fround(10));
          exponent--;
        }
        while (number > ((Math.fround(Math.fround(1.0E+6) * Math.fround(1.0E+6))))) {
          number /= (Math.fround(1.0E+6));
          exponent = i32(exponent + 6);
        }
        while (number > (Math.fround(1.0E+6))) {
          number /= (Math.fround(10));
          exponent++;
        }
        n = __safe_div((i32(Math.trunc(+((number + number))) + 1)), 2);
        if (n > 999999) {
          n = 100000;
          exponent++;
        }
        decimals = ((((exponent <= 0 && exponent >= -9) ? 1 : 0)) ? -exponent : 5);
        exponent = i32(exponent + decimals);
        while (((decimals > 0 && i32(n % 10) == 0) ? 1 : 0)) {
          n = __safe_div(n, 10);
          decimals--;
        }
        digits = 0;
        while (((n != 0 || digits < i32(decimals + 1)) ? 1 : 0)) {
          buf.buf[(buf.off ?? 0) + digits++] = (((Math.trunc(+((i32(48 + i32(n % 10)))))) << 24 >> 24)) << 24 >> 24;
          n = __safe_div(n, 10);
        }
        while (digits > 0) {
          if (digits == decimals) {
            (putchar(46));
          }
          (putchar(((buf.buf[(buf.off ?? 0) + --digits]) << 24 >> 24)));
        }
        if (exponent != 0) {
          (putchar(101));
          if (exponent < 0) {
            (putchar(45));
            exponent = -exponent;
          } else {
            (putchar(43));
          }
          digits = 0;
          while (((exponent != 0 || digits < 2) ? 1 : 0)) {
            buf.buf[(buf.off ?? 0) + digits++] = (((Math.trunc(+((i32(48 + i32(exponent % 10)))))) << 24 >> 24)) << 24 >> 24;
            exponent = __safe_div(exponent, 10);
          }
          while (digits > 0) {
            (putchar(((buf.buf[(buf.off ?? 0) + --digits]) << 24 >> 24)));
          }
        }
      }
    }
  }
}

function UnityTestResultsBegin(file: string, line: UNITY_UINT): void {
  UnityPrint(cptr_clone(file));
  (putchar(58));
  UnityPrintNumber(__i64(__as_bigint(line)));
  (putchar(58));
  UnityPrint(cptr_clone(Unity.CurrentTestName));
  (putchar(58));
}

function UnityTestResultsFailBegin(line: UNITY_UINT): void {
  UnityTestResultsBegin(cptr_clone(Unity.TestFile), line);
  UnityPrint(cptr_clone(UnityStrFail));
  (putchar(58));
}

export function UnityConcludeTest(): void {
  if (Unity.CurrentTestIgnored) {
    Unity.TestIgnores++;
  } else {
    if (!Unity.CurrentTestFailed) {
      UnityTestResultsBegin(cptr_clone(Unity.TestFile), Unity.CurrentTestLineNumber);
      UnityPrint(cptr_clone(UnityStrPass));
    } else {
      Unity.TestFailures++;
    }
  }
  Unity.CurrentTestFailed = 0;
  Unity.CurrentTestIgnored = 0;
  (putchar(10));
}

function UnityAddMsgIfSpecified(msg: string): void {
  if (msg) {
    UnityPrint(cptr_clone(UnityStrSpacer));
    if (Unity.CurrentDetail1) {
      UnityPrint(cptr_clone(UnityStrDetail1Name));
      UnityPrint(cptr_clone(Unity.CurrentDetail1));
      if (Unity.CurrentDetail2) {
        UnityPrint(cptr_clone(UnityStrDetail2Name));
        UnityPrint(cptr_clone(Unity.CurrentDetail2));
      }
      UnityPrint(cptr_clone(UnityStrSpacer));
    }
    UnityPrint(cptr_clone(msg));
  }
}

function UnityPrintExpectedAndActualStrings(expected: string, actual: string): void {
  UnityPrint(cptr_clone(UnityStrExpected));
  if (!cptr_eq(expected, (null))) {
    (putchar(39));
    UnityPrint(cptr_clone(expected));
    (putchar(39));
  } else {
    UnityPrint(cptr_clone(UnityStrNull));
  }
  UnityPrint(cptr_clone(UnityStrWas));
  if (!cptr_eq(actual, (null))) {
    (putchar(39));
    UnityPrint(cptr_clone(actual));
    (putchar(39));
  } else {
    UnityPrint(cptr_clone(UnityStrNull));
  }
}

function UnityPrintExpectedAndActualStringsLen(expected: string, actual: string, length: UNITY_UINT32): void {
  UnityPrint(cptr_clone(UnityStrExpected));
  if (!cptr_eq(expected, (null))) {
    (putchar(39));
    UnityPrintLen(cptr_clone(expected), length);
    (putchar(39));
  } else {
    UnityPrint(cptr_clone(UnityStrNull));
  }
  UnityPrint(cptr_clone(UnityStrWas));
  if (!cptr_eq(actual, (null))) {
    (putchar(39));
    UnityPrintLen(cptr_clone(actual), length);
    (putchar(39));
  } else {
    UnityPrint(cptr_clone(UnityStrNull));
  }
}

function UnityIsOneArrayNull(expected: any | null, actual: any | null, lineNumber: UNITY_UINT, msg: string): number {
  if (cptr_eq(expected, actual)) {
    return 0;
  }
  if (cptr_eq(expected, (null))) {
    UnityTestResultsFailBegin(lineNumber);
    UnityPrint(cptr_clone(UnityStrNullPointerForExpected));
    UnityAddMsgIfSpecified(cptr_clone(msg));
    return 1;
  }
  if (cptr_eq(actual, (null))) {
    UnityTestResultsFailBegin(lineNumber);
    UnityPrint(cptr_clone(UnityStrNullPointerForActual));
    UnityAddMsgIfSpecified(cptr_clone(msg));
    return 1;
  }
  return 0;
}

export function UnityAssertBits(mask: UNITY_INT, expected: UNITY_INT, actual: UNITY_INT, msg: string, lineNumber: UNITY_UINT): void {
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if ((__as_bigint((__i64(__as_bigint(mask) & __as_bigint(expected)))) != __as_bigint((__i64(__as_bigint(mask) & __as_bigint(actual)))))) {
    UnityTestResultsFailBegin(lineNumber);
    UnityPrint(cptr_clone(UnityStrExpected));
    UnityPrintMask(__u64(__as_bigint(mask)), __u64(__as_bigint(expected)));
    UnityPrint(cptr_clone(UnityStrWas));
    UnityPrintMask(__u64(__as_bigint(mask)), __u64(__as_bigint(actual)));
    UnityAddMsgIfSpecified(cptr_clone(msg));
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
}

export function UnityAssertEqualNumber(expected: UNITY_INT, actual: UNITY_INT, msg: string, lineNumber: UNITY_UINT, style: UNITY_DISPLAY_STYLE_T): void {
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if ((__as_bigint(expected) != __as_bigint(actual))) {
    UnityTestResultsFailBegin(lineNumber);
    UnityPrint(cptr_clone(UnityStrExpected));
    UnityPrintNumberByStyle(expected, style);
    UnityPrint(cptr_clone(UnityStrWas));
    UnityPrintNumberByStyle(actual, style);
    UnityAddMsgIfSpecified(cptr_clone(msg));
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
}

export function UnityAssertGreaterOrLessOrEqualNumber(threshold: UNITY_INT, actual: UNITY_INT, compare: UNITY_COMPARISON_T, msg: string, lineNumber: UNITY_UINT, style: UNITY_DISPLAY_STYLE_T): void {
  let failed = 0;
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if ((((__as_bigint(threshold) == __as_bigint(actual)) && compare & UNITY_EQUAL_TO) ? 1 : 0)) {
    return;
  }
  if ((__as_bigint(threshold) == __as_bigint(actual))) {
    failed = 1;
  }
  if ((style & (16)) == (16)) {
    if ((((__as_bigint(actual) > __as_bigint(threshold)) && compare & UNITY_SMALLER_THAN) ? 1 : 0)) {
      failed = 1;
    }
    if ((((__as_bigint(actual) < __as_bigint(threshold)) && compare & UNITY_GREATER_THAN) ? 1 : 0)) {
      failed = 1;
    }
  } else {
    if ((((__as_bigint(__u64(__as_bigint(actual))) > __as_bigint(__u64(__as_bigint(threshold)))) && compare & UNITY_SMALLER_THAN) ? 1 : 0)) {
      failed = 1;
    }
    if ((((__as_bigint(__u64(__as_bigint(actual))) < __as_bigint(__u64(__as_bigint(threshold)))) && compare & UNITY_GREATER_THAN) ? 1 : 0)) {
      failed = 1;
    }
  }
  if (failed) {
    UnityTestResultsFailBegin(lineNumber);
    UnityPrint(cptr_clone(UnityStrExpected));
    UnityPrintNumberByStyle(actual, style);
    if (compare & UNITY_GREATER_THAN) {
      UnityPrint(cptr_clone(UnityStrGt));
    }
    if (compare & UNITY_SMALLER_THAN) {
      UnityPrint(cptr_clone(UnityStrLt));
    }
    if (compare & UNITY_EQUAL_TO) {
      UnityPrint(cptr_clone(UnityStrOrEqual));
    }
    UnityPrintNumberByStyle(threshold, style);
    UnityAddMsgIfSpecified(cptr_clone(msg));
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
}

export function UnityAssertEqualIntArray(expected: any | null, actual: any | null, num_elements: UNITY_UINT32, msg: string, lineNumber: UNITY_UINT, style: UNITY_DISPLAY_STYLE_T, flags: UNITY_FLAGS_T): void {
  let elements = num_elements;
  let length = ((style & 15) >>> 0);
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if (num_elements == 0) {
    {
      {
        UnityTestResultsFailBegin(lineNumber);
        UnityPrint(cptr_clone(UnityStrPointless));
        UnityAddMsgIfSpecified(cptr_clone(msg));
        {
          Unity.CurrentTestFailed = 1;
          throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
        }
      }
    }
  }
  if (cptr_eq(expected, actual)) {
    return;
  }
  if (UnityIsOneArrayNull(expected, actual, lineNumber, cptr_clone(msg))) {
    Unity.CurrentTestFailed = 1;
    throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
  }
  while (elements--) {
    let expect_val = 0;
    let actual_val = 0;
    switch (((length) >>> 0)) {
      case ((1) >>> 0):
      {
        expect_val = (expected).buf[(expected).off];
      actual_val = (actual).buf[(actual).off];
      break;
      }
      case ((2) >>> 0):
      {
        expect_val = cptr_read_int16((expected));
      actual_val = cptr_read_int16((actual));
      break;
      }
      case ((8) >>> 0):
      {
        expect_val = cptr_read_int64((expected));
      actual_val = cptr_read_int64((actual));
      break;
      }
      default:
      {
        expect_val = cptr_read_int32((expected));
      actual_val = cptr_read_int32((actual));
      length = ((4) >>> 0);
      break;
      }
    }
    if ((__as_bigint(expect_val) != __as_bigint(actual_val))) {
      if (((style & (32) && ((length) >>> 0) < 8) ? 1 : 0)) {
        let mask = 1;
        mask = __i64(__as_bigint((__i64(__as_bigint(mask) << __as_bigint((Math.imul(((8) >>> 0), ((length) >>> 0)) >>> 0))))) - __as_bigint(1));
        expect_val = __i64(__as_bigint(expect_val) & __as_bigint(mask));
        actual_val = __i64(__as_bigint(actual_val) & __as_bigint(mask));
      }
      UnityTestResultsFailBegin(lineNumber);
      UnityPrint(cptr_clone(UnityStrElement));
      UnityPrintNumberUnsigned(u32(u32(num_elements - elements) - 1));
      UnityPrint(cptr_clone(UnityStrExpected));
      UnityPrintNumberByStyle(expect_val, style);
      UnityPrint(cptr_clone(UnityStrWas));
      UnityPrintNumberByStyle(actual_val, style);
      UnityAddMsgIfSpecified(cptr_clone(msg));
      {
        {
          Unity.CurrentTestFailed = 1;
          throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
        }
      }
    }
    if (flags == UNITY_ARRAY_TO_ARRAY) {
      expected = ((cptr_offset((expected), ((length) >>> 0))));
    }
    actual = ((cptr_offset((actual), ((length) >>> 0))));
  }
}

function UnityFloatsWithin(delta: UNITY_FLOAT, expected: UNITY_FLOAT, actual: UNITY_FLOAT): number {
  let diff = 0.0;
  if (((((((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((expected))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((expected))) : _ldclass(((expected))))))) == 1) && ((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 1)) ? 1 : 0) && ((expected < 0) == (actual < 0))) ? 1 : 0)) {
    return 1;
  }
  if (((((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((expected))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((expected))) : _ldclass(((expected))))))) == 2) && ((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 2)) ? 1 : 0)) {
    return 1;
  }
  diff = Math.fround(actual - expected);
  if (diff < 0) {
    diff = -diff;
  }
  if (delta < 0) {
    delta = -delta;
  }
  return !(((((((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((diff))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((diff))) : _ldclass(((diff))))))) == 2) || ((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((diff))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((diff))) : _ldclass(((diff))))))) == 1)) ? 1 : 0) || (diff > delta)) ? 1 : 0));
}

export function UnityAssertEqualFloatArray(expected: UNITY_FLOAT | null, actual: UNITY_FLOAT | null, num_elements: UNITY_UINT32, msg: string, lineNumber: UNITY_UINT, flags: UNITY_FLAGS_T): void {
  let elements = num_elements;
  let ptr_expected = expected; /* &ref */
  let ptr_actual = actual; /* &ref */
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if (elements == 0) {
    {
      {
        UnityTestResultsFailBegin(lineNumber);
        UnityPrint(cptr_clone(UnityStrPointless));
        UnityAddMsgIfSpecified(cptr_clone(msg));
        {
          Unity.CurrentTestFailed = 1;
          throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
        }
      }
    }
  }
  if (cptr_eq(expected, actual)) {
    return;
  }
  if (UnityIsOneArrayNull((expected), (actual), lineNumber, cptr_clone(msg))) {
    Unity.CurrentTestFailed = 1;
    throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
  }
  while (elements--) {
    if (!UnityFloatsWithin(Math.fround(cptr_read_float32(ptr_expected) * (Math.fround(9.99999974E-6))), cptr_read_float32(ptr_expected), cptr_read_float32(ptr_actual))) {
      UnityTestResultsFailBegin(lineNumber);
      UnityPrint(cptr_clone(UnityStrElement));
      UnityPrintNumberUnsigned(u32(u32(num_elements - elements) - 1));
      {
        {
          UnityPrint(cptr_clone(UnityStrExpected));
          UnityPrintFloat((cptr_read_float32(ptr_expected)));
          UnityPrint(cptr_clone(UnityStrWas));
          UnityPrintFloat((cptr_read_float32(ptr_actual)));
        }
      }
      UnityAddMsgIfSpecified(cptr_clone(msg));
      {
        {
          Unity.CurrentTestFailed = 1;
          throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
        }
      }
    }
    if (flags == UNITY_ARRAY_TO_ARRAY) {
      (() => { const __v = ptr_expected; ptr_expected = cptr_offset(ptr_expected, 4); return __v; })();
    }
    (() => { const __v = ptr_actual; ptr_actual = cptr_offset(ptr_actual, 4); return __v; })();
  }
}

export function UnityAssertFloatsWithin(delta: UNITY_FLOAT, expected: UNITY_FLOAT, actual: UNITY_FLOAT, msg: string, lineNumber: UNITY_UINT): void {
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if (!UnityFloatsWithin(delta, expected, actual)) {
    UnityTestResultsFailBegin(lineNumber);
    {
      {
        UnityPrint(cptr_clone(UnityStrExpected));
        UnityPrintFloat((expected));
        UnityPrint(cptr_clone(UnityStrWas));
        UnityPrintFloat((actual));
      }
    }
    UnityAddMsgIfSpecified(cptr_clone(msg));
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
}

export function UnityAssertFloatSpecial(actual: UNITY_FLOAT, msg: string, lineNumber: UNITY_UINT, style: UNITY_FLOAT_TRAIT_T): void {
  let trait_names = [UnityStrInf, UnityStrNegInf, UnityStrNaN, UnityStrDet]; /* &ref */
  let should_be_trait = (__i64(__as_bigint(__i64(__as_bigint(style))) & __as_bigint(1)));
  let is_trait = !should_be_trait;
  let trait_index = __i64(__as_bigint((((style >> 1) | 0))));
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  switch (style) {
    case UNITY_FLOAT_IS_INF:
      case UNITY_FLOAT_IS_NOT_INF:
      {
        is_trait = ((((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 1) && (actual > 0)) ? 1 : 0);
    break;
      }
    case UNITY_FLOAT_IS_NEG_INF:
      case UNITY_FLOAT_IS_NOT_NEG_INF:
      {
        is_trait = ((((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 1) && (actual < 0)) ? 1 : 0);
    break;
      }
    case UNITY_FLOAT_IS_NAN:
      case UNITY_FLOAT_IS_NOT_NAN:
      {
        is_trait = (((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 2) ? 1 : 0);
    break;
      }
    case UNITY_FLOAT_IS_DET:
      case UNITY_FLOAT_IS_NOT_DET:
      {
        is_trait = ((!((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 1) && !((((((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((4 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 2)) ? 1 : 0);
    break;
      }
    default:
    {
      trait_index = 0;
    trait_names[0] = cptr_clone(UnityStrInvalidFloatTrait);
    break;
    }
  }
  if ((__as_bigint(is_trait) != __as_bigint(should_be_trait))) {
    UnityTestResultsFailBegin(lineNumber);
    UnityPrint(cptr_clone(UnityStrExpected));
    if (!should_be_trait) {
      UnityPrint(cptr_clone(UnityStrNot));
    }
    UnityPrint(cptr_clone(trait_names[trait_index]));
    UnityPrint(cptr_clone(UnityStrWas));
    UnityPrintFloat((actual));
    UnityAddMsgIfSpecified(cptr_clone(msg));
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
}

function UnityDoublesWithin(delta: UNITY_DOUBLE, expected: UNITY_DOUBLE, actual: UNITY_DOUBLE): number {
  let diff = 0.0;
  if (((((((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((expected))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((expected))) : _ldclass(((expected))))))) == 1) && ((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 1)) ? 1 : 0) && ((expected < 0) == (actual < 0))) ? 1 : 0)) {
    return 1;
  }
  if (((((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((expected))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((expected))) : _ldclass(((expected))))))) == 2) && ((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 2)) ? 1 : 0)) {
    return 1;
  }
  diff = actual - expected;
  if (diff < 0) {
    diff = -diff;
  }
  if (delta < 0) {
    delta = -delta;
  }
  return !(((((((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((diff))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((diff))) : _ldclass(((diff))))))) == 2) || ((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((diff))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((diff))) : _ldclass(((diff))))))) == 1)) ? 1 : 0) || (diff > delta)) ? 1 : 0));
}

export function UnityAssertEqualDoubleArray(expected: UNITY_DOUBLE | null, actual: UNITY_DOUBLE | null, num_elements: UNITY_UINT32, msg: string, lineNumber: UNITY_UINT, flags: UNITY_FLAGS_T): void {
  let elements = num_elements;
  let ptr_expected = expected; /* &ref */
  let ptr_actual = actual; /* &ref */
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if (elements == 0) {
    {
      {
        UnityTestResultsFailBegin(lineNumber);
        UnityPrint(cptr_clone(UnityStrPointless));
        UnityAddMsgIfSpecified(cptr_clone(msg));
        {
          Unity.CurrentTestFailed = 1;
          throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
        }
      }
    }
  }
  if (cptr_eq(expected, actual)) {
    return;
  }
  if (UnityIsOneArrayNull((expected), (actual), lineNumber, cptr_clone(msg))) {
    Unity.CurrentTestFailed = 1;
    throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
  }
  while (elements--) {
    if (!UnityDoublesWithin(cptr_read_float64(ptr_expected) * (9.9999999999999998E-13), cptr_read_float64(ptr_expected), cptr_read_float64(ptr_actual))) {
      UnityTestResultsFailBegin(lineNumber);
      UnityPrint(cptr_clone(UnityStrElement));
      UnityPrintNumberUnsigned(u32(u32(num_elements - elements) - 1));
      {
        {
          UnityPrint(cptr_clone(UnityStrExpected));
          UnityPrintFloat(cptr_read_float64(ptr_expected));
          UnityPrint(cptr_clone(UnityStrWas));
          UnityPrintFloat(cptr_read_float64(ptr_actual));
        }
      }
      UnityAddMsgIfSpecified(cptr_clone(msg));
      {
        {
          Unity.CurrentTestFailed = 1;
          throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
        }
      }
    }
    if (flags == UNITY_ARRAY_TO_ARRAY) {
      (() => { const __v = ptr_expected; ptr_expected = cptr_offset(ptr_expected, 8); return __v; })();
    }
    (() => { const __v = ptr_actual; ptr_actual = cptr_offset(ptr_actual, 8); return __v; })();
  }
}

export function UnityAssertDoublesWithin(delta: UNITY_DOUBLE, expected: UNITY_DOUBLE, actual: UNITY_DOUBLE, msg: string, lineNumber: UNITY_UINT): void {
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if (!UnityDoublesWithin(delta, expected, actual)) {
    UnityTestResultsFailBegin(lineNumber);
    {
      {
        UnityPrint(cptr_clone(UnityStrExpected));
        UnityPrintFloat(expected);
        UnityPrint(cptr_clone(UnityStrWas));
        UnityPrintFloat(actual);
      }
    }
    UnityAddMsgIfSpecified(cptr_clone(msg));
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
}

export function UnityAssertDoubleSpecial(actual: UNITY_DOUBLE, msg: string, lineNumber: UNITY_UINT, style: UNITY_FLOAT_TRAIT_T): void {
  let trait_names = [UnityStrInf, UnityStrNegInf, UnityStrNaN, UnityStrDet]; /* &ref */
  let should_be_trait = (__i64(__as_bigint(__i64(__as_bigint(style))) & __as_bigint(1)));
  let is_trait = !should_be_trait;
  let trait_index = __i64(__as_bigint((((style >> 1) | 0))));
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  switch (style) {
    case UNITY_FLOAT_IS_INF:
      case UNITY_FLOAT_IS_NOT_INF:
      {
        is_trait = ((((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 1) && (actual > 0)) ? 1 : 0);
    break;
      }
    case UNITY_FLOAT_IS_NEG_INF:
      case UNITY_FLOAT_IS_NOT_NEG_INF:
      {
        is_trait = ((((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 1) && (actual < 0)) ? 1 : 0);
    break;
      }
    case UNITY_FLOAT_IS_NAN:
      case UNITY_FLOAT_IS_NOT_NAN:
      {
        is_trait = (((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 2) ? 1 : 0);
    break;
      }
    case UNITY_FLOAT_IS_DET:
      case UNITY_FLOAT_IS_NOT_DET:
      {
        is_trait = ((!((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 1) && !((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((actual))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((actual))) : _ldclass(((actual))))))) == 2)) ? 1 : 0);
    break;
      }
    default:
    {
      trait_index = 0;
    trait_names[0] = cptr_clone(UnityStrInvalidFloatTrait);
    break;
    }
  }
  if ((__as_bigint(is_trait) != __as_bigint(should_be_trait))) {
    UnityTestResultsFailBegin(lineNumber);
    UnityPrint(cptr_clone(UnityStrExpected));
    if (!should_be_trait) {
      UnityPrint(cptr_clone(UnityStrNot));
    }
    UnityPrint(cptr_clone(trait_names[trait_index]));
    UnityPrint(cptr_clone(UnityStrWas));
    UnityPrintFloat(actual);
    UnityAddMsgIfSpecified(cptr_clone(msg));
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
}

export function UnityAssertNumbersWithin(delta: UNITY_UINT, expected: UNITY_INT, actual: UNITY_INT, msg: string, lineNumber: UNITY_UINT, style: UNITY_DISPLAY_STYLE_T): void {
  if (typeof expected === 'string') expected = cptr_from_string(expected);
  if (typeof actual === 'string') actual = cptr_from_string(actual);

  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if ((style & (16)) == (16)) {
    if ((__as_bigint(actual) > __as_bigint(expected))) {
      Unity.CurrentTestFailed = __u64(__as_bigint(((__as_bigint(__u64(__as_bigint((__i64(__as_bigint(actual) - __as_bigint(expected)))))) > __as_bigint(delta)))));
    } else {
      Unity.CurrentTestFailed = __u64(__as_bigint(((__as_bigint(__u64(__as_bigint((__i64(__as_bigint(expected) - __as_bigint(actual)))))) > __as_bigint(delta)))));
    }
  } else {
    if ((__as_bigint(__u64(__as_bigint(actual))) > __as_bigint(__u64(__as_bigint(expected))))) {
      Unity.CurrentTestFailed = __u64(__as_bigint(((__as_bigint(__u64(__as_bigint((__i64(__as_bigint(actual) - __as_bigint(expected)))))) > __as_bigint(delta)))));
    } else {
      Unity.CurrentTestFailed = __u64(__as_bigint(((__as_bigint(__u64(__as_bigint((__i64(__as_bigint(expected) - __as_bigint(actual)))))) > __as_bigint(delta)))));
    }
  }
  if (Unity.CurrentTestFailed) {
    UnityTestResultsFailBegin(lineNumber);
    UnityPrint(cptr_clone(UnityStrDelta));
    UnityPrintNumberByStyle(__i64(__as_bigint(delta)), style);
    UnityPrint(cptr_clone(UnityStrExpected));
    UnityPrintNumberByStyle(expected, style);
    UnityPrint(cptr_clone(UnityStrWas));
    UnityPrintNumberByStyle(actual, style);
    UnityAddMsgIfSpecified(cptr_clone(msg));
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
}

export function UnityAssertEqualString(expected: any, actual: any, msg: string, lineNumber: UNITY_UINT): void {
  if (typeof expected === 'string') expected = cptr_from_string(expected);
  if (typeof actual === 'string') actual = cptr_from_string(actual);

  let i = 0;
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if (((expected && actual) ? 1 : 0)) {
    for (i = 0; ((((expected.buf[(expected.off ?? 0) + i]) << 24 >> 24) || ((actual.buf[(actual.off ?? 0) + i]) << 24 >> 24)) ? 1 : 0); i++) {
      if (((expected.buf[(expected.off ?? 0) + i]) << 24 >> 24) != ((actual.buf[(actual.off ?? 0) + i]) << 24 >> 24)) {
        Unity.CurrentTestFailed = 1;
        break;
      }
    }
  } else {
    if (!cptr_eq(expected, actual)) {
      Unity.CurrentTestFailed = 1;
    }
  }
  if (Unity.CurrentTestFailed) {
    UnityTestResultsFailBegin(lineNumber);
    UnityPrintExpectedAndActualStrings(cptr_clone(expected), cptr_clone(actual));
    UnityAddMsgIfSpecified(cptr_clone(msg));
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
}

export function UnityAssertEqualStringLen(expected: any, actual: any, length: UNITY_UINT32, msg: string, lineNumber: UNITY_UINT): void {
  if (typeof expected === 'string') expected = cptr_from_string(expected);
  if (typeof actual === 'string') actual = cptr_from_string(actual);

  let i = 0;
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if (((expected && actual) ? 1 : 0)) {
    for (i = 0; (((i < length) && (((((expected.buf[(expected.off ?? 0) + i]) << 24 >> 24) || ((actual.buf[(actual.off ?? 0) + i]) << 24 >> 24)) ? 1 : 0))) ? 1 : 0); i++) {
      if (((expected.buf[(expected.off ?? 0) + i]) << 24 >> 24) != ((actual.buf[(actual.off ?? 0) + i]) << 24 >> 24)) {
        Unity.CurrentTestFailed = 1;
        break;
      }
    }
  } else {
    if (!cptr_eq(expected, actual)) {
      Unity.CurrentTestFailed = 1;
    }
  }
  if (Unity.CurrentTestFailed) {
    UnityTestResultsFailBegin(lineNumber);
    UnityPrintExpectedAndActualStringsLen(cptr_clone(expected), cptr_clone(actual), length);
    UnityAddMsgIfSpecified(cptr_clone(msg));
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
}

export function UnityAssertEqualStringArray(expected: any | null, actual: { value: string }, num_elements: UNITY_UINT32, msg: string, lineNumber: UNITY_UINT, flags: UNITY_FLAGS_T): void {
  let i = 0;
  let j = 0;
  let expd = null; /* &ref */
  let act = null; /* &ref */
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if (num_elements == 0) {
    {
      {
        UnityTestResultsFailBegin(lineNumber);
        UnityPrint(cptr_clone(UnityStrPointless));
        UnityAddMsgIfSpecified(cptr_clone(msg));
        {
          Unity.CurrentTestFailed = 1;
          throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
        }
      }
    }
  }
  if (cptr_eq((expected), (actual))) {
    return;
  }
  if (UnityIsOneArrayNull((expected), (actual), lineNumber, cptr_clone(msg))) {
    {
      {
        Unity.CurrentTestFailed = 1;
        throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
      }
    }
  }
  if (flags != UNITY_ARRAY_TO_ARRAY) {
    expd = (expected);
  }
  do {
    act = cptr_clone(cptr_read_ptr(actual, j));
    if (flags == UNITY_ARRAY_TO_ARRAY) {
      expd = cptr_clone(cptr_read_ptr(((expected)), j));
    }
    if (((expd && act) ? 1 : 0)) {
      for (i = 0; ((((expd.buf[(expd.off ?? 0) + i]) << 24 >> 24) || ((act.buf[(act.off ?? 0) + i]) << 24 >> 24)) ? 1 : 0); i++) {
        if (((expd.buf[(expd.off ?? 0) + i]) << 24 >> 24) != ((act.buf[(act.off ?? 0) + i]) << 24 >> 24)) {
          Unity.CurrentTestFailed = 1;
          break;
        }
      }
    } else {
      if (!cptr_eq(expd, act)) {
        Unity.CurrentTestFailed = 1;
      }
    }
    if (Unity.CurrentTestFailed) {
      UnityTestResultsFailBegin(lineNumber);
      if (num_elements > 1) {
        UnityPrint(cptr_clone(UnityStrElement));
        UnityPrintNumberUnsigned(j);
      }
      UnityPrintExpectedAndActualStrings(cptr_clone(expd), cptr_clone(act));
      UnityAddMsgIfSpecified(cptr_clone(msg));
      {
        {
          Unity.CurrentTestFailed = 1;
          throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
        }
      }
    }
  } while (++j < num_elements);
}

export function UnityAssertEqualMemory(expected: any | null, actual: any | null, length: UNITY_UINT32, num_elements: UNITY_UINT32, msg: string, lineNumber: UNITY_UINT, flags: UNITY_FLAGS_T): void {
  let ptr_exp = cptr_clone((expected)); /* &ref */
  let ptr_act = cptr_clone((actual)); /* &ref */
  let elements = num_elements;
  let bytes = 0;
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  if ((((elements == 0) || (length == 0)) ? 1 : 0)) {
    {
      {
        UnityTestResultsFailBegin(lineNumber);
        UnityPrint(cptr_clone(UnityStrPointless));
        UnityAddMsgIfSpecified(cptr_clone(msg));
        {
          Unity.CurrentTestFailed = 1;
          throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
        }
      }
    }
  }
  if (cptr_eq(expected, actual)) {
    return;
  }
  if (UnityIsOneArrayNull(expected, actual, lineNumber, cptr_clone(msg))) {
    Unity.CurrentTestFailed = 1;
    throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
  }
  while (elements--) {
    bytes = length;
    while (bytes--) {
      if (((ptr_exp.buf[ptr_exp.off]) & 0xFF) != ((ptr_act.buf[ptr_act.off]) & 0xFF)) {
        UnityTestResultsFailBegin(lineNumber);
        UnityPrint(cptr_clone(UnityStrMemory));
        if (num_elements > 1) {
          UnityPrint(cptr_clone(UnityStrElement));
          UnityPrintNumberUnsigned(u32(u32(num_elements - elements) - 1));
        }
        UnityPrint(cptr_clone(UnityStrByte));
        UnityPrintNumberUnsigned(u32(u32(length - bytes) - 1));
        UnityPrint(cptr_clone(UnityStrExpected));
        UnityPrintNumberByStyle(((ptr_exp.buf[ptr_exp.off]) & 0xFF), UNITY_DISPLAY_STYLE_HEX8);
        UnityPrint(cptr_clone(UnityStrWas));
        UnityPrintNumberByStyle(((ptr_act.buf[ptr_act.off]) & 0xFF), UNITY_DISPLAY_STYLE_HEX8);
        UnityAddMsgIfSpecified(cptr_clone(msg));
        {
          {
            Unity.CurrentTestFailed = 1;
            throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
          }
        }
      }
      ptr_exp.off++;
      ptr_act.off++;
    }
    if (flags == UNITY_ARRAY_TO_VAL) {
      ptr_exp = (expected);
    }
  }
}

let UnityQuickCompare = {};
export function UnityNumToPtr(num: UNITY_INT, size: UNITY_UINT8): any | null {
  switch (size) {
    case 1:
    {
      UnityQuickCompare.i8 = Number(BigInt.asIntN(32, __as_bigint(num)));
    return cptr_clone(((__field_ref_scalar(() => UnityQuickCompare, "(unnamed at tests/real-world/cjson/tests/unity/src/unity.c:1221:8)", "i8", 0))));
    }
    case 2:
    {
      UnityQuickCompare.i16 = Number(BigInt.asIntN(32, __as_bigint(num)));
    return cptr_clone(((__field_ref_scalar(() => UnityQuickCompare, "(unnamed at tests/real-world/cjson/tests/unity/src/unity.c:1221:8)", "i16", 0))));
    }
    case 8:
    {
      UnityQuickCompare.i64 = __i64(__as_bigint(num));
    return cptr_clone(((__field_ref_scalar(() => UnityQuickCompare, "(unnamed at tests/real-world/cjson/tests/unity/src/unity.c:1221:8)", "i64", 0))));
    }
    default:
    {
      UnityQuickCompare.i32 = Number(BigInt.asIntN(32, __as_bigint(num)));
    return cptr_clone(((__field_ref_scalar(() => UnityQuickCompare, "(unnamed at tests/real-world/cjson/tests/unity/src/unity.c:1221:8)", "i32", 0))));
    }
  }
}

export function UnityFloatToPtr(num: number): any | null {
  UnityQuickCompare.f = num;
  return cptr_clone(((__field_ref_scalar(() => UnityQuickCompare, "(unnamed at tests/real-world/cjson/tests/unity/src/unity.c:1221:8)", "f", 0))));
}

export function UnityDoubleToPtr(num: number): any | null {
  UnityQuickCompare.d = num;
  return cptr_clone(((__field_ref_scalar(() => UnityQuickCompare, "(unnamed at tests/real-world/cjson/tests/unity/src/unity.c:1221:8)", "d", 0))));
}

export function UnityFail(msg: any, line: UNITY_UINT): void {
  if (typeof msg === 'string') msg = cptr_from_string(msg);

  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  UnityTestResultsBegin(cptr_clone(Unity.TestFile), line);
  UnityPrint(cptr_clone(UnityStrFail));
  if (!cptr_eq(msg, (null))) {
    (putchar(58));
    if (Unity.CurrentDetail1) {
      UnityPrint(cptr_clone(UnityStrDetail1Name));
      UnityPrint(cptr_clone(Unity.CurrentDetail1));
      if (Unity.CurrentDetail2) {
        UnityPrint(cptr_clone(UnityStrDetail2Name));
        UnityPrint(cptr_clone(Unity.CurrentDetail2));
      }
      UnityPrint(cptr_clone(UnityStrSpacer));
    }
    if (((msg.buf[(msg.off ?? 0) + 0]) << 24 >> 24) != 32) {
      (putchar(32));
    }
    UnityPrint(cptr_clone(msg));
  }
  {
    Unity.CurrentTestFailed = 1;
    throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
  }
}

export function UnityIgnore(msg: string, line: UNITY_UINT): void {
  if (((Unity.CurrentTestFailed || Unity.CurrentTestIgnored) ? 1 : 0)) {
    return;
  }
  UnityTestResultsBegin(cptr_clone(Unity.TestFile), line);
  UnityPrint(cptr_clone(UnityStrIgnore));
  if (!cptr_eq(msg, (null))) {
    (putchar(58));
    (putchar(32));
    UnityPrint(cptr_clone(msg));
  }
  {
    Unity.CurrentTestIgnored = 1;
    throw new LongjmpException(((__v: number) => __v === 0 ? 1 : __v)(1), Unity.AbortFrame);
  }
}

export function UnityDefaultTestRun(Func: UnityTestFunction, FuncName: string, FuncLineNum: number): void {
  Unity.CurrentTestName = FuncName;
  Unity.CurrentTestLineNumber = __u64(__as_bigint(FuncLineNum));
  Unity.NumberOfTests++;
  {
    Unity.CurrentDetail1 = null;
    Unity.CurrentDetail2 = null;
  }
  let __setjmp_val_1 = 0;
  let __setjmp_val_2 = 0;
  __sj_1: while (true) { try {
  if (((Unity.AbortFrame = Unity.AbortFrame || {__jmp_buf: 1}, __setjmp_val_1) == 0)) {
    setUp();
    Func();
  }
  __sj_2: while (true) { try {
  if (((Unity.AbortFrame = Unity.AbortFrame || {__jmp_buf: 2}, __setjmp_val_2) == 0)) {
    tearDown();
  }
  UnityConcludeTest();
  break __sj_2; } catch (__e: any) { if (__e instanceof LongjmpException && __e.env === Unity.AbortFrame) { __setjmp_val_2 = __e.value; continue __sj_2; } throw __e; } }
  break __sj_1; } catch (__e: any) { if (__e instanceof LongjmpException && __e.env === Unity.AbortFrame) { __setjmp_val_1 = __e.value; continue __sj_1; } throw __e; } }
}

export function UnityBegin(filename: string): void {
  Unity.TestFile = filename;
  Unity.CurrentTestName = null;
  Unity.CurrentTestLineNumber = 0;
  Unity.NumberOfTests = 0;
  Unity.TestFailures = 0;
  Unity.TestIgnores = 0;
  Unity.CurrentTestFailed = 0;
  Unity.CurrentTestIgnored = 0;
  {
    Unity.CurrentDetail1 = null;
    Unity.CurrentDetail2 = null;
  }
}

export function UnityEnd(): number {
  (putchar(10));
  UnityPrint(cptr_clone(UnityStrBreaker));
  (putchar(10));
  UnityPrintNumber(__i64(__as_bigint((Unity.NumberOfTests))));
  UnityPrint(cptr_clone(UnityStrResultsTests));
  UnityPrintNumber(__i64(__as_bigint((Unity.TestFailures))));
  UnityPrint(cptr_clone(UnityStrResultsFailures));
  UnityPrintNumber(__i64(__as_bigint((Unity.TestIgnores))));
  UnityPrint(cptr_clone(UnityStrResultsIgnored));
  (putchar(10));
  if (Unity.TestFailures == 0) {
    UnityPrint(cptr_clone(UnityStrOk));
  } else {
    UnityPrint(cptr_clone(UnityStrFail));
  }
  (putchar(10));
  return (Number(BigInt.asIntN(32, __as_bigint((Unity.TestFailures)))) | 0);
}

