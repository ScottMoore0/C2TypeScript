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
// C17 paragraph 6.3.2.3 p7: numeric-array to byte-pointer cast produces a LIVE
// byte alias. Reads through the alias must reflect current source-array values
// because the source may be mutated in place after the alias is captured.
// A snapshot Uint8Array would go stale; a Proxy that consults the source array
// on each access stays live and works under cptr_offset and cptr_read_ helpers.
function __cptr_byte_view_live(arr: any[], elemSize: number): any {
  const existing = (arr as any).__cptr_byte_view_live;
  if (existing && existing.__src_arr === arr && existing.__elem_size === elemSize) return existing;
  const buf: any = new Proxy({}, {
    get(_t: any, prop: any): any {
      if (prop === 'length') return arr.length * elemSize;
      if (prop === 'buffer' || prop === 'byteOffset' || prop === 'byteLength') {
        // Fallback: materialise a fresh snapshot for DataView consumers.
        const b = new Uint8Array(arr.length * elemSize);
        const v = new DataView(b.buffer);
        if (elemSize === 8) {
          for (let i = 0; i < arr.length; i++) {
            const x = arr[i];
            v.setBigUint64(i * 8, BigInt.asUintN(64, typeof x === 'bigint' ? x : BigInt(Math.trunc(Number(x ?? 0)))), true);
          }
        } else if (elemSize === 4) {
          for (let i = 0; i < arr.length; i++) v.setUint32(i * 4, (Number(arr[i] ?? 0) >>> 0), true);
        } else if (elemSize === 2) {
          for (let i = 0; i < arr.length; i++) v.setUint16(i * 2, (Number(arr[i] ?? 0) & 0xFFFF), true);
        } else {
          for (let i = 0; i < arr.length; i++) b[i] = Number(arr[i] ?? 0) & 0xFF;
        }
        return prop === 'buffer' ? b.buffer : (prop === 'byteOffset' ? 0 : b.byteLength);
      }
      const idx = typeof prop === 'symbol' ? NaN : Number(prop);
      if (!Number.isFinite(idx) || idx < 0 || (idx | 0) !== idx) return undefined;
      const elemIdx = (idx / elemSize) | 0;
      const byteInElem = idx - elemIdx * elemSize;
      if (elemIdx < 0 || elemIdx >= arr.length) return 0;
      const x = arr[elemIdx];
      if (elemSize === 8) {
        const big = typeof x === 'bigint' ? BigInt.asUintN(64, x) : BigInt.asUintN(64, BigInt(Math.trunc(Number(x ?? 0))));
        return Number((big >> BigInt(byteInElem * 8)) & 0xFFn);
      }
      const v = (Number(x ?? 0) >>> 0);
      return (v >>> (byteInElem * 8)) & 0xFF;
    },
    set(_t: any, prop: any, val: any): boolean {
      const idx = typeof prop === 'symbol' ? NaN : Number(prop);
      if (!Number.isFinite(idx) || idx < 0 || (idx | 0) !== idx) return true;
      const elemIdx = (idx / elemSize) | 0;
      const byteInElem = idx - elemIdx * elemSize;
      if (elemIdx < 0 || elemIdx >= arr.length) return true;
      if (elemSize === 8) {
        const cur = typeof arr[elemIdx] === 'bigint' ? BigInt.asUintN(64, arr[elemIdx]) : BigInt.asUintN(64, BigInt(Math.trunc(Number(arr[elemIdx] ?? 0))));
        const shift = BigInt(byteInElem * 8);
        const mask = ~(0xFFn << shift) & 0xFFFFFFFFFFFFFFFFn;
        arr[elemIdx] = (cur & mask) | ((BigInt(Number(val) & 0xFF)) << shift);
      } else {
        const cur = (Number(arr[elemIdx] ?? 0) >>> 0);
        const shift = byteInElem * 8;
        const mask = (~(0xFF << shift)) >>> 0;
        arr[elemIdx] = ((cur & mask) | ((Number(val) & 0xFF) << shift)) >>> 0;
      }
      return true;
    },
    has(_t: any, prop: any): boolean {
      if (prop === 'length' || prop === 'buffer' || prop === 'byteOffset' || prop === 'byteLength') return true;
      const idx = typeof prop === 'symbol' ? NaN : Number(prop);
      return Number.isFinite(idx) && idx >= 0 && idx < arr.length * elemSize;
    },
  });
  const view: any = { buf, off: 0, __src_arr: arr, __elem_size: elemSize, __live_byteview: true };
  try { Object.defineProperty(arr, '__cptr_byte_view_live', { value: view, enumerable: false, configurable: true, writable: true }); } catch { (arr as any).__cptr_byte_view_live = view; }
  return view;
}
function cptr_clone(ptr: any): any { if (ptr == null) return null; if (ptr?.buf) { const c: any = { buf: ptr.buf, off: ptr.off }; if (ptr.slots) c.slots = ptr.slots; if (ptr.__ptr_arr) c.__ptr_arr = true; if (ptr.__src_arr) c.__src_arr = ptr.__src_arr; if (ptr.__elem_size) c.__elem_size = ptr.__elem_size; if (ptr.__live_byteview) c.__live_byteview = true; return c; } /* BRIDGE: pointer-array — C17 §6.7.9 + §6.3.2.1: cloning a JS array-of-pointers (T*[N]) at a call boundary lifts it to a slot-bearing CPtr so callee-side cptr_offset/cptr_read_ptr operate on a T** view rather than treating it as an int32 array. */ if (Array.isArray(ptr)) { const isPtrArr = ptr.length > 0 && ptr.some((e: any) => e == null || (typeof e === 'object' && (e?.buf || e?.slots))); if (isPtrArr) { return { buf: new Uint8Array(ptr.length * 8), off: 0, slots: ptr.slice(), __ptr_arr: true }; } /* C17 §6.3.2.3 p7: numeric-array to byte-pointer cast. Return a live Proxy byte view so subsequent in-place mutations of the source array are visible through the alias. */ if (ptr.length > 0) { const isBig = typeof ptr[0] === 'bigint'; const elemSize = isBig ? 8 : (typeof ptr[0] === 'number' ? 4 : 1); return __cptr_byte_view_live(ptr, elemSize); } return ptr; } if (typeof ptr === 'string') return cptr_from_string(ptr); return ptr; }
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
function pow(x: number, y: number): number { return Math.pow(x, y); }
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
export class blake2s_ctx {
  [k: string]: any;
  b: any = cptr_create(64);
  h: any = new Array(8).fill(0);
  t: any = new Array(2).fill(0);
  c: number;
  outlen: number;
  constructor() {
    this.b = cptr_create(64);
    this.h = new Array(8).fill(0);
    this.t = new Array(2).fill(0);
    this.c = 0;
    this.outlen = 0;
  }
}
(blake2s_ctx as any).__fieldTypes = ["bytes","bytes","bytes","int64","int64"];
(blake2s_ctx as any).__fieldNames = ["b","h","t","c","outlen"];
(blake2s_ctx as any).__fieldOffsets = [0,64,96,104,112];

