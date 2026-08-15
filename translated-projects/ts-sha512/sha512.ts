let _Buffer: any = null; // BRIDGE: dropped-file-scope-static — see Rule 41j (lvalue without decl)
let BufferSize: any = null; // BRIDGE: dropped-file-scope-static — see Rule 41j (lvalue without decl)
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
function memcpy(dst: any, src: any, n: number): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 if (dst?.buf && src?.buf) { cptr_copy(dst, src, n); /* C17 §6.7.6.1: when src is a slot-bearing CPtr (T** array), copy the parallel slot references into dst so pointer identity survives the byte-copy. Slot stride is 8 bytes (LLP64 sizeof(void*)); slot indices align with byte offset >> 3. */ if ((src as any).slots) { const dstAny: any = dst; if (!dstAny.slots) dstAny.slots = []; const srcSlotBase = ((src.off ?? 0) >> 3); const dstSlotBase = ((dst.off ?? 0) >> 3); const slotCount = Math.floor(n / 8); for (let i = 0; i < slotCount; i++) dstAny.slots[dstSlotBase + i] = (src as any).slots[srcSlotBase + i] ?? null; } return dst; } if (dst?.buf && typeof src === 'string') { for (let i = 0; i < n && i < src.length; i++) dst.buf[dst.off + i] = src.charCodeAt(i); return dst; } if (dst?.buf && src && typeof src === 'object' && 'value' in src && typeof src.value === 'number') { const dv = new DataView(dst.buf.buffer, dst.buf.byteOffset + dst.off); if (n >= 4) dv.setInt32(0, src.value, true); else if (n >= 2) dv.setInt16(0, src.value, true); else dv.setInt8(0, src.value); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src?.buf) { /* BRIDGE: memcpy(box, cptr, n) — read N bytes from a CPtr into a {value} box. C17 §7.24.2.1. n=8 → bigint64 (signed). n=4 → int32. n=2 → int16. n=1 → int8. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const off = src.off ?? 0; if (n >= 8) { const bv = dv.getBigInt64(off, true); dst.value = (typeof dst.value === 'bigint') ? bv : Number(bv); } else if (n >= 4) dst.value = dv.getInt32(off, true); else if (n >= 2) dst.value = dv.getInt16(off, true); else dst.value = dv.getInt8(off); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src && typeof src === 'object' && 'value' in src) { /* C17 §6.5 type-pun via memcpy: reinterpret src.value bytes as dst's type. n=4: int32<->float32. n=8: int64<->float64 (via bigint). */ const __b = new Uint8Array(8); const __dv = new DataView(__b.buffer); const __s = src.value; const __d = dst.value; if (n === 4) { if (Number.isInteger(__s) && !Number.isInteger(__d) && typeof __d === 'number') { __dv.setInt32(0, __s | 0, true); dst.value = __dv.getFloat32(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat32(0, __s, true); dst.value = __dv.getInt32(0, true); } else { dst.value = __s; } } else if (n === 8) { if (typeof __s === 'bigint' && typeof __d !== 'bigint') { __dv.setBigInt64(0, __s, true); dst.value = __dv.getFloat64(0, true); } else if (typeof __s !== 'bigint' && typeof __d === 'bigint') { __dv.setFloat64(0, Number(__s), true); dst.value = __dv.getBigInt64(0, true); } else if (Number.isInteger(__s) && !Number.isInteger(__d)) { __dv.setBigInt64(0, BigInt(Math.trunc(__s)), true); dst.value = __dv.getFloat64(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat64(0, __s, true); dst.value = Number(__dv.getBigInt64(0, true)); } else { dst.value = __s; } } else { dst.value = __s; } return dst; } if (Array.isArray(dst) && src && src.buf) { /* BRIDGE: memcpy(Array, CPtr, n) — destination is a JS Array decayed from a struct/array of i64/i32/etc., source is a CPtr backed by a Uint8Array. Read element-wise via DataView using src.__elem_size when available, defaulting to 8 (int64 — covers curve25519 fcontract / fmonty origx<-x and BLAKE2 buffer staging). C17 §7.24.2.1: memcpy copies n bytes; element-size routing is the byte-addressable lowering for an i64 destination. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const baseOff = src.off ?? 0; const elemSize = (src.__elem_size as number) || 8; const count = Math.floor(n / elemSize); for (let i = 0; i < count; i++) { const eoff = baseOff + i * elemSize; if (elemSize === 8) dst[i] = dv.getBigInt64(eoff, true); else if (elemSize === 4) dst[i] = dv.getInt32(eoff, true); else if (elemSize === 2) dst[i] = dv.getInt16(eoff, true); else dst[i] = dv.getInt8(eoff); } return dst; } if (Array.isArray(dst) && Array.isArray(src)) { for (let i = 0; i < n; i++) dst[i] = src[i]; } else if (typeof dst === 'object' && typeof src === 'object') Object.assign(dst, src); return dst; }
// C++20 iterator helpers — shared by <algorithm> / <numeric>.
// Lowering: `v[Symbol.iterator]()` to `v.values()` (C++20 §22.3.11). We patch
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
// within the same range. Lowering: it == __cpp_iter(v, v.length) and similar
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
function recv(sockfd: number, buf: any, len: number, flags: number): number { const M=(globalThis as any).__mirage_sockets; if(M&&M.posix_recv)return M.posix_recv(sockfd,buf,len,flags); return -1; }
function fill(first: any, last: any, value: any): void { const A = __cpp_arr(first, last); for (let i = A.start; i < A.end; i++) A.arr[i] = value; }
function max(a: any, b?: any, comp?: Function): any { if (b === undefined) { if (Array.isArray(a)) return a.reduce((m, x) => x > m ? x : m, a[0]); return a; } const lt = comp ?? ((x: any, y: any) => x < y); return lt(a, b) ? b : a; }
function trunc(x: number): number { return Math.trunc(x); }
/* stdbool: true/false are native in TypeScript */
function i32(x: number) { return x | 0; }
function u32(x: number) { return x >>> 0; }
function __as_bigint(x: any): bigint { if (typeof x === 'bigint') return x; if (typeof x === 'number') return BigInt(Math.trunc(x)); if (x && typeof x === 'object' && 'value' in x) { const v = (x as any).value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof x === 'boolean') return x ? 1n : 0n; return BigInt(Math.trunc(Number(x ?? 0))); }
function __u64(x: bigint): any { return BigInt.asUintN(64, x); }
function __i64(x: bigint): any { return BigInt.asIntN(64, x); }
function __safe_div_i64(a: bigint, b: bigint): any { if (b === 0n) throw new Error('Division by zero'); return a / b; }
function __safe_mod_i64(a: bigint, b: bigint): any { if (b === 0n) throw new Error('Division by zero'); return a % b; }

function __struct_ptr_at(p: any, i: any): any { if (p == null) return p; if (i === 0 && typeof p === 'object' && p.__arr === undefined && p.__cptr_overlay !== true && p.__field_ref !== true && p.__field_at_offset !== true && !Array.isArray(p)) return p; const idx = Number(i) | 0; if (Array.isArray(p)) return p[idx]; if (p && p.__arr !== undefined) return p.__arr[(p.__idx ?? 0) + idx]; if (p && p.__cptr_overlay === true && idx !== 0) { return cptr_struct_overlay(p.__structT, p.__cptr, (p.__byteOff ?? 0) + idx * (p.__layout?.totalSize ?? 0)); } if (p && p.__field_ref === true && idx === 0) { /* C17 §6.3.2.3 p7: container_of round-trip recovery. Fire ONLY when explicit pointer arithmetic happened (byte_delta != 0) and the accumulated delta + field_offset cancels to 0. The byte_delta=0 case is direct field-ref dereference (`(&t.f)->subfield`) — the field-ref Proxy itself handles sub-field access via property forwarding, so returning the owner here would incorrectly resolve `(g.nilvalue_field_ref)->value_` to `g.value_` (undefined) instead of `g.nilvalue.value_`. The cast-back form `(T*)((char*)&t.m - offsetof(T,m))` still works through cptr_struct_overlay's separate round-trip path. */ const bd = p.__byte_delta ?? 0; if (bd !== 0 && bd + (p.__field_offset ?? 0) === 0) return p.__owner; } if (p && p.__field_at_offset === true && idx === 0) { /* C17 §6.3.2.3 p7 + §7.19: resolve inverse-container_of shape. byte_offset 0 with cast target == owner's type is round-trip back to owner; otherwise look up the field at byte offset on the owner's class. */ const ctor = p.__owner ? p.__owner.constructor : null; const target = p.__byte_offset ?? 0; if (target === 0 && p.__cast_target === ctor) return p.__owner; if (ctor && ctor.__fieldNames) { if (ctor.__fieldOffsets) { for (let k = 0; k < ctor.__fieldNames.length; k++) { if (ctor.__fieldOffsets[k] === target) return p.__owner[ctor.__fieldNames[k]]; } } else if (ctor.__fieldTypes) { const SZ: any = { bool:1, int8:1, uint8:1, char:1, bytes:1, int16:2, uint16:2, int32:4, uint32:4, float:4, int64:8, uint64:8, double:8, ptr:8 }; let off = 0; for (let k = 0; k < ctor.__fieldNames.length; k++) { if (off === target) return p.__owner[ctor.__fieldNames[k]]; off += SZ[ctor.__fieldTypes[k]] ?? 4; } } } if (target === 0) return p.__owner; } return p; }
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
  // Union totalSize override: registered union arms (routed via the
  // __rt_union_field_class Proxy) aren't included in fields[] so
  // the max-size sweep above underestimates. T.__sizeof carries the
  // emitter-computed size (computeStructSize) so dynamic-array stride
  // (`__struct_ptr_advance(arr, n) = n * totalSize`) is correct.
  if (isUnion && typeof T.__sizeof === 'number' && T.__sizeof > off) off = T.__sizeof;
  T.__overlay_layout = { fields, totalSize: off };
  return T.__overlay_layout;
}
function cptr_struct_overlay(T: any, p: any, byteOff?: number): any {
  if (typeof p === 'string') p = cptr_from_string(p);

  if (p == null) return p;
  // C17 §6.7.2.1 + ECMAScript §6.1.7 object identity: when the
  // same byte range is overlaid as the same struct type T from
  // different call sites (e.g. `gco2ts(o)` in createstrobj vs
  // freeobj), return the SAME Proxy so identity comparisons and
  // proxy-cache stampings persist. Cache keyed by (p.buf,
  // p.off + byteOff, T) using a WeakMap on p.buf so dead buffers
  // are GC'd along with their overlay views.
  const _buf = (p as any)?.buf;
  if (_buf && _buf instanceof Uint8Array) {
    const _gOff = ((p as any).off ?? 0) + (byteOff ?? 0);
    const _gReg: WeakMap<Uint8Array, Map<string, any>> = (globalThis as any).__rt_overlay_cache ??= new WeakMap();
    let _bufMap = _gReg.get(_buf);
    if (_bufMap) {
      const _key = (T && (T.name ?? '')) + '@' + _gOff;
      const _cached = _bufMap.get(_key);
      if (_cached) return _cached;
    }
  }
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
  // Side-table for pointer-typed fields stored in 8-byte slots.
  // C17 §6.7.2.1: a struct field of pointer type occupies the same
  // storage as a 64-bit integer on LLP64/LP64 platforms, so the
  // layout classifier maps it to `int64`. But the runtime value is
  // an object reference (JS-class instance, CPtr, slot-bearing
  // pointer-array, or null) — not serialisable to bytes. Keep the
  // reference in a per-overlay side-table keyed by (baseByteOff +
  // offset), and prefer it on read so writes/reads round-trip.
  // Sharing the side-table across overlays that observe the same
  // (buf, baseByteOff) keeps cross-view aliasing correct: stash
  // the table on p.buf so any overlay over the same underlying
  // buffer sees the same references.
  if (!(p.buf as any).__overlay_refs) (p.buf as any).__overlay_refs = new Map<number, any>();
  const __refs = (p.buf as any).__overlay_refs as Map<number, any>;
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
          case 'int32': { const refAt = (p.off ?? 0) + baseByteOff + off; if (__refs.has(refAt)) return __refs.get(refAt); const intVal = ((buf[at] & 0xFF) | ((buf[at+1] & 0xFF) << 8) | ((buf[at+2] & 0xFF) << 16) | ((buf[at+3] & 0xFF) << 24)) | 0; if (intVal === 0) { /* C17 §6.7.2.1: anon-struct / anon-union sub-fields of a struct lay out as an inline nested aggregate but the layout-classifier maps them to int32 (a size-only proxy). When the bytes are still at the default state (0), lazy-materialise the sub-struct instance using T's default ctor field. This restores `.u.hnext`-style sub-field access for the union-cast overlay. */ try { const proto = (T as any).__defaults ?? ((T as any).__defaults = new T()); const def = (proto as any)[name]; if (def !== undefined && def !== null && typeof def === 'object') { const inst = (typeof def.constructor === 'function' && def.constructor !== Object && def.constructor !== Array) ? new def.constructor() : (Array.isArray(def) ? [] : {}); __refs.set(refAt, inst); return inst; } } catch {} } return intVal; }
          case 'int64': { const refAt = (p.off ?? 0) + baseByteOff + off; if (__refs.has(refAt)) return __refs.get(refAt); const lo = ((buf[at] & 0xFF) | ((buf[at+1] & 0xFF) << 8) | ((buf[at+2] & 0xFF) << 16)) + ((buf[at+3] & 0xFF) * 0x1000000); const hi = ((buf[at+4] & 0xFF) | ((buf[at+5] & 0xFF) << 8) | ((buf[at+6] & 0xFF) << 16)) + ((buf[at+7] & 0xFF) * 0x1000000); const intVal = lo + hi * 0x100000000; if (intVal === 0) { /* C17 §6.7.2.1: a struct field of struct/union type (e.g. lua_State.top is a StkIdRel sub-union with .p pointer) is layout-classified as int64 (8 bytes); at the default state (zero bytes), lazy-materialise the sub-struct so subsequent `.field = v` assignments persist via the cached reference. */ try { const proto = (T as any).__defaults ?? ((T as any).__defaults = new T()); const def = (proto as any)[name]; if (def !== undefined && def !== null && typeof def === 'object') { const inst = (typeof def.constructor === 'function' && def.constructor !== Object && def.constructor !== Array) ? new def.constructor() : (Array.isArray(def) ? [] : {}); __refs.set(refAt, inst); return inst; } } catch {} } return intVal; }
          case 'float': { const dv = new DataView(new ArrayBuffer(4)); for (let k = 0; k < 4; k++) dv.setUint8(k, buf[at+k] & 0xFF); return dv.getFloat32(0, true); }
          case 'double': { const dv = new DataView(new ArrayBuffer(8)); for (let k = 0; k < 8; k++) dv.setUint8(k, buf[at+k] & 0xFF); return dv.getFloat64(0, true); }
          case 'bytes': { const __byteBase = (p.off ?? 0) + baseByteOff + off; return new Proxy({} as any, { get: (_t, k) => { if (k === 'buf') return buf; if (k === 'off') return at; const ii = Number(k); if (!isNaN(ii)) { /* C17 §6.7.2.1 + §6.5.6: a struct trailing flex-array of pointers (`T *arr[N]`) is layout-classified as `bytes` (no per-slot type info). When the consumer stored an object reference, return it. Slot stride is 8 (LLP64 sizeof(void*)). */ const refAt = __byteBase + ii * 8; if (__refs.has(refAt)) return __refs.get(refAt); return buf[at + ii] & 0xFF; } return undefined; }, set: (_t, k, val) => { const ii = Number(k); if (!isNaN(ii)) { if (val !== null && typeof val === 'object') { const refAt = __byteBase + ii * 8; __refs.set(refAt, val); return true; } if (val === null) { const refAt = __byteBase + ii * 8; __refs.set(refAt, null); return true; } buf[at + ii] = Number(val) & 0xFF; } return true; } }); }
        }
        return undefined;
      },
      set(val: any): void {
        const buf = p.buf; const at = (p.off ?? 0) + baseByteOff + off;
        switch (ty) {
          case 'bool': case 'int8': { const v = Number(val) | 0; buf[at] = v & 0xFF; return; }
          case 'int16': { const v = Number(val) | 0; buf[at] = v & 0xFF; buf[at+1] = (v >> 8) & 0xFF; return; }
          case 'int32': { const refAt = (p.off ?? 0) + baseByteOff + off; if (val !== null && typeof val === 'object') { __refs.set(refAt, val); return; } if (val === null) { __refs.set(refAt, null); return; } __refs.delete(refAt); const v = Number(val) | 0; buf[at] = v & 0xFF; buf[at+1] = (v >> 8) & 0xFF; buf[at+2] = (v >> 16) & 0xFF; buf[at+3] = (v >> 24) & 0xFF; return; }
          case 'int64': { const refAt = (p.off ?? 0) + baseByteOff + off; if (val !== null && typeof val === 'object') { __refs.set(refAt, val); return; } if (val === undefined || (typeof val === 'number' && Number.isNaN(val))) { __refs.delete(refAt); for (let k = 0; k < 8; k++) buf[at+k] = 0; return; } if (val === null) { __refs.set(refAt, null); return; } __refs.delete(refAt); let big = typeof val === 'bigint' ? val : BigInt(Math.trunc(Number(val))); for (let k = 0; k < 8; k++) { buf[at+k] = Number(big & 0xFFn) & 0xFF; big = big >> 8n; } return; }
          case 'float': { const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, Number(val), true); for (let k = 0; k < 4; k++) buf[at+k] = dv.getUint8(k); return; }
          case 'double': { const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, Number(val), true); for (let k = 0; k < 8; k++) buf[at+k] = dv.getUint8(k); return; }
        }
      },
    });
  }
  // C17 §6.7.2.1 union-member-cast (value position): wrap the
  // view in a Proxy that intercepts unknown property reads. When a
  // missing property name is registered in
  // (globalThis as any).__rt_union_field_class as a sibling
  // struct/class type (populated at union emit), synthesise a
  // cptr_struct_overlay of that class over the same bytes and
  // cache it on the view so subsequent reads round-trip. This
  // unblocks `((GCUnion*)gco)->cl.l`-style direct member chains.
  const _result = new Proxy(view, {
    get(target, prop, recv) {
      if (typeof prop !== 'string') return Reflect.get(target, prop, recv);
      // CPtr-compat: expose .buf / .off from the underlying byte CPtr so
      // overlay values flow through realloc/grow chains that expect
      // {buf, off} (e.g. Lua's luaM_saferealloc_).
      if (prop === 'buf') return p.buf;
      if (prop === 'off') return ((p.off ?? 0) + ((target as any).__byteOff ?? 0));
      if (prop in target) return (target as any)[prop];
      const reg = (globalThis as any).__rt_union_field_class;
      if (!reg) return undefined;
      const className = reg[prop];
      if (!className) return undefined;
      const Ctor = (globalThis as any)['__lazy_' + className];
      if (typeof Ctor !== 'function') return undefined;
      const cached = (target as any).__cptr_union_cache?.[prop];
      if (cached) return cached;
      const sub = cptr_struct_overlay(Ctor, p, baseByteOff);
      ((target as any).__cptr_union_cache ??= {})[prop] = sub;
      return sub;
    },
    set(target, prop, val, recv) {
      if (typeof prop !== 'string') return Reflect.set(target, prop, val, recv);
      if (prop in target) { (target as any)[prop] = val; return true; }
      (target as any)[prop] = val;
      return true;
    },
    has(target, prop) {
      if (prop in target) return true;
      const reg = (globalThis as any).__rt_union_field_class;
      return !!(reg && typeof prop === 'string' && reg[prop]);
    },
  });
  if (_buf && _buf instanceof Uint8Array) {
    const _gOff = ((p as any).off ?? 0) + (byteOff ?? 0);
    const _gReg: WeakMap<Uint8Array, Map<string, any>> = (globalThis as any).__rt_overlay_cache ??= new WeakMap();
    let _bufMap = _gReg.get(_buf);
    if (!_bufMap) { _bufMap = new Map(); _gReg.set(_buf, _bufMap); }
    const _key = (T && (T.name ?? '')) + '@' + _gOff;
    _bufMap.set(_key, _result);
  }
  return _result;
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class Sha512Context {
  [k: string]: any;
  length: number;
  state: any = new Array(8).fill(0);
  curlen: number;
  buf: any = cptr_create(128);
  constructor() {
    this.length = 0;
    this.state = new Array(8).fill(0);
    this.curlen = 0;
    this.buf = cptr_create(128);
  }
}
(Sha512Context as any).__fieldTypes = ["int64","bytes","int32","bytes"];
(Sha512Context as any).__fieldNames = ["length","state","curlen","buf"];
(Sha512Context as any).__fieldOffsets = [0,8,72,76];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class SHA512_HASH {
  [k: string]: any;
  bytes: any = cptr_create(64);
  constructor() {
    this.bytes = cptr_create(64);
  }
}
(SHA512_HASH as any).__fieldTypes = ["bytes"];
(SHA512_HASH as any).__fieldNames = ["bytes"];
(SHA512_HASH as any).__fieldOffsets = [0];

