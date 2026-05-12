function __safe_div(a: any, b: any): any { const aBig = typeof a === 'bigint'; const bBig = typeof b === 'bigint'; if (aBig && bBig) { if (b === 0n) throw new Error('Division by zero'); return a / b; } const an = aBig ? Number(a) : Number(a ?? 0); const bn = bBig ? Number(b) : Number(b ?? 0); if (bn === 0) throw new Error('Division by zero'); return Math.trunc(an / bn); }
function __safe_mod(a: any, b: any): any { const aBig = typeof a === 'bigint'; const bBig = typeof b === 'bigint'; if (aBig && bBig) { if (b === 0n) throw new Error('Division by zero'); return a % b; } const an = aBig ? Number(a) : Number(a ?? 0); const bn = bBig ? Number(b) : Number(b ?? 0); if (bn === 0) throw new Error('Division by zero'); return an % bn; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function realloc(ptr: any, size: any): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 const sz = typeof size === 'bigint' ? Number(size) : Number(size ?? 0); if (ptr && ptr.__cptr_overlay === true) { const cp = ptr.__cptr; ptr = { buf: cp.buf, off: (cp.off ?? 0) + (ptr.__byteOff ?? 0) }; return cptr_realloc(ptr, sz); } if (ptr && typeof ptr === 'object' && !ptr.buf && ptr.constructor && (ptr.constructor as any).__fieldNames) { /* BRIDGE: struct-as-class realloc */ const existing = ptr.__cptr; const newBuf = new Uint8Array(sz); if (existing && existing.buf) { const srcOff = existing.off ?? 0; const copyLen = Math.min(existing.buf.length - srcOff, sz); if (copyLen > 0) newBuf.set(existing.buf.subarray(srcOff, srcOff + copyLen)); } ptr.__cptr = { buf: newBuf, off: 0 }; ptr.__byteOff = 0; return ptr; } return cptr_realloc(ptr, sz); }