let blake2s_iv: any = [((1779033703) >>> 0), 3144134277, ((1013904242) >>> 0), 2773480762, ((1359893119) >>> 0), 2600822924, ((528734635) >>> 0), ((1541459225) >>> 0)];
export function blake2s_compress(ctx: blake2s_ctx | null, last: number): void {
  let sigma = [(() => { const __b = cptr_create(16); __b.buf[0] = (((0) & 0xFF)) & 0xFF; __b.buf[1] = (((1) & 0xFF)) & 0xFF; __b.buf[2] = (((2) & 0xFF)) & 0xFF; __b.buf[3] = (((3) & 0xFF)) & 0xFF; __b.buf[4] = (((4) & 0xFF)) & 0xFF; __b.buf[5] = (((5) & 0xFF)) & 0xFF; __b.buf[6] = (((6) & 0xFF)) & 0xFF; __b.buf[7] = (((7) & 0xFF)) & 0xFF; __b.buf[8] = (((8) & 0xFF)) & 0xFF; __b.buf[9] = (((9) & 0xFF)) & 0xFF; __b.buf[10] = (((10) & 0xFF)) & 0xFF; __b.buf[11] = (((11) & 0xFF)) & 0xFF; __b.buf[12] = (((12) & 0xFF)) & 0xFF; __b.buf[13] = (((13) & 0xFF)) & 0xFF; __b.buf[14] = (((14) & 0xFF)) & 0xFF; __b.buf[15] = (((15) & 0xFF)) & 0xFF; return __b; })(), (() => { const __b = cptr_create(16); __b.buf[0] = (((14) & 0xFF)) & 0xFF; __b.buf[1] = (((10) & 0xFF)) & 0xFF; __b.buf[2] = (((4) & 0xFF)) & 0xFF; __b.buf[3] = (((8) & 0xFF)) & 0xFF; __b.buf[4] = (((9) & 0xFF)) & 0xFF; __b.buf[5] = (((15) & 0xFF)) & 0xFF; __b.buf[6] = (((13) & 0xFF)) & 0xFF; __b.buf[7] = (((6) & 0xFF)) & 0xFF; __b.buf[8] = (((1) & 0xFF)) & 0xFF; __b.buf[9] = (((12) & 0xFF)) & 0xFF; __b.buf[10] = (((0) & 0xFF)) & 0xFF; __b.buf[11] = (((2) & 0xFF)) & 0xFF; __b.buf[12] = (((11) & 0xFF)) & 0xFF; __b.buf[13] = (((7) & 0xFF)) & 0xFF; __b.buf[14] = (((5) & 0xFF)) & 0xFF; __b.buf[15] = (((3) & 0xFF)) & 0xFF; return __b; })(), (() => { const __b = cptr_create(16); __b.buf[0] = (((11) & 0xFF)) & 0xFF; __b.buf[1] = (((8) & 0xFF)) & 0xFF; __b.buf[2] = (((12) & 0xFF)) & 0xFF; __b.buf[3] = (((0) & 0xFF)) & 0xFF; __b.buf[4] = (((5) & 0xFF)) & 0xFF; __b.buf[5] = (((2) & 0xFF)) & 0xFF; __b.buf[6] = (((15) & 0xFF)) & 0xFF; __b.buf[7] = (((13) & 0xFF)) & 0xFF; __b.buf[8] = (((10) & 0xFF)) & 0xFF; __b.buf[9] = (((14) & 0xFF)) & 0xFF; __b.buf[10] = (((3) & 0xFF)) & 0xFF; __b.buf[11] = (((6) & 0xFF)) & 0xFF; __b.buf[12] = (((7) & 0xFF)) & 0xFF; __b.buf[13] = (((1) & 0xFF)) & 0xFF; __b.buf[14] = (((9) & 0xFF)) & 0xFF; __b.buf[15] = (((4) & 0xFF)) & 0xFF; return __b; })(), (() => { const __b = cptr_create(16); __b.buf[0] = (((7) & 0xFF)) & 0xFF; __b.buf[1] = (((9) & 0xFF)) & 0xFF; __b.buf[2] = (((3) & 0xFF)) & 0xFF; __b.buf[3] = (((1) & 0xFF)) & 0xFF; __b.buf[4] = (((13) & 0xFF)) & 0xFF; __b.buf[5] = (((12) & 0xFF)) & 0xFF; __b.buf[6] = (((11) & 0xFF)) & 0xFF; __b.buf[7] = (((14) & 0xFF)) & 0xFF; __b.buf[8] = (((2) & 0xFF)) & 0xFF; __b.buf[9] = (((6) & 0xFF)) & 0xFF; __b.buf[10] = (((5) & 0xFF)) & 0xFF; __b.buf[11] = (((10) & 0xFF)) & 0xFF; __b.buf[12] = (((4) & 0xFF)) & 0xFF; __b.buf[13] = (((0) & 0xFF)) & 0xFF; __b.buf[14] = (((15) & 0xFF)) & 0xFF; __b.buf[15] = (((8) & 0xFF)) & 0xFF; return __b; })(), (() => { const __b = cptr_create(16); __b.buf[0] = (((9) & 0xFF)) & 0xFF; __b.buf[1] = (((0) & 0xFF)) & 0xFF; __b.buf[2] = (((5) & 0xFF)) & 0xFF; __b.buf[3] = (((7) & 0xFF)) & 0xFF; __b.buf[4] = (((2) & 0xFF)) & 0xFF; __b.buf[5] = (((4) & 0xFF)) & 0xFF; __b.buf[6] = (((10) & 0xFF)) & 0xFF; __b.buf[7] = (((15) & 0xFF)) & 0xFF; __b.buf[8] = (((14) & 0xFF)) & 0xFF; __b.buf[9] = (((1) & 0xFF)) & 0xFF; __b.buf[10] = (((11) & 0xFF)) & 0xFF; __b.buf[11] = (((12) & 0xFF)) & 0xFF; __b.buf[12] = (((6) & 0xFF)) & 0xFF; __b.buf[13] = (((8) & 0xFF)) & 0xFF; __b.buf[14] = (((3) & 0xFF)) & 0xFF; __b.buf[15] = (((13) & 0xFF)) & 0xFF; return __b; })(), (() => { const __b = cptr_create(16); __b.buf[0] = (((2) & 0xFF)) & 0xFF; __b.buf[1] = (((12) & 0xFF)) & 0xFF; __b.buf[2] = (((6) & 0xFF)) & 0xFF; __b.buf[3] = (((10) & 0xFF)) & 0xFF; __b.buf[4] = (((0) & 0xFF)) & 0xFF; __b.buf[5] = (((11) & 0xFF)) & 0xFF; __b.buf[6] = (((8) & 0xFF)) & 0xFF; __b.buf[7] = (((3) & 0xFF)) & 0xFF; __b.buf[8] = (((4) & 0xFF)) & 0xFF; __b.buf[9] = (((13) & 0xFF)) & 0xFF; __b.buf[10] = (((7) & 0xFF)) & 0xFF; __b.buf[11] = (((5) & 0xFF)) & 0xFF; __b.buf[12] = (((15) & 0xFF)) & 0xFF; __b.buf[13] = (((14) & 0xFF)) & 0xFF; __b.buf[14] = (((1) & 0xFF)) & 0xFF; __b.buf[15] = (((9) & 0xFF)) & 0xFF; return __b; })(), (() => { const __b = cptr_create(16); __b.buf[0] = (((12) & 0xFF)) & 0xFF; __b.buf[1] = (((5) & 0xFF)) & 0xFF; __b.buf[2] = (((1) & 0xFF)) & 0xFF; __b.buf[3] = (((15) & 0xFF)) & 0xFF; __b.buf[4] = (((14) & 0xFF)) & 0xFF; __b.buf[5] = (((13) & 0xFF)) & 0xFF; __b.buf[6] = (((4) & 0xFF)) & 0xFF; __b.buf[7] = (((10) & 0xFF)) & 0xFF; __b.buf[8] = (((0) & 0xFF)) & 0xFF; __b.buf[9] = (((7) & 0xFF)) & 0xFF; __b.buf[10] = (((6) & 0xFF)) & 0xFF; __b.buf[11] = (((3) & 0xFF)) & 0xFF; __b.buf[12] = (((9) & 0xFF)) & 0xFF; __b.buf[13] = (((2) & 0xFF)) & 0xFF; __b.buf[14] = (((8) & 0xFF)) & 0xFF; __b.buf[15] = (((11) & 0xFF)) & 0xFF; return __b; })(), (() => { const __b = cptr_create(16); __b.buf[0] = (((13) & 0xFF)) & 0xFF; __b.buf[1] = (((11) & 0xFF)) & 0xFF; __b.buf[2] = (((7) & 0xFF)) & 0xFF; __b.buf[3] = (((14) & 0xFF)) & 0xFF; __b.buf[4] = (((12) & 0xFF)) & 0xFF; __b.buf[5] = (((1) & 0xFF)) & 0xFF; __b.buf[6] = (((3) & 0xFF)) & 0xFF; __b.buf[7] = (((9) & 0xFF)) & 0xFF; __b.buf[8] = (((5) & 0xFF)) & 0xFF; __b.buf[9] = (((0) & 0xFF)) & 0xFF; __b.buf[10] = (((15) & 0xFF)) & 0xFF; __b.buf[11] = (((4) & 0xFF)) & 0xFF; __b.buf[12] = (((8) & 0xFF)) & 0xFF; __b.buf[13] = (((6) & 0xFF)) & 0xFF; __b.buf[14] = (((2) & 0xFF)) & 0xFF; __b.buf[15] = (((10) & 0xFF)) & 0xFF; return __b; })(), (() => { const __b = cptr_create(16); __b.buf[0] = (((6) & 0xFF)) & 0xFF; __b.buf[1] = (((15) & 0xFF)) & 0xFF; __b.buf[2] = (((14) & 0xFF)) & 0xFF; __b.buf[3] = (((9) & 0xFF)) & 0xFF; __b.buf[4] = (((11) & 0xFF)) & 0xFF; __b.buf[5] = (((3) & 0xFF)) & 0xFF; __b.buf[6] = (((0) & 0xFF)) & 0xFF; __b.buf[7] = (((8) & 0xFF)) & 0xFF; __b.buf[8] = (((12) & 0xFF)) & 0xFF; __b.buf[9] = (((2) & 0xFF)) & 0xFF; __b.buf[10] = (((13) & 0xFF)) & 0xFF; __b.buf[11] = (((7) & 0xFF)) & 0xFF; __b.buf[12] = (((1) & 0xFF)) & 0xFF; __b.buf[13] = (((4) & 0xFF)) & 0xFF; __b.buf[14] = (((10) & 0xFF)) & 0xFF; __b.buf[15] = (((5) & 0xFF)) & 0xFF; return __b; })(), (() => { const __b = cptr_create(16); __b.buf[0] = (((10) & 0xFF)) & 0xFF; __b.buf[1] = (((2) & 0xFF)) & 0xFF; __b.buf[2] = (((8) & 0xFF)) & 0xFF; __b.buf[3] = (((4) & 0xFF)) & 0xFF; __b.buf[4] = (((7) & 0xFF)) & 0xFF; __b.buf[5] = (((6) & 0xFF)) & 0xFF; __b.buf[6] = (((1) & 0xFF)) & 0xFF; __b.buf[7] = (((5) & 0xFF)) & 0xFF; __b.buf[8] = (((15) & 0xFF)) & 0xFF; __b.buf[9] = (((11) & 0xFF)) & 0xFF; __b.buf[10] = (((9) & 0xFF)) & 0xFF; __b.buf[11] = (((14) & 0xFF)) & 0xFF; __b.buf[12] = (((3) & 0xFF)) & 0xFF; __b.buf[13] = (((12) & 0xFF)) & 0xFF; __b.buf[14] = (((13) & 0xFF)) & 0xFF; __b.buf[15] = (((0) & 0xFF)) & 0xFF; return __b; })()];
  let i = 0;
  let v = new Array(16).fill(0);
  let m = new Array(16).fill(0);
  for (i = 0; (i < 8 ? 1 : 0); i++) {
    v[i] = (((__struct_ptr_at(ctx, 0)).h[i]) >>> 0);
    v[i32(i + 8)] = ((blake2s_iv[i]) >>> 0);
  }
  v[12] = (v[12] ^ (((__struct_ptr_at(ctx, 0)).t[0]) >>> 0)) >>> 0;
  v[13] = (v[13] ^ (((__struct_ptr_at(ctx, 0)).t[1]) >>> 0)) >>> 0;
  if (last) {
    v[14] = (~((v[14]) >>> 0)) >>> 0;
  }
  for (i = 0; (i < 16 ? 1 : 0); i++) {
    m[i] = (((((((Math.trunc(+((((((cptr_offset(cptr_from_uint8_array((__struct_ptr_at(ctx, 0)).b), (Math.imul(4, i)))))).buf[((((cptr_offset(cptr_from_uint8_array((__struct_ptr_at(ctx, 0)).b), (Math.imul(4, i)))))).off ?? 0) + 0]) & 0xFF)))) >>> 0)) ^ (((((Math.trunc(+((((((cptr_offset(cptr_from_uint8_array((__struct_ptr_at(ctx, 0)).b), (Math.imul(4, i)))))).buf[((((cptr_offset(cptr_from_uint8_array((__struct_ptr_at(ctx, 0)).b), (Math.imul(4, i)))))).off ?? 0) + 1]) & 0xFF)))) >>> 0)) << 8) >>> 0)) >>> 0 ^ (((((Math.trunc(+((((((cptr_offset(cptr_from_uint8_array((__struct_ptr_at(ctx, 0)).b), (Math.imul(4, i)))))).buf[((((cptr_offset(cptr_from_uint8_array((__struct_ptr_at(ctx, 0)).b), (Math.imul(4, i)))))).off ?? 0) + 2]) & 0xFF)))) >>> 0)) << 16) >>> 0)) >>> 0 ^ (((((Math.trunc(+((((((cptr_offset(cptr_from_uint8_array((__struct_ptr_at(ctx, 0)).b), (Math.imul(4, i)))))).buf[((((cptr_offset(cptr_from_uint8_array((__struct_ptr_at(ctx, 0)).b), (Math.imul(4, i)))))).off ?? 0) + 3]) & 0xFF)))) >>> 0)) << 24) >>> 0)) >>> 0);
  }
  for (i = 0; (i < 10 ? 1 : 0); i++) {
    {
      {
        v[0] = u32(u32(((v[0]) >>> 0) + ((v[4]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 0]) & 0xFF)]) >>> 0));
        v[12] = ((((((((v[12]) >>> 0) ^ ((v[0]) >>> 0)) >>> 0) >>> (16)) >>> 0) ^ ((((((v[12]) >>> 0) ^ ((v[0]) >>> 0)) >>> 0) << (i32(32 - (16)))) >>> 0)) >>> 0);
        v[8] = u32(((v[8]) >>> 0) + ((v[12]) >>> 0));
        v[4] = ((((((((v[4]) >>> 0) ^ ((v[8]) >>> 0)) >>> 0) >>> (12)) >>> 0) ^ ((((((v[4]) >>> 0) ^ ((v[8]) >>> 0)) >>> 0) << (i32(32 - (12)))) >>> 0)) >>> 0);
        v[0] = u32(u32(((v[0]) >>> 0) + ((v[4]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 1]) & 0xFF)]) >>> 0));
        v[12] = ((((((((v[12]) >>> 0) ^ ((v[0]) >>> 0)) >>> 0) >>> (8)) >>> 0) ^ ((((((v[12]) >>> 0) ^ ((v[0]) >>> 0)) >>> 0) << (i32(32 - (8)))) >>> 0)) >>> 0);
        v[8] = u32(((v[8]) >>> 0) + ((v[12]) >>> 0));
        v[4] = ((((((((v[4]) >>> 0) ^ ((v[8]) >>> 0)) >>> 0) >>> (7)) >>> 0) ^ ((((((v[4]) >>> 0) ^ ((v[8]) >>> 0)) >>> 0) << (i32(32 - (7)))) >>> 0)) >>> 0);
      }
    }
    {
      {
        v[1] = u32(u32(((v[1]) >>> 0) + ((v[5]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 2]) & 0xFF)]) >>> 0));
        v[13] = ((((((((v[13]) >>> 0) ^ ((v[1]) >>> 0)) >>> 0) >>> (16)) >>> 0) ^ ((((((v[13]) >>> 0) ^ ((v[1]) >>> 0)) >>> 0) << (i32(32 - (16)))) >>> 0)) >>> 0);
        v[9] = u32(((v[9]) >>> 0) + ((v[13]) >>> 0));
        v[5] = ((((((((v[5]) >>> 0) ^ ((v[9]) >>> 0)) >>> 0) >>> (12)) >>> 0) ^ ((((((v[5]) >>> 0) ^ ((v[9]) >>> 0)) >>> 0) << (i32(32 - (12)))) >>> 0)) >>> 0);
        v[1] = u32(u32(((v[1]) >>> 0) + ((v[5]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 3]) & 0xFF)]) >>> 0));
        v[13] = ((((((((v[13]) >>> 0) ^ ((v[1]) >>> 0)) >>> 0) >>> (8)) >>> 0) ^ ((((((v[13]) >>> 0) ^ ((v[1]) >>> 0)) >>> 0) << (i32(32 - (8)))) >>> 0)) >>> 0);
        v[9] = u32(((v[9]) >>> 0) + ((v[13]) >>> 0));
        v[5] = ((((((((v[5]) >>> 0) ^ ((v[9]) >>> 0)) >>> 0) >>> (7)) >>> 0) ^ ((((((v[5]) >>> 0) ^ ((v[9]) >>> 0)) >>> 0) << (i32(32 - (7)))) >>> 0)) >>> 0);
      }
    }
    {
      {
        v[2] = u32(u32(((v[2]) >>> 0) + ((v[6]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 4]) & 0xFF)]) >>> 0));
        v[14] = ((((((((v[14]) >>> 0) ^ ((v[2]) >>> 0)) >>> 0) >>> (16)) >>> 0) ^ ((((((v[14]) >>> 0) ^ ((v[2]) >>> 0)) >>> 0) << (i32(32 - (16)))) >>> 0)) >>> 0);
        v[10] = u32(((v[10]) >>> 0) + ((v[14]) >>> 0));
        v[6] = ((((((((v[6]) >>> 0) ^ ((v[10]) >>> 0)) >>> 0) >>> (12)) >>> 0) ^ ((((((v[6]) >>> 0) ^ ((v[10]) >>> 0)) >>> 0) << (i32(32 - (12)))) >>> 0)) >>> 0);
        v[2] = u32(u32(((v[2]) >>> 0) + ((v[6]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 5]) & 0xFF)]) >>> 0));
        v[14] = ((((((((v[14]) >>> 0) ^ ((v[2]) >>> 0)) >>> 0) >>> (8)) >>> 0) ^ ((((((v[14]) >>> 0) ^ ((v[2]) >>> 0)) >>> 0) << (i32(32 - (8)))) >>> 0)) >>> 0);
        v[10] = u32(((v[10]) >>> 0) + ((v[14]) >>> 0));
        v[6] = ((((((((v[6]) >>> 0) ^ ((v[10]) >>> 0)) >>> 0) >>> (7)) >>> 0) ^ ((((((v[6]) >>> 0) ^ ((v[10]) >>> 0)) >>> 0) << (i32(32 - (7)))) >>> 0)) >>> 0);
      }
    }
    {
      {
        v[3] = u32(u32(((v[3]) >>> 0) + ((v[7]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 6]) & 0xFF)]) >>> 0));
        v[15] = ((((((((v[15]) >>> 0) ^ ((v[3]) >>> 0)) >>> 0) >>> (16)) >>> 0) ^ ((((((v[15]) >>> 0) ^ ((v[3]) >>> 0)) >>> 0) << (i32(32 - (16)))) >>> 0)) >>> 0);
        v[11] = u32(((v[11]) >>> 0) + ((v[15]) >>> 0));
        v[7] = ((((((((v[7]) >>> 0) ^ ((v[11]) >>> 0)) >>> 0) >>> (12)) >>> 0) ^ ((((((v[7]) >>> 0) ^ ((v[11]) >>> 0)) >>> 0) << (i32(32 - (12)))) >>> 0)) >>> 0);
        v[3] = u32(u32(((v[3]) >>> 0) + ((v[7]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 7]) & 0xFF)]) >>> 0));
        v[15] = ((((((((v[15]) >>> 0) ^ ((v[3]) >>> 0)) >>> 0) >>> (8)) >>> 0) ^ ((((((v[15]) >>> 0) ^ ((v[3]) >>> 0)) >>> 0) << (i32(32 - (8)))) >>> 0)) >>> 0);
        v[11] = u32(((v[11]) >>> 0) + ((v[15]) >>> 0));
        v[7] = ((((((((v[7]) >>> 0) ^ ((v[11]) >>> 0)) >>> 0) >>> (7)) >>> 0) ^ ((((((v[7]) >>> 0) ^ ((v[11]) >>> 0)) >>> 0) << (i32(32 - (7)))) >>> 0)) >>> 0);
      }
    }
    {
      {
        v[0] = u32(u32(((v[0]) >>> 0) + ((v[5]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 8]) & 0xFF)]) >>> 0));
        v[15] = ((((((((v[15]) >>> 0) ^ ((v[0]) >>> 0)) >>> 0) >>> (16)) >>> 0) ^ ((((((v[15]) >>> 0) ^ ((v[0]) >>> 0)) >>> 0) << (i32(32 - (16)))) >>> 0)) >>> 0);
        v[10] = u32(((v[10]) >>> 0) + ((v[15]) >>> 0));
        v[5] = ((((((((v[5]) >>> 0) ^ ((v[10]) >>> 0)) >>> 0) >>> (12)) >>> 0) ^ ((((((v[5]) >>> 0) ^ ((v[10]) >>> 0)) >>> 0) << (i32(32 - (12)))) >>> 0)) >>> 0);
        v[0] = u32(u32(((v[0]) >>> 0) + ((v[5]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 9]) & 0xFF)]) >>> 0));
        v[15] = ((((((((v[15]) >>> 0) ^ ((v[0]) >>> 0)) >>> 0) >>> (8)) >>> 0) ^ ((((((v[15]) >>> 0) ^ ((v[0]) >>> 0)) >>> 0) << (i32(32 - (8)))) >>> 0)) >>> 0);
        v[10] = u32(((v[10]) >>> 0) + ((v[15]) >>> 0));
        v[5] = ((((((((v[5]) >>> 0) ^ ((v[10]) >>> 0)) >>> 0) >>> (7)) >>> 0) ^ ((((((v[5]) >>> 0) ^ ((v[10]) >>> 0)) >>> 0) << (i32(32 - (7)))) >>> 0)) >>> 0);
      }
    }
    {
      {
        v[1] = u32(u32(((v[1]) >>> 0) + ((v[6]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 10]) & 0xFF)]) >>> 0));
        v[12] = ((((((((v[12]) >>> 0) ^ ((v[1]) >>> 0)) >>> 0) >>> (16)) >>> 0) ^ ((((((v[12]) >>> 0) ^ ((v[1]) >>> 0)) >>> 0) << (i32(32 - (16)))) >>> 0)) >>> 0);
        v[11] = u32(((v[11]) >>> 0) + ((v[12]) >>> 0));
        v[6] = ((((((((v[6]) >>> 0) ^ ((v[11]) >>> 0)) >>> 0) >>> (12)) >>> 0) ^ ((((((v[6]) >>> 0) ^ ((v[11]) >>> 0)) >>> 0) << (i32(32 - (12)))) >>> 0)) >>> 0);
        v[1] = u32(u32(((v[1]) >>> 0) + ((v[6]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 11]) & 0xFF)]) >>> 0));
        v[12] = ((((((((v[12]) >>> 0) ^ ((v[1]) >>> 0)) >>> 0) >>> (8)) >>> 0) ^ ((((((v[12]) >>> 0) ^ ((v[1]) >>> 0)) >>> 0) << (i32(32 - (8)))) >>> 0)) >>> 0);
        v[11] = u32(((v[11]) >>> 0) + ((v[12]) >>> 0));
        v[6] = ((((((((v[6]) >>> 0) ^ ((v[11]) >>> 0)) >>> 0) >>> (7)) >>> 0) ^ ((((((v[6]) >>> 0) ^ ((v[11]) >>> 0)) >>> 0) << (i32(32 - (7)))) >>> 0)) >>> 0);
      }
    }
    {
      {
        v[2] = u32(u32(((v[2]) >>> 0) + ((v[7]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 12]) & 0xFF)]) >>> 0));
        v[13] = ((((((((v[13]) >>> 0) ^ ((v[2]) >>> 0)) >>> 0) >>> (16)) >>> 0) ^ ((((((v[13]) >>> 0) ^ ((v[2]) >>> 0)) >>> 0) << (i32(32 - (16)))) >>> 0)) >>> 0);
        v[8] = u32(((v[8]) >>> 0) + ((v[13]) >>> 0));
        v[7] = ((((((((v[7]) >>> 0) ^ ((v[8]) >>> 0)) >>> 0) >>> (12)) >>> 0) ^ ((((((v[7]) >>> 0) ^ ((v[8]) >>> 0)) >>> 0) << (i32(32 - (12)))) >>> 0)) >>> 0);
        v[2] = u32(u32(((v[2]) >>> 0) + ((v[7]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 13]) & 0xFF)]) >>> 0));
        v[13] = ((((((((v[13]) >>> 0) ^ ((v[2]) >>> 0)) >>> 0) >>> (8)) >>> 0) ^ ((((((v[13]) >>> 0) ^ ((v[2]) >>> 0)) >>> 0) << (i32(32 - (8)))) >>> 0)) >>> 0);
        v[8] = u32(((v[8]) >>> 0) + ((v[13]) >>> 0));
        v[7] = ((((((((v[7]) >>> 0) ^ ((v[8]) >>> 0)) >>> 0) >>> (7)) >>> 0) ^ ((((((v[7]) >>> 0) ^ ((v[8]) >>> 0)) >>> 0) << (i32(32 - (7)))) >>> 0)) >>> 0);
      }
    }
    {
      {
        v[3] = u32(u32(((v[3]) >>> 0) + ((v[4]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 14]) & 0xFF)]) >>> 0));
        v[14] = ((((((((v[14]) >>> 0) ^ ((v[3]) >>> 0)) >>> 0) >>> (16)) >>> 0) ^ ((((((v[14]) >>> 0) ^ ((v[3]) >>> 0)) >>> 0) << (i32(32 - (16)))) >>> 0)) >>> 0);
        v[9] = u32(((v[9]) >>> 0) + ((v[14]) >>> 0));
        v[4] = ((((((((v[4]) >>> 0) ^ ((v[9]) >>> 0)) >>> 0) >>> (12)) >>> 0) ^ ((((((v[4]) >>> 0) ^ ((v[9]) >>> 0)) >>> 0) << (i32(32 - (12)))) >>> 0)) >>> 0);
        v[3] = u32(u32(((v[3]) >>> 0) + ((v[4]) >>> 0)) + ((m[((sigma[i].buf[(sigma[i].off ?? 0) + 15]) & 0xFF)]) >>> 0));
        v[14] = ((((((((v[14]) >>> 0) ^ ((v[3]) >>> 0)) >>> 0) >>> (8)) >>> 0) ^ ((((((v[14]) >>> 0) ^ ((v[3]) >>> 0)) >>> 0) << (i32(32 - (8)))) >>> 0)) >>> 0);
        v[9] = u32(((v[9]) >>> 0) + ((v[14]) >>> 0));
        v[4] = ((((((((v[4]) >>> 0) ^ ((v[9]) >>> 0)) >>> 0) >>> (7)) >>> 0) ^ ((((((v[4]) >>> 0) ^ ((v[9]) >>> 0)) >>> 0) << (i32(32 - (7)))) >>> 0)) >>> 0);
      }
    }
  }
  for (i = 0; (i < 8 ? 1 : 0); ++i) {
    (__struct_ptr_at(ctx, 0)).h[i] = ((__struct_ptr_at(ctx, 0)).h[i] ^ (((v[i]) >>> 0) ^ ((v[i32(i + 8)]) >>> 0)) >>> 0) >>> 0;
  }
}

