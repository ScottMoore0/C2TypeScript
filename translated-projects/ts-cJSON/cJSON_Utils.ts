/**
 * This project is a direct translation of cJSON, from C to TypeScript.
 *
 * Original cJSON:
 * Copyright (c) 2009-2017 Dave Gamble and cJSON contributors
 * Licensed under the MIT License.
 *
 * TypeScript translation:
 * Copyright (c) 2026 Scott Moore
 * Licensed under the MIT License.
 */

import { cJSON_malloc, cJSON_IsArray, cJSON_free, cJSON_IsObject, cJSON_DetachItemFromObject, cJSON_AddItemToArray, cJSON_GetObjectItemCaseSensitive, cJSON_GetObjectItem, cJSON_IsString, cJSON_Delete, cJSON_Duplicate, cJSON_DeleteItemFromObjectCaseSensitive, cJSON_DeleteItemFromObject, cJSON_AddItemToObject, cJSON_CreateObject, cJSON_CreateString, cJSON_CreateArray, cJSON_IsNull, cJSON_DetachItemFromObjectCaseSensitive, cJSON_CreateNull } from "./cJSON";
function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function dup(fd: number): number { return fd; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function strdup(s: any): any { const str = typeof s === 'string' ? s : cptr_to_string(s); return cptr_from_string(str); }
function printf_format(fmt: string, ...args: any[]): string {
  if (fmt == null) return '';
  let result = "", argIdx = 0, i = 0;
  while (i < fmt.length) {
    if (fmt[i] === "%" && i + 1 < fmt.length) {
      i++; let flags = ""; while ("-+ 0#".includes(fmt[i])) flags += fmt[i++];
      let width = ""; if (fmt[i] === "*") { width = String(args[argIdx++]); i++; } else { while (fmt[i] >= "0" && fmt[i] <= "9") width += fmt[i++]; }
      let prec = ""; if (fmt[i] === ".") { i++; if (fmt[i] === "*") { prec = String(args[argIdx++]); i++; } else { while (fmt[i] >= "0" && fmt[i] <= "9") prec += fmt[i++]; } }
      let lenMod = ""; if ("hlLzjt".includes(fmt[i])) { lenMod = fmt[i]; i++; if (fmt[i] === fmt[i-1]) { lenMod += fmt[i]; i++; } }
      const is64 = (lenMod === "z" || lenMod === "ll" || lenMod === "j" || lenMod === "L");
      const spec = fmt[i++], a = args[argIdx++];
      const toU = (v: any, r: number, up: boolean): string => { if (typeof v === "bigint") { const s2 = BigInt.asUintN(is64 ? 64 : 32, v).toString(r); return up ? s2.toUpperCase() : s2; } const nn = Number(v); if (is64 && nn < 0) { const b = BigInt.asUintN(64, BigInt(Math.trunc(nn))); const s2 = b.toString(r); return up ? s2.toUpperCase() : s2; } const s2 = (Math.trunc(nn) >>> 0).toString(r); return up ? s2.toUpperCase() : s2; };
      let s = "";
      switch (spec) {
        case "d": case "i": { if (typeof a === "bigint") { const n = is64 ? BigInt.asIntN(64, a) : a; let mag = (n < 0n ? -n : n).toString(); if (prec) { const p = parseInt(prec); if (mag.length < p) mag = mag.padStart(p, "0"); } s = (n < 0n ? "-" : "") + mag; if (n >= 0n && flags.includes("+")) s = "+" + s; else if (n >= 0n && flags.includes(" ")) s = " " + s; break; } const n = Math.trunc(Number(a)); let mag = Math.abs(n).toString(); if (prec) { const p = parseInt(prec); if (mag.length < p) mag = mag.padStart(p, "0"); } s = (n < 0 ? "-" : "") + mag; if (n >= 0 && flags.includes("+")) s = "+" + s; else if (n >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "u": s = toU(a, 10, false); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } break;
        case "x": s = toU(a, 16, false); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } if (flags.includes("#") && s !== "0") s = "0x" + s; break;
        case "X": s = toU(a, 16, true); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } if (flags.includes("#") && s !== "0") s = "0X" + s; break;
        case "o": s = toU(a, 8, false); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } if (flags.includes("#") && !s.startsWith("0")) s = "0" + s; break;
        case "s": s = (a?.buf ? cptr_to_string(a) : (a && typeof a === "object" && typeof a.c_str === "function") ? a : ("" + (a ?? ""))); if (prec) s = s.slice(0, parseInt(prec)); break;
        case "f": case "F": { const nn = Number(a); if (Number.isNaN(nn)) { s = spec === "F" ? "NAN" : "nan"; } else if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + (spec === "F" ? "INF" : "inf"); } else { s = nn.toFixed(prec && parseInt(prec) >= 0 ? parseInt(prec) : 6); if (nn >= 0 && flags.includes("+")) s = "+" + s; else if (nn >= 0 && flags.includes(" ")) s = " " + s; } break; }
        case "e": { const nn = Number(a); if (Number.isNaN(nn)) { s = "nan"; } else if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + "inf"; } else { s = nn.toExponential(prec ? parseInt(prec) : 6).replace(/e([+-])(\d)$/, 'e$10$2'); if (nn >= 0 && flags.includes("+")) s = "+" + s; else if (nn >= 0 && flags.includes(" ")) s = " " + s; } break; }
        case "E": { const nn = Number(a); if (Number.isNaN(nn)) { s = "NAN"; } else if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + "INF"; } else { s = nn.toExponential(prec ? parseInt(prec) : 6).replace(/e([+-])(\d)$/, 'e$10$2').toUpperCase(); if (nn >= 0 && flags.includes("+")) s = "+" + s; else if (nn >= 0 && flags.includes(" ")) s = " " + s; } break; }
        case "g": case "G": { const v = Number(a); if (Number.isNaN(v)) { s = spec === "G" ? "NAN" : "nan"; } else if (!Number.isFinite(v)) { s = (v < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + (spec === "G" ? "INF" : "inf"); } else { const gPrec = prec ? parseInt(prec) : 6; s = v.toPrecision(gPrec).replace(/(\.\d*?)0+(?=e|$)/, "$1").replace(/\.(?=e|$)/, "").replace(/e([+-])(\d)$/, "e$1" + "0$2"); if (spec === "G") s = s.toUpperCase(); if (v >= 0 && flags.includes("+")) s = "+" + s; else if (v >= 0 && flags.includes(" ")) s = " " + s; } break; }
        case "a": case "A": { const v = Number(a); if (v === 0) { s = (spec === "A" ? "0X0P+0" : "0x0p+0"); break; } const __bb = new ArrayBuffer(8); new DataView(__bb).setFloat64(0, v, true); const __dv = new DataView(__bb); const __lo = __dv.getUint32(0, true), __hi = __dv.getUint32(4, true); const __sg = (__hi >>> 31) & 1; const __ex = ((__hi >>> 20) & 0x7FF) - 1023; let __m = (__hi & 0xFFFFF).toString(16).padStart(5, "0") + __lo.toString(16).padStart(8, "0"); __m = __m.replace(/0+$/, ""); const __exStr = __ex >= 0 ? ("+" + __ex) : String(__ex); const __head = spec === "A" ? "0X1" : "0x1"; const __mid = __m ? ("." + (spec === "A" ? __m.toUpperCase() : __m)) : ""; const __p = spec === "A" ? "P" : "p"; s = (__sg ? "-" : "") + __head + __mid + __p + __exStr; break; }
case "c": s = typeof a === "string" ? a.charAt(0) : String.fromCharCode(Number(a)); break;
        case "p": s = "0x" + (Number(a) >>> 0).toString(16); break;
        case "n": { if (a?.buf) new DataView(a.buf.buffer, a.buf.byteOffset).setInt32(a.off ?? 0, result.length, true); else if (a && typeof a === "object" && "value" in a) a.value = result.length; s = ""; break; }
        case "%": s = "%"; argIdx--; break;
        default: s = spec; break;
      }
      if (width) { let w = parseInt(width); let leftAlign = flags.includes("-"); if (w < 0) { leftAlign = true; w = -w; } if (s.length < w) { const zero = flags.includes("0") && !leftAlign && "diouxXeEfFgG".includes(spec); if (leftAlign) s = s.padEnd(w); else if (zero) { /* C17 §7.21.6.1: zero-pad goes BETWEEN sign and magnitude. */ const padLen = w - s.length; const pad = "0".repeat(padLen); if (s.startsWith("-") || s.startsWith("+") || s.startsWith(" ")) s = s[0] + pad + s.slice(1); else if (s.startsWith("0x") || s.startsWith("0X")) s = s.slice(0, 2) + pad + s.slice(2); else s = pad + s; } else s = s.padStart(w); } }
      result += s;
    } else { result += fmt[i++]; }
  }
  return result;
}
function realloc(ptr: any, size: any): any {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 const sz = typeof size === 'bigint' ? Number(size) : Number(size ?? 0); if (ptr && ptr.__cptr_overlay === true) { const cp = ptr.__cptr; ptr = { buf: cp.buf, off: (cp.off ?? 0) + (ptr.__byteOff ?? 0) }; return cptr_realloc(ptr, sz); } if (ptr && typeof ptr === 'object' && !ptr.buf && ptr.constructor && (ptr.constructor as any).__fieldNames) { /* BRIDGE: struct-as-class realloc */ const existing = ptr.__cptr; const newBuf = new Uint8Array(sz); if (existing && existing.buf) { const srcOff = existing.off ?? 0; const copyLen = Math.min(existing.buf.length - srcOff, sz); if (copyLen > 0) newBuf.set(existing.buf.subarray(srcOff, srcOff + copyLen)); } ptr.__cptr = { buf: newBuf, off: 0 }; ptr.__byteOff = 0; return ptr; } return cptr_realloc(ptr, sz); }
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
function cptr_to_string(ptr: any | null): string {
  if (typeof ptr === 'string') ptr = cptr_from_string(ptr);
 if (!ptr) return ''; const bytes: number[] = []; for (let i = ptr.off; i < ptr.buf.length; i++) { if (ptr.buf[i] === 0) break; bytes.push(ptr.buf[i]); } return String.fromCharCode(...bytes); }
