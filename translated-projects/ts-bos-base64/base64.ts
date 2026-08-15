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
function min(a: any, b?: any, comp?: Function): any { if (b === undefined) { if (Array.isArray(a)) return a.reduce((m, x) => x < m ? x : m, a[0]); return a; } const lt = comp ?? ((x: any, y: any) => x < y); return lt(b, a) ? b : a; }
function strnlen(s: any, maxlen: number): number {
  if (typeof s === 'string') s = cptr_from_string(s);
 if (s == null) return 0; if (typeof s === 'string') return Math.min(s.length, maxlen); if (s?.buf) { let i = 0; while (i < maxlen && (s.buf[s.off + i] ?? 0) !== 0) i++; return i; } if (Array.isArray(s)) { let i = 0; while (i < maxlen && s[i] !== 0 && s[i] !== undefined) i++; return i; } return 0; }
function trunc(x: number): number { return Math.trunc(x); }
function i32(x: number) { return x | 0; }
function u32(x: number) { return x >>> 0; }
function __as_bigint(x: any): bigint { if (typeof x === 'bigint') return x; if (typeof x === 'number') return BigInt(Math.trunc(x)); if (x && typeof x === 'object' && 'value' in x) { const v = (x as any).value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof x === 'boolean') return x ? 1n : 0n; return BigInt(Math.trunc(Number(x ?? 0))); }
function __u64(x: bigint): any { return BigInt.asUintN(64, x); }
function __i64(x: bigint): any { return BigInt.asIntN(64, x); }
function __safe_div_i64(a: bigint, b: bigint): any { if (b === 0n) throw new Error('Division by zero'); return a / b; }
function __safe_mod_i64(a: bigint, b: bigint): any { if (b === 0n) throw new Error('Division by zero'); return a % b; }

export function strnlen_s(_String: any, _MaxCount: number): number {
  return ((_String == null ? 1 : 0) ? ((0) >>> 0) : strnlen(cptr_clone(_String), ((_MaxCount) >>> 0)));
}

