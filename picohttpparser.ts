function __builtin_unreachable(): never { throw new Error('__builtin_unreachable reached (C17 §6.5.2.2 UB)'); }
function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function _assert(_expr: any, _file: any, _line: any): void { const m = 'Assertion failed: ' + String(_expr); process.stderr.write(m + '\n'); throw new Error(m); }
function wcsnlen(s: any, n: number): number { if (s == null) return 0; const str = typeof s === 'string' ? s : (s?.buf ? cptr_to_string(s) : String(s)); return Math.min(str.length, n); }
const ENOENT = 2, EACCES = 13, EEXIST = 17, EINTR = 4, EAGAIN = 11, EBADF = 9, EPERM = 1, ENOMEM = 12, EINVAL = 22, ENOSYS = 38, ERANGE = 34, EDOM = 33, EILSEQ = 84, ENFILE = 23, EMFILE = 24, ENOTTY = 25, EBUSY = 16, ENOSPC = 28, EROFS = 30, EPIPE = 32, ECONNREFUSED = 111, EADDRINUSE = 98, ETIMEDOUT = 110, ECONNRESET = 104;
let errno = 0;
export class std_bitset { private _val: number; private _size: number;
  constructor(size: number, val: any = 0) { this._size = size; const raw = val instanceof std_bitset ? val.to_ulong() : Number(val); this._val = raw & ((1 << size) - 1); }
  count(): number { let n = this._val >>> 0, c = 0; while (n) { c += n & 1; n >>>= 1; } return c; }
  test(pos: number): boolean { return (this._val & (1 << pos)) !== 0; }
  set(pos?: number, val = true) { if (pos !== undefined) { if (val) this._val |= (1 << pos); else this._val &= ~(1 << pos); } else this._val = (1 << this._size) - 1; return this; }
  reset(pos?: number) { if (pos !== undefined) this._val &= ~(1 << pos); else this._val = 0; return this; }
  flip(pos?: number) { if (pos !== undefined) this._val ^= (1 << pos); else this._val = ~this._val & ((1 << this._size) - 1); return this; }
  to_string(): string { return this._val.toString(2).padStart(this._size, '0'); }
  to_ulong(): number { return this._val; }
  to_ullong(): number { return this._val; }
  size(): number { return this._size; }
  any(): boolean { return this._val !== 0; }
  none(): boolean { return this._val === 0; }
  all(): boolean { return this._val === ((1 << this._size) - 1); }
}
function assert(expr: any, msg?: string): void { if (!expr) { const m = 'Assertion failed' + (msg ? ': ' + msg : ''); process.stderr.write(m + '\n'); throw new Error(m); } }
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
// C++20 iterator helpers — shared by <algorithm> / <numeric>.
// Lowering: `v.begin()` to `v.values()` (C++20 §22.3.11). We patch
// Array.prototype.values once so the returned iterator carries __arr/__pos and
// coerces to its position via valueOf, so iterator arithmetic expressions like
// `it - v.begin()` (from std::distance lowerings) evaluate to a position index
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
// within the same range. Lowering: it == v.end() and similar
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
function min(a: any, b?: any, comp?: Function): any { if (b === undefined) { if (Array.isArray(a)) return a.reduce((m, x) => x < m ? x : m, a[0]); return a; } const lt = comp ?? ((x: any, y: any) => x < y); return lt(b, a) ? b : a; }
function memmove(dst: any, src: any, n: number): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
  if (typeof src === 'string') src = cptr_from_string(src);
 if (dst?.buf && src?.buf) { const tmp = new Uint8Array(n); for (let i = 0; i < n; i++) tmp[i] = src.buf[src.off + i] ?? 0; for (let i = 0; i < n; i++) dst.buf[dst.off + i] = tmp[i]; return dst; } if (Array.isArray(dst) && Array.isArray(src)) { const tmp = src.slice(0, n); for (let i = 0; i < n; i++) dst[i] = tmp[i]; } else if (typeof dst === 'object' && typeof src === 'object') Object.assign(dst, src); return dst; }
function __builtin_expect(x: any, v: any): any { return x; }
function strnlen(s: any, maxlen: number): number {
  if (typeof s === 'string') s = cptr_from_string(s);
 if (s == null) return 0; if (typeof s === 'string') return Math.min(s.length, maxlen); if (s?.buf) { let i = 0; while (i < maxlen && (s.buf[s.off + i] ?? 0) !== 0) i++; return i; } if (Array.isArray(s)) { let i = 0; while (i < maxlen && s[i] !== 0 && s[i] !== undefined) i++; return i; } return 0; }
function max(a: any, b?: any, comp?: Function): any { if (b === undefined) { if (Array.isArray(a)) return a.reduce((m, x) => x > m ? x : m, a[0]); return a; } const lt = comp ?? ((x: any, y: any) => x < y); return lt(a, b) ? b : a; }
function trunc(x: number): number { return Math.trunc(x); }
function unique(first: any, last: any, pred?: Function): any { const A = __cpp_arr(first, last); const eq = pred ?? ((a: any, b: any) => a === b); if (A.end <= A.start) return __cpp_iter(A.arr, A.start); let w = A.start + 1; for (let i = A.start + 1; i < A.end; i++) if (!eq(A.arr[w - 1], A.arr[i])) A.arr[w++] = A.arr[i]; return __cpp_iter(A.arr, w); }
/* stdbool: true/false are native in TypeScript */
/* ═══════════════════════════════════════════════
 * TRANSLATOR DIAGNOSTICS
 * ═══════════════════════════════════════════════
 * One entry per unique (kind, reason). See emitter.diagnostics
 * for the full list with all source locations.
 *
 * ── ERRORS (1) ──
 *   [unsupported] [x2]
 *     inline assembly is platform-specific and cannot be translated to TypeScript: (asm template not exposed in AST)
 *
 * ── WARNINGS (1) ──
 *   [unsupported-x86-sse-intrinsic]
 *     x86 SSE intrinsic (_mm_*) — vendor-specific 128-bit vector op (xmmintrin.h / emmintrin.h family); no portable JS analogue, requires manual SIMD or scalar-fallback rewrite
 *
 * ═══════════════════════════════════════════════ */
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