function cptr_from_string(str: string): CPtr { const buf = new Uint8Array(str.length + 1); for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i); buf[str.length] = 0; return { buf, off: 0 }; }
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
function cptr_realloc(ptr: any, newSize: any): CPtr { const sz = typeof newSize === "bigint" ? Number(newSize) : Number(newSize ?? 0); const n = new Uint8Array(sz); if (ptr) { const copyLen = Math.min(ptr.buf.length - ptr.off, sz); n.set(ptr.buf.subarray(ptr.off, ptr.off + copyLen)); } const r: any = { buf: n, off: 0 }; if (ptr && (ptr as any).slots) r.slots = (ptr as any).slots.slice(); return r; }
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
function memcpy(dst: any, src: any, n: number): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 if (dst?.buf && src?.buf) { cptr_copy(dst, src, n); /* C17 §6.7.6.1: when src is a slot-bearing CPtr (T** array), copy the parallel slot references into dst so pointer identity survives the byte-copy. Slot stride is 8 bytes (LLP64 sizeof(void*)); slot indices align with byte offset >> 3. */ if ((src as any).slots) { const dstAny: any = dst; if (!dstAny.slots) dstAny.slots = []; const srcSlotBase = ((src.off ?? 0) >> 3); const dstSlotBase = ((dst.off ?? 0) >> 3); const slotCount = Math.floor(n / 8); for (let i = 0; i < slotCount; i++) dstAny.slots[dstSlotBase + i] = (src as any).slots[srcSlotBase + i] ?? null; } return dst; } if (dst?.buf && typeof src === 'string') { for (let i = 0; i < n && i < src.length; i++) dst.buf[dst.off + i] = src.charCodeAt(i); return dst; } if (dst?.buf && src && typeof src === 'object' && 'value' in src && typeof src.value === 'number') { const dv = new DataView(dst.buf.buffer, dst.buf.byteOffset + dst.off); if (n >= 4) dv.setInt32(0, src.value, true); else if (n >= 2) dv.setInt16(0, src.value, true); else dv.setInt8(0, src.value); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src?.buf) { /* BRIDGE: memcpy(box, cptr, n) — read N bytes from a CPtr into a {value} box. C17 §7.24.2.1. n=8 → bigint64 (signed). n=4 → int32. n=2 → int16. n=1 → int8. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const off = src.off ?? 0; if (n >= 8) { const bv = dv.getBigInt64(off, true); dst.value = (typeof dst.value === 'bigint') ? bv : Number(bv); } else if (n >= 4) dst.value = dv.getInt32(off, true); else if (n >= 2) dst.value = dv.getInt16(off, true); else dst.value = dv.getInt8(off); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src && typeof src === 'object' && 'value' in src) { /* C17 §6.5 type-pun via memcpy: reinterpret src.value bytes as dst's type. n=4: int32<->float32. n=8: int64<->float64 (via bigint). */ const __b = new Uint8Array(8); const __dv = new DataView(__b.buffer); const __s = src.value; const __d = dst.value; if (n === 4) { if (Number.isInteger(__s) && !Number.isInteger(__d) && typeof __d === 'number') { __dv.setInt32(0, __s | 0, true); dst.value = __dv.getFloat32(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat32(0, __s, true); dst.value = __dv.getInt32(0, true); } else { dst.value = __s; } } else if (n === 8) { if (typeof __s === 'bigint' && typeof __d !== 'bigint') { __dv.setBigInt64(0, __s, true); dst.value = __dv.getFloat64(0, true); } else if (typeof __s !== 'bigint' && typeof __d === 'bigint') { __dv.setFloat64(0, Number(__s), true); dst.value = __dv.getBigInt64(0, true); } else if (Number.isInteger(__s) && !Number.isInteger(__d)) { __dv.setBigInt64(0, BigInt(Math.trunc(__s)), true); dst.value = __dv.getFloat64(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat64(0, __s, true); dst.value = Number(__dv.getBigInt64(0, true)); } else { dst.value = __s; } } else { dst.value = __s; } return dst; } if (Array.isArray(dst) && src && src.buf) { /* BRIDGE: memcpy(Array, CPtr, n) — destination is a JS Array decayed from a struct/array of i64/i32/etc., source is a CPtr backed by a Uint8Array. Read element-wise via DataView using src.__elem_size when available, defaulting to 8 (int64 — covers curve25519 fcontract / fmonty origx<-x and BLAKE2 buffer staging). C17 §7.24.2.1: memcpy copies n bytes; element-size routing is the byte-addressable lowering for an i64 destination. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const baseOff = src.off ?? 0; const elemSize = (src.__elem_size as number) || 8; const count = Math.floor(n / elemSize); for (let i = 0; i < count; i++) { const eoff = baseOff + i * elemSize; if (elemSize === 8) dst[i] = dv.getBigInt64(eoff, true); else if (elemSize === 4) dst[i] = dv.getInt32(eoff, true); else if (elemSize === 2) dst[i] = dv.getInt16(eoff, true); else dst[i] = dv.getInt8(eoff); } return dst; } if (Array.isArray(dst) && Array.isArray(src)) { for (let i = 0; i < n; i++) dst[i] = src[i]; } else if (typeof dst === 'object' && typeof src === 'object') Object.assign(dst, src); return dst; }
function strcat(dst: any, src: any): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 const srcStr = typeof src === 'string' ? src : src?.buf ? cptr_to_string(src) : src?.toString?.() ?? ''; if (dst?.buf) { let end = 0; while (dst.buf[dst.off + end] !== 0 && dst.off + end < dst.buf.length) end++; for (let i = 0; i < srcStr.length; i++) dst.buf[dst.off + end + i] = srcStr.charCodeAt(i); dst.buf[dst.off + end + srcStr.length] = 0; return dst; } if (Array.isArray(dst)) { let i = 0; while (dst[i] !== 0 && dst[i] !== undefined && i < dst.length) i++; for (let j = 0; j < srcStr.length; j++) dst[i + j] = srcStr.charCodeAt(j); dst[i + srcStr.length] = 0; return dst; } if (typeof dst === 'object' && 'value' in dst) { dst.value = (dst.value ?? '') + srcStr; return dst; } return (dst ?? '') + srcStr; }
function strcpy(dst: any, src: any): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 const srcStr = typeof src === 'string' ? src : src?.buf ? cptr_to_string(src) : src?.toString?.() ?? ''; if (dst?.buf) { for (let i = 0; i < srcStr.length; i++) dst.buf[dst.off + i] = srcStr.charCodeAt(i); dst.buf[dst.off + srcStr.length] = 0; return dst; } if (Array.isArray(dst)) { for (let i = 0; i < srcStr.length; i++) dst[i] = srcStr.charCodeAt(i); dst[srcStr.length] = 0; return dst; } if (dst && typeof dst === 'object' && 'value' in dst) dst.value = srcStr; return srcStr; }
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
function prev(it: any, n: number = 1): any { if (it == null) return null; if (it && it.__arr !== undefined) return __cpp_iter(it.__arr, (it.__pos ?? 0) - n); if (typeof it === 'number') return it - n; return it; }
function next(it: any, n: number = 1): any { if (it == null) return null; if (it && it.__arr !== undefined) return __cpp_iter(it.__arr, (it.__pos ?? 0) + n); if (typeof it === 'number') return it + n; return it; }
function count(first: any, last: any, value: any): number { const A = __cpp_arr(first, last); let n = 0; for (let i = A.start; i < A.end; i++) if (A.arr[i] === value) n++; return n; }
function strrchr(s: any, c: number): any {
  if (typeof s === 'string') s = cptr_from_string(s);
 if (s == null) return null; if (s?.buf) { let last = -1; for (let i = s.off; i < s.buf.length && s.buf[i] !== 0; i++) if (s.buf[i] === c) last = i; return last >= 0 ? { buf: s.buf, off: last } : null; } if (typeof s === 'string') { const idx = s.lastIndexOf(String.fromCharCode(c)); if (idx < 0) return null; const p = cptr_from_string(s); p.off = idx; return p; } return null; }
function fabs(x: number): number { return Math.abs(x); }
function tolower(c: number): number { if (c == null) return 0; const ch = String.fromCharCode(c); return ch.toLowerCase().charCodeAt(0); }
function write(fd: any, buf: any, count: number): number { if (fd === 1) { const s = (buf?.buf) ? cptr_to_string(buf) : (typeof buf === 'string' ? buf : String.fromCharCode(...new Uint8Array(buf, 0, count))); process.stdout.write(s.substring(0, count)); return count; } if (fd === 2) { const s = (buf?.buf) ? cptr_to_string(buf) : (typeof buf === 'string' ? buf : String(buf)); process.stderr.write(s.substring(0, count)); return count; } try { const data = (buf?.buf) ? Buffer.from(buf.buf.buffer, buf.buf.byteOffset + buf.off, count) : (typeof buf === 'string' ? Buffer.from(buf) : Buffer.from(buf)); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function abs(x: number): number { return Math.abs(x); }
function includes(first1: any, last1: any, first2: any, last2: any, comp?: Function): boolean { const A = __cpp_arr(first1, last1); const B = __cpp_arr(first2, last2); const lt = comp ?? ((a: any, b: any) => a < b); let i = A.start, j = B.start; while (i < A.end && j < B.end) { if (lt(B.arr[j], A.arr[i])) return false; if (lt(A.arr[i], B.arr[j])) i++; else { i++; j++; } } return j === B.end; }
function max(a: any, b?: any, comp?: Function): any { if (b === undefined) { if (Array.isArray(a)) return a.reduce((m, x) => x > m ? x : m, a[0]); return a; } const lt = comp ?? ((x: any, y: any) => x < y); return lt(a, b) ? b : a; }
function trunc(x: number): number { return Math.trunc(x); }
/* stdbool: true/false are native in TypeScript */
const stdin = { __fd: 0, __name: 'stdin' }, stdout = { __fd: 1, __name: 'stdout' }, stderr = { __fd: 2, __name: 'stderr' };
const NULL = null;
const NAN = NaN, INFINITY_C = Infinity, HUGE_VAL = Infinity, HUGE_VALF = Infinity, HUGE_VALL = Infinity, M_PI = 3.141592653589793, M_PI_2 = 1.5707963267948966, M_PI_4 = 0.7853981633974483, M_1_PI = 0.3183098861837907, M_2_PI = 0.6366197723675814, M_2_SQRTPI = 1.1283791670955126, M_E = 2.718281828459045, M_LOG2E = 1.4426950408889634, M_LOG10E = 0.4342944819032518, M_LN2 = 0.6931471805599453, M_LN10 = 2.302585092994046, M_SQRT2 = 1.4142135623730951, M_SQRT1_2 = 0.7071067811865476;
function i32(x: number) { return x | 0; }
function u32(x: number) { return x >>> 0; }
function __as_bigint(x: any): bigint { if (typeof x === 'bigint') return x; if (typeof x === 'number') return BigInt(Math.trunc(x)); if (x && typeof x === 'object' && 'value' in x) { const v = (x as any).value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof x === 'boolean') return x ? 1n : 0n; return BigInt(Math.trunc(Number(x ?? 0))); }
function __u64(x: bigint): bigint { return BigInt.asUintN(64, x); }
function __i64(x: bigint): bigint { return BigInt.asIntN(64, x); }
function __safe_div_i64(a: bigint, b: bigint): bigint { if (b === 0n) throw new Error('Division by zero'); return a / b; }
function __safe_mod_i64(a: bigint, b: bigint): bigint { if (b === 0n) throw new Error('Division by zero'); return a % b; }

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

// BRIDGE: c-out-pointer alias — C17 §6.5.3.2 + §6.7.6.1; structurally `{ value: T }`.
type COutParam<T> = { value: T };

function printf(fmt: string, ...args: any[]): number {
  let result = "", argIdx = 0, i = 0;
  while (i < fmt.length) {
    if (fmt[i] === "%" && i + 1 < fmt.length) {
      i++;
      let flags = ""; while ("-+ 0#".includes(fmt[i])) flags += fmt[i++];
      let width = ""; if (fmt[i] === "*") { width = String(args[argIdx++]); i++; } else { while (fmt[i] >= "0" && fmt[i] <= "9") width += fmt[i++]; }
      let prec = ""; if (fmt[i] === ".") { i++; if (fmt[i] === "*") { prec = String(args[argIdx++]); i++; } else { while (fmt[i] >= "0" && fmt[i] <= "9") prec += fmt[i++]; } }
      let lenMod = ""; if ("hlLzjt".includes(fmt[i])) { lenMod = fmt[i]; i++; if (fmt[i] === fmt[i-1]) { lenMod += fmt[i]; i++; } }
      const is64 = (lenMod === "z" || lenMod === "ll" || lenMod === "j" || lenMod === "L");
      const spec = fmt[i++], a = args[argIdx++], w = width ? parseInt(width) : 0;
      const av = (a && typeof a === "object" && a.__arr !== undefined) ? a.__arr[a.__pos ?? 0] : a;
      let s: string;
      // C17 7.21.6.1: negative values under u/x/X/o with z, ll, j length modifiers
      // render with full 64-bit unsigned wrap so size_t(-1) prints as 18446744073709551615.
      const toUnsignedStr = (v: any, radix: number, upper: boolean): string => {
        if (typeof v === "bigint") {
          const r = BigInt.asUintN(is64 ? 64 : 32, v).toString(radix);
          return upper ? r.toUpperCase() : r;
        }
        const n = Number(v);
        if (is64 && n < 0) {
          let big = BigInt.asUintN(64, BigInt(Math.trunc(n)));
          let r = big.toString(radix);
          return upper ? r.toUpperCase() : r;
        }
        let r = (Math.trunc(n) >>> 0).toString(radix);
        return upper ? r.toUpperCase() : r;
      };
      switch (spec) {
        case "d": case "i": { if (typeof av === "bigint") { const n = is64 ? BigInt.asIntN(64, av) : av; let mag = (n < 0n ? -n : n).toString(); if (prec) { const p = parseInt(prec); if (mag.length < p) mag = mag.padStart(p, "0"); } s = (n < 0n ? "-" : "") + mag; if (n >= 0n && flags.includes("+")) s = "+" + s; else if (n >= 0n && flags.includes(" ")) s = " " + s; break; } const n = Math.trunc(Number(av)); let mag = Math.abs(n).toString(); if (prec) { const p = parseInt(prec); if (mag.length < p) mag = mag.padStart(p, "0"); } s = (n < 0 ? "-" : "") + mag; if (n >= 0 && flags.includes("+")) s = "+" + s; else if (n >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "u": s = toUnsignedStr(av, 10, false); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } break;
        case "x": s = toUnsignedStr(av, 16, false); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } if (flags.includes("#") && s !== "0") s = "0x" + s; break;
        case "X": s = toUnsignedStr(av, 16, true); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } if (flags.includes("#") && s !== "0") s = "0X" + s; break;
        case "o": s = toUnsignedStr(av, 8, false); if (prec) { const p = parseInt(prec); if (s.length < p) s = s.padStart(p, "0"); } if (flags.includes("#") && !s.startsWith("0")) s = "0" + s; break;
        case "f": case "F": { const aObj: any = av; const nn = Number(aObj); if (Number.isNaN(nn)) { s = spec === "F" ? "NAN" : "nan"; break; } if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + (spec === "F" ? "INF" : "inf"); break; } const isDec = !!(aObj && typeof aObj.toFixed === "function" && typeof aObj.toNumber === "function"); const p = prec ? parseInt(prec) : 6; if (isDec) { s = aObj.toFixed(p); } else { s = nn.toFixed(p); } const isNegZero = !isDec && Object.is(nn, -0); const sign = isDec ? (aObj.isNegative && aObj.isNegative() ? -1 : 1) : (nn < 0 || isNegZero ? -1 : 1); if (isNegZero && !s.startsWith("-")) s = "-" + s; if (sign >= 0 && flags.includes("+")) s = "+" + s; else if (sign >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "e": { const aObj: any = av; const nn = Number(aObj); if (Number.isNaN(nn)) { s = "nan"; break; } if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + "inf"; break; } const isDec = !!(aObj && typeof aObj.toExponential === "function" && typeof aObj.toNumber === "function"); const p = prec ? parseInt(prec) : 6; if (isDec) { s = aObj.toExponential(p); } else { s = nn.toExponential(p); } s = s.replace(/e([+-])(\d)$/, "e$1" + "0$2"); const sign = isDec ? (aObj.isNegative && aObj.isNegative() ? -1 : 1) : (nn < 0 ? -1 : 1); if (sign >= 0 && flags.includes("+")) s = "+" + s; else if (sign >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "E": { const aObj: any = av; const nn = Number(aObj); if (Number.isNaN(nn)) { s = "NAN"; break; } if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + "INF"; break; } const isDec = !!(aObj && typeof aObj.toExponential === "function" && typeof aObj.toNumber === "function"); const p = prec ? parseInt(prec) : 6; if (isDec) { s = aObj.toExponential(p); } else { s = nn.toExponential(p); } s = s.replace(/e([+-])(\d)$/, "e$1" + "0$2").toUpperCase(); const sign = isDec ? (aObj.isNegative && aObj.isNegative() ? -1 : 1) : (nn < 0 ? -1 : 1); if (sign >= 0 && flags.includes("+")) s = "+" + s; else if (sign >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "g": case "G": { const aObj: any = av; const nn = Number(aObj); if (Number.isNaN(nn)) { s = spec === "G" ? "NAN" : "nan"; break; } if (!Number.isFinite(nn)) { s = (nn < 0 ? "-" : (flags.includes("+") ? "+" : (flags.includes(" ") ? " " : ""))) + (spec === "G" ? "INF" : "inf"); break; } const isDec = !!(aObj && typeof aObj.toPrecision === "function" && typeof aObj.toNumber === "function"); const gPrec = prec ? parseInt(prec) : 6; if (isDec) { s = aObj.toPrecision(gPrec); } else { s = nn.toPrecision(gPrec); } s = s.replace(/(\.\d*?)0+(?=e|$)/, "$1").replace(/\.(?=e|$)/, "").replace(/e([+-])(\d)$/, "e$1" + "0$2"); if (spec === "G") s = s.toUpperCase(); const sign = isDec ? (aObj.isNegative && aObj.isNegative() ? -1 : 1) : (nn < 0 ? -1 : 1); if (sign >= 0 && flags.includes("+")) s = "+" + s; else if (sign >= 0 && flags.includes(" ")) s = " " + s; break; }
        case "s": {
          // C17 §7.21.6.1: %s prints a char string; %ls (lenMod 'l') prints
          // a wchar_t string. For wide strings, decode the wchar_t array to
          // UTF-16 code points (null-terminated). Plain JS array of numbers
          // = wchar_t buffer; CPtr or string = char string.
          if (lenMod === "l" && Array.isArray(a)) {
            let r = "";
            for (let i = 0; i < a.length; i++) {
              const cp = Number(a[i] ?? 0);
              if (cp === 0) break;
              r += String.fromCodePoint(cp);
            }
            s = r;
          } else if (a?.buf) {
            s = cptr_to_string(a);
          } else if (a && typeof a === "object" && typeof a.c_str === "function") {
            s = a;
          } else {
            s = "" + (a ?? "");
          }
          if (prec) s = s.slice(0, parseInt(prec));
          break;
        }
        case "a": case "A": { const v = Number(av); if (v === 0) { s = (spec === "A" ? "0X0P+0" : "0x0p+0"); break; } const __bb = new ArrayBuffer(8); new DataView(__bb).setFloat64(0, v, true); const __dv = new DataView(__bb); const __lo = __dv.getUint32(0, true), __hi = __dv.getUint32(4, true); const __sg = (__hi >>> 31) & 1; const __ex = ((__hi >>> 20) & 0x7FF) - 1023; let __m = (__hi & 0xFFFFF).toString(16).padStart(5, "0") + __lo.toString(16).padStart(8, "0"); __m = __m.replace(/0+$/, ""); const __exStr = __ex >= 0 ? ("+" + __ex) : String(__ex); const __head = spec === "A" ? "0X1" : "0x1"; const __mid = __m ? ("." + (spec === "A" ? __m.toUpperCase() : __m)) : ""; const __p = spec === "A" ? "P" : "p"; s = (__sg ? "-" : "") + __head + __mid + __p + __exStr; break; }
        case "c": s = typeof av === "string" ? av.charAt(0) : String.fromCharCode(Number(av)); break;
        case "p": s = "0x" + (Number(av) >>> 0).toString(16); break;
        case "n": { if (a?.buf) new DataView(a.buf.buffer, a.buf.byteOffset).setInt32(a.off ?? 0, result.length, true); else if (a && typeof a === "object" && "value" in a) a.value = result.length; s = ""; break; }
        case "%": s = "%"; argIdx--; break;
        default: s = "%" + spec; argIdx--;
      }
      { let ww = w; let leftAlign = flags.includes("-"); if (ww < 0) { leftAlign = true; ww = -ww; } if (ww > s.length) { const zero = flags.includes("0") && !leftAlign && "diouxXeEfFgG".includes(spec); const padChar = zero ? "0" : " "; const padLen = ww - s.length; const pad = padChar.repeat(padLen); /* C17 §7.21.6.1: zero-pad goes BETWEEN the sign and the magnitude, not before the sign. Same for 0x/0X prefixes added by # flag. */ if (zero && !leftAlign && (s.startsWith("-") || s.startsWith("+") || s.startsWith(" "))) { s = s[0] + pad + s.slice(1); } else if (zero && !leftAlign && (s.startsWith("0x") || s.startsWith("0X"))) { s = s.slice(0, 2) + pad + s.slice(2); } else { s = leftAlign ? s + pad : pad + s; } } }
      result += s;
    } else { result += fmt[i++]; }
  }
  // Reference _fileHandles via globalThis to avoid TS2304 in TUs that don't
  // include the file-IO injection block (no fopen/fclose/fgets in the source).
  // The runtime check still works either way.
  const __fh: any = (globalThis as any)._fileHandles;
  if (typeof stdout === "object" && stdout && typeof (stdout as any).__fd === "number" && __fh) {
    const h = __fh.get((stdout as any).__fd);
    if (h) {
      const buf = Buffer.from(result);
      require("fs").writeSync(h.fd, buf, 0, buf.length, h.pos);
      h.pos += buf.length;
      return result.length;
    }
  }
  process.stdout.write(result);
  return result.length;
}
function strlen(s: any): number { if (s == null) return 0; if (typeof s === 'string') return s.length; if (s.buf) return cptr_strlen(s); if (Array.isArray(s)) { let i = 0; while (s[i] !== 0 && s[i] !== undefined && i < s.length) i++; return i; } return s?.length ?? 0; }
function strcmp(a: any, b: any): number { const sa = (typeof a === 'string') ? a : (a?.buf ? cptr_to_string(a) : a?.toString?.() ?? ''); const sb = (typeof b === 'string') ? b : (b?.buf ? cptr_to_string(b) : b?.toString?.() ?? ''); return sa < sb ? -1 : sa > sb ? 1 : 0; }
// Static local variables
let _static_invalid_0: cJSON;

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class cJSON {
  next: cJSON | null;
  prev: cJSON | null;
  child: cJSON | null;
  type: number;
  valuestring: string;
  valueint: number;
  valuedouble: number;
  string: string;
  constructor() {
    this.next = null;
    this.prev = null;
    this.child = null;
    this.type = 0;
    this.valuestring = null;
    this.valueint = 0;
    this.valuedouble = 0.0;
    this.string = null;
  }
}
(cJSON as any).__fieldTypes = ["int64","int64","int64","int32","int64","int32","double","int64"];
(cJSON as any).__fieldNames = ["next","prev","child","type","valuestring","valueint","valuedouble","string"];
(cJSON as any).__fieldOffsets = [0,8,16,24,32,40,48,56];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class cJSON_Hooks {
  malloc_fn: any;
  free_fn: any;
  constructor() {
    this.malloc_fn = null;
    this.free_fn = null;
  }
}
(cJSON_Hooks as any).__fieldTypes = ["int64","int32"];
(cJSON_Hooks as any).__fieldNames = ["malloc_fn","free_fn"];
(cJSON_Hooks as any).__fieldOffsets = [0,8];

type cJSON_bool = number;
function cJSONUtils_strdup(string: any | null): any | null {
  let length = ((0) >>> 0);
  let copy = null; /* &ref */
  length = strlen(cptr_clone((string))) + 1;
  copy = (cJSON_malloc(((length) >>> 0)));
  if ((cptr_eq(copy, (null)) ? 1 : 0)) {
    return null;
  }
  memcpy(copy, string, ((length) >>> 0));
  return cptr_clone(copy);
}

function compare_strings(string1: any | null, string2: any | null, case_sensitive: cJSON_bool): number {
  if (typeof string1 === 'string') string1 = cptr_from_string(string1);
  if (typeof string2 === 'string') string2 = cptr_from_string(string2);

  if (((((cptr_eq(string1, (null)) ? 1 : 0)) || ((cptr_eq(string2, (null)) ? 1 : 0))) ? 1 : 0)) {
    return 1;
  }
  if ((cptr_eq(string1, string2) ? 1 : 0)) {
    return 0;
  }
  if (case_sensitive) {
    return strcmp(cptr_clone((string1)), cptr_clone((string2)));
  }
  for (; (tolower(((string1.buf[string1.off]) & 0xFF)) == tolower(((string2.buf[string2.off]) & 0xFF)) ? 1 : 0); (string1.off++), string2.off++) {
    if ((((string1.buf[string1.off]) & 0xFF) == 0 ? 1 : 0)) {
      return 0;
    }
  }
  return i32(tolower(((string1.buf[string1.off]) & 0xFF)) - tolower(((string2.buf[string2.off]) & 0xFF)));
}

function compare_double(a: number, b: number): cJSON_bool {
  let maxVal = ((fabs(a) > fabs(b) ? 1 : 0) ? fabs(a) : fabs(b));
  return (((fabs(a - b) <= maxVal * 2.2204460492503131E-16 ? 1 : 0)) ? 1 : 0);
}

function compare_pointers(name: any | null, pointer: any | null, case_sensitive: cJSON_bool): cJSON_bool {
  if (typeof name === 'string') name = cptr_from_string(name);
  if (typeof pointer === 'string') pointer = cptr_from_string(pointer);

  if (((((cptr_eq(name, (null)) ? 1 : 0)) || ((cptr_eq(pointer, (null)) ? 1 : 0))) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  for (; ((((((((name.buf[name.off]) & 0xFF) != 0 ? 1 : 0)) && ((((pointer.buf[pointer.off]) & 0xFF) != 0 ? 1 : 0))) ? 1 : 0) && ((((pointer.buf[pointer.off]) & 0xFF) != 47 ? 1 : 0))) ? 1 : 0); (name.off++), pointer.off++) {
    if ((((pointer.buf[pointer.off]) & 0xFF) == 126 ? 1 : 0)) {
      if ((((((((((pointer.buf[(pointer.off ?? 0) + 1]) & 0xFF) != 48 ? 1 : 0)) || ((((name.buf[name.off]) & 0xFF) != 126 ? 1 : 0))) ? 1 : 0)) && (((((((pointer.buf[(pointer.off ?? 0) + 1]) & 0xFF) != 49 ? 1 : 0)) || ((((name.buf[name.off]) & 0xFF) != 47 ? 1 : 0))) ? 1 : 0))) ? 1 : 0)) {
        return (Math.trunc(+(0)));
      } else {
        pointer.off++;
      }
    } else {
      if (((((((!case_sensitive ? 1 : 0) && ((tolower(((name.buf[name.off]) & 0xFF)) != tolower(((pointer.buf[pointer.off]) & 0xFF)) ? 1 : 0))) ? 1 : 0)) || (((case_sensitive && ((((name.buf[name.off]) & 0xFF) != ((pointer.buf[pointer.off]) & 0xFF) ? 1 : 0))) ? 1 : 0))) ? 1 : 0)) {
        return (Math.trunc(+(0)));
      }
    }
  }
  if (((((((((pointer.buf[pointer.off]) & 0xFF) != 0 ? 1 : 0)) && ((((pointer.buf[pointer.off]) & 0xFF) != 47 ? 1 : 0))) ? 1 : 0)) != ((((name.buf[name.off]) & 0xFF) != 0 ? 1 : 0)) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  return (Math.trunc(+(1)));
}

function pointer_encoded_length(string: any | null): number {
  if (typeof string === 'string') string = cptr_from_string(string);

  let length = 0;
  for (length = ((0) >>> 0); (((string.buf[string.off]) & 0xFF) != 0 ? 1 : 0); (string.off++), (() => { const _t = length; length = u32(length + 1); return _t; })()) {
    if (((((((string.buf[string.off]) & 0xFF) == 126 ? 1 : 0)) || ((((string.buf[string.off]) & 0xFF) == 47 ? 1 : 0))) ? 1 : 0)) {
      (() => { const _t = length; length = u32(length + 1); return _t; })();
    }
  }
  return ((length) >>> 0);
}

function encode_string_as_pointer(destination: any | null, source: any | null): void {
  if (typeof destination === 'string') destination = cptr_from_string(destination);
  if (typeof source === 'string') source = cptr_from_string(source);

  for (; (((source.buf[(source.off ?? 0) + 0]) & 0xFF) != 0 ? 1 : 0); (source.off++), destination.off++) {
    if ((((source.buf[(source.off ?? 0) + 0]) & 0xFF) == 47 ? 1 : 0)) {
      destination.buf[(destination.off ?? 0) + 0] = (((126) & 0xFF)) & 0xFF;
      destination.buf[(destination.off ?? 0) + 1] = (((49) & 0xFF)) & 0xFF;
      destination.off++;
    } else {
      if ((((source.buf[(source.off ?? 0) + 0]) & 0xFF) == 126 ? 1 : 0)) {
        destination.buf[(destination.off ?? 0) + 0] = (((126) & 0xFF)) & 0xFF;
        destination.buf[(destination.off ?? 0) + 1] = (((48) & 0xFF)) & 0xFF;
        destination.off++;
      } else {
        destination.buf[(destination.off ?? 0) + 0] = (((source.buf[(source.off ?? 0) + 0]) & 0xFF)) & 0xFF;
      }
    }
  }
  destination.buf[(destination.off ?? 0) + 0] = (((0) & 0xFF)) & 0xFF;
}

export function cJSONUtils_FindPointerFromObjectTo(object: cJSON | null, target: cJSON | null): CPtr {
  let child_index = ((0) >>> 0);
  let current_child = null; /* &ref */
  if (((((object == (null) ? 1 : 0)) || ((target == (null) ? 1 : 0))) ? 1 : 0)) {
    return null;
  }
  if ((object == target ? 1 : 0)) {
    return cptr_clone((cJSONUtils_strdup((""))));
  }
  for (current_child = (__struct_ptr_at(object, 0)).child; (current_child != (null) ? 1 : 0); ((current_child = (__struct_ptr_at(current_child, 0)).next)), (() => { const _t = child_index; child_index = u32(child_index + 1); return _t; })()) {
    let target_pointer = (cJSONUtils_FindPointerFromObjectTo(current_child, target)); /* &ref */
    if ((!cptr_eq(target_pointer, (null)) ? 1 : 0)) {
      if (cJSON_IsArray(object)) {
        let full_pointer = (cJSON_malloc(strlen(cptr_clone((target_pointer))) + 20 + 2)); /* &ref */
        if ((((child_index) >>> 0) > (((u32((Math.imul(((2147483647) >>> 0), 2) >>> 0) + 1))) >>> 0) ? 1 : 0)) {
          cJSON_free(target_pointer);
          cJSON_free(full_pointer);
          return null;
        }
        (() => { const __s = printf_format("/%lu%s", ((Number(BigInt.asUintN(32, __as_bigint(((child_index) >>> 0))))) >>> 0), cptr_clone(target_pointer)); strcpy((full_pointer), __s); return __s.length; })();
        cJSON_free(target_pointer);
        return cptr_clone((full_pointer));
      }
      if (cJSON_IsObject(object)) {
        let full_pointer = (cJSON_malloc(Number(__as_bigint(__u64(__as_bigint(strlen(cptr_clone((target_pointer))) + pointer_encoded_length(cptr_clone(((__struct_ptr_at(current_child, 0)).string)))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 2)))))); /* &ref */
        full_pointer.buf[(full_pointer.off ?? 0) + 0] = (((47) & 0xFF)) & 0xFF;
        encode_string_as_pointer(cptr_offset(full_pointer, 1), cptr_clone(((__struct_ptr_at(current_child, 0)).string)));
        strcat((full_pointer), cptr_clone((target_pointer)));
        cJSON_free(target_pointer);
        return cptr_clone((full_pointer));
      }
      cJSON_free(target_pointer);
      return null;
    }
  }
  return null;
}

function get_array_item(array: cJSON | null, item: number): cJSON | null {
  let child = (array ? (__struct_ptr_at(array, 0)).child : null); /* &ref */
  while (((((child != (null) ? 1 : 0)) && ((((item) >>> 0) > ((0) >>> 0) ? 1 : 0))) ? 1 : 0)) {
    (() => { const _t = item; item = u32(item - 1); return _t; })();
    child = (__struct_ptr_at(child, 0)).next;
  }
  return child;
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: index.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
function decode_array_index_from_pointer(pointer: any | null, index: COutParam<number | null>): cJSON_bool {
  if (typeof pointer === 'string') pointer = cptr_from_string(pointer);

  let parsed_index = ((0) >>> 0);
  let position = ((0) >>> 0);
  if (((((((pointer.buf[(pointer.off ?? 0) + 0]) & 0xFF) == 48 ? 1 : 0)) && (((((((pointer.buf[(pointer.off ?? 0) + 1]) & 0xFF) != 0 ? 1 : 0)) && ((((pointer.buf[(pointer.off ?? 0) + 1]) & 0xFF) != 47 ? 1 : 0))) ? 1 : 0))) ? 1 : 0)) {
    return 0;
  }
  for (position = ((0) >>> 0); ((((((pointer.buf[(pointer.off ?? 0) + ((position) >>> 0)]) & 0xFF) >= 48 ? 1 : 0)) && ((((pointer.buf[(pointer.off ?? 0) + ((position) >>> 0)]) & 0xFF) <= 57 ? 1 : 0))) ? 1 : 0); (() => { const _t = position; position = u32(position + 1); return _t; })()) {
    parsed_index = (((10) >>> 0) * ((parsed_index) >>> 0)) + ((Math.trunc(+((i32(((pointer.buf[(pointer.off ?? 0) + ((position) >>> 0)]) & 0xFF) - 48))))) >>> 0);
  }
  if (((((((pointer.buf[(pointer.off ?? 0) + ((position) >>> 0)]) & 0xFF) != 0 ? 1 : 0)) && ((((pointer.buf[(pointer.off ?? 0) + ((position) >>> 0)]) & 0xFF) != 47 ? 1 : 0))) ? 1 : 0)) {
    return 0;
  }
  index.value = ((parsed_index) >>> 0);
  return 1;
}

function get_item_from_pointer(object: cJSON | null, pointer: any, case_sensitive: cJSON_bool): cJSON | null {
  if (typeof pointer === 'string') pointer = cptr_from_string(pointer);

  let current_element = object; /* &ref */
  if ((cptr_eq(pointer, (null)) ? 1 : 0)) {
    return null;
  }
  while (((((((pointer.buf[(pointer.off ?? 0) + 0]) << 24 >> 24) == 47 ? 1 : 0)) && ((current_element != (null) ? 1 : 0))) ? 1 : 0)) {
    pointer.off++;
    if (cJSON_IsArray(current_element)) {
      let index_box = { value: ((0) >>> 0) };
      if ((!decode_array_index_from_pointer(cptr_clone((pointer)), index_box) ? 1 : 0)) {
        return null;
      }
      current_element = get_array_item(current_element, ((index_box.value) >>> 0));
    } else {
      if (cJSON_IsObject(current_element)) {
        current_element = (__struct_ptr_at(current_element, 0)).child;
        while (((((current_element != (null) ? 1 : 0)) && (!compare_pointers(cptr_clone(((__struct_ptr_at(current_element, 0)).string)), cptr_clone((pointer)), case_sensitive) ? 1 : 0)) ? 1 : 0)) {
          current_element = (__struct_ptr_at(current_element, 0)).next;
        }
      } else {
        return null;
      }
    }
    while (((((((pointer.buf[(pointer.off ?? 0) + 0]) << 24 >> 24) != 0 ? 1 : 0)) && ((((pointer.buf[(pointer.off ?? 0) + 0]) << 24 >> 24) != 47 ? 1 : 0))) ? 1 : 0)) {
      pointer.off++;
    }
  }
  return current_element;
}

export function cJSONUtils_GetPointer(object: cJSON | null, pointer: any): cJSON | null {
  return get_item_from_pointer(object, cptr_clone(pointer), (Math.trunc(+(0))));
}

export function cJSONUtils_GetPointerCaseSensitive(object: cJSON | null, pointer: any): cJSON | null {
  return get_item_from_pointer(object, cptr_clone(pointer), (Math.trunc(+(1))));
}

function decode_pointer_inplace(string: any | null): void {
  if (typeof string === 'string') string = cptr_from_string(string);

  let decoded_string = cptr_clone(cptr_clone(string)); /* &ref */
  if ((cptr_eq(string, (null)) ? 1 : 0)) {
    return;
  }
  for (; ((string.buf[string.off]) & 0xFF); (decoded_string.off++), string.off++) {
    if ((((string.buf[(string.off ?? 0) + 0]) & 0xFF) == 126 ? 1 : 0)) {
      if ((((string.buf[(string.off ?? 0) + 1]) & 0xFF) == 48 ? 1 : 0)) {
        decoded_string.buf[(decoded_string.off ?? 0) + 0] = (((126) & 0xFF)) & 0xFF;
      } else {
        if ((((string.buf[(string.off ?? 0) + 1]) & 0xFF) == 49 ? 1 : 0)) {
          decoded_string.buf[(decoded_string.off ?? 0) + 1] = (((47) & 0xFF)) & 0xFF;
        } else {
          return;
        }
      }
      string.off++;
    }
  }
  decoded_string.buf[(decoded_string.off ?? 0) + 0] = (((0) & 0xFF)) & 0xFF;
}

function detach_item_from_array(array: cJSON | null, which: number): cJSON | null {
  let c = (__struct_ptr_at(array, 0)).child; /* &ref */
  while (((c && ((((which) >>> 0) > ((0) >>> 0) ? 1 : 0))) ? 1 : 0)) {
    c = (__struct_ptr_at(c, 0)).next;
    (() => { const _t = which; which = u32(which - 1); return _t; })();
  }
  if ((!c ? 1 : 0)) {
    return null;
  }
  if ((c != (__struct_ptr_at(array, 0)).child ? 1 : 0)) {
    (__struct_ptr_at((__struct_ptr_at(c, 0)).prev, 0)).next = (__struct_ptr_at(c, 0)).next;
  }
  if ((__struct_ptr_at(c, 0)).next) {
    (__struct_ptr_at((__struct_ptr_at(c, 0)).next, 0)).prev = (__struct_ptr_at(c, 0)).prev;
  }
  if ((c == (__struct_ptr_at(array, 0)).child ? 1 : 0)) {
    (__struct_ptr_at(array, 0)).child = (__struct_ptr_at(c, 0)).next;
  } else {
    if (((__struct_ptr_at(c, 0)).next == (null) ? 1 : 0)) {
      (__struct_ptr_at((__struct_ptr_at(array, 0)).child, 0)).prev = (__struct_ptr_at(c, 0)).prev;
    }
  }
  (__struct_ptr_at(c, 0)).prev = (__struct_ptr_at(c, 0)).next = null;
  return c;
}

function detach_path(object: cJSON | null, path: any | null, case_sensitive: cJSON_bool): cJSON | null {
  let parent_pointer: any | null = null;
  let child_pointer: any | null = null;
  let parent: cJSON | null = null;
  let detached_item: cJSON | null = null;
  let index: number = 0;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      parent_pointer = null; /* &ref */
      child_pointer = null; /* &ref */
      parent = null; /* &ref */
      detached_item = null; /* &ref */
      parent_pointer = cJSONUtils_strdup(cptr_clone(path));
      if ((cptr_eq(parent_pointer, (null)) ? 1 : 0)) {
        _state = 1; continue _sm; /* goto cleanup */
      }
      child_pointer = (strrchr(cptr_clone((parent_pointer)), 47));
      if ((cptr_eq(child_pointer, (null)) ? 1 : 0)) {
        _state = 1; continue _sm; /* goto cleanup */
      }
      child_pointer.buf[(child_pointer.off ?? 0) + 0] = (((0) & 0xFF)) & 0xFF;
      child_pointer.off++;
      parent = get_item_from_pointer(object, cptr_clone((parent_pointer)), case_sensitive);
      decode_pointer_inplace(cptr_clone(child_pointer));
      if (cJSON_IsArray(parent)) {
        index = ((0) >>> 0);
        if ((!decode_array_index_from_pointer(cptr_clone(child_pointer), { value: index }) ? 1 : 0)) {
          _state = 1; continue _sm; /* goto cleanup */
        }
        detached_item = detach_item_from_array(parent, ((index) >>> 0));
      } else {
        if (cJSON_IsObject(parent)) {
          detached_item = cJSON_DetachItemFromObject(parent, cptr_clone((child_pointer)));
        } else {
          _state = 1; continue _sm; /* goto cleanup */
        }
      }
    case 1: /* cleanup */
      if ((!cptr_eq(parent_pointer, (null)) ? 1 : 0)) {
        cJSON_free(parent_pointer);
      }
      return detached_item;
      break _sm;
    }
  }
}

function sort_list(list: cJSON | null, case_sensitive: cJSON_bool): cJSON | null {
  let first = list; /* &ref */
  let second = list; /* &ref */
  let current_item = list; /* &ref */
  let result = list; /* &ref */
  let result_tail = null; /* &ref */
  if (((((list == (null) ? 1 : 0)) || (((__struct_ptr_at(list, 0)).next == (null) ? 1 : 0))) ? 1 : 0)) {
    return result;
  }
  while (((((((current_item != (null) ? 1 : 0)) && (((__struct_ptr_at(current_item, 0)).next != (null) ? 1 : 0))) ? 1 : 0) && ((compare_strings(cptr_clone(((__struct_ptr_at(current_item, 0)).string)), cptr_clone(((__struct_ptr_at((__struct_ptr_at(current_item, 0)).next, 0)).string)), case_sensitive) < 0 ? 1 : 0))) ? 1 : 0)) {
    current_item = (__struct_ptr_at(current_item, 0)).next;
  }
  if (((((current_item == (null) ? 1 : 0)) || (((__struct_ptr_at(current_item, 0)).next == (null) ? 1 : 0))) ? 1 : 0)) {
    return result;
  }
  current_item = list;
  while ((current_item != (null) ? 1 : 0)) {
    second = (__struct_ptr_at(second, 0)).next;
    current_item = (__struct_ptr_at(current_item, 0)).next;
    if ((current_item != (null) ? 1 : 0)) {
      current_item = (__struct_ptr_at(current_item, 0)).next;
    }
  }
  if (((((second != (null) ? 1 : 0)) && (((__struct_ptr_at(second, 0)).prev != (null) ? 1 : 0))) ? 1 : 0)) {
    (__struct_ptr_at((__struct_ptr_at(second, 0)).prev, 0)).next = null;
    (__struct_ptr_at(second, 0)).prev = null;
  }
  first = sort_list(first, case_sensitive);
  second = sort_list(second, case_sensitive);
  result = null;
  while (((((first != (null) ? 1 : 0)) && ((second != (null) ? 1 : 0))) ? 1 : 0)) {
    let smaller = null; /* &ref */
    if ((compare_strings(cptr_clone(((__struct_ptr_at(first, 0)).string)), cptr_clone(((__struct_ptr_at(second, 0)).string)), case_sensitive) < 0 ? 1 : 0)) {
      smaller = first;
    } else {
      smaller = second;
    }
    if ((result == (null) ? 1 : 0)) {
      result_tail = smaller;
      result = smaller;
    } else {
      (__struct_ptr_at(result_tail, 0)).next = smaller;
      (__struct_ptr_at(smaller, 0)).prev = result_tail;
      result_tail = smaller;
    }
    if ((first == smaller ? 1 : 0)) {
      first = (__struct_ptr_at(first, 0)).next;
    } else {
      second = (__struct_ptr_at(second, 0)).next;
    }
  }
  if ((first != (null) ? 1 : 0)) {
    if ((result == (null) ? 1 : 0)) {
      return first;
    }
    (__struct_ptr_at(result_tail, 0)).next = first;
    (__struct_ptr_at(first, 0)).prev = result_tail;
  }
  if ((second != (null) ? 1 : 0)) {
    if ((result == (null) ? 1 : 0)) {
      return second;
    }
    (__struct_ptr_at(result_tail, 0)).next = second;
    (__struct_ptr_at(second, 0)).prev = result_tail;
  }
  return result;
}

function sort_object(object: cJSON | null, case_sensitive: cJSON_bool): void {
  if ((object == (null) ? 1 : 0)) {
    return;
  }
  (__struct_ptr_at(object, 0)).child = sort_list((__struct_ptr_at(object, 0)).child, case_sensitive);
}

function compare_json(a: cJSON | null, b: cJSON | null, case_sensitive: cJSON_bool): cJSON_bool {
  if (((((((a == (null) ? 1 : 0)) || ((b == (null) ? 1 : 0))) ? 1 : 0) || ((((__struct_ptr_at(a, 0)).type & 255) != ((__struct_ptr_at(b, 0)).type & 255) ? 1 : 0))) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  switch ((__struct_ptr_at(a, 0)).type & 255) {
    case (((1 << 3) | 0)):
      {
        if ((((((__struct_ptr_at(a, 0)).valueint != (__struct_ptr_at(b, 0)).valueint ? 1 : 0)) || ((!compare_double((__struct_ptr_at(a, 0)).valuedouble, (__struct_ptr_at(b, 0)).valuedouble) ? 1 : 0))) ? 1 : 0)) {
          return (Math.trunc(+(0)));
        } else {
          return (Math.trunc(+(1)));
        }
      }
    case (((1 << 4) | 0)):
      {
        if ((strcmp(cptr_clone((__struct_ptr_at(a, 0)).valuestring), cptr_clone((__struct_ptr_at(b, 0)).valuestring)) != 0 ? 1 : 0)) {
          return (Math.trunc(+(0)));
        } else {
          return (Math.trunc(+(1)));
        }
      }
    case (((1 << 5) | 0)):
      {
        for (((a = (__struct_ptr_at(a, 0)).child)), b = (__struct_ptr_at(b, 0)).child; ((((a != (null) ? 1 : 0)) && ((b != (null) ? 1 : 0))) ? 1 : 0); ((a = (__struct_ptr_at(a, 0)).next)), b = (__struct_ptr_at(b, 0)).next) {
          let identical = compare_json(a, b, case_sensitive);
          if ((!identical ? 1 : 0)) {
            return (Math.trunc(+(0)));
          }
        }
      }
    if (((((a != (null) ? 1 : 0)) || ((b != (null) ? 1 : 0))) ? 1 : 0)) {
      return (Math.trunc(+(0)));
    } else {
      return (Math.trunc(+(1)));
    }
    case (((1 << 6) | 0)):
    {
      sort_object(a, case_sensitive);
    sort_object(b, case_sensitive);
    for (((a = (__struct_ptr_at(a, 0)).child)), b = (__struct_ptr_at(b, 0)).child; ((((a != (null) ? 1 : 0)) && ((b != (null) ? 1 : 0))) ? 1 : 0); ((a = (__struct_ptr_at(a, 0)).next)), b = (__struct_ptr_at(b, 0)).next) {
      let identical = (Math.trunc(+(0)));
      if (compare_strings(cptr_clone(((__struct_ptr_at(a, 0)).string)), cptr_clone(((__struct_ptr_at(b, 0)).string)), case_sensitive)) {
        return (Math.trunc(+(0)));
      }
      identical = compare_json(a, b, case_sensitive);
      if ((!identical ? 1 : 0)) {
        return (Math.trunc(+(0)));
      }
    }
    if (((((a != (null) ? 1 : 0)) || ((b != (null) ? 1 : 0))) ? 1 : 0)) {
      return (Math.trunc(+(0)));
    } else {
      return (Math.trunc(+(1)));
    }
    }
    default:
    {
      break;
    }
  }
  return (Math.trunc(+(1)));
}

function insert_item_in_array(array: cJSON | null, which: number, newitem: cJSON | null): cJSON_bool {
  let child = (__struct_ptr_at(array, 0)).child; /* &ref */
  while (((child && ((((which) >>> 0) > ((0) >>> 0) ? 1 : 0))) ? 1 : 0)) {
    child = (__struct_ptr_at(child, 0)).next;
    (() => { const _t = which; which = u32(which - 1); return _t; })();
  }
  if ((((which) >>> 0) > ((0) >>> 0) ? 1 : 0)) {
    return 0;
  }
  if ((child == (null) ? 1 : 0)) {
    cJSON_AddItemToArray(array, newitem);
    return 1;
  }
  (__struct_ptr_at(newitem, 0)).next = child;
  (__struct_ptr_at(newitem, 0)).prev = (__struct_ptr_at(child, 0)).prev;
  (__struct_ptr_at(child, 0)).prev = newitem;
  if ((child == (__struct_ptr_at(array, 0)).child ? 1 : 0)) {
    (__struct_ptr_at(array, 0)).child = newitem;
  } else {
    (__struct_ptr_at((__struct_ptr_at(newitem, 0)).prev, 0)).next = newitem;
  }
  return 1;
}

function get_object_item(object: cJSON | null, name: string, case_sensitive: cJSON_bool): cJSON | null {
  if (case_sensitive) {
    return cJSON_GetObjectItemCaseSensitive(object, cptr_clone(name));
  }
  return cJSON_GetObjectItem(object, cptr_clone(name));
}

export type patch_operation = number;
export const INVALID: number = 0;
export const ADD: number = 1;
export const REMOVE: number = 2;
export const REPLACE: number = 3;
export const MOVE: number = 4;
export const COPY: number = 5;
export const TEST: number = 6;

function decode_patch_operation(patch: cJSON | null, case_sensitive: cJSON_bool): patch_operation {
  let operation = get_object_item(patch, "op", case_sensitive); /* &ref */
  if ((!cJSON_IsString(operation) ? 1 : 0)) {
    return INVALID;
  }
  if ((strcmp(cptr_clone((__struct_ptr_at(operation, 0)).valuestring), "add") == 0 ? 1 : 0)) {
    return ADD;
  }
  if ((strcmp(cptr_clone((__struct_ptr_at(operation, 0)).valuestring), "remove") == 0 ? 1 : 0)) {
    return REMOVE;
  }
  if ((strcmp(cptr_clone((__struct_ptr_at(operation, 0)).valuestring), "replace") == 0 ? 1 : 0)) {
    return REPLACE;
  }
  if ((strcmp(cptr_clone((__struct_ptr_at(operation, 0)).valuestring), "move") == 0 ? 1 : 0)) {
    return MOVE;
  }
  if ((strcmp(cptr_clone((__struct_ptr_at(operation, 0)).valuestring), "copy") == 0 ? 1 : 0)) {
    return COPY;
  }
  if ((strcmp(cptr_clone((__struct_ptr_at(operation, 0)).valuestring), "test") == 0 ? 1 : 0)) {
    return TEST;
  }
  return INVALID;
}

function overwrite_item(root: cJSON | null, replacement: cJSON): void {
  if ((root == (null) ? 1 : 0)) {
    return;
  }
  if ((!cptr_eq((__struct_ptr_at(root, 0)).string, (null)) ? 1 : 0)) {
    cJSON_free((__struct_ptr_at(root, 0)).string);
  }
  if ((!cptr_eq((__struct_ptr_at(root, 0)).valuestring, (null)) ? 1 : 0)) {
    cJSON_free((__struct_ptr_at(root, 0)).valuestring);
  }
  if (((__struct_ptr_at(root, 0)).child != (null) ? 1 : 0)) {
    cJSON_Delete((__struct_ptr_at(root, 0)).child);
  }
  memcpy(root, replacement, 64);
}

function apply_patch(object: cJSON | null, patch: cJSON | null, case_sensitive: cJSON_bool): number {
  let path: cJSON | null = null;
  let value: cJSON | null = null;
  let parent: cJSON | null = null;
  let opcode: patch_operation = 0;
  let parent_pointer: any | null = null;
  let child_pointer: any | null = null;
  let status: number = 0;
  let invalid: cJSON = new cJSON();
  let old_item: cJSON | null = null;
  let from: cJSON | null = null;
  let index: number = 0;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      path = null; /* &ref */
      value = null; /* &ref */
      parent = null; /* &ref */
      opcode = INVALID;
      parent_pointer = null; /* &ref */
      child_pointer = null; /* &ref */
      status = 0;
      path = get_object_item(patch, "path", case_sensitive);
      if ((!cJSON_IsString(path) ? 1 : 0)) {
        status = 2;
        _state = 1; continue _sm; /* goto cleanup */
      }
      opcode = decode_patch_operation(patch, case_sensitive);
      if ((opcode == INVALID ? 1 : 0)) {
        status = 3;
        _state = 1; continue _sm; /* goto cleanup */
      } else {
        if ((opcode == TEST ? 1 : 0)) {
          status = (!(() => { const __rtl_0_2 = case_sensitive; const __rtl_0_1 = get_object_item(patch, "value", case_sensitive); const __rtl_0_0 = get_item_from_pointer(object, cptr_clone((__struct_ptr_at(path, 0)).valuestring), case_sensitive); return compare_json(__rtl_0_0, __rtl_0_1, __rtl_0_2); })() ? 1 : 0);
          _state = 1; continue _sm; /* goto cleanup */
        }
      }
      if (((((__struct_ptr_at(path, 0)).valuestring.buf[((__struct_ptr_at(path, 0)).valuestring.off ?? 0) + 0]) << 24 >> 24) == 0 ? 1 : 0)) {
        if ((opcode == REMOVE ? 1 : 0)) {
          overwrite_item(object, Object.assign(new cJSON(), _static_invalid_0));
          status = 0;
          _state = 1; continue _sm; /* goto cleanup */
        }
        if (((((opcode == REPLACE ? 1 : 0)) || ((opcode == ADD ? 1 : 0))) ? 1 : 0)) {
          value = get_object_item(patch, "value", case_sensitive);
          if ((value == (null) ? 1 : 0)) {
            status = 7;
            _state = 1; continue _sm; /* goto cleanup */
          }
          value = cJSON_Duplicate(value, 1);
          if ((value == (null) ? 1 : 0)) {
            status = 8;
            _state = 1; continue _sm; /* goto cleanup */
          }
          overwrite_item(object, Object.assign(new cJSON(), value));
          cJSON_free(value);
          value = null;
          if ((!cptr_eq((__struct_ptr_at(object, 0)).string, (null)) ? 1 : 0)) {
            cJSON_free((__struct_ptr_at(object, 0)).string);
            (__struct_ptr_at(object, 0)).string = null;
          }
          status = 0;
          _state = 1; continue _sm; /* goto cleanup */
        }
      }
      if (((((opcode == REMOVE ? 1 : 0)) || ((opcode == REPLACE ? 1 : 0))) ? 1 : 0)) {
        old_item = detach_path(object, cptr_clone(((__struct_ptr_at(path, 0)).valuestring)), case_sensitive); /* &ref */
        if ((old_item == (null) ? 1 : 0)) {
          status = 13;
          _state = 1; continue _sm; /* goto cleanup */
        }
        cJSON_Delete(old_item);
        if ((opcode == REMOVE ? 1 : 0)) {
          status = 0;
          _state = 1; continue _sm; /* goto cleanup */
        }
      }
      if (((((opcode == MOVE ? 1 : 0)) || ((opcode == COPY ? 1 : 0))) ? 1 : 0)) {
        let _from = get_object_item(patch, "from", case_sensitive); /* &ref */
        if ((!cJSON_IsString(_from) ? 1 : 0)) {
          status = 4;
          _state = 1; continue _sm; /* goto cleanup */
        }
        if ((opcode == MOVE ? 1 : 0)) {
          value = detach_path(object, cptr_clone(((__struct_ptr_at(_from, 0)).valuestring)), case_sensitive);
        }
        if ((opcode == COPY ? 1 : 0)) {
          value = get_item_from_pointer(object, cptr_clone((__struct_ptr_at(_from, 0)).valuestring), case_sensitive);
        }
        if ((value == (null) ? 1 : 0)) {
          status = 5;
          _state = 1; continue _sm; /* goto cleanup */
        }
        if ((opcode == COPY ? 1 : 0)) {
          value = cJSON_Duplicate(value, 1);
        }
        if ((value == (null) ? 1 : 0)) {
          status = 6;
          _state = 1; continue _sm; /* goto cleanup */
        }
      } else {
        value = get_object_item(patch, "value", case_sensitive);
        if ((value == (null) ? 1 : 0)) {
          status = 7;
          _state = 1; continue _sm; /* goto cleanup */
        }
        value = cJSON_Duplicate(value, 1);
        if ((value == (null) ? 1 : 0)) {
          status = 8;
          _state = 1; continue _sm; /* goto cleanup */
        }
      }
      parent_pointer = cJSONUtils_strdup(cptr_clone(((__struct_ptr_at(path, 0)).valuestring)));
      if (parent_pointer) {
        child_pointer = (strrchr(cptr_clone((parent_pointer)), 47));
      }
      if ((!cptr_eq(child_pointer, (null)) ? 1 : 0)) {
        child_pointer.buf[(child_pointer.off ?? 0) + 0] = (((0) & 0xFF)) & 0xFF;
        child_pointer.off++;
      }
      parent = get_item_from_pointer(object, cptr_clone((parent_pointer)), case_sensitive);
      decode_pointer_inplace(cptr_clone(child_pointer));
      if (((((parent == (null) ? 1 : 0)) || ((cptr_eq(child_pointer, (null)) ? 1 : 0))) ? 1 : 0)) {
        status = 9;
        _state = 1; continue _sm; /* goto cleanup */
      } else {
        if (cJSON_IsArray(parent)) {
          if ((strcmp(cptr_clone((child_pointer)), "-") == 0 ? 1 : 0)) {
            cJSON_AddItemToArray(parent, value);
            value = null;
          } else {
            index = ((0) >>> 0);
            if ((!decode_array_index_from_pointer(cptr_clone(child_pointer), { value: index }) ? 1 : 0)) {
              status = 11;
              _state = 1; continue _sm; /* goto cleanup */
            }
            if ((!insert_item_in_array(parent, ((index) >>> 0), value) ? 1 : 0)) {
              status = 10;
              _state = 1; continue _sm; /* goto cleanup */
            }
            value = null;
          }
        } else {
          if (cJSON_IsObject(parent)) {
            if (case_sensitive) {
              cJSON_DeleteItemFromObjectCaseSensitive(parent, cptr_clone((child_pointer)));
            } else {
              cJSON_DeleteItemFromObject(parent, cptr_clone((child_pointer)));
            }
            cJSON_AddItemToObject(parent, cptr_clone((child_pointer)), value);
            value = null;
          } else {
            status = 9;
            _state = 1; continue _sm; /* goto cleanup */
          }
        }
      }
    case 1: /* cleanup */
      if ((value != (null) ? 1 : 0)) {
        cJSON_Delete(value);
      }
      if ((!cptr_eq(parent_pointer, (null)) ? 1 : 0)) {
        cJSON_free(parent_pointer);
      }
      return status;
      break _sm;
    }
  }
}

export function cJSONUtils_ApplyPatches(object: cJSON | null, patches: cJSON | null): number {
  let current_patch = null; /* &ref */
  let status = 0;
  if ((!cJSON_IsArray(patches) ? 1 : 0)) {
    return 1;
  }
  if ((patches != (null) ? 1 : 0)) {
    current_patch = (__struct_ptr_at(patches, 0)).child;
  }
  while ((current_patch != (null) ? 1 : 0)) {
    status = apply_patch(object, current_patch, (Math.trunc(+(0))));
    if ((status != 0 ? 1 : 0)) {
      return status;
    }
    current_patch = (__struct_ptr_at(current_patch, 0)).next;
  }
  return 0;
}

export function cJSONUtils_ApplyPatchesCaseSensitive(object: cJSON | null, patches: cJSON | null): number {
  let current_patch = null; /* &ref */
  let status = 0;
  if ((!cJSON_IsArray(patches) ? 1 : 0)) {
    return 1;
  }
  if ((patches != (null) ? 1 : 0)) {
    current_patch = (__struct_ptr_at(patches, 0)).child;
  }
  while ((current_patch != (null) ? 1 : 0)) {
    status = apply_patch(object, current_patch, (Math.trunc(+(1))));
    if ((status != 0 ? 1 : 0)) {
      return status;
    }
    current_patch = (__struct_ptr_at(current_patch, 0)).next;
  }
  return 0;
}

function compose_patch(patches: cJSON | null, operation: any | null, path: any | null, suffix: any | null, value: cJSON | null): void {
  let patch = null; /* &ref */
  if (((((((patches == (null) ? 1 : 0)) || ((cptr_eq(operation, (null)) ? 1 : 0))) ? 1 : 0) || ((cptr_eq(path, (null)) ? 1 : 0))) ? 1 : 0)) {
    return;
  }
  patch = cJSON_CreateObject();
  if ((patch == (null) ? 1 : 0)) {
    return;
  }
  cJSON_AddItemToObject(patch, "op", cJSON_CreateString(cptr_clone((operation))));
  if ((cptr_eq(suffix, (null)) ? 1 : 0)) {
    cJSON_AddItemToObject(patch, "path", cJSON_CreateString(cptr_clone((path))));
  } else {
    let suffix_length = pointer_encoded_length(cptr_clone(suffix));
    let path_length = strlen(cptr_clone((path)));
    let full_path = (cJSON_malloc(((path_length) >>> 0) + ((suffix_length) >>> 0) + 2)); /* &ref */
    (() => { const __s = printf_format("%s/", cptr_clone((path))); strcpy((full_path), __s); return __s.length; })();
    encode_string_as_pointer(cptr_offset(cptr_offset(full_path, ((path_length) >>> 0)), 1), cptr_clone(suffix));
    cJSON_AddItemToObject(patch, "path", cJSON_CreateString(cptr_clone((full_path))));
    cJSON_free(full_path);
  }
  if ((value != (null) ? 1 : 0)) {
    cJSON_AddItemToObject(patch, "value", cJSON_Duplicate(value, 1));
  }
  cJSON_AddItemToArray(patches, patch);
}

export function cJSONUtils_AddPatchToArray(array: cJSON | null, operation: string, path: any, value: cJSON | null): void {
  compose_patch(array, cptr_clone((operation)), cptr_clone((path)), null, value);
}

function create_patches(patches: cJSON | null, path: any | null, _from: cJSON | null, to: cJSON | null, case_sensitive: cJSON_bool): void {
  if (((((_from == (null) ? 1 : 0)) || ((to == (null) ? 1 : 0))) ? 1 : 0)) {
    return;
  }
  if ((((__struct_ptr_at(_from, 0)).type & 255) != ((__struct_ptr_at(to, 0)).type & 255) ? 1 : 0)) {
    compose_patch(patches, ("replace"), cptr_clone(path), null, to);
    return;
  }
  switch ((__struct_ptr_at(_from, 0)).type & 255) {
    case (((1 << 3) | 0)):
      {
        if ((((((__struct_ptr_at(_from, 0)).valueint != (__struct_ptr_at(to, 0)).valueint ? 1 : 0)) || (!compare_double((__struct_ptr_at(_from, 0)).valuedouble, (__struct_ptr_at(to, 0)).valuedouble) ? 1 : 0)) ? 1 : 0)) {
          compose_patch(patches, ("replace"), cptr_clone(path), null, to);
        }
      }
    return;
    case (((1 << 4) | 0)):
      {
        if ((strcmp(cptr_clone((__struct_ptr_at(_from, 0)).valuestring), cptr_clone((__struct_ptr_at(to, 0)).valuestring)) != 0 ? 1 : 0)) {
          compose_patch(patches, ("replace"), cptr_clone(path), null, to);
        }
      }
    return;
    case (((1 << 5) | 0)):
      {
        let index = ((0) >>> 0);
        let from_child = (__struct_ptr_at(_from, 0)).child; /* &ref */
        let to_child = (__struct_ptr_at(to, 0)).child; /* &ref */
        let new_path = (cJSON_malloc(strlen(cptr_clone((path))) + 20 + 2)); /* &ref */
        for (index = ((0) >>> 0); ((((from_child != (null) ? 1 : 0)) && ((to_child != (null) ? 1 : 0))) ? 1 : 0); ((from_child = (__struct_ptr_at(from_child, 0)).next)), ((to_child = (__struct_ptr_at(to_child, 0)).next)), (() => { const _t = index; index = u32(index + 1); return _t; })()) {
          if ((((index) >>> 0) > (((u32((Math.imul(((2147483647) >>> 0), 2) >>> 0) + 1))) >>> 0) ? 1 : 0)) {
            cJSON_free(new_path);
            return;
          }
          (() => { const __s = printf_format("%s/%lu", cptr_clone(path), ((Number(BigInt.asUintN(32, __as_bigint(((index) >>> 0))))) >>> 0)); strcpy((new_path), __s); return __s.length; })();
          create_patches(patches, cptr_clone(new_path), from_child, to_child, case_sensitive);
        }
        for (; ((from_child != (null) ? 1 : 0)); ((from_child = (__struct_ptr_at(from_child, 0)).next))) {
          if ((((index) >>> 0) > (((u32((Math.imul(((2147483647) >>> 0), 2) >>> 0) + 1))) >>> 0) ? 1 : 0)) {
            cJSON_free(new_path);
            return;
          }
          (() => { const __s = printf_format("%lu", ((Number(BigInt.asUintN(32, __as_bigint(((index) >>> 0))))) >>> 0)); strcpy((new_path), __s); return __s.length; })();
          compose_patch(patches, ("remove"), cptr_clone(path), cptr_clone(new_path), null);
        }
        for (; ((to_child != (null) ? 1 : 0)); ((to_child = (__struct_ptr_at(to_child, 0)).next)), (() => { const _t = index; index = u32(index + 1); return _t; })()) {
          compose_patch(patches, ("add"), cptr_clone(path), ("-"), to_child);
        }
        cJSON_free(new_path);
        return;
      }
    case (((1 << 6) | 0)):
      {
        let from_child = null; /* &ref */
        let to_child = null; /* &ref */
        sort_object(_from, case_sensitive);
        sort_object(to, case_sensitive);
        from_child = (__struct_ptr_at(_from, 0)).child;
        to_child = (__struct_ptr_at(to, 0)).child;
        while (((((from_child != (null) ? 1 : 0)) || ((to_child != (null) ? 1 : 0))) ? 1 : 0)) {
          let diff = 0;
          if ((from_child == (null) ? 1 : 0)) {
            diff = 1;
          } else {
            if ((to_child == (null) ? 1 : 0)) {
              diff = -1;
            } else {
              diff = compare_strings(cptr_clone(((__struct_ptr_at(from_child, 0)).string)), cptr_clone(((__struct_ptr_at(to_child, 0)).string)), case_sensitive);
            }
          }
          if ((diff == 0 ? 1 : 0)) {
            let path_length = strlen(cptr_clone((path)));
            let from_child_name_length = pointer_encoded_length(cptr_clone(((__struct_ptr_at(from_child, 0)).string)));
            let new_path = (cJSON_malloc(((path_length) >>> 0) + ((from_child_name_length) >>> 0) + 2)); /* &ref */
            (() => { const __s = printf_format("%s/", cptr_clone(path)); strcpy((new_path), __s); return __s.length; })();
            encode_string_as_pointer(cptr_offset(cptr_offset(new_path, ((path_length) >>> 0)), 1), cptr_clone(((__struct_ptr_at(from_child, 0)).string)));
            create_patches(patches, cptr_clone(new_path), from_child, to_child, case_sensitive);
            cJSON_free(new_path);
            from_child = (__struct_ptr_at(from_child, 0)).next;
            to_child = (__struct_ptr_at(to_child, 0)).next;
          } else {
            if ((diff < 0 ? 1 : 0)) {
              compose_patch(patches, ("remove"), cptr_clone(path), cptr_clone(((__struct_ptr_at(from_child, 0)).string)), null);
              from_child = (__struct_ptr_at(from_child, 0)).next;
            } else {
              compose_patch(patches, ("add"), cptr_clone(path), cptr_clone(((__struct_ptr_at(to_child, 0)).string)), to_child);
              to_child = (__struct_ptr_at(to_child, 0)).next;
            }
          }
        }
        return;
      }
    default:
    {
      break;
    }
  }
}

export function cJSONUtils_GeneratePatches(_from: cJSON | null, to: cJSON | null): cJSON | null {
  let patches = null; /* &ref */
  if (((((_from == (null) ? 1 : 0)) || ((to == (null) ? 1 : 0))) ? 1 : 0)) {
    return null;
  }
  patches = cJSON_CreateArray();
  create_patches(patches, (""), _from, to, (Math.trunc(+(0))));
  return patches;
}

export function cJSONUtils_GeneratePatchesCaseSensitive(_from: cJSON | null, to: cJSON | null): cJSON | null {
  let patches = null; /* &ref */
  if (((((_from == (null) ? 1 : 0)) || ((to == (null) ? 1 : 0))) ? 1 : 0)) {
    return null;
  }
  patches = cJSON_CreateArray();
  create_patches(patches, (""), _from, to, (Math.trunc(+(1))));
  return patches;
}

export function cJSONUtils_SortObject(object: cJSON | null): void {
  sort_object(object, (Math.trunc(+(0))));
}

export function cJSONUtils_SortObjectCaseSensitive(object: cJSON | null): void {
  sort_object(object, (Math.trunc(+(1))));
}

function merge_patch(target: cJSON | null, patch: cJSON | null, case_sensitive: cJSON_bool): cJSON | null {
  let patch_child = null; /* &ref */
  if ((!cJSON_IsObject(patch) ? 1 : 0)) {
    cJSON_Delete(target);
    return cJSON_Duplicate(patch, 1);
  }
  if ((!cJSON_IsObject(target) ? 1 : 0)) {
    cJSON_Delete(target);
    target = cJSON_CreateObject();
  }
  patch_child = (__struct_ptr_at(patch, 0)).child;
  while ((patch_child != (null) ? 1 : 0)) {
    if (cJSON_IsNull(patch_child)) {
      if (case_sensitive) {
        cJSON_DeleteItemFromObjectCaseSensitive(target, cptr_clone((__struct_ptr_at(patch_child, 0)).string));
      } else {
        cJSON_DeleteItemFromObject(target, cptr_clone((__struct_ptr_at(patch_child, 0)).string));
      }
    } else {
      let replace_me = null; /* &ref */
      let replacement = null; /* &ref */
      if (case_sensitive) {
        replace_me = cJSON_DetachItemFromObjectCaseSensitive(target, cptr_clone((__struct_ptr_at(patch_child, 0)).string));
      } else {
        replace_me = cJSON_DetachItemFromObject(target, cptr_clone((__struct_ptr_at(patch_child, 0)).string));
      }
      replacement = merge_patch(replace_me, patch_child, case_sensitive);
      if ((replacement == (null) ? 1 : 0)) {
        cJSON_Delete(target);
        return null;
      }
      cJSON_AddItemToObject(target, cptr_clone((__struct_ptr_at(patch_child, 0)).string), replacement);
    }
    patch_child = (__struct_ptr_at(patch_child, 0)).next;
  }
  return target;
}

export function cJSONUtils_MergePatch(target: cJSON | null, patch: cJSON | null): cJSON | null {
  return merge_patch(target, patch, (Math.trunc(+(0))));
}

export function cJSONUtils_MergePatchCaseSensitive(target: cJSON | null, patch: cJSON | null): cJSON | null {
  return merge_patch(target, patch, (Math.trunc(+(1))));
}

function generate_merge_patch(_from: cJSON | null, to: cJSON | null, case_sensitive: cJSON_bool): cJSON | null {
  let from_child = null; /* &ref */
  let to_child = null; /* &ref */
  let patch = null; /* &ref */
  if ((to == (null) ? 1 : 0)) {
    return cJSON_CreateNull();
  }
  if ((((!cJSON_IsObject(to) ? 1 : 0) || (!cJSON_IsObject(_from) ? 1 : 0)) ? 1 : 0)) {
    return cJSON_Duplicate(to, 1);
  }
  sort_object(_from, case_sensitive);
  sort_object(to, case_sensitive);
  from_child = (__struct_ptr_at(_from, 0)).child;
  to_child = (__struct_ptr_at(to, 0)).child;
  patch = cJSON_CreateObject();
  if ((patch == (null) ? 1 : 0)) {
    return null;
  }
  while (((from_child || to_child) ? 1 : 0)) {
    let diff = 0;
    if ((from_child != (null) ? 1 : 0)) {
      if ((to_child != (null) ? 1 : 0)) {
        diff = strcmp(cptr_clone((__struct_ptr_at(from_child, 0)).string), cptr_clone((__struct_ptr_at(to_child, 0)).string));
      } else {
        diff = -1;
      }
    } else {
      diff = 1;
    }
    if ((diff < 0 ? 1 : 0)) {
      cJSON_AddItemToObject(patch, cptr_clone((__struct_ptr_at(from_child, 0)).string), cJSON_CreateNull());
      from_child = (__struct_ptr_at(from_child, 0)).next;
    } else {
      if ((diff > 0 ? 1 : 0)) {
        cJSON_AddItemToObject(patch, cptr_clone((__struct_ptr_at(to_child, 0)).string), cJSON_Duplicate(to_child, 1));
        to_child = (__struct_ptr_at(to_child, 0)).next;
      } else {
        if ((!compare_json(from_child, to_child, case_sensitive) ? 1 : 0)) {
          cJSON_AddItemToObject(patch, cptr_clone((__struct_ptr_at(to_child, 0)).string), cJSONUtils_GenerateMergePatch(from_child, to_child));
        }
        from_child = (__struct_ptr_at(from_child, 0)).next;
        to_child = (__struct_ptr_at(to_child, 0)).next;
      }
    }
  }
  if (((__struct_ptr_at(patch, 0)).child == (null) ? 1 : 0)) {
    cJSON_Delete(patch);
    return null;
  }
  return patch;
}

export function cJSONUtils_GenerateMergePatch(_from: cJSON | null, to: cJSON | null): cJSON | null {
  return generate_merge_patch(_from, to, (Math.trunc(+(0))));
}

export function cJSONUtils_GenerateMergePatchCaseSensitive(_from: cJSON | null, to: cJSON | null): cJSON | null {
  return generate_merge_patch(_from, to, (Math.trunc(+(1))));
}

// Static-local initializers deferred past class declarations (G20)
_static_invalid_0 = Object.assign(new cJSON(), { next: null, prev: null, child: null, type: (0), valuestring: null, valueint: 0, valuedouble: 0, string: null });