let K: any = [4794697086780616226n, 8158064640168781261n, 13096744586834688815n, 16840607885511220156n, 4131703408338449720n, 6480981068601479193n, 10538285296894168987n, 12329834152419229976n, 15566598209576043074n, 1334009975649890238n, 2608012711638119052n, 6128411473006802146n, 8268148722764581231n, 9286055187155687089n, 11230858885718282805n, 13951009754708518548n, 16472876342353939154n, 17275323862435702243n, 1135362057144423861n, 2597628984639134821n, 3308224258029322869n, 5365058923640841347n, 6679025012923562964n, 8573033837759648693n, 10970295158949994411n, 12119686244451234320n, 12683024718118986047n, 13788192230050041572n, 14330467153632333762n, 15395433587784984357n, 489312712824947311n, 1452737877330783856n, 2861767655752347644n, 3322285676063803686n, 5560940570517711597n, 5996557281743188959n, 7280758554555802590n, 8532644243296465576n, 9350256976987008742n, 10552545826968843579n, 11727347734174303076n, 12113106623233404929n, 14000437183269869457n, 14369950271660146224n, 15101387698204529176n, 15463397548674623760n, 17586052441742319658n, 1182934255886127544n, 1847814050463011016n, 2177327727835720531n, 2830643537854262169n, 3796741975233480872n, 4115178125766777443n, 5681478168544905931n, 6601373596472566643n, 7507060721942968483n, 8399075790359081724n, 8693463985226723168n, 9568029438360202098n, 10144078919501101548n, 10430055236837252648n, 11840083180663258601n, 13761210420658862357n, 14299343276471374635n, 14566680578165727644n, 15097957966210449927n, 16922976911328602910n, 17689382322260857208n, 500013540394364858n, 748580250866718886n, 1242879168328830382n, 1977374033974150939n, 2944078676154940804n, 3659926193048069267n, 4368137639120453308n, 4836135668995329356n, 5532061633213252278n, 6448918945643986474n, 6902733635092675308n, 7801388544844847127n];
function TransformFunction(Context: Sha512Context | null, _Buffer: any | null): void {
  let S = new Array(8).fill(0);
  let W = new Array(80).fill(0);
  let t0: any = 0;
  let t1: any = 0;
  let i = 0;
  for (i = 0; (i < 8 ? 1 : 0); i++) {
    S[i] = /* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(Context, 0)).state[i];
  }
  for (i = 0; (i < 16 ? 1 : 0); i++) {
    {
      {
        W[i] = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(((((cptr_offset(_Buffer, (Math.imul(8, i)))).buf[((cptr_offset(_Buffer, (Math.imul(8, i)))).off ?? 0) + 0]) & 0xFF) & 255))))) << __as_bigint(56)))) | __as_bigint((__u64(__as_bigint((__u64(__as_bigint(((((cptr_offset(_Buffer, (Math.imul(8, i)))).buf[((cptr_offset(_Buffer, (Math.imul(8, i)))).off ?? 0) + 1]) & 0xFF) & 255))))) << __as_bigint(48)))))) | __as_bigint((__u64(__as_bigint((__u64(__as_bigint(((((cptr_offset(_Buffer, (Math.imul(8, i)))).buf[((cptr_offset(_Buffer, (Math.imul(8, i)))).off ?? 0) + 2]) & 0xFF) & 255))))) << __as_bigint(40)))))) | __as_bigint((__u64(__as_bigint((__u64(__as_bigint(((((cptr_offset(_Buffer, (Math.imul(8, i)))).buf[((cptr_offset(_Buffer, (Math.imul(8, i)))).off ?? 0) + 3]) & 0xFF) & 255))))) << __as_bigint(32)))))) | __as_bigint((__u64(__as_bigint((__u64(__as_bigint(((((cptr_offset(_Buffer, (Math.imul(8, i)))).buf[((cptr_offset(_Buffer, (Math.imul(8, i)))).off ?? 0) + 4]) & 0xFF) & 255))))) << __as_bigint(24)))))) | __as_bigint((__u64(__as_bigint((__u64(__as_bigint(((((cptr_offset(_Buffer, (Math.imul(8, i)))).buf[((cptr_offset(_Buffer, (Math.imul(8, i)))).off ?? 0) + 5]) & 0xFF) & 255))))) << __as_bigint(16)))))) | __as_bigint((__u64(__as_bigint((__u64(__as_bigint(((((cptr_offset(_Buffer, (Math.imul(8, i)))).buf[((cptr_offset(_Buffer, (Math.imul(8, i)))).off ?? 0) + 6]) & 0xFF) & 255))))) << __as_bigint(8)))))) | __as_bigint(((__u64(__as_bigint(((((cptr_offset(_Buffer, (Math.imul(8, i)))).buf[((cptr_offset(_Buffer, (Math.imul(8, i)))).off ?? 0) + 7]) & 0xFF) & 255)))))));
      }
    }
  }
  for (i = 16; (i < 80 ? 1 : 0); i++) {
    W[i] = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (W[i32(i - 2)]))) >> __as_bigint((19))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (W[i32(i - 2)])) << __as_bigint((i32(64 - (19)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (W[i32(i - 2)]))) >> __as_bigint((61))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (W[i32(i - 2)])) << __as_bigint((i32(64 - (61)))))))))))) ^ __as_bigint((__u64(__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (W[i32(i - 2)])) & __as_bigint(18446744073709551615n))))) >> __as_bigint((__u64(__as_bigint(6)))))))))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ W[i32(i - 7)]))) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (W[i32(i - 15)]))) >> __as_bigint((1))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (W[i32(i - 15)])) << __as_bigint((i32(64 - (1)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (W[i32(i - 15)]))) >> __as_bigint((8))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (W[i32(i - 15)])) << __as_bigint((i32(64 - (8)))))))))))) ^ __as_bigint((__u64(__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (W[i32(i - 15)])) & __as_bigint(18446744073709551615n))))) >> __as_bigint((__u64(__as_bigint(7)))))))))))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ W[i32(i - 16)]));
  }
  for (i = 0; (i < 80 ? 1 : 0); i = i32(i + 8)) {
    t0 = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[7]) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4]))) >> __as_bigint((14))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4])) << __as_bigint((i32(64 - (14)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4]))) >> __as_bigint((18))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4])) << __as_bigint((i32(64 - (18)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4]))) >> __as_bigint((41))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4])) << __as_bigint((i32(64 - (41))))))))))))))) + __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[6]) ^ __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[4]) & __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[5]) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[6])))))))))))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ K[i32(i + 0)]))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ W[i32(i + 0)]));
    t1 = __u64(__as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0]))) >> __as_bigint((28))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0])) << __as_bigint((i32(64 - (28)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0]))) >> __as_bigint((34))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0])) << __as_bigint((i32(64 - (34)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0]))) >> __as_bigint((39))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0])) << __as_bigint((i32(64 - (39))))))))))))) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[0]) | __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[1])))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[2])))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[0]) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[1]))))))));
    S[3] = __u64(__as_bigint(S[3]) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0));
    S[7] = __u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t1));
    t0 = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[6]) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3]))) >> __as_bigint((14))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3])) << __as_bigint((i32(64 - (14)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3]))) >> __as_bigint((18))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3])) << __as_bigint((i32(64 - (18)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3]))) >> __as_bigint((41))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3])) << __as_bigint((i32(64 - (41))))))))))))))) + __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[5]) ^ __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[3]) & __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[4]) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[5])))))))))))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ K[i32(i + 1)]))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ W[i32(i + 1)]));
    t1 = __u64(__as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7]))) >> __as_bigint((28))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7])) << __as_bigint((i32(64 - (28)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7]))) >> __as_bigint((34))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7])) << __as_bigint((i32(64 - (34)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7]))) >> __as_bigint((39))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7])) << __as_bigint((i32(64 - (39))))))))))))) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[7]) | __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[0])))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[1])))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[7]) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[0]))))))));
    S[2] = __u64(__as_bigint(S[2]) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0));
    S[6] = __u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t1));
    t0 = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[5]) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2]))) >> __as_bigint((14))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2])) << __as_bigint((i32(64 - (14)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2]))) >> __as_bigint((18))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2])) << __as_bigint((i32(64 - (18)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2]))) >> __as_bigint((41))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2])) << __as_bigint((i32(64 - (41))))))))))))))) + __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[4]) ^ __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[2]) & __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[3]) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[4])))))))))))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ K[i32(i + 2)]))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ W[i32(i + 2)]));
    t1 = __u64(__as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6]))) >> __as_bigint((28))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6])) << __as_bigint((i32(64 - (28)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6]))) >> __as_bigint((34))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6])) << __as_bigint((i32(64 - (34)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6]))) >> __as_bigint((39))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6])) << __as_bigint((i32(64 - (39))))))))))))) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[6]) | __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[7])))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[0])))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[6]) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[7]))))))));
    S[1] = __u64(__as_bigint(S[1]) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0));
    S[5] = __u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t1));
    t0 = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[4]) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1]))) >> __as_bigint((14))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1])) << __as_bigint((i32(64 - (14)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1]))) >> __as_bigint((18))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1])) << __as_bigint((i32(64 - (18)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1]))) >> __as_bigint((41))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1])) << __as_bigint((i32(64 - (41))))))))))))))) + __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[3]) ^ __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[1]) & __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[2]) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[3])))))))))))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ K[i32(i + 3)]))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ W[i32(i + 3)]));
    t1 = __u64(__as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5]))) >> __as_bigint((28))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5])) << __as_bigint((i32(64 - (28)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5]))) >> __as_bigint((34))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5])) << __as_bigint((i32(64 - (34)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5]))) >> __as_bigint((39))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5])) << __as_bigint((i32(64 - (39))))))))))))) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[5]) | __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[6])))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[7])))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[5]) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[6]))))))));
    S[0] = __u64(__as_bigint(S[0]) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0));
    S[4] = __u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t1));
    t0 = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[3]) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0]))) >> __as_bigint((14))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0])) << __as_bigint((i32(64 - (14)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0]))) >> __as_bigint((18))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0])) << __as_bigint((i32(64 - (18)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0]))) >> __as_bigint((41))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[0])) << __as_bigint((i32(64 - (41))))))))))))))) + __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[2]) ^ __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[0]) & __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[1]) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[2])))))))))))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ K[i32(i + 4)]))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ W[i32(i + 4)]));
    t1 = __u64(__as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4]))) >> __as_bigint((28))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4])) << __as_bigint((i32(64 - (28)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4]))) >> __as_bigint((34))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4])) << __as_bigint((i32(64 - (34)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4]))) >> __as_bigint((39))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[4])) << __as_bigint((i32(64 - (39))))))))))))) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[4]) | __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[5])))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[6])))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[4]) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[5]))))))));
    S[7] = __u64(__as_bigint(S[7]) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0));
    S[3] = __u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t1));
    t0 = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[2]) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7]))) >> __as_bigint((14))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7])) << __as_bigint((i32(64 - (14)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7]))) >> __as_bigint((18))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7])) << __as_bigint((i32(64 - (18)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7]))) >> __as_bigint((41))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[7])) << __as_bigint((i32(64 - (41))))))))))))))) + __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[1]) ^ __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[7]) & __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[0]) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[1])))))))))))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ K[i32(i + 5)]))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ W[i32(i + 5)]));
    t1 = __u64(__as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3]))) >> __as_bigint((28))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3])) << __as_bigint((i32(64 - (28)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3]))) >> __as_bigint((34))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3])) << __as_bigint((i32(64 - (34)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3]))) >> __as_bigint((39))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[3])) << __as_bigint((i32(64 - (39))))))))))))) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[3]) | __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[4])))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[5])))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[3]) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[4]))))))));
    S[6] = __u64(__as_bigint(S[6]) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0));
    S[2] = __u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t1));
    t0 = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[1]) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6]))) >> __as_bigint((14))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6])) << __as_bigint((i32(64 - (14)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6]))) >> __as_bigint((18))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6])) << __as_bigint((i32(64 - (18)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6]))) >> __as_bigint((41))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[6])) << __as_bigint((i32(64 - (41))))))))))))))) + __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[0]) ^ __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[6]) & __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[7]) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[0])))))))))))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ K[i32(i + 6)]))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ W[i32(i + 6)]));
    t1 = __u64(__as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2]))) >> __as_bigint((28))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2])) << __as_bigint((i32(64 - (28)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2]))) >> __as_bigint((34))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2])) << __as_bigint((i32(64 - (34)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2]))) >> __as_bigint((39))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[2])) << __as_bigint((i32(64 - (39))))))))))))) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[2]) | __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[3])))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[4])))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[2]) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[3]))))))));
    S[5] = __u64(__as_bigint(S[5]) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0));
    S[1] = __u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t1));
    t0 = __u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[0]) + __as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5]))) >> __as_bigint((14))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5])) << __as_bigint((i32(64 - (14)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5]))) >> __as_bigint((18))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5])) << __as_bigint((i32(64 - (18)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5]))) >> __as_bigint((41))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[5])) << __as_bigint((i32(64 - (41))))))))))))))) + __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[7]) ^ __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[5]) & __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[6]) ^ __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[7])))))))))))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ K[i32(i + 7)]))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ W[i32(i + 7)]));
    t1 = __u64(__as_bigint((__u64(__as_bigint(__u64(__as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1]))) >> __as_bigint((28))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1])) << __as_bigint((i32(64 - (28)))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1]))) >> __as_bigint((34))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1])) << __as_bigint((i32(64 - (34)))))))))))) ^ __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1]))) >> __as_bigint((39))))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (S[1])) << __as_bigint((i32(64 - (39))))))))))))) + __as_bigint((__u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[1]) | __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[2])))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[3])))) | __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[1]) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[2]))))))));
    S[4] = __u64(__as_bigint(S[4]) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0));
    S[0] = __u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t0) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ t1));
  }
  for (i = 0; (i < 8 ? 1 : 0); i++) {
    (__struct_ptr_at(Context, 0)).state[i] = __u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(Context, 0)).state[i]) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ S[i]));
  }
}

export function Sha512Initialise(Context: Sha512Context | null): void {
  (__struct_ptr_at(Context, 0)).curlen = ((0) >>> 0);
  (__struct_ptr_at(Context, 0)).length = /* WARNING: 64-bit integer may lose precision beyond 2^53 */ 0;
  (__struct_ptr_at(Context, 0)).state[0] = 7640891576956012808n;
  (__struct_ptr_at(Context, 0)).state[1] = 13503953896175478587n;
  (__struct_ptr_at(Context, 0)).state[2] = 4354685564936845355n;
  (__struct_ptr_at(Context, 0)).state[3] = 11912009170470909681n;
  (__struct_ptr_at(Context, 0)).state[4] = 5840696475078001361n;
  (__struct_ptr_at(Context, 0)).state[5] = 11170449401992604703n;
  (__struct_ptr_at(Context, 0)).state[6] = 2270897969802886507n;
  (__struct_ptr_at(Context, 0)).state[7] = 6620516959819538809n;
}

export function Sha512Update(Context: Sha512Context | null, _Buffer: any | null, BufferSize: number): void {
  let n = 0;
  if (((((__struct_ptr_at(Context, 0)).curlen) >>> 0) > 1024 ? 1 : 0)) {
    return;
  }
  while ((((BufferSize) >>> 0) > ((0) >>> 0) ? 1 : 0)) {
    if (((((((__struct_ptr_at(Context, 0)).curlen) >>> 0) == ((0) >>> 0) ? 1 : 0) && (((BufferSize) >>> 0) >= ((128) >>> 0) ? 1 : 0)) ? 1 : 0)) {
      TransformFunction(Context, cptr_clone((_Buffer)));
      (__struct_ptr_at(Context, 0)).length = __u64(__as_bigint((__struct_ptr_at(Context, 0)).length) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ Math.imul(128, 8)));
      _Buffer = cptr_offset((_Buffer), 128);
      BufferSize = u32(BufferSize - ((128) >>> 0));
    } else {
      n = (((((((BufferSize)) >>> 0) < ((u32(((128) >>> 0) - (((__struct_ptr_at(Context, 0)).curlen) >>> 0)))) ? 1 : 0)) ? (((BufferSize)) >>> 0) : ((u32(((128) >>> 0) - (((__struct_ptr_at(Context, 0)).curlen) >>> 0))))));
      memcpy(cptr_offset((__struct_ptr_at(Context, 0)).buf, (((__struct_ptr_at(Context, 0)).curlen) >>> 0)), _Buffer, ((Math.trunc(+(((n) >>> 0)))) >>> 0));
      (__struct_ptr_at(Context, 0)).curlen = u32((__struct_ptr_at(Context, 0)).curlen + ((n) >>> 0));
      _Buffer = cptr_offset((_Buffer), ((n) >>> 0));
      BufferSize = u32(BufferSize - ((n) >>> 0));
      if (((((__struct_ptr_at(Context, 0)).curlen) >>> 0) == ((128) >>> 0) ? 1 : 0)) {
        TransformFunction(Context, cptr_clone((__struct_ptr_at(Context, 0)).buf));
        (__struct_ptr_at(Context, 0)).length = __u64(__as_bigint((__struct_ptr_at(Context, 0)).length) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ Math.imul(8, 128)));
        (__struct_ptr_at(Context, 0)).curlen = ((0) >>> 0);
      }
    }
  }
}