function __field_ref_scalar(getOwner: () => any, ownerType: string, fieldName: string, fieldOffset: number): any {
  let _buf: Uint8Array | null = null;
  let _view: DataView | null = null;
  let _proxy: any = null;
  function _width(): number {
    const o = getOwner(); if (!o || !o.constructor) return 4;
    const ft: string[] | undefined = (o.constructor as any).__fieldTypes;
    const fn: string[] | undefined = (o.constructor as any).__fieldNames;
    if (!ft || !fn) return 4;
    const i = fn.indexOf(fieldName); if (i < 0) return 4;
    const t = ft[i] || '';
    if (/int8|uint8|^char$|^bool$|bytes/.test(t)) return 1;
    if (/int16|uint16|short/.test(t)) return 2;
    if (/int64|uint64|long\s*long|double/.test(t)) return 8;
    return 4;
  }
  function _ensureBuf(): void {
    if (_buf != null) return;
    const w = _width();
    _buf = new Uint8Array(w);
    _view = new DataView(_buf.buffer);
    const v = (getOwner() as any)?.[fieldName];
    if (w === 1) _buf[0] = (Number(v) | 0) & 0xFF;
    else if (w === 2) _view.setUint16(0, Number(v ?? 0) & 0xFFFF, true);
    else if (w === 4) _view.setUint32(0, (Number(v ?? 0)) >>> 0, true);
    else { const bv = typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); _view.setBigUint64(0, BigInt.asUintN(64, bv), true); }
  }
  function _unpack(): void {
    if (_buf == null || _view == null) return;
    const w = _width(); let nv: any;
    if (w === 1) nv = _buf[0];
    else if (w === 2) nv = _view.getUint16(0, true);
    else if (w === 4) nv = _view.getUint32(0, true);
    else nv = _view.getBigUint64(0, true);
    (getOwner() as any)[fieldName] = nv;
  }
  return {
    __field_ref: true,
    __owner_type: ownerType, __field_name: fieldName,
    __field_offset: fieldOffset, __byte_delta: 0,
    off: 0,
    get __owner() { return getOwner(); },
    get value() { return getOwner()[fieldName]; },
    set value(v: any) { getOwner()[fieldName] = v; },
    get buf() {
      _ensureBuf();
      if (_proxy == null) {
        _proxy = new Proxy(_buf!, {
          get(t, p) { return (t as any)[p]; },
          set(t, p, v) {
            const isIdx = typeof p === 'string' && /^\d+$/.test(p);
            (t as any)[p] = isIdx ? (Number(v) & 0xFF) : v;
            if (isIdx) _unpack();
            return true;
          },
        });
      }
      return _proxy;
    },
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
function container_of(p: any, _T: any, _member: any): any {
  if (p == null) return null;
  if (p.__field_ref === true) return p.__owner;
  return p; /* best-effort identity; UB per C17 §6.3.2.3 p7 */
}

// BRIDGE: c-out-pointer alias — C17 §6.5.3.2 + §6.7.6.1; structurally `{ value: T }`.
type COutParam<T> = { value: T };

// Static local variables
let _static_ranges_0: string = "\x00 \"\"(),,//:@[]{\xFF";
let _static_ranges2_1: string = "\x00 \x7F\x7F";

function __debugbreak(): void {
  ((): never => { throw new Error("inline asm not supported in TS translation: (asm template not exposed in AST)"); })() /* BRIDGE: c-inline-asm — GCC manual "Extended Asm" */;
}

function __fastfail(_Code: number): void {
  ((): never => { throw new Error("inline asm not supported in TS translation: (asm template not exposed in AST)"); })() /* BRIDGE: c-inline-asm — GCC manual "Extended Asm" */;
  (() => { throw new Error("__builtin_unreachable reached"); })();
}

type rsize_t = number;
type wctype_t = number;
type errno_t = number;
type __time32_t = number;
type __time64_t = number;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class localeinfo_struct {
  locinfo: any;
  mbcinfo: any;
  constructor() {
    this.locinfo = undefined;
    this.mbcinfo = undefined;
  }
}
const _locale_tstruct = localeinfo_struct;
type _locale_tstruct = localeinfo_struct;
(localeinfo_struct as any).__fieldTypes = ["int32","int32"];
(localeinfo_struct as any).__fieldNames = ["locinfo","mbcinfo"];
(localeinfo_struct as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class tagLC_ID {
  wLanguage: number;
  wCountry: number;
  wCodePage: number;
  constructor() {
    this.wLanguage = 0;
    this.wCountry = 0;
    this.wCodePage = 0;
  }
}
const LC_ID = tagLC_ID;
type LC_ID = tagLC_ID;
(tagLC_ID as any).__fieldTypes = ["int16","int16","int16"];
(tagLC_ID as any).__fieldNames = ["wLanguage","wCountry","wCodePage"];
(tagLC_ID as any).__fieldOffsets = [0,2,4];

type LPLC_ID = any | null;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class threadlocaleinfostruct {
  _locale_pctype: number | null;
  _locale_mb_cur_max: number;
  _locale_lc_codepage: number;
  constructor() {
    this._locale_pctype = null;
    this._locale_mb_cur_max = 0;
    this._locale_lc_codepage = 0;
  }
}
const threadlocinfo = threadlocaleinfostruct;
type threadlocinfo = threadlocaleinfostruct;
(threadlocaleinfostruct as any).__fieldTypes = ["int64","int32","int32"];
(threadlocaleinfostruct as any).__fieldNames = ["_locale_pctype","_locale_mb_cur_max","_locale_lc_codepage"];
(threadlocaleinfostruct as any).__fieldOffsets = [0,8,12];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class max_align_t {
  __max_align_ll: number;
  __max_align_ld: number;
  constructor() {
    this.__max_align_ll = 0;
    this.__max_align_ld = 0.0;
  }
}
(max_align_t as any).__fieldTypes = ["int64","double"];
(max_align_t as any).__fieldNames = ["__max_align_ll","__max_align_ld"];
(max_align_t as any).__fieldOffsets = [0,16];

export function strnlen_s(_src: any, _count: number): number {
  return (_src ? strnlen(cptr_clone(_src), ((_count) >>> 0)) : ((0) >>> 0));
}

export function wcsnlen_s(_src: number | null, _count: number): number {
  return (_src ? wcsnlen(_src, ((_count) >>> 0)) : ((0) >>> 0));
}

type int_least8_t = number;
type uint_least8_t = number;
type int_least16_t = number;
type uint_least16_t = number;
type int_least32_t = number;
type uint_least32_t = number;
type int_least64_t = number;
type uint_least64_t = number;
type int_fast8_t = number;
type uint_fast8_t = number;
type int_fast16_t = number;
type uint_fast16_t = number;
type int_fast32_t = number;
type uint_fast32_t = number;
type int_fast64_t = number;
type uint_fast64_t = number;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class phr_header {
  name: string;
  name_len: number;
  value: string;
  value_len: number;
  constructor() {
    this.name = null;
    this.name_len = 0;
    this.value = null;
    this.value_len = 0;
  }
}
(phr_header as any).__fieldTypes = ["int64","int64","int64","int64"];
(phr_header as any).__fieldNames = ["name","name_len","value","value_len"];
(phr_header as any).__fieldOffsets = [0,8,16,24];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class phr_chunked_decoder {
  bytes_left_in_chunk: number;
  consume_trailer: number;
  _hex_count: number;
  _state: number;
  _total_read: number;
  _total_overhead: number;
  constructor() {
    this.bytes_left_in_chunk = 0;
    this.consume_trailer = 0;
    this._hex_count = 0;
    this._state = 0;
    this._total_read = 0;
    this._total_overhead = 0;
  }
}
(phr_chunked_decoder as any).__fieldTypes = ["int64","int8","int8","int8","int64","int64"];
(phr_chunked_decoder as any).__fieldNames = ["bytes_left_in_chunk","consume_trailer","_hex_count","_state","_total_read","_total_overhead"];
(phr_chunked_decoder as any).__fieldOffsets = [0,8,9,10,16,24];

const token_char_map = cptr_clone("\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x01\x01\x01\x01\x01\x00\x00\x01\x01\x00\x01\x01\x00\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x00\x00\x00\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"); /* &ref */
// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: found.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
function findchar_fast(buf: any, buf_end: any, ranges: any, ranges_size: number, found: COutParam<number>): any {
  (() => { const __p: any = (found); const __v: any = (0); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
  (buf_end);
  (ranges);
  (((ranges_size) >>> 0));
  return cptr_clone(buf);
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: token, token_len, ret.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
function get_token_to_eol(buf: any, buf_end: any, token: COutParam<CPtr>, token_len: COutParam<number>, ret: COutParam<number>): any {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  let token_start: CPtr = null;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      token_start = cptr_clone(cptr_clone(buf)); /* &ref */
      _state = 3; continue _sm; /* enter lifted loop */
      _state = 4; continue _sm; /* post-ancestor continuation */
    case 3: /* lifted-loop reentry */
      if (!(__builtin_expect((!(!((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(buf_end, buf) >= 8 ? 1 : 0)) ? 1 : 0) ? 1 : 0), 1))) { _state = 4; continue _sm; }
      do {
        if (__builtin_expect((!(!((!((u32(((((Math.trunc(+((((buf.buf[buf.off])) << 24 >> 24)))) & 0xFF)) >>> 0) - 32) < 95 ? 1 : 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) {
          _state = 1; continue _sm; /* goto NonPrintable */
        }
        ++buf.off;
      } while (0);
      do {
        if (__builtin_expect((!(!((!((u32(((((Math.trunc(+((((buf.buf[buf.off])) << 24 >> 24)))) & 0xFF)) >>> 0) - 32) < 95 ? 1 : 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) {
          _state = 1; continue _sm; /* goto NonPrintable */
        }
        ++buf.off;
      } while (0);
      do {
        if (__builtin_expect((!(!((!((u32(((((Math.trunc(+((((buf.buf[buf.off])) << 24 >> 24)))) & 0xFF)) >>> 0) - 32) < 95 ? 1 : 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) {
          _state = 1; continue _sm; /* goto NonPrintable */
        }
        ++buf.off;
      } while (0);
      do {
        if (__builtin_expect((!(!((!((u32(((((Math.trunc(+((((buf.buf[buf.off])) << 24 >> 24)))) & 0xFF)) >>> 0) - 32) < 95 ? 1 : 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) {
          _state = 1; continue _sm; /* goto NonPrintable */
        }
        ++buf.off;
      } while (0);
      do {
        if (__builtin_expect((!(!((!((u32(((((Math.trunc(+((((buf.buf[buf.off])) << 24 >> 24)))) & 0xFF)) >>> 0) - 32) < 95 ? 1 : 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) {
          _state = 1; continue _sm; /* goto NonPrintable */
        }
        ++buf.off;
      } while (0);
      do {
        if (__builtin_expect((!(!((!((u32(((((Math.trunc(+((((buf.buf[buf.off])) << 24 >> 24)))) & 0xFF)) >>> 0) - 32) < 95 ? 1 : 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) {
          _state = 1; continue _sm; /* goto NonPrintable */
        }
        ++buf.off;
      } while (0);
      do {
        if (__builtin_expect((!(!((!((u32(((((Math.trunc(+((((buf.buf[buf.off])) << 24 >> 24)))) & 0xFF)) >>> 0) - 32) < 95 ? 1 : 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) {
          _state = 1; continue _sm; /* goto NonPrintable */
        }
        ++buf.off;
      } while (0);
      do {
        if (__builtin_expect((!(!((!((u32(((((Math.trunc(+((((buf.buf[buf.off])) << 24 >> 24)))) & 0xFF)) >>> 0) - 32) < 95 ? 1 : 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) {
          _state = 1; continue _sm; /* goto NonPrintable */
        }
        ++buf.off;
      } while (0);
      _state = 3; continue _sm; /* lifted-loop reentry */
      _state = 1; continue _sm; /* fall into NonPrintable (hoisted) */
      _state = 3; continue _sm; /* lifted-loop fallthrough */
    case 1: /* NonPrintable (hoisted) */
      do {
        if ((((((__builtin_expect((!(!((((Math.trunc(+(((buf.buf[buf.off]) << 24 >> 24)))) & 0xFF) < 32 ? 1 : 0)) ? 1 : 0) ? 1 : 0), 1) && __builtin_expect((!(!((((buf.buf[buf.off]) << 24 >> 24) != 9 ? 1 : 0)) ? 1 : 0) ? 1 : 0), 1)) ? 1 : 0)) || __builtin_expect((!(!((((buf.buf[buf.off]) << 24 >> 24) == 127 ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) ? 1 : 0)) {
          _state = 2; continue _sm; /* goto FOUND_CTL */
        }
        ++buf.off;
      } while (false);
      _state = 4; continue _sm; /* post-ancestor continuation */
    case 4: /* post-ancestor continuation */
      for (; ; ++buf.off) {
        if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
          (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
          return null;
        }
        if (__builtin_expect((!(!((!((u32(((((Math.trunc(+((((buf.buf[buf.off])) << 24 >> 24)))) & 0xFF)) >>> 0) - 32) < 95 ? 1 : 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) {
          if ((((((__builtin_expect((!(!((((Math.trunc(+(((buf.buf[buf.off]) << 24 >> 24)))) & 0xFF) < 32 ? 1 : 0)) ? 1 : 0) ? 1 : 0), 1) && __builtin_expect((!(!((((buf.buf[buf.off]) << 24 >> 24) != 9 ? 1 : 0)) ? 1 : 0) ? 1 : 0), 1)) ? 1 : 0)) || __builtin_expect((!(!((((buf.buf[buf.off]) << 24 >> 24) == 127 ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) ? 1 : 0)) {
            _state = 2; continue _sm; /* goto FOUND_CTL */
          }
        }
      }
    case 2: /* FOUND_CTL */
      if (__builtin_expect((!(!((((buf.buf[buf.off]) << 24 >> 24) == 13 ? 1 : 0)) ? 1 : 0) ? 1 : 0), 1)) {
        ++buf.off;
        if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
          (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
          return null;
        }
        if (((((buf.buf[buf.off++])) << 24 >> 24) != 10 ? 1 : 0)) {
          (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
          return null;
        }
        token_len.value = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(cptr_offset(buf, -(2)), token_start)) >>> 0);
      } else {
        if ((((buf.buf[buf.off]) << 24 >> 24) == 10 ? 1 : 0)) {
          token_len.value = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(buf, token_start)) >>> 0);
          ++buf.off;
        } else {
          (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
          return null;
        }
      }
      token.value = token_start;
      return cptr_clone(buf);
      break _sm;
      break _sm;
    }
  }
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: ret.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
function is_complete(buf: any, buf_end: any, last_len: number, ret: COutParam<number>): any {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  let ret_cnt = 0;
  buf = ((((last_len) >>> 0) < ((3) >>> 0) ? 1 : 0) ? buf : cptr_offset(cptr_offset(buf, ((last_len) >>> 0)), -(3)));
  while (1) {
    if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
    if ((((buf.buf[buf.off]) << 24 >> 24) == 13 ? 1 : 0)) {
      ++buf.off;
      if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
        (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
        return null;
      }
      if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
        (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
        return null;
      }
      if (((((buf.buf[buf.off++])) << 24 >> 24) != 10 ? 1 : 0)) {
        (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
        return null;
      }
      ++ret_cnt;
    } else {
      if ((((buf.buf[buf.off]) << 24 >> 24) == 10 ? 1 : 0)) {
        ++buf.off;
        ++ret_cnt;
      } else {
        ++buf.off;
        ret_cnt = 0;
      }
    }
    if ((ret_cnt == 2 ? 1 : 0)) {
      return cptr_clone(buf);
    }
  }
  (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
  return null;
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: token, token_len, ret.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
function parse_token(buf: any, buf_end: any, token: COutParam<CPtr>, token_len: COutParam<number>, next_char: number, ret: COutParam<number>): any {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  /* BRIDGE: _Alignas(16) — C11 §6.7.5 alignment requirement; JS naturally satisfies fundamental alignments (≤8 bytes), over-alignment must be enforced via alloy_aligned_alloc / SIMD-aware path */
  let buf_start = cptr_clone(cptr_clone(buf)); /* &ref */
  let found_box = { value: 0 };
  buf = findchar_fast(cptr_clone(buf), cptr_clone(buf_end), cptr_clone(_static_ranges_0), 17 - 1, found_box);
  if ((!found_box.value ? 1 : 0)) {
    if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
  }
  while (1) {
    if ((((buf.buf[buf.off]) << 24 >> 24) == ((next_char) << 24 >> 24) ? 1 : 0)) {
      break;
    } else {
      if ((!((token_char_map.buf[(token_char_map.off ?? 0) + ((Math.trunc(+(((buf.buf[buf.off]) << 24 >> 24)))) & 0xFF)]) << 24 >> 24) ? 1 : 0)) {
        (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
        return null;
      }
    }
    ++buf.off;
    if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
  }
  token.value = buf_start;
  token_len.value = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(buf, buf_start)) >>> 0);
  return cptr_clone(buf);
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: minor_version, ret.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
function parse_http_version(buf: any, buf_end: any, minor_version: COutParam<number>, ret: COutParam<number>): any {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  if ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(buf_end, buf) < 9 ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  if (((((buf.buf[buf.off++])) << 24 >> 24) != 72 ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  if (((((buf.buf[buf.off++])) << 24 >> 24) != 84 ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  if (((((buf.buf[buf.off++])) << 24 >> 24) != 84 ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  if (((((buf.buf[buf.off++])) << 24 >> 24) != 80 ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  if (((((buf.buf[buf.off++])) << 24 >> 24) != 47 ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  if (((((buf.buf[buf.off++])) << 24 >> 24) != 49 ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  if (((((buf.buf[buf.off++])) << 24 >> 24) != 46 ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  if ((((((buf.buf[buf.off]) << 24 >> 24) < 48 ? 1 : 0) || (57 < ((buf.buf[buf.off]) << 24 >> 24) ? 1 : 0)) ? 1 : 0)) {
    buf.off++;
    (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  (() => { const __p: any = (minor_version); const __v: any = (Math.imul((1), (i32((((buf.buf[buf.off++])) << 24 >> 24) - 48)))); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
  return cptr_clone(buf);
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: num_headers, ret.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
function parse_headers(buf: any, buf_end: any, headers: phr_header | null, num_headers: COutParam<number>, max_headers: number, ret: COutParam<number>): any {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  for (; ; (num_headers.value += 1, num_headers.value)) {
    if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
    if ((((buf.buf[buf.off]) << 24 >> 24) == 13 ? 1 : 0)) {
      ++buf.off;
      if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
        (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
        return null;
      }
      if (((((buf.buf[buf.off++])) << 24 >> 24) != 10 ? 1 : 0)) {
        (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
        return null;
      }
      break;
    } else {
      if ((((buf.buf[buf.off]) << 24 >> 24) == 10 ? 1 : 0)) {
        ++buf.off;
        break;
      }
    }
    if ((((num_headers.value) >>> 0) == ((max_headers) >>> 0) ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
    if ((!((((((num_headers.value) >>> 0) != ((0) >>> 0) ? 1 : 0) && ((((((buf.buf[buf.off]) << 24 >> 24) == 32 ? 1 : 0) || (((buf.buf[buf.off]) << 24 >> 24) == 9 ? 1 : 0)) ? 1 : 0))) ? 1 : 0)) ? 1 : 0)) {
      if ((cptr_eq((buf = parse_token(cptr_clone(buf), cptr_clone(buf_end), __field_ref_scalar(() => __struct_ptr_at(headers, ((num_headers.value) >>> 0)), "phr_header", "name", 0), __field_ref_scalar(() => __struct_ptr_at(headers, ((num_headers.value) >>> 0)), "phr_header", "name_len", 8), ((58) << 24 >> 24), ret)), (null)) ? 1 : 0)) {
        return null;
      }
      if ((((__struct_ptr_at(headers, ((num_headers.value) >>> 0)).name_len) >>> 0) == ((0) >>> 0) ? 1 : 0)) {
        (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
        return null;
      }
      ++buf.off;
      for (; ; ++buf.off) {
        if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
          (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
          return null;
        }
        if ((!((((((buf.buf[buf.off]) << 24 >> 24) == 32 ? 1 : 0) || (((buf.buf[buf.off]) << 24 >> 24) == 9 ? 1 : 0)) ? 1 : 0)) ? 1 : 0)) {
          break;
        }
      }
    } else {
      __struct_ptr_at(headers, ((num_headers.value) >>> 0)).name = null;
      __struct_ptr_at(headers, ((num_headers.value) >>> 0)).name_len = ((0) >>> 0);
    }
    let value = null;
    let value_len_box = { value: 0 };
    if ((cptr_eq((buf = (() => { const _box0 = { value: value }; const _r = get_token_to_eol(cptr_clone(buf), cptr_clone(buf_end), _box0, value_len_box, ret); value = _box0.value; return _r; })()), (null)) ? 1 : 0)) {
      return null;
    }
    let value_end = cptr_offset(value, ((value_len_box.value) >>> 0)); /* &ref */
    for (; (!cptr_eq(value_end, value) ? 1 : 0); --value_end.off) {
      let c = (((cptr_offset(value_end, -(1))).buf[(cptr_offset(value_end, -(1))).off]) << 24 >> 24);
      if ((!((((((c) << 24 >> 24) == 32 ? 1 : 0) || (((c) << 24 >> 24) == 9 ? 1 : 0)) ? 1 : 0)) ? 1 : 0)) {
        break;
      }
    }
    __struct_ptr_at(headers, ((num_headers.value) >>> 0)).value = value;
    __struct_ptr_at(headers, ((num_headers.value) >>> 0)).value_len = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(value_end, value)) >>> 0);
  }
  return cptr_clone(buf);
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: method, method_len, path, path_len, minor_version, num_headers, ret.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
function parse_request(buf: any, buf_end: any, method: COutParam<CPtr>, method_len: COutParam<number>, path: COutParam<CPtr>, path_len: COutParam<number>, minor_version: COutParam<number>, headers: phr_header | null, num_headers: COutParam<number>, max_headers: number, ret: COutParam<number>): any {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  if ((((buf.buf[buf.off]) << 24 >> 24) == 13 ? 1 : 0)) {
    ++buf.off;
    if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
    if (((((buf.buf[buf.off++])) << 24 >> 24) != 10 ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
  } else {
    if ((((buf.buf[buf.off]) << 24 >> 24) == 10 ? 1 : 0)) {
      ++buf.off;
    }
  }
  if ((cptr_eq((buf = parse_token(cptr_clone(buf), cptr_clone(buf_end), method, method_len, ((32) << 24 >> 24), ret)), (null)) ? 1 : 0)) {
    return null;
  }
  do {
    ++buf.off;
    if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
  } while ((((buf.buf[buf.off]) << 24 >> 24) == 32 ? 1 : 0));
  do {
    let tok_start = cptr_clone(cptr_clone(buf)); /* &ref */
    /* BRIDGE: _Alignas(16) — C11 §6.7.5 alignment requirement; JS naturally satisfies fundamental alignments (≤8 bytes), over-alignment must be enforced via alloy_aligned_alloc / SIMD-aware path */
    let found2_box = { value: 0 };
    buf = findchar_fast(cptr_clone(buf), cptr_clone(buf_end), cptr_clone(_static_ranges2_1), ((4) >>> 0), found2_box);
    if ((!found2_box.value ? 1 : 0)) {
      if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
        (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
        return null;
      }
    }
    while (1) {
      if ((((buf.buf[buf.off]) << 24 >> 24) == 32 ? 1 : 0)) {
        break;
      } else {
        if (__builtin_expect((!(!((!((u32(((((Math.trunc(+((((buf.buf[buf.off])) << 24 >> 24)))) & 0xFF)) >>> 0) - 32) < 95 ? 1 : 0)) ? 1 : 0)) ? 1 : 0) ? 1 : 0), 0)) {
          if ((((((Math.trunc(+(((buf.buf[buf.off]) << 24 >> 24)))) & 0xFF) < 32 ? 1 : 0) || (((buf.buf[buf.off]) << 24 >> 24) == 127 ? 1 : 0)) ? 1 : 0)) {
            (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
            return null;
          }
        }
      }
      ++buf.off;
      if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
        (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
        return null;
      }
    }
    path.value = tok_start;
    path_len.value = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(buf, tok_start)) >>> 0);
  } while (0);
  do {
    ++buf.off;
    if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
  } while ((((buf.buf[buf.off]) << 24 >> 24) == 32 ? 1 : 0));
  if ((((((method_len.value) >>> 0) == ((0) >>> 0) ? 1 : 0) || (((path_len.value) >>> 0) == ((0) >>> 0) ? 1 : 0)) ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  if ((cptr_eq((buf = parse_http_version(cptr_clone(buf), cptr_clone(buf_end), minor_version, ret)), (null)) ? 1 : 0)) {
    return null;
  }
  if ((((buf.buf[buf.off]) << 24 >> 24) == 13 ? 1 : 0)) {
    ++buf.off;
    if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
    if (((((buf.buf[buf.off++])) << 24 >> 24) != 10 ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
  } else {
    if ((((buf.buf[buf.off]) << 24 >> 24) == 10 ? 1 : 0)) {
      ++buf.off;
    } else {
      (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
  }
  return cptr_clone(parse_headers(cptr_clone(buf), cptr_clone(buf_end), headers, num_headers, ((max_headers) >>> 0), ret));
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: method, method_len, path, path_len, minor_version, num_headers.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
export function phr_parse_request(buf_start: any, len: number, method: COutParam<CPtr>, method_len: COutParam<number>, path: COutParam<CPtr>, path_len: COutParam<number>, minor_version: COutParam<number>, headers: phr_header | null, num_headers: COutParam<number>, last_len: number): number {
  let buf = cptr_clone(cptr_clone(buf_start)); /* &ref */
  let buf_end = cptr_offset(buf_start, ((len) >>> 0)); /* &ref */
  let max_headers = ((num_headers.value) >>> 0);
  let r_box = { value: 0 };
  method.value = null;
  method_len.value = ((0) >>> 0);
  path.value = null;
  path_len.value = ((0) >>> 0);
  (() => { const __p: any = (minor_version); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
  num_headers.value = ((0) >>> 0);
  if ((((((last_len) >>> 0) != ((0) >>> 0) ? 1 : 0) && (cptr_eq(is_complete(cptr_clone(buf), cptr_clone(buf_end), ((last_len) >>> 0), r_box), (null)) ? 1 : 0)) ? 1 : 0)) {
    return r_box.value;
  }
  if ((cptr_eq((buf = parse_request(cptr_clone(buf), cptr_clone(buf_end), method, method_len, path, path_len, minor_version, headers, num_headers, ((max_headers) >>> 0), r_box)), (null)) ? 1 : 0)) {
    return r_box.value;
  }
  return (Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(buf, buf_start)))) | 0);
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: minor_version, status, msg, msg_len, num_headers, ret.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
function parse_response(buf: any, buf_end: any, minor_version: COutParam<number>, status: COutParam<number>, msg: COutParam<CPtr>, msg_len: COutParam<number>, headers: phr_header | null, num_headers: COutParam<number>, max_headers: number, ret: COutParam<number>): any {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  if ((cptr_eq((buf = parse_http_version(cptr_clone(buf), cptr_clone(buf_end), minor_version, ret)), (null)) ? 1 : 0)) {
    return null;
  }
  if ((((buf.buf[buf.off]) << 24 >> 24) != 32 ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  do {
    ++buf.off;
    if ((cptr_eq(buf, buf_end) ? 1 : 0)) {
      (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
  } while ((((buf.buf[buf.off]) << 24 >> 24) == 32 ? 1 : 0));
  if ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(buf_end, buf) < 4 ? 1 : 0)) {
    (() => { const __p: any = (ret); const __v: any = (-2); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    return null;
  }
  do {
    let res__box = { value: 0 };
    if ((((((buf.buf[buf.off]) << 24 >> 24) < 48 ? 1 : 0) || (57 < ((buf.buf[buf.off]) << 24 >> 24) ? 1 : 0)) ? 1 : 0)) {
      buf.off++;
      (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
    (() => { const __p: any = ((res__box)); const __v: any = (Math.imul((100), (i32((((buf.buf[buf.off++])) << 24 >> 24) - 48)))); if (__p && __p.__field_ref === true) { __p.value = __v; } else { cptr_write_int32(__p, 0, __v); } })();
    (() => { const __p: any = (status); const __v: any = (res__box.value); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
    if ((((((buf.buf[buf.off]) << 24 >> 24) < 48 ? 1 : 0) || (57 < ((buf.buf[buf.off]) << 24 >> 24) ? 1 : 0)) ? 1 : 0)) {
      buf.off++;
      (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
    (() => { const __p: any = ((res__box)); const __v: any = (Math.imul((10), (i32((((buf.buf[buf.off++])) << 24 >> 24) - 48)))); if (__p && __p.__field_ref === true) { __p.value = __v; } else { cptr_write_int32(__p, 0, __v); } })();
    status.value = i32(status.value + res__box.value);
    if ((((((buf.buf[buf.off]) << 24 >> 24) < 48 ? 1 : 0) || (57 < ((buf.buf[buf.off]) << 24 >> 24) ? 1 : 0)) ? 1 : 0)) {
      buf.off++;
      (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
    (() => { const __p: any = ((res__box)); const __v: any = (Math.imul((1), (i32((((buf.buf[buf.off++])) << 24 >> 24) - 48)))); if (__p && __p.__field_ref === true) { __p.value = __v; } else { cptr_write_int32(__p, 0, __v); } })();
    status.value = i32(status.value + res__box.value);
  } while (0);
  if ((cptr_eq((buf = get_token_to_eol(cptr_clone(buf), cptr_clone(buf_end), msg, msg_len, ret)), (null)) ? 1 : 0)) {
    return null;
  }
  if ((((msg_len.value) >>> 0) == ((0) >>> 0) ? 1 : 0)) {
  } else {
    if ((((msg.value.buf[msg.value.off]) << 24 >> 24) == 32 ? 1 : 0)) {
      do {
        ++msg.value.off;
        (msg_len.value -= 1, msg_len.value);
      } while ((((msg.value.buf[msg.value.off]) << 24 >> 24) == 32 ? 1 : 0));
    } else {
      (() => { const __p: any = (ret); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
    }
  }
  return cptr_clone(parse_headers(cptr_clone(buf), cptr_clone(buf_end), headers, num_headers, ((max_headers) >>> 0), ret));
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: minor_version, status, msg, msg_len, num_headers.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
export function phr_parse_response(buf_start: any, len: number, minor_version: COutParam<number>, status: COutParam<number>, msg: COutParam<CPtr>, msg_len: COutParam<number>, headers: phr_header | null, num_headers: COutParam<number>, last_len: number): number {
  let buf = cptr_clone(cptr_clone(buf_start)); /* &ref */
  let buf_end = cptr_offset(buf, ((len) >>> 0)); /* &ref */
  let max_headers = ((num_headers.value) >>> 0);
  let r_box = { value: 0 };
  (() => { const __p: any = (minor_version); const __v: any = (-1); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
  (() => { const __p: any = (status); const __v: any = (0); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
  msg.value = null;
  msg_len.value = ((0) >>> 0);
  num_headers.value = ((0) >>> 0);
  if ((((((last_len) >>> 0) != ((0) >>> 0) ? 1 : 0) && (cptr_eq(is_complete(cptr_clone(buf), cptr_clone(buf_end), ((last_len) >>> 0), r_box), (null)) ? 1 : 0)) ? 1 : 0)) {
    return r_box.value;
  }
  if ((cptr_eq((buf = parse_response(cptr_clone(buf), cptr_clone(buf_end), minor_version, status, msg, msg_len, headers, num_headers, ((max_headers) >>> 0), r_box)), (null)) ? 1 : 0)) {
    return r_box.value;
  }
  return (Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(buf, buf_start)))) | 0);
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: num_headers.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
export function phr_parse_headers(buf_start: any, len: number, headers: phr_header | null, num_headers: COutParam<number>, last_len: number): number {
  let buf = cptr_clone(cptr_clone(buf_start)); /* &ref */
  let buf_end = cptr_offset(buf, ((len) >>> 0)); /* &ref */
  let max_headers = ((num_headers.value) >>> 0);
  let r_box = { value: 0 };
  num_headers.value = ((0) >>> 0);
  if ((((((last_len) >>> 0) != ((0) >>> 0) ? 1 : 0) && (cptr_eq(is_complete(cptr_clone(buf), cptr_clone(buf_end), ((last_len) >>> 0), r_box), (null)) ? 1 : 0)) ? 1 : 0)) {
    return r_box.value;
  }
  if ((cptr_eq((buf = parse_headers(cptr_clone(buf), cptr_clone(buf_end), headers, num_headers, ((max_headers) >>> 0), r_box)), (null)) ? 1 : 0)) {
    return r_box.value;
  }
  return (Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(buf, buf_start)))) | 0);
}

export const CHUNKED_IN_CHUNK_SIZE: number = 0;
export const CHUNKED_IN_CHUNK_EXT: number = 1;
export const CHUNKED_IN_CHUNK_HEADER_EXPECT_LF: number = 2;
export const CHUNKED_IN_CHUNK_DATA: number = 3;
export const CHUNKED_IN_CHUNK_DATA_EXPECT_CR: number = 4;
export const CHUNKED_IN_CHUNK_DATA_EXPECT_LF: number = 5;
export const CHUNKED_IN_TRAILERS_LINE_HEAD: number = 6;
export const CHUNKED_IN_TRAILERS_LINE_MIDDLE: number = 7;

function decode_hex(ch: number): number {
  if ((((48 <= ch ? 1 : 0) && (ch <= 57 ? 1 : 0)) ? 1 : 0)) {
    return i32(ch - 48);
  } else {
    if ((((65 <= ch ? 1 : 0) && (ch <= 70 ? 1 : 0)) ? 1 : 0)) {
      return i32(i32(ch - 65) + 10);
    } else {
      if ((((97 <= ch ? 1 : 0) && (ch <= 102 ? 1 : 0)) ? 1 : 0)) {
        return i32(i32(ch - 97) + 10);
      } else {
        return -1;
      }
    }
  }
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: _bufsz.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
export function phr_decode_chunked(decoder: phr_chunked_decoder | null, buf: any, _bufsz: COutParam<number>): number {
  if (typeof buf === 'string') buf = cptr_from_string(buf);

  let dst: number = 0;
  let src: number = 0;
  let bufsz: number = 0;
  let ret: number = 0;
  let v: number = 0;
  let avail: number = 0;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      dst = ((0) >>> 0);
      src = ((0) >>> 0);
      bufsz = ((_bufsz.value) >>> 0);
      ret = -2;
      (__struct_ptr_at(decoder, 0))._total_read = __u64(__as_bigint((__struct_ptr_at(decoder, 0))._total_read) + __as_bigint(((bufsz) >>> 0)));
      while (1) {
        switch ((((__struct_ptr_at(decoder, 0))._state) << 24 >> 24)) {
          case CHUNKED_IN_CHUNK_SIZE:
            {
              for (; ; (src = u32(src + 1))) {
                v = 0;
                if ((((src) >>> 0) == ((bufsz) >>> 0) ? 1 : 0)) {
                  _state = 2; continue _sm; /* goto Exit */
                }
                if (((v = decode_hex(((buf.buf[(buf.off ?? 0) + ((src) >>> 0)]) << 24 >> 24))) == -1 ? 1 : 0)) {
                  if (((((__struct_ptr_at(decoder, 0))._hex_count) << 24 >> 24) == 0 ? 1 : 0)) {
                    ret = -1;
                    _state = 2; continue _sm; /* goto Exit */
                  }
                  switch (((buf.buf[(buf.off ?? 0) + ((src) >>> 0)]) << 24 >> 24)) {
                    case 32:
                      case 9:
                        case 59:
                          case 10:
                            case 13:
                            {
                              break;
                            }
                    default:
                    {
                      ret = -1;
                    _state = 2; continue _sm; /* goto Exit */
                    }
                  }
                  break;
                }
                if (((((__struct_ptr_at(decoder, 0))._hex_count) << 24 >> 24) == 8 * 2 ? 1 : 0)) {
                  ret = -1;
                  _state = 2; continue _sm; /* goto Exit */
                }
                (__struct_ptr_at(decoder, 0)).bytes_left_in_chunk = (((__struct_ptr_at(decoder, 0)).bytes_left_in_chunk) >>> 0) * ((16) >>> 0) + ((v) >>> 0);
                ++(__struct_ptr_at(decoder, 0))._hex_count;
              }
            }
          (__struct_ptr_at(decoder, 0))._hex_count = (((0) << 24 >> 24)) << 24 >> 24;
          (__struct_ptr_at(decoder, 0))._state = (((CHUNKED_IN_CHUNK_EXT) << 24 >> 24)) << 24 >> 24;
          case CHUNKED_IN_CHUNK_EXT:
            {
              for (; ; (src = u32(src + 1))) {
                if ((((src) >>> 0) == ((bufsz) >>> 0) ? 1 : 0)) {
                  _state = 2; continue _sm; /* goto Exit */
                }
                if ((((buf.buf[(buf.off ?? 0) + ((src) >>> 0)]) << 24 >> 24) == 13 ? 1 : 0)) {
                  break;
                } else {
                  if ((((buf.buf[(buf.off ?? 0) + ((src) >>> 0)]) << 24 >> 24) == 10 ? 1 : 0)) {
                    ret = -1;
                    _state = 2; continue _sm; /* goto Exit */
                  }
                }
              }
            }
          (src = u32(src + 1));
          (__struct_ptr_at(decoder, 0))._state = (((CHUNKED_IN_CHUNK_HEADER_EXPECT_LF) << 24 >> 24)) << 24 >> 24;
          case CHUNKED_IN_CHUNK_HEADER_EXPECT_LF:
            if ((((src) >>> 0) == ((bufsz) >>> 0) ? 1 : 0)) {
              _state = 2; continue _sm; /* goto Exit */
            }
          if ((((buf.buf[(buf.off ?? 0) + ((src) >>> 0)]) << 24 >> 24) != 10 ? 1 : 0)) {
            ret = -1;
            _state = 2; continue _sm; /* goto Exit */
          }
          (src = u32(src + 1));
          if (((((__struct_ptr_at(decoder, 0)).bytes_left_in_chunk) >>> 0) == ((0) >>> 0) ? 1 : 0)) {
            if ((((__struct_ptr_at(decoder, 0)).consume_trailer) << 24 >> 24)) {
              (__struct_ptr_at(decoder, 0))._state = (((CHUNKED_IN_TRAILERS_LINE_HEAD) << 24 >> 24)) << 24 >> 24;
              break;
            } else {
              _state = 1; continue _sm; /* goto Complete */
            }
          }
          (__struct_ptr_at(decoder, 0))._state = (((CHUNKED_IN_CHUNK_DATA) << 24 >> 24)) << 24 >> 24;
          case CHUNKED_IN_CHUNK_DATA:
            {
              avail = ((bufsz) >>> 0) - ((src) >>> 0);
              if ((((avail) >>> 0) < (((__struct_ptr_at(decoder, 0)).bytes_left_in_chunk) >>> 0) ? 1 : 0)) {
                if ((((dst) >>> 0) != ((src) >>> 0) ? 1 : 0)) {
                  memmove(cptr_offset(buf, ((dst) >>> 0)), cptr_offset(buf, ((src) >>> 0)), ((avail) >>> 0));
                }
                src += ((avail) >>> 0);
                dst += ((avail) >>> 0);
                (__struct_ptr_at(decoder, 0)).bytes_left_in_chunk -= ((avail) >>> 0);
                _state = 2; continue _sm; /* goto Exit */
              }
              if ((((dst) >>> 0) != ((src) >>> 0) ? 1 : 0)) {
                memmove(cptr_offset(buf, ((dst) >>> 0)), cptr_offset(buf, ((src) >>> 0)), (((__struct_ptr_at(decoder, 0)).bytes_left_in_chunk) >>> 0));
              }
              src += (((__struct_ptr_at(decoder, 0)).bytes_left_in_chunk) >>> 0);
              dst += (((__struct_ptr_at(decoder, 0)).bytes_left_in_chunk) >>> 0);
              (__struct_ptr_at(decoder, 0)).bytes_left_in_chunk = ((0) >>> 0);
              (__struct_ptr_at(decoder, 0))._state = (((CHUNKED_IN_CHUNK_DATA_EXPECT_CR) << 24 >> 24)) << 24 >> 24;
            }
          case CHUNKED_IN_CHUNK_DATA_EXPECT_CR:
            if ((((src) >>> 0) == ((bufsz) >>> 0) ? 1 : 0)) {
              _state = 2; continue _sm; /* goto Exit */
            }
          if ((((buf.buf[(buf.off ?? 0) + ((src) >>> 0)]) << 24 >> 24) != 13 ? 1 : 0)) {
            ret = -1;
            _state = 2; continue _sm; /* goto Exit */
          }
          (src = u32(src + 1));
          (__struct_ptr_at(decoder, 0))._state = (((CHUNKED_IN_CHUNK_DATA_EXPECT_LF) << 24 >> 24)) << 24 >> 24;
          case CHUNKED_IN_CHUNK_DATA_EXPECT_LF:
            if ((((src) >>> 0) == ((bufsz) >>> 0) ? 1 : 0)) {
              _state = 2; continue _sm; /* goto Exit */
            }
          if ((((buf.buf[(buf.off ?? 0) + ((src) >>> 0)]) << 24 >> 24) != 10 ? 1 : 0)) {
            ret = -1;
            _state = 2; continue _sm; /* goto Exit */
          }
          (src = u32(src + 1));
          (__struct_ptr_at(decoder, 0))._state = (((CHUNKED_IN_CHUNK_SIZE) << 24 >> 24)) << 24 >> 24;
          break;
          case CHUNKED_IN_TRAILERS_LINE_HEAD:
            {
              for (; ; (src = u32(src + 1))) {
                if ((((src) >>> 0) == ((bufsz) >>> 0) ? 1 : 0)) {
                  _state = 2; continue _sm; /* goto Exit */
                }
                if ((((buf.buf[(buf.off ?? 0) + ((src) >>> 0)]) << 24 >> 24) != 13 ? 1 : 0)) {
                  break;
                }
              }
            }
          if ((((buf.buf[(buf.off ?? 0) + (() => { const _t = src; src = u32(src + 1); return _t; })()]) << 24 >> 24) == 10 ? 1 : 0)) {
            _state = 1; continue _sm; /* goto Complete */
          }
          (__struct_ptr_at(decoder, 0))._state = (((CHUNKED_IN_TRAILERS_LINE_MIDDLE) << 24 >> 24)) << 24 >> 24;
          case CHUNKED_IN_TRAILERS_LINE_MIDDLE:
            {
              for (; ; (src = u32(src + 1))) {
                if ((((src) >>> 0) == ((bufsz) >>> 0) ? 1 : 0)) {
                  _state = 2; continue _sm; /* goto Exit */
                }
                if ((((buf.buf[(buf.off ?? 0) + ((src) >>> 0)]) << 24 >> 24) == 10 ? 1 : 0)) {
                  break;
                }
              }
            }
          (src = u32(src + 1));
          (__struct_ptr_at(decoder, 0))._state = (((CHUNKED_IN_TRAILERS_LINE_HEAD) << 24 >> 24)) << 24 >> 24;
          break;
          default:
            ((((((!(!(0) ? 1 : 0) ? 1 : 0)) || (((): any => { _assert("!\"decoder is corrupt\"", "picohttpparser.c", ((681) >>> 0)); return 0; })())) ? 1 : 0)));
        }
      }
    case 1: /* Complete */
      ret = ((bufsz) >>> 0) - ((src) >>> 0);
    case 2: /* Exit */
      if ((((dst) >>> 0) != ((src) >>> 0) ? 1 : 0)) {
        memmove(cptr_offset(buf, ((dst) >>> 0)), cptr_offset(buf, ((src) >>> 0)), ((bufsz) >>> 0) - ((src) >>> 0));
      }
      _bufsz.value = ((dst) >>> 0);
      if ((ret == -2 ? 1 : 0)) {
        (__struct_ptr_at(decoder, 0))._total_overhead = __u64(__as_bigint((__struct_ptr_at(decoder, 0))._total_overhead) + __as_bigint(((bufsz) >>> 0) - ((dst) >>> 0)));
        if (((((__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(decoder, 0))._total_overhead) >= __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ Math.imul(100, 1024))) ? 1 : 0) && ((__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(decoder, 0))._total_read) - __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(decoder, 0))._total_overhead))) < __as_bigint(__safe_div_i64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(decoder, 0))._total_read), __as_bigint(new std_bitset(8, 4))))) ? 1 : 0)) ? 1 : 0)) {
          ret = -1;
        }
      }
      return ret;
      break _sm;
    }
  }
}

export function phr_decode_chunked_is_in_data(decoder: phr_chunked_decoder | null): number {
  return (((((__struct_ptr_at(decoder, 0))._state) << 24 >> 24) == CHUNKED_IN_CHUNK_DATA ? 1 : 0) ? 1 : 0);
}