// CPtr runtime for C pointer semantics
const __LITTLE_ENDIAN = true;
interface CPtr { buf: Uint8Array; off: number; [k: string]: any; }
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
function cptr_from_int8_array(arr: number[] | string): any { if (typeof arr === "string") { const b = new Uint8Array(arr.length); for (let i = 0; i < arr.length; i++) b[i] = arr.charCodeAt(i) & 0xFF; return { buf: b, off: 0 }; } return __cptr_cached_array(arr, "__cptr_int8", arr.length, (v, i, x) => v.setInt8(i, x), 1); }
function cptr_from_uint8_array(arr: any): any {
  if (typeof arr === 'string') arr = cptr_from_string(arr);
 if (arr && arr.buf instanceof Uint8Array) return arr as CPtr; return __cptr_cached_array(arr, "__cptr_uint8", arr.length, (v, i, x) => v.setUint8(i, x & 0xFF), 1); }
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
function cptr_offset(ptr: any, n: number): any { if (typeof ptr === 'string') { /* C17 §6.5.6 pointer arithmetic chains: s+ls-lp lowers to cptr_offset(cptr_offset(s,ls),-lp). On a JS string the first substring drops absolute position; convert to CPtr so the chain composes. */ const __b = new Uint8Array(ptr.length + 1); for (let __i = 0; __i < ptr.length; __i++) __b[__i] = ptr.charCodeAt(__i); return { buf: __b, off: Number(n) }; } if (ptr && ptr.__field_ref === true) { return { __field_ref: true, __owner: ptr.__owner, __owner_type: ptr.__owner_type, __field_name: ptr.__field_name, __field_offset: ptr.__field_offset, __byte_delta: (ptr.__byte_delta ?? 0) + Number(n) }; } if (ptr && ptr.__field_at_offset === true) { return { __field_at_offset: true, __owner: ptr.__owner, __byte_offset: (ptr.__byte_offset ?? 0) + Number(n) }; } /* BRIDGE: pointer-array — C17 §6.7.6.2 array-of-pointers (T*[N]) decays to T** (§6.3.2.1). When a slot-bearing CPtr (slots+__ptr_arr) is incremented, scale n by 8 (LLP64 sizeof(void*)) so cptr_read_ptr's off>>3 advances slot-by-slot, not byte-by-byte. */ if (ptr?.buf && ptr.__ptr_arr === true) return { buf: ptr.buf, off: (ptr.off ?? 0) + Number(n) * 8, slots: ptr.slots, __ptr_arr: true }; if (ptr?.buf) return { buf: ptr.buf, off: (ptr.off ?? 0) + n, __src_arr: ptr.__src_arr, __src_writer: ptr.__src_writer, __elem_size: ptr.__elem_size, __class_byte_view: ptr.__class_byte_view, __instance: ptr.__instance, __layout: ptr.__layout }; if (Array.isArray(ptr)) { /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: const T *arr[N] init-then-decay produces a T** that survives cptr_offset/cptr_read_ptr. Detect "JS array of pointers" by element shape (CPtr-like {buf,...} or null) and lift to a slot-bearing CPtr. Plain numeric arrays fall through to the int32-DataView path. */ const isPtrArr = ptr.length > 0 && ptr.some((e: any) => e == null || (typeof e === 'object' && (e?.buf || e?.slots))); if (isPtrArr) { return { buf: new Uint8Array(ptr.length * 8), off: Number(n) * 8, slots: ptr.slice(), __ptr_arr: true }; } /* C17 §6.5 p7 + §6.3.2.1: array-of-integer decay through a byte-pointer view. Memoise the byte buffer on the source array so repeated cptr_offset calls share storage and writes via memcpy/cptr_write_* survive — required for streaming-hash partial-block buffers like xxhash mem32/mem64. Reuse the typed-view cache (cptr_from_{u32,u64}_array stamps __cptr_uint32/uint64) when present; otherwise heuristically pick width from element type (bigint→8, number→4) and stamp __cptr_byteview. */ const __pre64 = (ptr as any).__cptr_uint64 || (ptr as any).__cptr_int64; if (__pre64?.buf) return { buf: __pre64.buf, off: Number(n), __src_arr: ptr, __elem_size: 8 }; const __pre32 = (ptr as any).__cptr_uint32 || (ptr as any).__cptr_int32; if (__pre32?.buf) return { buf: __pre32.buf, off: Number(n), __src_arr: ptr, __elem_size: 4 }; const __preBV = (ptr as any).__cptr_byteview; if (__preBV?.buf) return { buf: __preBV.buf, off: Number(n), __src_arr: ptr, __elem_size: __preBV.__elem_size }; const __isBig = ptr.length > 0 && typeof ptr[0] === 'bigint'; const __esz = __isBig ? 8 : 4; const b = new Uint8Array(ptr.length * __esz); const v = new DataView(b.buffer); for (let __i = 0; __i < ptr.length; __i++) { const __x = ptr[__i]; if (__isBig) v.setBigUint64(__i * 8, BigInt.asUintN(64, typeof __x === 'bigint' ? __x : BigInt(Math.trunc(Number(__x ?? 0)))), true); else v.setInt32(__i * 4, Number(__x ?? 0) | 0, true); } const __bv: any = { buf: b, off: 0, __elem_size: __esz }; try { Object.defineProperty(ptr, '__cptr_byteview', { value: __bv, enumerable: false, configurable: true, writable: true }); } catch { (ptr as any).__cptr_byteview = __bv; } return { buf: b, off: Number(n), __src_arr: ptr, __elem_size: __esz }; } if (ptr && typeof ptr === 'object' && !ptr.__cptr_overlay && !ptr.__arr && ptr.constructor && (ptr.constructor as any).__fieldNames) { return { __field_at_offset: true, __owner: ptr, __byte_offset: Number(n) }; } return ptr; }
// C17 §6.5.16.1: writes through a CPtr derived from a JS array must mirror
// to the source array so subsequent arr[i] reads see the written value.
function __cptr_writeback(ptr: any, byteOff: number): void { const arr = ptr.__src_arr; if (!arr) return; const es = ptr.__elem_size ?? 1; if (byteOff % es !== 0) return; const idx = byteOff / es; if (idx < 0 || idx >= arr.length) return; const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); if (es === 1) arr[idx] = dv.getInt8(byteOff); else if (es === 2) arr[idx] = dv.getInt16(byteOff, true); else if (es === 4) arr[idx] = dv.getInt32(byteOff, true); else if (es === 8) arr[idx] = dv.getFloat64(byteOff, true); }
// C17 §6.5 p7: when a plain JS array has a memoised byte-view (stamped by
// cptr_offset or cptr_from_<T>_array), subsequent cptr_read_<T> / cptr_write_<T>
// calls on the array MUST go through that view — bytes written via memcpy live
// in the view, not in arr[i]. Without this routing, streaming-hash partial-block
// buffers (xxhash mem32/mem64, BLAKE2 block staging) read zeros from arr[i]
// while the actual data sits in the cached buffer.
function __cptr_arr_view(ptr: any): any { if (!Array.isArray(ptr)) return null; const __c: any = (ptr as any).__cptr_uint64 || (ptr as any).__cptr_int64 || (ptr as any).__cptr_uint32 || (ptr as any).__cptr_int32 || (ptr as any).__cptr_byteview; return __c?.buf ? __c : null; }
function cptr_read(ptr: any, i: number = 0): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (Array.isArray(ptr)) return ptr[i]; if (!ptr?.buf) return 0; return ptr.buf[ptr.off + i] ?? 0; }
function cptr_write(ptr: any, i: number, val: number): void {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr?.buf) return; ptr.buf[ptr.off + i] = val & 0xFF; }
function cptr_to_string(ptr: any): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr) return ''; const bytes: number[] = []; for (let i = ptr.off; i < ptr.buf.length; i++) { if (ptr.buf[i] === 0) break; bytes.push(ptr.buf[i]); } return String.fromCharCode(...bytes); }
function cptr_from_string(str: any): any { const buf = new Uint8Array(str.length + 1); for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i); buf[str.length] = 0; return { buf, off: 0 }; }
function cptr_strlen(ptr: any): number {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr) return 0; let i = 0; while (ptr.off + i < ptr.buf.length && ptr.buf[ptr.off + i] !== 0) i++; return i; }
function cptr_memset(ptr: any, val: number, n: number): void {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 for (let i = 0; i < n; i++) ptr.buf[ptr.off + i] = val & 0xFF; }
function cptr_copy(dst: any, src: any, n: number): void {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
  if (typeof src === 'string') src = cptr_from_string(src);
 for (let i = 0; i < n; i++) dst.buf[dst.off + i] = src.buf[src.off + i] ?? 0; }