let base64en = (() => { const __b = cptr_create(64); __b.buf[0] = (((65) << 24 >> 24)) & 0xFF; __b.buf[1] = (((66) << 24 >> 24)) & 0xFF; __b.buf[2] = (((67) << 24 >> 24)) & 0xFF; __b.buf[3] = (((68) << 24 >> 24)) & 0xFF; __b.buf[4] = (((69) << 24 >> 24)) & 0xFF; __b.buf[5] = (((70) << 24 >> 24)) & 0xFF; __b.buf[6] = (((71) << 24 >> 24)) & 0xFF; __b.buf[7] = (((72) << 24 >> 24)) & 0xFF; __b.buf[8] = (((73) << 24 >> 24)) & 0xFF; __b.buf[9] = (((74) << 24 >> 24)) & 0xFF; __b.buf[10] = (((75) << 24 >> 24)) & 0xFF; __b.buf[11] = (((76) << 24 >> 24)) & 0xFF; __b.buf[12] = (((77) << 24 >> 24)) & 0xFF; __b.buf[13] = (((78) << 24 >> 24)) & 0xFF; __b.buf[14] = (((79) << 24 >> 24)) & 0xFF; __b.buf[15] = (((80) << 24 >> 24)) & 0xFF; __b.buf[16] = (((81) << 24 >> 24)) & 0xFF; __b.buf[17] = (((82) << 24 >> 24)) & 0xFF; __b.buf[18] = (((83) << 24 >> 24)) & 0xFF; __b.buf[19] = (((84) << 24 >> 24)) & 0xFF; __b.buf[20] = (((85) << 24 >> 24)) & 0xFF; __b.buf[21] = (((86) << 24 >> 24)) & 0xFF; __b.buf[22] = (((87) << 24 >> 24)) & 0xFF; __b.buf[23] = (((88) << 24 >> 24)) & 0xFF; __b.buf[24] = (((89) << 24 >> 24)) & 0xFF; __b.buf[25] = (((90) << 24 >> 24)) & 0xFF; __b.buf[26] = (((97) << 24 >> 24)) & 0xFF; __b.buf[27] = (((98) << 24 >> 24)) & 0xFF; __b.buf[28] = (((99) << 24 >> 24)) & 0xFF; __b.buf[29] = (((100) << 24 >> 24)) & 0xFF; __b.buf[30] = (((101) << 24 >> 24)) & 0xFF; __b.buf[31] = (((102) << 24 >> 24)) & 0xFF; __b.buf[32] = (((103) << 24 >> 24)) & 0xFF; __b.buf[33] = (((104) << 24 >> 24)) & 0xFF; __b.buf[34] = (((105) << 24 >> 24)) & 0xFF; __b.buf[35] = (((106) << 24 >> 24)) & 0xFF; __b.buf[36] = (((107) << 24 >> 24)) & 0xFF; __b.buf[37] = (((108) << 24 >> 24)) & 0xFF; __b.buf[38] = (((109) << 24 >> 24)) & 0xFF; __b.buf[39] = (((110) << 24 >> 24)) & 0xFF; __b.buf[40] = (((111) << 24 >> 24)) & 0xFF; __b.buf[41] = (((112) << 24 >> 24)) & 0xFF; __b.buf[42] = (((113) << 24 >> 24)) & 0xFF; __b.buf[43] = (((114) << 24 >> 24)) & 0xFF; __b.buf[44] = (((115) << 24 >> 24)) & 0xFF; __b.buf[45] = (((116) << 24 >> 24)) & 0xFF; __b.buf[46] = (((117) << 24 >> 24)) & 0xFF; __b.buf[47] = (((118) << 24 >> 24)) & 0xFF; __b.buf[48] = (((119) << 24 >> 24)) & 0xFF; __b.buf[49] = (((120) << 24 >> 24)) & 0xFF; __b.buf[50] = (((121) << 24 >> 24)) & 0xFF; __b.buf[51] = (((122) << 24 >> 24)) & 0xFF; __b.buf[52] = (((48) << 24 >> 24)) & 0xFF; __b.buf[53] = (((49) << 24 >> 24)) & 0xFF; __b.buf[54] = (((50) << 24 >> 24)) & 0xFF; __b.buf[55] = (((51) << 24 >> 24)) & 0xFF; __b.buf[56] = (((52) << 24 >> 24)) & 0xFF; __b.buf[57] = (((53) << 24 >> 24)) & 0xFF; __b.buf[58] = (((54) << 24 >> 24)) & 0xFF; __b.buf[59] = (((55) << 24 >> 24)) & 0xFF; __b.buf[60] = (((56) << 24 >> 24)) & 0xFF; __b.buf[61] = (((57) << 24 >> 24)) & 0xFF; __b.buf[62] = (((43) << 24 >> 24)) & 0xFF; __b.buf[63] = (((47) << 24 >> 24)) & 0xFF; return __b; })();
let base64de = (() => { const __b = cptr_create(123); __b.buf[0] = (((255) & 0xFF)) & 0xFF; __b.buf[1] = (((255) & 0xFF)) & 0xFF; __b.buf[2] = (((255) & 0xFF)) & 0xFF; __b.buf[3] = (((255) & 0xFF)) & 0xFF; __b.buf[4] = (((255) & 0xFF)) & 0xFF; __b.buf[5] = (((255) & 0xFF)) & 0xFF; __b.buf[6] = (((255) & 0xFF)) & 0xFF; __b.buf[7] = (((255) & 0xFF)) & 0xFF; __b.buf[8] = (((255) & 0xFF)) & 0xFF; __b.buf[9] = (((255) & 0xFF)) & 0xFF; __b.buf[10] = (((255) & 0xFF)) & 0xFF; __b.buf[11] = (((255) & 0xFF)) & 0xFF; __b.buf[12] = (((255) & 0xFF)) & 0xFF; __b.buf[13] = (((255) & 0xFF)) & 0xFF; __b.buf[14] = (((255) & 0xFF)) & 0xFF; __b.buf[15] = (((255) & 0xFF)) & 0xFF; __b.buf[16] = (((255) & 0xFF)) & 0xFF; __b.buf[17] = (((255) & 0xFF)) & 0xFF; __b.buf[18] = (((255) & 0xFF)) & 0xFF; __b.buf[19] = (((255) & 0xFF)) & 0xFF; __b.buf[20] = (((255) & 0xFF)) & 0xFF; __b.buf[21] = (((255) & 0xFF)) & 0xFF; __b.buf[22] = (((255) & 0xFF)) & 0xFF; __b.buf[23] = (((255) & 0xFF)) & 0xFF; __b.buf[24] = (((255) & 0xFF)) & 0xFF; __b.buf[25] = (((255) & 0xFF)) & 0xFF; __b.buf[26] = (((255) & 0xFF)) & 0xFF; __b.buf[27] = (((255) & 0xFF)) & 0xFF; __b.buf[28] = (((255) & 0xFF)) & 0xFF; __b.buf[29] = (((255) & 0xFF)) & 0xFF; __b.buf[30] = (((255) & 0xFF)) & 0xFF; __b.buf[31] = (((255) & 0xFF)) & 0xFF; __b.buf[32] = (((255) & 0xFF)) & 0xFF; __b.buf[33] = (((255) & 0xFF)) & 0xFF; __b.buf[34] = (((255) & 0xFF)) & 0xFF; __b.buf[35] = (((255) & 0xFF)) & 0xFF; __b.buf[36] = (((255) & 0xFF)) & 0xFF; __b.buf[37] = (((255) & 0xFF)) & 0xFF; __b.buf[38] = (((255) & 0xFF)) & 0xFF; __b.buf[39] = (((255) & 0xFF)) & 0xFF; __b.buf[40] = (((255) & 0xFF)) & 0xFF; __b.buf[41] = (((255) & 0xFF)) & 0xFF; __b.buf[42] = (((255) & 0xFF)) & 0xFF; __b.buf[43] = (((62) & 0xFF)) & 0xFF; __b.buf[44] = (((255) & 0xFF)) & 0xFF; __b.buf[45] = (((255) & 0xFF)) & 0xFF; __b.buf[46] = (((255) & 0xFF)) & 0xFF; __b.buf[47] = (((63) & 0xFF)) & 0xFF; __b.buf[48] = (((52) & 0xFF)) & 0xFF; __b.buf[49] = (((53) & 0xFF)) & 0xFF; __b.buf[50] = (((54) & 0xFF)) & 0xFF; __b.buf[51] = (((55) & 0xFF)) & 0xFF; __b.buf[52] = (((56) & 0xFF)) & 0xFF; __b.buf[53] = (((57) & 0xFF)) & 0xFF; __b.buf[54] = (((58) & 0xFF)) & 0xFF; __b.buf[55] = (((59) & 0xFF)) & 0xFF; __b.buf[56] = (((60) & 0xFF)) & 0xFF; __b.buf[57] = (((61) & 0xFF)) & 0xFF; __b.buf[58] = (((255) & 0xFF)) & 0xFF; __b.buf[59] = (((255) & 0xFF)) & 0xFF; __b.buf[60] = (((255) & 0xFF)) & 0xFF; __b.buf[61] = (((255) & 0xFF)) & 0xFF; __b.buf[62] = (((255) & 0xFF)) & 0xFF; __b.buf[63] = (((255) & 0xFF)) & 0xFF; __b.buf[64] = (((255) & 0xFF)) & 0xFF; __b.buf[65] = (((0) & 0xFF)) & 0xFF; __b.buf[66] = (((1) & 0xFF)) & 0xFF; __b.buf[67] = (((2) & 0xFF)) & 0xFF; __b.buf[68] = (((3) & 0xFF)) & 0xFF; __b.buf[69] = (((4) & 0xFF)) & 0xFF; __b.buf[70] = (((5) & 0xFF)) & 0xFF; __b.buf[71] = (((6) & 0xFF)) & 0xFF; __b.buf[72] = (((7) & 0xFF)) & 0xFF; __b.buf[73] = (((8) & 0xFF)) & 0xFF; __b.buf[74] = (((9) & 0xFF)) & 0xFF; __b.buf[75] = (((10) & 0xFF)) & 0xFF; __b.buf[76] = (((11) & 0xFF)) & 0xFF; __b.buf[77] = (((12) & 0xFF)) & 0xFF; __b.buf[78] = (((13) & 0xFF)) & 0xFF; __b.buf[79] = (((14) & 0xFF)) & 0xFF; __b.buf[80] = (((15) & 0xFF)) & 0xFF; __b.buf[81] = (((16) & 0xFF)) & 0xFF; __b.buf[82] = (((17) & 0xFF)) & 0xFF; __b.buf[83] = (((18) & 0xFF)) & 0xFF; __b.buf[84] = (((19) & 0xFF)) & 0xFF; __b.buf[85] = (((20) & 0xFF)) & 0xFF; __b.buf[86] = (((21) & 0xFF)) & 0xFF; __b.buf[87] = (((22) & 0xFF)) & 0xFF; __b.buf[88] = (((23) & 0xFF)) & 0xFF; __b.buf[89] = (((24) & 0xFF)) & 0xFF; __b.buf[90] = (((25) & 0xFF)) & 0xFF; __b.buf[91] = (((255) & 0xFF)) & 0xFF; __b.buf[92] = (((255) & 0xFF)) & 0xFF; __b.buf[93] = (((255) & 0xFF)) & 0xFF; __b.buf[94] = (((255) & 0xFF)) & 0xFF; __b.buf[95] = (((255) & 0xFF)) & 0xFF; __b.buf[96] = (((255) & 0xFF)) & 0xFF; __b.buf[97] = (((26) & 0xFF)) & 0xFF; __b.buf[98] = (((27) & 0xFF)) & 0xFF; __b.buf[99] = (((28) & 0xFF)) & 0xFF; __b.buf[100] = (((29) & 0xFF)) & 0xFF; __b.buf[101] = (((30) & 0xFF)) & 0xFF; __b.buf[102] = (((31) & 0xFF)) & 0xFF; __b.buf[103] = (((32) & 0xFF)) & 0xFF; __b.buf[104] = (((33) & 0xFF)) & 0xFF; __b.buf[105] = (((34) & 0xFF)) & 0xFF; __b.buf[106] = (((35) & 0xFF)) & 0xFF; __b.buf[107] = (((36) & 0xFF)) & 0xFF; __b.buf[108] = (((37) & 0xFF)) & 0xFF; __b.buf[109] = (((38) & 0xFF)) & 0xFF; __b.buf[110] = (((39) & 0xFF)) & 0xFF; __b.buf[111] = (((40) & 0xFF)) & 0xFF; __b.buf[112] = (((41) & 0xFF)) & 0xFF; __b.buf[113] = (((42) & 0xFF)) & 0xFF; __b.buf[114] = (((43) & 0xFF)) & 0xFF; __b.buf[115] = (((44) & 0xFF)) & 0xFF; __b.buf[116] = (((45) & 0xFF)) & 0xFF; __b.buf[117] = (((46) & 0xFF)) & 0xFF; __b.buf[118] = (((47) & 0xFF)) & 0xFF; __b.buf[119] = (((48) & 0xFF)) & 0xFF; __b.buf[120] = (((49) & 0xFF)) & 0xFF; __b.buf[121] = (((50) & 0xFF)) & 0xFF; __b.buf[122] = (((51) & 0xFF)) & 0xFF; return __b; })();
export function base64_encode(_in: any | null, inlen: number, out: any): number {
  if (typeof _in === 'string') _in = cptr_from_string(_in);
  if (typeof out === 'string') out = cptr_from_string(out);

  let s = 0;
  let i = 0;
  let j = 0;
  let c = 0;
  let l = 0;
  s = 0;
  l = (((0) & 0xFF)) & 0xFF;
  for (i = (j = (((0) & 0xFFFF)) & 0xFFFF) & 0xFFFF; (((i) & 0xFFFF) < ((inlen) & 0xFFFF) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    c = (((_in.buf[(_in.off ?? 0) + ((i) & 0xFFFF)]) & 0xFF)) & 0xFF;
    switch (s) {
      case 0:
      {
        s = 1;
      out.buf[(out.off ?? 0) + (() => { const _t = j; j = u32(j + 1); return _t; })()] = (((base64en.buf[(base64en.off ?? 0) + (((((c) & 0xFF) >> 2) | 0)) & 63]) << 24 >> 24)) << 24 >> 24;
      break;
      }
      case 1:
      {
        s = 2;
      out.buf[(out.off ?? 0) + (() => { const _t = j; j = u32(j + 1); return _t; })()] = (((base64en.buf[(base64en.off ?? 0) + ((((((l) & 0xFF) & 3) << 4) | 0)) | ((((((c) & 0xFF) >> 4) | 0)) & 15)]) << 24 >> 24)) << 24 >> 24;
      break;
      }
      case 2:
      {
        s = 0;
      out.buf[(out.off ?? 0) + (() => { const _t = j; j = u32(j + 1); return _t; })()] = (((base64en.buf[(base64en.off ?? 0) + ((((((l) & 0xFF) & 15) << 2) | 0)) | ((((((c) & 0xFF) >> 6) | 0)) & 3)]) << 24 >> 24)) << 24 >> 24;
      out.buf[(out.off ?? 0) + (() => { const _t = j; j = u32(j + 1); return _t; })()] = (((base64en.buf[(base64en.off ?? 0) + ((c) & 0xFF) & 63]) << 24 >> 24)) << 24 >> 24;
      break;
      }
    }
    l = (((c) & 0xFF)) & 0xFF;
  }
  switch (s) {
    case 1:
    {
      out.buf[(out.off ?? 0) + (() => { const _t = j; j = u32(j + 1); return _t; })()] = (((base64en.buf[(base64en.off ?? 0) + (((((l) & 0xFF) & 3) << 4) | 0)]) << 24 >> 24)) << 24 >> 24;
    out.buf[(out.off ?? 0) + (() => { const _t = j; j = u32(j + 1); return _t; })()] = (((61) << 24 >> 24)) << 24 >> 24;
    out.buf[(out.off ?? 0) + (() => { const _t = j; j = u32(j + 1); return _t; })()] = (((61) << 24 >> 24)) << 24 >> 24;
    break;
    }
    case 2:
    {
      out.buf[(out.off ?? 0) + (() => { const _t = j; j = u32(j + 1); return _t; })()] = (((base64en.buf[(base64en.off ?? 0) + (((((l) & 0xFF) & 15) << 2) | 0)]) << 24 >> 24)) << 24 >> 24;
    out.buf[(out.off ?? 0) + (() => { const _t = j; j = u32(j + 1); return _t; })()] = (((61) << 24 >> 24)) << 24 >> 24;
    break;
    }
  }
  out.buf[(out.off ?? 0) + ((j) & 0xFFFF)] = (((0) << 24 >> 24)) << 24 >> 24;
  return ((j) & 0xFFFF);
}

export function base64_decode(_in: any, inlen: number, out: any | null): number {
  if (typeof _in === 'string') _in = cptr_from_string(_in);
  if (typeof out === 'string') out = cptr_from_string(out);

  let i = 0;
  let j = 0;
  let c = 0;
  if (((inlen) & 0xFFFF) & 3) {
    return ((0) & 0xFFFF);
  }
  for (i = (j = (((0) & 0xFFFF)) & 0xFFFF) & 0xFFFF; (((i) & 0xFFFF) < ((inlen) & 0xFFFF) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    if ((((_in.buf[(_in.off ?? 0) + ((i) & 0xFFFF)]) << 24 >> 24) == 61 ? 1 : 0)) {
      break;
    }
    if ((((((_in.buf[(_in.off ?? 0) + ((i) & 0xFFFF)]) << 24 >> 24) < 43 ? 1 : 0) || (((_in.buf[(_in.off ?? 0) + ((i) & 0xFFFF)]) << 24 >> 24) > 122 ? 1 : 0)) ? 1 : 0)) {
      return ((0) & 0xFFFF);
    }
    c = (((base64de.buf[(base64de.off ?? 0) + ((Math.trunc(+(((_in.buf[(_in.off ?? 0) + ((i) & 0xFFFF)]) << 24 >> 24)))) & 0xFF)]) & 0xFF)) & 0xFF;
    if ((((c) & 0xFF) == 255 ? 1 : 0)) {
      return ((0) & 0xFFFF);
    }
    switch (((i) & 0xFFFF) & 3) {
      case 0:
      {
        out.buf[(out.off ?? 0) + ((j) & 0xFFFF)] = (((Math.trunc(+(((((((Math.trunc(+(((c) & 0xFF)))) >>> 0) << 2) >>> 0) & ((255) >>> 0)) >>> 0)))) & 0xFF)) & 0xFF;
      break;
      }
      case 1:
      {
        ((__cse_1) => out.buf[(out.off ?? 0) + __cse_1] = (out.buf[(out.off ?? 0) + __cse_1] | (((((c) & 0xFF) >> 4) | 0)) & 3) >>> 0)((() => { const _t = j; j = u32(j + 1); return _t; })());
      out.buf[(out.off ?? 0) + ((j) & 0xFFFF)] = (((Math.trunc(+(((((((Math.trunc(+(((c) & 0xFF)))) >>> 0) & ((15) >>> 0)) >>> 0) << 4) >>> 0)))) & 0xFF)) & 0xFF;
      break;
      }
      case 2:
      {
        ((__cse_2) => out.buf[(out.off ?? 0) + __cse_2] = (out.buf[(out.off ?? 0) + __cse_2] | (((((c) & 0xFF) >> 2) | 0)) & 15) >>> 0)((() => { const _t = j; j = u32(j + 1); return _t; })());
      out.buf[(out.off ?? 0) + ((j) & 0xFFFF)] = (((Math.trunc(+(((((((Math.trunc(+(((c) & 0xFF)))) >>> 0) & ((3) >>> 0)) >>> 0) << 6) >>> 0)))) & 0xFF)) & 0xFF;
      break;
      }
      case 3:
      {
        ((__cse_3) => out.buf[(out.off ?? 0) + __cse_3] = (out.buf[(out.off ?? 0) + __cse_3] | ((c) & 0xFF)) >>> 0)((() => { const _t = j; j = u32(j + 1); return _t; })());
      break;
      }
    }
  }
  return ((j) & 0xFFFF);
}