export function Sha512Finalise(Context: Sha512Context | null, Digest: SHA512_HASH | null): void {
  let i = 0;
  if (((((__struct_ptr_at(Context, 0)).curlen) >>> 0) >= 1024 ? 1 : 0)) {
    return;
  }
  (__struct_ptr_at(Context, 0)).length = __u64(__as_bigint((__struct_ptr_at(Context, 0)).length) + __as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (((__struct_ptr_at(Context, 0)).curlen) >>> 0)) * __as_bigint(8n))));
  (__struct_ptr_at(Context, 0)).buf.buf[((__struct_ptr_at(Context, 0)).buf.off ?? 0) + (() => { const _t = (__struct_ptr_at(Context, 0)).curlen; (__struct_ptr_at(Context, 0)).curlen = u32((__struct_ptr_at(Context, 0)).curlen + 1); return _t; })()] = (((Math.trunc(+(128))) & 0xFF)) & 0xFF;
  if (((((__struct_ptr_at(Context, 0)).curlen) >>> 0) > ((112) >>> 0) ? 1 : 0)) {
    while (((((__struct_ptr_at(Context, 0)).curlen) >>> 0) < ((128) >>> 0) ? 1 : 0)) {
      (__struct_ptr_at(Context, 0)).buf.buf[((__struct_ptr_at(Context, 0)).buf.off ?? 0) + (() => { const _t = (__struct_ptr_at(Context, 0)).curlen; (__struct_ptr_at(Context, 0)).curlen = u32((__struct_ptr_at(Context, 0)).curlen + 1); return _t; })()] = (((Math.trunc(+(0))) & 0xFF)) & 0xFF;
    }
    TransformFunction(Context, cptr_clone((__struct_ptr_at(Context, 0)).buf));
    (__struct_ptr_at(Context, 0)).curlen = ((0) >>> 0);
  }
  while (((((__struct_ptr_at(Context, 0)).curlen) >>> 0) < ((120) >>> 0) ? 1 : 0)) {
    (__struct_ptr_at(Context, 0)).buf.buf[((__struct_ptr_at(Context, 0)).buf.off ?? 0) + (() => { const _t = (__struct_ptr_at(Context, 0)).curlen; (__struct_ptr_at(Context, 0)).curlen = u32((__struct_ptr_at(Context, 0)).curlen + 1); return _t; })()] = (((Math.trunc(+(0))) & 0xFF)) & 0xFF;
  }
  {
    (cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).buf[((cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).off ?? 0) + 0] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).length))) >> __as_bigint(56)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
    (cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).buf[((cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).off ?? 0) + 1] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).length))) >> __as_bigint(48)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
    (cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).buf[((cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).off ?? 0) + 2] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).length))) >> __as_bigint(40)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
    (cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).buf[((cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).off ?? 0) + 3] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).length))) >> __as_bigint(32)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
    (cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).buf[((cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).off ?? 0) + 4] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).length))) >> __as_bigint(24)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
    (cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).buf[((cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).off ?? 0) + 5] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).length))) >> __as_bigint(16)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
    (cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).buf[((cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).off ?? 0) + 6] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).length))) >> __as_bigint(8)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
    (cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).buf[((cptr_offset((__struct_ptr_at(Context, 0)).buf, 120)).off ?? 0) + 7] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).length)) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
  }
  TransformFunction(Context, cptr_clone((__struct_ptr_at(Context, 0)).buf));
  for (i = 0; (i < 8 ? 1 : 0); i++) {
    {
      {
        (cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).buf[((cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).off ?? 0) + 0] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).state[i]))) >> __as_bigint(56)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
        (cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).buf[((cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).off ?? 0) + 1] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).state[i]))) >> __as_bigint(48)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
        (cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).buf[((cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).off ?? 0) + 2] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).state[i]))) >> __as_bigint(40)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
        (cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).buf[((cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).off ?? 0) + 3] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).state[i]))) >> __as_bigint(32)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
        (cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).buf[((cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).off ?? 0) + 4] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).state[i]))) >> __as_bigint(24)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
        (cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).buf[((cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).off ?? 0) + 5] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).state[i]))) >> __as_bigint(16)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
        (cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).buf[((cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).off ?? 0) + 6] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).state[i]))) >> __as_bigint(8)))) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
        (cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).buf[((cptr_offset((__struct_ptr_at(Digest, 0)).bytes, (Math.imul(8, i)))).off ?? 0) + 7] = (((Number(BigInt.asIntN(32, __as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ ((__struct_ptr_at(Context, 0)).state[i])) & __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 255))))))) & 0xFF)) & 0xFF;
      }
    }
  }
}

export function Sha512Calculate(_Buffer: any | null, BufferSize: number, Digest: SHA512_HASH | null): void {
  let context = new Sha512Context();
  Sha512Initialise(context);
  Sha512Update(context, _Buffer, ((BufferSize) >>> 0));
  Sha512Finalise(context, Digest);
}