function cptr_realloc(ptr: any, newSize: any): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 const sz = typeof newSize === "bigint" ? Number(newSize) : Number(newSize ?? 0); const n = new Uint8Array(sz); let copyLen = 0; if (ptr) { copyLen = Math.min(ptr.buf.length - ptr.off, sz); n.set(ptr.buf.subarray(ptr.off, ptr.off + copyLen)); const _or: any = (ptr.buf as any).__overlay_refs; if (_or && _or.size > 0) { const _so = ptr.off ?? 0; const _nr: Map<number, any> = new Map(); for (const [_k, _v] of _or) { if (_k >= _so && _k < _so + copyLen) _nr.set(_k - _so, _v); } if (_nr.size > 0) (n as any).__overlay_refs = _nr; } } const r: any = { buf: n, off: 0 }; if (ptr && (ptr as any).slots) r.slots = (ptr as any).slots.slice(); return r; }
function cptr_clone(ptr: any): any { if (ptr == null) return null; if (ptr?.buf) { const c: any = { buf: ptr.buf, off: ptr.off }; if (ptr.slots) c.slots = ptr.slots; if (ptr.__ptr_arr) c.__ptr_arr = true; return c; } /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: cloning a JS array-of-pointers (T*[N]) at a call boundary lifts it to a slot-bearing CPtr so callee-side cptr_offset/cptr_read_ptr operate on a T** view rather than treating it as an int32 array. */ if (Array.isArray(ptr)) { const isPtrArr = ptr.length > 0 && ptr.some((e: any) => e == null || (typeof e === 'object' && (e?.buf || e?.slots))); if (isPtrArr) { return { buf: new Uint8Array(ptr.length * 8), off: 0, slots: ptr.slice(), __ptr_arr: true }; } return ptr; } if (typeof ptr === 'string') return cptr_from_string(ptr); return ptr; }
function cptr_eq(a: any, b: any): boolean {
  if (typeof a === 'string') a = cptr_from_string(a);
  if (typeof b === 'string') b = cptr_from_string(b);
 if (a === b) return true; if (a == null || b == null) return a == b; if (a.buf && b.buf) return a.buf === b.buf && (a.off ?? 0) === (b.off ?? 0); function __fra_fp(x: any): any { if (x == null) return 'null'; let cur = x; let acc = ''; let depth = 0; while (cur && cur.__field_ref === true && depth < 32) { acc += '|' + (cur.__field_name ?? '') + '@' + (cur.__field_offset ?? 0) + '+' + (cur.__byte_delta ?? 0); cur = cur.__owner; depth++; } let rootId: any; if (cur && typeof cur === 'object') { rootId = cur.__rt_id; if (rootId === undefined) { const g: any = globalThis; g.__rt_id_next = (g.__rt_id_next || 1) + 1; rootId = g.__rt_id_next; Object.defineProperty(cur, '__rt_id', { value: rootId, enumerable: false, configurable: true, writable: false }); } } else { rootId = String(cur); } return acc + '#' + rootId; } if (a.__field_ref === true || b.__field_ref === true) { if (__fra_fp(a) === __fra_fp(b)) return true; } if (a.__cptr_overlay === true && b.__cptr_overlay === true) return a.__cptr === b.__cptr && (a.__byteOff ?? 0) === (b.__byteOff ?? 0); if (a.__arr !== undefined && b.__arr !== undefined) return a.__arr === b.__arr && (a.__idx ?? 0) === (b.__idx ?? 0); if (a.__field_ref === true && (a.__byte_delta ?? 0) === 0 && (a.__field_offset ?? 0) === 0) { try { const inner = a.__owner ? a.__owner[a.__field_name] : null; if (inner === b) return true; } catch (_e) {} } if (b.__field_ref === true && (b.__byte_delta ?? 0) === 0 && (b.__field_offset ?? 0) === 0) { try { const inner = b.__owner ? b.__owner[b.__field_name] : null; if (inner === a) return true; } catch (_e) {} } return false; }