export function blake2s_init(ctx: blake2s_ctx | null, outlen: number, key: any | null, keylen: number): number {
  let i = 0;
  if ((((((((outlen) >>> 0) == ((0) >>> 0) ? 1 : 0) || (((outlen) >>> 0) > ((32) >>> 0) ? 1 : 0)) ? 1 : 0) || (((keylen) >>> 0) > ((32) >>> 0) ? 1 : 0)) ? 1 : 0)) {
    return -1;
  }
  for (i = ((0) >>> 0); (((i) >>> 0) < ((8) >>> 0) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    (__struct_ptr_at(ctx, 0)).h[((i) >>> 0)] = ((blake2s_iv[((i) >>> 0)]) >>> 0);
  }
  (__struct_ptr_at(ctx, 0)).h[0] = ((__struct_ptr_at(ctx, 0)).h[0] ^ ((16842752) >>> 0) ^ ((((keylen) >>> 0) * Math.pow(2, 8))) ^ ((outlen) >>> 0)) >>> 0;
  (__struct_ptr_at(ctx, 0)).t[0] = ((0) >>> 0);
  (__struct_ptr_at(ctx, 0)).t[1] = ((0) >>> 0);
  (__struct_ptr_at(ctx, 0)).c = ((0) >>> 0);
  (__struct_ptr_at(ctx, 0)).outlen = ((outlen) >>> 0);
  for (i = ((keylen) >>> 0); (((i) >>> 0) < ((64) >>> 0) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    (__struct_ptr_at(ctx, 0)).b.buf[((__struct_ptr_at(ctx, 0)).b.off ?? 0) + ((i) >>> 0)] = (((0) & 0xFF)) & 0xFF;
  }
  if ((((keylen) >>> 0) > ((0) >>> 0) ? 1 : 0)) {
    blake2s_update(ctx, key, ((keylen) >>> 0));
    (__struct_ptr_at(ctx, 0)).c = ((64) >>> 0);
  }
  return 0;
}

export function blake2s_update(ctx: blake2s_ctx | null, _in: any | null, inlen: number): void {
  let i = 0;
  for (i = ((0) >>> 0); (((i) >>> 0) < ((inlen) >>> 0) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    if (((((__struct_ptr_at(ctx, 0)).c) >>> 0) == ((64) >>> 0) ? 1 : 0)) {
      (__struct_ptr_at(ctx, 0)).t[0] = u32((__struct_ptr_at(ctx, 0)).t[0] + (((__struct_ptr_at(ctx, 0)).c) >>> 0));
      if (((((((__struct_ptr_at(ctx, 0)).t[0]) >>> 0)) >>> 0) < (((__struct_ptr_at(ctx, 0)).c) >>> 0) ? 1 : 0)) {
        (() => { const _t = (__struct_ptr_at(ctx, 0)).t[1]; (__struct_ptr_at(ctx, 0)).t[1] = u32((__struct_ptr_at(ctx, 0)).t[1] + 1); return _t; })();
      }
      blake2s_compress(ctx, 0);
      (__struct_ptr_at(ctx, 0)).c = ((0) >>> 0);
    }
    (__struct_ptr_at(ctx, 0)).b.buf[((__struct_ptr_at(ctx, 0)).b.off ?? 0) + (() => { const _t = (__struct_ptr_at(ctx, 0)).c; (__struct_ptr_at(ctx, 0)).c = u32((__struct_ptr_at(ctx, 0)).c + 1); return _t; })()] = (((((_in)).buf[(((_in)).off ?? 0) + ((i) >>> 0)]) & 0xFF)) & 0xFF;
  }
}

export function blake2s_final(ctx: blake2s_ctx | null, out: any | null): void {
  let i = 0;
  (__struct_ptr_at(ctx, 0)).t[0] = u32((__struct_ptr_at(ctx, 0)).t[0] + (((__struct_ptr_at(ctx, 0)).c) >>> 0));
  if (((((((__struct_ptr_at(ctx, 0)).t[0]) >>> 0)) >>> 0) < (((__struct_ptr_at(ctx, 0)).c) >>> 0) ? 1 : 0)) {
    (() => { const _t = (__struct_ptr_at(ctx, 0)).t[1]; (__struct_ptr_at(ctx, 0)).t[1] = u32((__struct_ptr_at(ctx, 0)).t[1] + 1); return _t; })();
  }
  while (((((__struct_ptr_at(ctx, 0)).c) >>> 0) < ((64) >>> 0) ? 1 : 0)) {
    (__struct_ptr_at(ctx, 0)).b.buf[((__struct_ptr_at(ctx, 0)).b.off ?? 0) + (() => { const _t = (__struct_ptr_at(ctx, 0)).c; (__struct_ptr_at(ctx, 0)).c = u32((__struct_ptr_at(ctx, 0)).c + 1); return _t; })()] = (((0) & 0xFF)) & 0xFF;
  }
  blake2s_compress(ctx, 1);
  for (i = ((0) >>> 0); (((i) >>> 0) < (((__struct_ptr_at(ctx, 0)).outlen) >>> 0) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    ((out)).buf[(((out)).off ?? 0) + ((i) >>> 0)] = (((((((((__struct_ptr_at(ctx, 0)).h[Math.trunc(((i) >>> 0) / Math.pow(2, 2))]) >>> 0) >>> (((8) >>> 0) * (((i) >>> 0) & ((3) >>> 0)))) >>> 0) & ((255) >>> 0)) >>> 0) & 0xFF)) & 0xFF;
  }
}

export function blake2s(out: any | null, outlen: number, key: any | null, keylen: number, _in: any | null, inlen: number): number {
  let ctx = new blake2s_ctx();
  if (blake2s_init(ctx, ((outlen) >>> 0), key, ((keylen) >>> 0))) {
    return -1;
  }
  blake2s_update(ctx, _in, ((inlen) >>> 0));
  blake2s_final(ctx, out);
  return 0;
}