function cptr_read_int8(ptr: any, i: number = 0): number { const __av = __cptr_arr_view(ptr); if (__av) return new DataView(__av.buf.buffer, __av.buf.byteOffset).getInt8(i); if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getInt8(ptr.off + i); }
function cptr_write_int8(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setInt8(ptr.off + i, val); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i); }
function cptr_read_uint8(ptr: any, i: number = 0): number {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 const __av = __cptr_arr_view(ptr); if (__av) return __av.buf[i] ?? 0; if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } return ptr.buf[ptr.off + i] ?? 0; }
function cptr_write_uint8(ptr: any, i: number, val: number): void {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } ptr.buf[ptr.off + i] = val & 0xFF; if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i); }
function cptr_read_int16(ptr: any, i: number = 0): number { const __av = __cptr_arr_view(ptr); if (__av) return new DataView(__av.buf.buffer, __av.buf.byteOffset).getInt16(i * 2, __LITTLE_ENDIAN); if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getInt16(ptr.off + i * 2, __LITTLE_ENDIAN); }
function cptr_write_int16(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setInt16(ptr.off + i * 2, val, __LITTLE_ENDIAN); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i * 2); }
function cptr_read_uint16(ptr: any, i: number = 0): number { const __av = __cptr_arr_view(ptr); if (__av) return new DataView(__av.buf.buffer, __av.buf.byteOffset).getUint16(i * 2, __LITTLE_ENDIAN); if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getUint16(ptr.off + i * 2, __LITTLE_ENDIAN); }
function cptr_write_uint16(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setUint16(ptr.off + i * 2, val, __LITTLE_ENDIAN); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i * 2); }
function cptr_read_int32(ptr: any, i: number = 0): number {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 const __av = __cptr_arr_view(ptr); if (__av) return new DataView(__av.buf.buffer, __av.buf.byteOffset).getInt32(i * 4, __LITTLE_ENDIAN); if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } if (Array.isArray(ptr.buf)) { const idx = (ptr.off ?? 0) / 4 + i; return Number(ptr.buf[idx] ?? 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getInt32(ptr.off + i * 4, __LITTLE_ENDIAN); }
function cptr_write_int32(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setInt32(ptr.off + i * 4, val, __LITTLE_ENDIAN); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i * 4); }
function cptr_read_uint32(ptr: any, i: number = 0): number { const __av = __cptr_arr_view(ptr); if (__av) return new DataView(__av.buf.buffer, __av.buf.byteOffset).getUint32(i * 4, __LITTLE_ENDIAN); if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) return ptr.value; return typeof ptr === 'number' ? ptr : (Array.isArray(ptr) ? ptr[i] : 0); } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getUint32(ptr.off + i * 4, __LITTLE_ENDIAN); }
function cptr_write_uint32(ptr: any, i: number, val: number): void { if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = val; return; } if (Array.isArray(ptr)) ptr[i] = val; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setUint32(ptr.off + i * 4, val, __LITTLE_ENDIAN); if (ptr.__src_arr) __cptr_writeback(ptr, ptr.off + i * 4); }
function cptr_read_int64(ptr: any, i: number = 0): bigint { const __av = __cptr_arr_view(ptr); if (__av) return new DataView(__av.buf.buffer, __av.buf.byteOffset).getBigInt64(i * 8, __LITTLE_ENDIAN); if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { const v = ptr.value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof ptr === 'bigint') return ptr; if (typeof ptr === 'number') return BigInt(Math.trunc(ptr)); if (Array.isArray(ptr)) { const x = ptr[i]; return typeof x === 'bigint' ? x : BigInt(Math.trunc(Number(x ?? 0))); } return 0n; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getBigInt64(ptr.off + i * 8, __LITTLE_ENDIAN); }
function cptr_write_int64(ptr: any, i: number, val: bigint | number): void { const v = typeof val === 'bigint' ? val : BigInt(Math.trunc(Number(val ?? 0))); if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { ptr.value = v; return; } if (Array.isArray(ptr)) ptr[i] = v; return; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); dv.setBigInt64(ptr.off + i * 8, BigInt.asIntN(64, v), __LITTLE_ENDIAN); }
function cptr_read_uint64(ptr: any, i: number = 0): bigint { const __av = __cptr_arr_view(ptr); if (__av) return new DataView(__av.buf.buffer, __av.buf.byteOffset).getBigUint64(i * 8, __LITTLE_ENDIAN); if (!ptr?.buf) { if (ptr && typeof ptr === 'object' && 'value' in ptr) { const v = ptr.value; return typeof v === 'bigint' ? BigInt.asUintN(64, v) : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof ptr === 'bigint') return BigInt.asUintN(64, ptr); if (typeof ptr === 'number') return BigInt(Math.trunc(ptr)); if (Array.isArray(ptr)) { const x = ptr[i]; return typeof x === 'bigint' ? BigInt.asUintN(64, x) : BigInt(Math.trunc(Number(x ?? 0))); } return 0n; } const dv = new DataView(ptr.buf.buffer, ptr.buf.byteOffset); return dv.getBigUint64(ptr.off + i * 8, __LITTLE_ENDIAN); }
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
function pow(x: number, y: number): number { return Math.pow(x, y); }
function trunc(x: number): number { return Math.trunc(x); }
function i32(x: number) { return x | 0; }
function u32(x: number) { return x >>> 0; }
function __as_bigint(x: any): bigint { if (typeof x === 'bigint') return x; if (typeof x === 'number') return BigInt(Math.trunc(x)); if (x && typeof x === 'object' && 'value' in x) { const v = (x as any).value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof x === 'boolean') return x ? 1n : 0n; return BigInt(Math.trunc(Number(x ?? 0))); }
function __u64(x: bigint): any { return BigInt.asUintN(64, x); }
function __i64(x: bigint): any { return BigInt.asIntN(64, x); }
function __safe_div_i64(a: bigint, b: bigint): any { if (b === 0n) throw new Error('Division by zero'); return a / b; }
function __safe_mod_i64(a: bigint, b: bigint): any { if (b === 0n) throw new Error('Division by zero'); return a % b; }

let T = (() => { const __b = cptr_create(256); __b.buf[0] = (((29) & 0xFF)) & 0xFF; __b.buf[1] = (((186) & 0xFF)) & 0xFF; __b.buf[2] = (((180) & 0xFF)) & 0xFF; __b.buf[3] = (((162) & 0xFF)) & 0xFF; __b.buf[4] = (((184) & 0xFF)) & 0xFF; __b.buf[5] = (((218) & 0xFF)) & 0xFF; __b.buf[6] = (((3) & 0xFF)) & 0xFF; __b.buf[7] = (((141) & 0xFF)) & 0xFF; __b.buf[8] = (((55) & 0xFF)) & 0xFF; __b.buf[9] = (((0) & 0xFF)) & 0xFF; __b.buf[10] = (((72) & 0xFF)) & 0xFF; __b.buf[11] = (((98) & 0xFF)) & 0xFF; __b.buf[12] = (((226) & 0xFF)) & 0xFF; __b.buf[13] = (((108) & 0xFF)) & 0xFF; __b.buf[14] = (((220) & 0xFF)) & 0xFF; __b.buf[15] = (((158) & 0xFF)) & 0xFF; __b.buf[16] = (((231) & 0xFF)) & 0xFF; __b.buf[17] = (((248) & 0xFF)) & 0xFF; __b.buf[18] = (((247) & 0xFF)) & 0xFF; __b.buf[19] = (((251) & 0xFF)) & 0xFF; __b.buf[20] = (((130) & 0xFF)) & 0xFF; __b.buf[21] = (((46) & 0xFF)) & 0xFF; __b.buf[22] = (((174) & 0xFF)) & 0xFF; __b.buf[23] = (((135) & 0xFF)) & 0xFF; __b.buf[24] = (((170) & 0xFF)) & 0xFF; __b.buf[25] = (((127) & 0xFF)) & 0xFF; __b.buf[26] = (((163) & 0xFF)) & 0xFF; __b.buf[27] = (((109) & 0xFF)) & 0xFF; __b.buf[28] = (((229) & 0xFF)) & 0xFF; __b.buf[29] = (((36) & 0xFF)) & 0xFF; __b.buf[30] = (((45) & 0xFF)) & 0xFF; __b.buf[31] = (((145) & 0xFF)) & 0xFF; __b.buf[32] = (((79) & 0xFF)) & 0xFF; __b.buf[33] = (((137) & 0xFF)) & 0xFF; __b.buf[34] = (((122) & 0xFF)) & 0xFF; __b.buf[35] = (((12) & 0xFF)) & 0xFF; __b.buf[36] = (((182) & 0xFF)) & 0xFF; __b.buf[37] = (((117) & 0xFF)) & 0xFF; __b.buf[38] = (((17) & 0xFF)) & 0xFF; __b.buf[39] = (((198) & 0xFF)) & 0xFF; __b.buf[40] = (((204) & 0xFF)) & 0xFF; __b.buf[41] = (((212) & 0xFF)) & 0xFF; __b.buf[42] = (((39) & 0xFF)) & 0xFF; __b.buf[43] = (((189) & 0xFF)) & 0xFF; __b.buf[44] = (((52) & 0xFF)) & 0xFF; __b.buf[45] = (((200) & 0xFF)) & 0xFF; __b.buf[46] = (((102) & 0xFF)) & 0xFF; __b.buf[47] = (((149) & 0xFF)) & 0xFF; __b.buf[48] = (((15) & 0xFF)) & 0xFF; __b.buf[49] = (((124) & 0xFF)) & 0xFF; __b.buf[50] = (((233) & 0xFF)) & 0xFF; __b.buf[51] = (((64) & 0xFF)) & 0xFF; __b.buf[52] = (((88) & 0xFF)) & 0xFF; __b.buf[53] = (((225) & 0xFF)) & 0xFF; __b.buf[54] = (((105) & 0xFF)) & 0xFF; __b.buf[55] = (((183) & 0xFF)) & 0xFF; __b.buf[56] = (((131) & 0xFF)) & 0xFF; __b.buf[57] = (((114) & 0xFF)) & 0xFF; __b.buf[58] = (((187) & 0xFF)) & 0xFF; __b.buf[59] = (((197) & 0xFF)) & 0xFF; __b.buf[60] = (((165) & 0xFF)) & 0xFF; __b.buf[61] = (((48) & 0xFF)) & 0xFF; __b.buf[62] = (((56) & 0xFF)) & 0xFF; __b.buf[63] = (((214) & 0xFF)) & 0xFF; __b.buf[64] = (((227) & 0xFF)) & 0xFF; __b.buf[65] = (((41) & 0xFF)) & 0xFF; __b.buf[66] = (((95) & 0xFF)) & 0xFF; __b.buf[67] = (((4) & 0xFF)) & 0xFF; __b.buf[68] = (((93) & 0xFF)) & 0xFF; __b.buf[69] = (((243) & 0xFF)) & 0xFF; __b.buf[70] = (((239) & 0xFF)) & 0xFF; __b.buf[71] = (((38) & 0xFF)) & 0xFF; __b.buf[72] = (((61) & 0xFF)) & 0xFF; __b.buf[73] = (((116) & 0xFF)) & 0xFF; __b.buf[74] = (((51) & 0xFF)) & 0xFF; __b.buf[75] = (((90) & 0xFF)) & 0xFF; __b.buf[76] = (((236) & 0xFF)) & 0xFF; __b.buf[77] = (((89) & 0xFF)) & 0xFF; __b.buf[78] = (((18) & 0xFF)) & 0xFF; __b.buf[79] = (((196) & 0xFF)) & 0xFF; __b.buf[80] = (((213) & 0xFF)) & 0xFF; __b.buf[81] = (((42) & 0xFF)) & 0xFF; __b.buf[82] = (((96) & 0xFF)) & 0xFF; __b.buf[83] = (((104) & 0xFF)) & 0xFF; __b.buf[84] = (((27) & 0xFF)) & 0xFF; __b.buf[85] = (((11) & 0xFF)) & 0xFF; __b.buf[86] = (((21) & 0xFF)) & 0xFF; __b.buf[87] = (((203) & 0xFF)) & 0xFF; __b.buf[88] = (((250) & 0xFF)) & 0xFF; __b.buf[89] = (((194) & 0xFF)) & 0xFF; __b.buf[90] = (((57) & 0xFF)) & 0xFF; __b.buf[91] = (((85) & 0xFF)) & 0xFF; __b.buf[92] = (((54) & 0xFF)) & 0xFF; __b.buf[93] = (((211) & 0xFF)) & 0xFF; __b.buf[94] = (((32) & 0xFF)) & 0xFF; __b.buf[95] = (((25) & 0xFF)) & 0xFF; __b.buf[96] = (((140) & 0xFF)) & 0xFF; __b.buf[97] = (((121) & 0xFF)) & 0xFF; __b.buf[98] = (((147) & 0xFF)) & 0xFF; __b.buf[99] = (((171) & 0xFF)) & 0xFF; __b.buf[100] = (((6) & 0xFF)) & 0xFF; __b.buf[101] = (((115) & 0xFF)) & 0xFF; __b.buf[102] = (((234) & 0xFF)) & 0xFF; __b.buf[103] = (((206) & 0xFF)) & 0xFF; __b.buf[104] = (((101) & 0xFF)) & 0xFF; __b.buf[105] = (((8) & 0xFF)) & 0xFF; __b.buf[106] = (((7) & 0xFF)) & 0xFF; __b.buf[107] = (((33) & 0xFF)) & 0xFF; __b.buf[108] = (((112) & 0xFF)) & 0xFF; __b.buf[109] = (((159) & 0xFF)) & 0xFF; __b.buf[110] = (((28) & 0xFF)) & 0xFF; __b.buf[111] = (((240) & 0xFF)) & 0xFF; __b.buf[112] = (((238) & 0xFF)) & 0xFF; __b.buf[113] = (((92) & 0xFF)) & 0xFF; __b.buf[114] = (((249) & 0xFF)) & 0xFF; __b.buf[115] = (((22) & 0xFF)) & 0xFF; __b.buf[116] = (((129) & 0xFF)) & 0xFF; __b.buf[117] = (((208) & 0xFF)) & 0xFF; __b.buf[118] = (((118) & 0xFF)) & 0xFF; __b.buf[119] = (((125) & 0xFF)) & 0xFF; __b.buf[120] = (((179) & 0xFF)) & 0xFF; __b.buf[121] = (((24) & 0xFF)) & 0xFF; __b.buf[122] = (((178) & 0xFF)) & 0xFF; __b.buf[123] = (((143) & 0xFF)) & 0xFF; __b.buf[124] = (((156) & 0xFF)) & 0xFF; __b.buf[125] = (((63) & 0xFF)) & 0xFF; __b.buf[126] = (((207) & 0xFF)) & 0xFF; __b.buf[127] = (((164) & 0xFF)) & 0xFF; __b.buf[128] = (((103) & 0xFF)) & 0xFF; __b.buf[129] = (((172) & 0xFF)) & 0xFF; __b.buf[130] = (((71) & 0xFF)) & 0xFF; __b.buf[131] = (((157) & 0xFF)) & 0xFF; __b.buf[132] = (((185) & 0xFF)) & 0xFF; __b.buf[133] = (((199) & 0xFF)) & 0xFF; __b.buf[134] = (((128) & 0xFF)) & 0xFF; __b.buf[135] = (((181) & 0xFF)) & 0xFF; __b.buf[136] = (((175) & 0xFF)) & 0xFF; __b.buf[137] = (((193) & 0xFF)) & 0xFF; __b.buf[138] = (((154) & 0xFF)) & 0xFF; __b.buf[139] = (((152) & 0xFF)) & 0xFF; __b.buf[140] = (((176) & 0xFF)) & 0xFF; __b.buf[141] = (((26) & 0xFF)) & 0xFF; __b.buf[142] = (((9) & 0xFF)) & 0xFF; __b.buf[143] = (((132) & 0xFF)) & 0xFF; __b.buf[144] = (((62) & 0xFF)) & 0xFF; __b.buf[145] = (((151) & 0xFF)) & 0xFF; __b.buf[146] = (((2) & 0xFF)) & 0xFF; __b.buf[147] = (((97) & 0xFF)) & 0xFF; __b.buf[148] = (((205) & 0xFF)) & 0xFF; __b.buf[149] = (((120) & 0xFF)) & 0xFF; __b.buf[150] = (((77) & 0xFF)) & 0xFF; __b.buf[151] = (((190) & 0xFF)) & 0xFF; __b.buf[152] = (((150) & 0xFF)) & 0xFF; __b.buf[153] = (((146) & 0xFF)) & 0xFF; __b.buf[154] = (((50) & 0xFF)) & 0xFF; __b.buf[155] = (((23) & 0xFF)) & 0xFF; __b.buf[156] = (((155) & 0xFF)) & 0xFF; __b.buf[157] = (((47) & 0xFF)) & 0xFF; __b.buf[158] = (((126) & 0xFF)) & 0xFF; __b.buf[159] = (((119) & 0xFF)) & 0xFF; __b.buf[160] = (((254) & 0xFF)) & 0xFF; __b.buf[161] = (((40) & 0xFF)) & 0xFF; __b.buf[162] = (((241) & 0xFF)) & 0xFF; __b.buf[163] = (((192) & 0xFF)) & 0xFF; __b.buf[164] = (((144) & 0xFF)) & 0xFF; __b.buf[165] = (((83) & 0xFF)) & 0xFF; __b.buf[166] = (((138) & 0xFF)) & 0xFF; __b.buf[167] = (((49) & 0xFF)) & 0xFF; __b.buf[168] = (((113) & 0xFF)) & 0xFF; __b.buf[169] = (((160) & 0xFF)) & 0xFF; __b.buf[170] = (((74) & 0xFF)) & 0xFF; __b.buf[171] = (((70) & 0xFF)) & 0xFF; __b.buf[172] = (((253) & 0xFF)) & 0xFF; __b.buf[173] = (((217) & 0xFF)) & 0xFF; __b.buf[174] = (((110) & 0xFF)) & 0xFF; __b.buf[175] = (((58) & 0xFF)) & 0xFF; __b.buf[176] = (((5) & 0xFF)) & 0xFF; __b.buf[177] = (((228) & 0xFF)) & 0xFF; __b.buf[178] = (((136) & 0xFF)) & 0xFF; __b.buf[179] = (((87) & 0xFF)) & 0xFF; __b.buf[180] = (((215) & 0xFF)) & 0xFF; __b.buf[181] = (((169) & 0xFF)) & 0xFF; __b.buf[182] = (((14) & 0xFF)) & 0xFF; __b.buf[183] = (((168) & 0xFF)) & 0xFF; __b.buf[184] = (((73) & 0xFF)) & 0xFF; __b.buf[185] = (((219) & 0xFF)) & 0xFF; __b.buf[186] = (((167) & 0xFF)) & 0xFF; __b.buf[187] = (((10) & 0xFF)) & 0xFF; __b.buf[188] = (((148) & 0xFF)) & 0xFF; __b.buf[189] = (((173) & 0xFF)) & 0xFF; __b.buf[190] = (((100) & 0xFF)) & 0xFF; __b.buf[191] = (((35) & 0xFF)) & 0xFF; __b.buf[192] = (((222) & 0xFF)) & 0xFF; __b.buf[193] = (((76) & 0xFF)) & 0xFF; __b.buf[194] = (((221) & 0xFF)) & 0xFF; __b.buf[195] = (((139) & 0xFF)) & 0xFF; __b.buf[196] = (((235) & 0xFF)) & 0xFF; __b.buf[197] = (((16) & 0xFF)) & 0xFF; __b.buf[198] = (((69) & 0xFF)) & 0xFF; __b.buf[199] = (((166) & 0xFF)) & 0xFF; __b.buf[200] = (((133) & 0xFF)) & 0xFF; __b.buf[201] = (((210) & 0xFF)) & 0xFF; __b.buf[202] = (((67) & 0xFF)) & 0xFF; __b.buf[203] = (((30) & 0xFF)) & 0xFF; __b.buf[204] = (((84) & 0xFF)) & 0xFF; __b.buf[205] = (((43) & 0xFF)) & 0xFF; __b.buf[206] = (((202) & 0xFF)) & 0xFF; __b.buf[207] = (((161) & 0xFF)) & 0xFF; __b.buf[208] = (((195) & 0xFF)) & 0xFF; __b.buf[209] = (((223) & 0xFF)) & 0xFF; __b.buf[210] = (((53) & 0xFF)) & 0xFF; __b.buf[211] = (((34) & 0xFF)) & 0xFF; __b.buf[212] = (((232) & 0xFF)) & 0xFF; __b.buf[213] = (((245) & 0xFF)) & 0xFF; __b.buf[214] = (((237) & 0xFF)) & 0xFF; __b.buf[215] = (((230) & 0xFF)) & 0xFF; __b.buf[216] = (((59) & 0xFF)) & 0xFF; __b.buf[217] = (((80) & 0xFF)) & 0xFF; __b.buf[218] = (((191) & 0xFF)) & 0xFF; __b.buf[219] = (((91) & 0xFF)) & 0xFF; __b.buf[220] = (((66) & 0xFF)) & 0xFF; __b.buf[221] = (((209) & 0xFF)) & 0xFF; __b.buf[222] = (((75) & 0xFF)) & 0xFF; __b.buf[223] = (((78) & 0xFF)) & 0xFF; __b.buf[224] = (((44) & 0xFF)) & 0xFF; __b.buf[225] = (((65) & 0xFF)) & 0xFF; __b.buf[226] = (((1) & 0xFF)) & 0xFF; __b.buf[227] = (((188) & 0xFF)) & 0xFF; __b.buf[228] = (((252) & 0xFF)) & 0xFF; __b.buf[229] = (((107) & 0xFF)) & 0xFF; __b.buf[230] = (((86) & 0xFF)) & 0xFF; __b.buf[231] = (((177) & 0xFF)) & 0xFF; __b.buf[232] = (((242) & 0xFF)) & 0xFF; __b.buf[233] = (((134) & 0xFF)) & 0xFF; __b.buf[234] = (((13) & 0xFF)) & 0xFF; __b.buf[235] = (((246) & 0xFF)) & 0xFF; __b.buf[236] = (((99) & 0xFF)) & 0xFF; __b.buf[237] = (((20) & 0xFF)) & 0xFF; __b.buf[238] = (((81) & 0xFF)) & 0xFF; __b.buf[239] = (((111) & 0xFF)) & 0xFF; __b.buf[240] = (((68) & 0xFF)) & 0xFF; __b.buf[241] = (((153) & 0xFF)) & 0xFF; __b.buf[242] = (((37) & 0xFF)) & 0xFF; __b.buf[243] = (((123) & 0xFF)) & 0xFF; __b.buf[244] = (((216) & 0xFF)) & 0xFF; __b.buf[245] = (((224) & 0xFF)) & 0xFF; __b.buf[246] = (((19) & 0xFF)) & 0xFF; __b.buf[247] = (((31) & 0xFF)) & 0xFF; __b.buf[248] = (((82) & 0xFF)) & 0xFF; __b.buf[249] = (((106) & 0xFF)) & 0xFF; __b.buf[250] = (((201) & 0xFF)) & 0xFF; __b.buf[251] = (((244) & 0xFF)) & 0xFF; __b.buf[252] = (((60) & 0xFF)) & 0xFF; __b.buf[253] = (((142) & 0xFF)) & 0xFF; __b.buf[254] = (((94) & 0xFF)) & 0xFF; __b.buf[255] = (((255) & 0xFF)) & 0xFF; return __b; })();
export function Pearson8(key: any | null, length: number): number {
  if (typeof key === 'string') key = cptr_from_string(key);

  let result = 0;
  do {
    let h = 0;
    for (let i: number = ((0) >>> 0); (((i) >>> 0) < 1 ? 1 : 0); i += ((1) >>> 0)) {
      h = (((T.buf[(T.off ?? 0) + __safe_mod((((((key.buf[(key.off ?? 0) + 0]) & 0xFF)) >>> 0) + ((i) >>> 0)), ((256) >>> 0))]) & 0xFF)) & 0xFF;
      for (let j: number = ((1) >>> 0); (((j) >>> 0) < ((length) >>> 0) ? 1 : 0); j += ((1) >>> 0)) {
        h = (((T.buf[(T.off ?? 0) + ((h) & 0xFF) ^ ((key.buf[(key.off ?? 0) + ((j) >>> 0)]) & 0xFF)]) & 0xFF)) & 0xFF;
      }
      result = (((((((((result) & 0xFF) << 8) | 0)) | ((h) & 0xFF))) & 0xFF)) & 0xFF;
    }
  } while (0);
  return ((result) & 0xFF);
}

export function Pearson16(key: any | null, length: number): number {
  if (typeof key === 'string') key = cptr_from_string(key);

  let result = 0;
  do {
    let h = 0;
    for (let i: number = ((0) >>> 0); (((i) >>> 0) < 2 ? 1 : 0); i += ((1) >>> 0)) {
      h = (((T.buf[(T.off ?? 0) + __safe_mod((((((key.buf[(key.off ?? 0) + 0]) & 0xFF)) >>> 0) + ((i) >>> 0)), ((256) >>> 0))]) & 0xFF)) & 0xFF;
      for (let j: number = ((1) >>> 0); (((j) >>> 0) < ((length) >>> 0) ? 1 : 0); j += ((1) >>> 0)) {
        h = (((T.buf[(T.off ?? 0) + ((h) & 0xFF) ^ ((key.buf[(key.off ?? 0) + ((j) >>> 0)]) & 0xFF)]) & 0xFF)) & 0xFF;
      }
      result = (((((((((result) & 0xFFFF) << 8) | 0)) | ((h) & 0xFF))) & 0xFFFF)) & 0xFFFF;
    }
  } while (0);
  return ((result) & 0xFFFF);
}

export function Pearson32(key: any | null, length: number): number {
  if (typeof key === 'string') key = cptr_from_string(key);

  let result = 0;
  do {
    let h = 0;
    for (let i: number = ((0) >>> 0); (((i) >>> 0) < 4 ? 1 : 0); i += ((1) >>> 0)) {
      h = (((T.buf[(T.off ?? 0) + __safe_mod((((((key.buf[(key.off ?? 0) + 0]) & 0xFF)) >>> 0) + ((i) >>> 0)), ((256) >>> 0))]) & 0xFF)) & 0xFF;
      for (let j: number = ((1) >>> 0); (((j) >>> 0) < ((length) >>> 0) ? 1 : 0); j += ((1) >>> 0)) {
        h = (((T.buf[(T.off ?? 0) + ((h) & 0xFF) ^ ((key.buf[(key.off ?? 0) + ((j) >>> 0)]) & 0xFF)]) & 0xFF)) & 0xFF;
      }
      result = ((((((result) >>> 0) << 8) >>> 0) | ((((h) & 0xFF)) >>> 0)) >>> 0);
    }
  } while (0);
  return ((result) >>> 0);
}

export function Pearson64(key: any | null, length: number): number {
  if (typeof key === 'string') key = cptr_from_string(key);

  let result: any = 0;
  do {
    let h = 0;
    for (let i: number = ((0) >>> 0); (((i) >>> 0) < 8 ? 1 : 0); i += ((1) >>> 0)) {
      h = (((T.buf[(T.off ?? 0) + __safe_mod((((((key.buf[(key.off ?? 0) + 0]) & 0xFF)) >>> 0) + ((i) >>> 0)), ((256) >>> 0))]) & 0xFF)) & 0xFF;
      for (let j: number = ((1) >>> 0); (((j) >>> 0) < ((length) >>> 0) ? 1 : 0); j += ((1) >>> 0)) {
        h = (((T.buf[(T.off ?? 0) + ((h) & 0xFF) ^ ((key.buf[(key.off ?? 0) + ((j) >>> 0)]) & 0xFF)]) & 0xFF)) & 0xFF;
      }
      result = (__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ result) << __as_bigint(8)))) | __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((h) & 0xFF))));
    }
  } while (0);
  return /* WARNING: 64-bit integer may lose precision beyond 2^53 */ result;
}

export function Pearson(key: any | null, length: number): number {
  if (typeof key === 'string') key = cptr_from_string(key);

  let result = 0;
  do {
    let h = 0;
    for (let i: number = ((0) >>> 0); (((i) >>> 0) < 8 ? 1 : 0); i += ((1) >>> 0)) {
      h = (((T.buf[(T.off ?? 0) + __safe_mod((((((key.buf[(key.off ?? 0) + 0]) & 0xFF)) >>> 0) + ((i) >>> 0)), ((256) >>> 0))]) & 0xFF)) & 0xFF;
      for (let j: number = ((1) >>> 0); (((j) >>> 0) < ((length) >>> 0) ? 1 : 0); j += ((1) >>> 0)) {
        h = (((T.buf[(T.off ?? 0) + ((h) & 0xFF) ^ ((key.buf[(key.off ?? 0) + ((j) >>> 0)]) & 0xFF)]) & 0xFF)) & 0xFF;
      }
      result = (((((result) >>> 0) * Math.pow(2, 8))) | ((((h) & 0xFF)) >>> 0));
    }
  } while (0);
  return ((result) >>> 0);
}

