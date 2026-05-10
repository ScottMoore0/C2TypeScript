
function _dclass(x: number): number { if (Number.isNaN(x)) return 2; if (!Number.isFinite(x)) return 1; if (x === 0) return 0; const a = Math.abs(x); if (a < 2.2250738585072014e-308) return -2; return -1; /* MinGW codes: NaN=2, INF=1, ZERO=0, NORMAL=-1, SUBNORMAL=-2; isfinite=(<=0), isnormal=(==-1) */ }
function _fdclass(x: number): number { return _dclass(x); }
function _ldclass(x: number): number { return _dclass(x); }
function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function sscanf(str: any, fmt: string, ...args: any[]): number {
  if (str?.buf) str = cptr_to_string(str);
  if (typeof str !== 'string') str = String(str ?? '');
  let pos = 0, fi = 0, argIdx = 0, matched = 0;
  while (fi < fmt.length && pos <= str.length) {
    if (fmt[fi] === " " || fmt[fi] === "\t" || fmt[fi] === "\n") { fi++; while (pos < str.length && " \t\n\r".includes(str[pos])) pos++; continue; }
    if (fmt[fi] !== "%") { if (pos < str.length && str[pos] === fmt[fi]) { pos++; fi++; continue; } else break; }
    fi++;
    if (fmt[fi] === "%") { if (str[pos] === "%") { pos++; fi++; continue; } else break; }
    let suppress = false; if (fmt[fi] === "*") { suppress = true; fi++; }
    let ws = ""; while (fi < fmt.length && fmt[fi] >= "0" && fmt[fi] <= "9") ws += fmt[fi++];
    const mw = ws ? parseInt(ws) : 0;
    let lenMod = ""; if (fi < fmt.length && "hlLzjt".includes(fmt[fi])) { lenMod = fmt[fi]; fi++; if (fi < fmt.length && (fmt[fi]==="h"||fmt[fi]==="l")) { lenMod += fmt[fi]; fi++; } }
    const is64 = (lenMod === "ll" || lenMod === "z" || lenMod === "j" || lenMod === "L");
    const sp = fmt[fi++]; let val: any, ok = false;
    if (sp !== "c" && sp !== "n") { while (pos < str.length && " \t\n\r".includes(str[pos])) pos++; }
    if (pos >= str.length && sp !== "n") break;
    const sub = mw ? str.substring(pos, pos + mw) : str.substring(pos);
    if (sp === "d" || sp === "i") { const m = sub.match(/^[+-]?\d+/); if (m) { val = is64 ? BigInt(m[0]) : parseInt(m[0], 10); pos += m[0].length; ok = true; } }
    else if (sp === "u") { const m = sub.match(/^\d+/); if (m) { val = is64 ? BigInt.asUintN(64, BigInt(m[0])) : (parseInt(m[0], 10) >>> 0); pos += m[0].length; ok = true; } }
    else if (sp === "x" || sp === "X") { const m = sub.match(/^[+-]?(?:0[xX])?[0-9a-fA-F]+/); if (m) { const clean = m[0].replace(/^[+-]?0[xX]/, (pre) => pre.replace(/0[xX]/, "")); val = is64 ? BigInt("0x" + clean.replace(/^[+-]/, "")) * (clean.startsWith("-") ? -1n : 1n) : parseInt(m[0], 16); pos += m[0].length; ok = true; } }
    else if (sp === "o") { const m = sub.match(/^[+-]?[0-7]+/); if (m) { val = is64 ? BigInt.asUintN(64, BigInt("0o" + m[0].replace(/^[+-]/, ""))) : parseInt(m[0], 8); pos += m[0].length; ok = true; } }
    else if ("fega".includes(sp)) { const m = sub.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/); if (m) { val = parseFloat(m[0]); pos += m[0].length; ok = true; } }
    else if (sp === "s") { let e = 0; const lim = mw || sub.length; while (e < lim && !" \t\n\r".includes(sub[e])) e++; if (e > 0) { val = sub.substring(0, e); pos += e; ok = true; } }
    else if (sp === "c") { const cnt = mw || 1; if (pos + cnt <= str.length) { val = cnt === 1 ? str.charCodeAt(pos) : str.substring(pos, pos + cnt); pos += cnt; ok = true; } }
    else if (sp === "n") { val = pos; ok = true; }
    if (!ok) break;
    if (!suppress) { const a = args[argIdx++]; if (a && a.buf) { if (typeof val === "string") { for (let _i = 0; _i < val.length; _i++) a.buf[a.off + _i] = val.charCodeAt(_i); a.buf[a.off + val.length] = 0; } else if (typeof val === "bigint") { try { new DataView(a.buf.buffer).setBigInt64(a.off, BigInt.asIntN(64, val), true); } catch { new DataView(a.buf.buffer).setFloat64(a.off, Number(val), true); } } else { new DataView(a.buf.buffer).setInt32(a.off, val, true); } } else if (a && typeof a === "object" && "value" in a) a.value = val; if (sp !== "n") matched++; }
  }
  return matched;
}
function __acrt_iob_func(idx: number): number { return idx; }
// ESM-safe require: synthesise a CJS-style require() via createRequire so
// shims using require("fs") / require("os") keep working under tsx ESM
// loaders. ECMAScript section 15.10 modules have no global require; Node
// exposes createRequire(url) to produce one bound to a given URL. This shim
// is idempotent (uses var + ??=) so multiple injections don't collide.
import { createRequire as __rt_cr } from "node:module";
import { UnityAssertBits, UnityAssertDoublesWithin, UnityAssertEqualNumber, UnityBegin, UnityDefaultTestRun, UnityEnd, UnityFail } from './unity.js';
var require: any = (globalThis as any).require ?? __rt_cr(import.meta.url);
(globalThis as any).require ??= require;
const _fs = require("fs");
// Expose via globalThis so the inlined printf shim (which lives in

// block) can find the same map at runtime via (globalThis as any)._fileHandles.
const _fileHandles = ((globalThis as any)._fileHandles ??= new Map<number, {fd: number, pos: number, mode: string, path: string, eofFlag?: boolean, errFlag?: boolean}>());
let _nextFh = 3;
function _fopen(path: any, mode: any): number {
  const p = typeof path === "string" ? path : (path?.buf ? cptr_to_string(path) : String(path ?? ""));
  const m = typeof mode === "string" ? mode : (mode?.buf ? cptr_to_string(mode) : String(mode ?? "r"));
  try {
    const flags = m.includes("w") ? "w" : m.includes("a") ? "a" : "r";
    const fd = _fs.openSync(p, flags === "r" ? "r" : flags === "w" ? "w+" : "a+");
    const fh = _nextFh++;
    _fileHandles.set(fh, {fd, pos: 0, mode: flags, path: p, ungot: []} as any);
    return fh;
  } catch { return null as any; }
}
function _fclose(fh: number): number { const h = _fileHandles.get(fh); if (h) { _fs.closeSync(h.fd); _fileHandles.delete(fh); } return 0; }
function _fprintf(fh: any, fmt: string, ...args: any[]): number { const s = printf_format(fmt, ...args); /* MSVC: __acrt_iob_func(0)=stdin, (1)=stdout, (2)=stderr — fh comes through as the index. Route to process.stdout/.stderr at the OS level so test output reaches the matrix's stdout sink. */ const fhNum = (fh && typeof fh === 'object' && '__fd' in fh) ? fh.__fd : Number(fh); if (fhNum === 1 || fhNum === 0) { process.stdout.write(s); return s.length; } if (fhNum === 2) { process.stderr.write(s); return s.length; } const h = _fileHandles.get(fhNum); if (!h) return -1; const buf = Buffer.from(s); _fs.writeSync(h.fd, buf, 0, buf.length, h.pos); h.pos += buf.length; return s.length; }
function _fgets(fh: number, size: number): string | null {
  const h = _fileHandles.get(fh); if (!h) return null;
  const buf = Buffer.alloc(size); let i = 0;
  while (i < size - 1) { let byte: number; if ((h as any).ungot?.length > 0) { byte = (h as any).ungot.pop(); } else { const r = _fs.readSync(h.fd, buf, i, 1, h.pos); if (r === 0) { h.eofFlag = true; break; } byte = buf[i]; h.pos++; } buf[i] = byte; i++; if (byte === 10) break; }
  return i === 0 ? null : buf.slice(0, i).toString();
}
function _fseek(fh: number, offset: number, whence: number): number { const h = _fileHandles.get(fh); if (!h) return -1; if (whence === 0) h.pos = offset; else if (whence === 1) h.pos += offset; else if (whence === 2) { const st = _fs.fstatSync(h.fd); h.pos = st.size + offset; } return 0; }
function _ftell(fh: number): number { const h = _fileHandles.get(fh); return h ? h.pos : -1; }
function _rewind(fh: number): void { const h = _fileHandles.get(fh); if (h) h.pos = 0; }
// Pad offset up to a multiple of align (natural alignment per C17 §6.7.2.1).
function __alignTo(offset: number, align: number): number {
  return (offset + align - 1) & ~(align - 1);
}
// Detect if a number needs float/double encoding vs int encoding. Heuristic:
// non-integer OR magnitude outside int32 range → double. Exact integers in
// int32 range remain int32. This is imperfect (e.g. 3.0 is an integer) but
// preserves the common case of mixed int+double struct serialization.
function __numberNeedsDouble(n: number): boolean {
  if (!Number.isFinite(n)) return true;
  if (!Number.isInteger(n)) return true;
  return n > 0x7FFFFFFF || n < -0x80000000;
}
function __fieldTypesOf(obj: any): { types: string[] | null; names: string[] | null } {
  const ctor: any = obj?.constructor;
  return { types: ctor?.__fieldTypes ?? null, names: ctor?.__fieldNames ?? null };
}
function _serializeObjectFields(obj: any, total: number): Buffer {
  const out = Buffer.alloc(total);
  let offset = 0;
  const meta = __fieldTypesOf(obj);
  const keys = meta.names && meta.types ? meta.names : Object.keys(obj ?? {});
  const types = meta.types;
  for (let idx = 0; idx < keys.length; idx++) {
    const key = keys[idx];
    if (offset >= total) break;
    const value = obj[key];
    const typeHint = types ? types[idx] : null;
    if (typeof value === "number") {
      const isDouble = typeHint === "double" || typeHint === "float" ||
        (!typeHint && __numberNeedsDouble(value));
      if (isDouble && offset + 8 <= total) {
        offset = __alignTo(offset, 8);
        if (offset + 8 > total) break;
        out.writeDoubleLE(value, offset);
        offset += 8;
      } else if (offset + 4 <= total) {
        offset = __alignTo(offset, 4);
        if (offset + 4 > total) break;
        out.writeInt32LE(value | 0, offset);
        offset += 4;
      }
      continue;
    }
    if (typeof value === "boolean") {
      if (offset + 1 <= total) { out.writeUInt8(value ? 1 : 0, offset); offset += 1; }
      continue;
    }
    if (typeof value === "string") {
      const bytes = Buffer.from(value + " ");
      bytes.copy(out, offset, 0, Math.min(bytes.length, total - offset));
      offset = total;
      continue;
    }
    if (value?.buf) {
      const src = Buffer.from(value.buf.buffer, value.buf.byteOffset + (value.off || 0), Math.min(value.buf.length - (value.off || 0), total - offset));
      src.copy(out, offset, 0, src.length);
      offset += src.length;
    }
  }
  return out;
}
function _deserializeObjectFields(obj: any, bytes: Buffer): void {
  if (typeof obj === 'string') obj = cptr_from_string(obj);

  let offset = 0;
  const meta = __fieldTypesOf(obj);
  const keys = meta.names && meta.types ? meta.names : Object.keys(obj ?? {});
  const types = meta.types;
  for (let idx = 0; idx < keys.length; idx++) {
    const key = keys[idx];
    if (offset >= bytes.length) break;
    const value = obj[key];
    const typeHint = types ? types[idx] : null;
    if (typeof value === "number") {
      const isDouble = typeHint === "double" || typeHint === "float" ||
        (!typeHint && __numberNeedsDouble(value));
      if (isDouble && offset + 8 <= bytes.length) {
        offset = __alignTo(offset, 8);
        if (offset + 8 > bytes.length) break;
        obj[key] = bytes.readDoubleLE(offset);
        offset += 8;
      } else if (offset + 4 <= bytes.length) {
        offset = __alignTo(offset, 4);
        if (offset + 4 > bytes.length) break;
        obj[key] = bytes.readInt32LE(offset);
        offset += 4;
      }
      continue;
    }
    if (typeof value === "boolean") {
      if (offset + 1 <= bytes.length) { obj[key] = bytes.readUInt8(offset) !== 0; offset += 1; }
      continue;
    }
    if (typeof value === "string") {
      const end = bytes.indexOf(0, offset);
      obj[key] = bytes.toString("utf8", offset, end >= 0 ? end : bytes.length);
      break;
    }
    if (value?.buf) {
      const len = Math.min(value.buf.length - (value.off || 0), bytes.length - offset);
      for (let i = 0; i < len; i++) value.buf[(value.off || 0) + i] = bytes[offset + i];
      if ((value.off || 0) + len < value.buf.length) value.buf[(value.off || 0) + len] = 0;
      offset += len;
    }
  }
}
function _fread(buf: any, size: number, count: number, fh: number): number {
  if (typeof buf === 'string') buf = cptr_from_string(buf);
 const h = _fileHandles.get(fh); if (!h) return 0; const total = size * count; const b = Buffer.alloc(total); const r = _fs.readSync(h.fd, b, 0, total, h.pos); h.pos += r; if (r < total) h.eofFlag = true; if (Array.isArray(buf) && size === 4) { const dv = new DataView(b.buffer, b.byteOffset); for (let i = 0; i < Math.min(count, Math.floor(r / size)); i++) buf[i] = dv.getInt32(i * 4, true); } else if (buf?.buf) { for (let i = 0; i < r; i++) buf.buf[buf.off + i] = b[i]; } else if (buf && typeof buf === "object" && count === 1) { _deserializeObjectFields(buf, b.subarray(0, r)); } return Math.floor(r / size); }
function _fwrite(buf: any, size: number, count: number, fh: number): number { const h = _fileHandles.get(fh); if (!h) return 0; if (Array.isArray(buf) && size === 4) { const ab = Buffer.alloc(size * count); const dv = new DataView(ab.buffer, ab.byteOffset); for (let i = 0; i < count; i++) dv.setInt32(i * 4, buf[i] || 0, true); _fs.writeSync(h.fd, ab, 0, size * count, h.pos); h.pos += size * count; return count; } if (buf?.buf) { const slice = Buffer.from(buf.buf.buffer, buf.buf.byteOffset + (buf.off || 0), Math.min(size * count, buf.buf.length - (buf.off || 0))); _fs.writeSync(h.fd, slice, 0, slice.length, h.pos); h.pos += slice.length; return count; } if (buf && typeof buf === "object" && count === 1) { const out = _serializeObjectFields(buf, size); _fs.writeSync(h.fd, out, 0, out.length, h.pos); h.pos += out.length; return count; } const s = typeof buf === "string" ? buf : String(buf); const b = Buffer.from(s); const total = Math.min(size * count, b.length); _fs.writeSync(h.fd, b, 0, total, h.pos); h.pos += total; return count; }
function _feof(fh: number): number { const h = _fileHandles.get(fh); if (!h) return 1; return h.eofFlag ? 1 : 0; }
function _fgetc(fh: number): number { const h = _fileHandles.get(fh); if (!h) return -1; const u = (h as any).ungot; if (u && u.length) return u.pop(); const b = Buffer.alloc(1); try { const r = _fs.readSync(h.fd, b, 0, 1, h.pos); if (r === 0) { h.eofFlag = true; return -1; } h.pos += r; return b[0]; } catch { h.errFlag = true; return -1; } }
function _fputc(ch: number, fh: number): number { const h = _fileHandles.get(fh); if (!h) return -1; try { const b = Buffer.from([ch & 0xFF]); _fs.writeSync(h.fd, b, 0, 1, h.pos); h.pos += 1; return ch & 0xFF; } catch { h.errFlag = true; return -1; } }
function _fflush(fh: number): number { const h = _fileHandles.get(fh); if (h) { try { _fs.fdatasyncSync(h.fd); } catch {} } return 0; }
function _ungetc(ch: number, fh: number): number { const h = _fileHandles.get(fh); if (!h || ch === -1) return -1; (h as any).ungot = (h as any).ungot || []; (h as any).ungot.push(ch); return ch; }
function dup(fd: number): number { return fd; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function strdup(s: any): any { const str = typeof s === 'string' ? s : cptr_to_string(s); return cptr_from_string(str); }
function div(numer: number, denom: number): any { return { quot: Math.trunc(numer / denom), rem: numer % denom }; }
function open(path: string, flags: number, mode?: number): number { const fs = require('fs'); let f = flags; if (f & 256) f = (f & ~256) | 64; if (f & 1024) f = (f & ~1024) | 128; let m = 'r'; if ((f & 3) === 1) m = (f & 64) ? ((f & 512) ? 'w' : 'a') : 'w'; else if ((f & 3) === 2) m = (f & 64) ? 'w+' : 'r+'; try { return fs.openSync(typeof path === 'string' ? path : cptr_to_string(path), m, mode); } catch { return -1; } }
const ENOENT = 2, EACCES = 13, EEXIST = 17, EINTR = 4, EAGAIN = 11, EBADF = 9, EPERM = 1, ENOMEM = 12, EINVAL = 22, ENOSYS = 38, ERANGE = 34, EDOM = 33, EILSEQ = 84, ENFILE = 23, EMFILE = 24, ENOTTY = 25, EBUSY = 16, ENOSPC = 28, EROFS = 30, EPIPE = 32, ECONNREFUSED = 111, EADDRINUSE = 98, ETIMEDOUT = 110, ECONNRESET = 104;
let errno = 0;
function nan(tag: string): number { return NaN; }
function rint(x: number): number { return Math.round(x); }
function __builtin_nan(s: string): number { return NaN; }
function __builtin_nanf(s: string): number { return NaN; }
function __builtin_nanl(s: string): number { return NaN; }
function round(x: number): number { return x >= 0 ? Math.floor(x + 0.5) : Math.ceil(x - 0.5); }
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
function __strto_source(s: any): string { return typeof s === 'string' ? s : (s?.buf ? cptr_to_string(s) : String(s ?? '')); }
function __strto_set_end(src: any, endptr: any, consumed: number): void {
  if (!endptr) return;
  if (typeof endptr === 'object' && 'value' in endptr) {
    /* C17 §7.22.1.4: *endptr := pointer to first unparsed char.
     * If src is a CPtr, advance off by consumed. If src is a JS
     * string, hand back the suffix string so subsequent %s prints
     * the unparsed portion. */
    if (consumed === 0) endptr.value = src;
    else if (src?.buf) endptr.value = cptr_offset(src, consumed);
    else if (typeof src === 'string') endptr.value = src.substring(consumed);
    else endptr.value = consumed;
    return;
  }
  if (endptr?.buf) {
    if (src?.buf) { endptr.off = (src.off ?? 0) + consumed; }
  }
}
function __strto_space(c: string | undefined): boolean { return c === ' ' || c === '\t' || c === '\n' || c === '\v' || c === '\f' || c === '\r'; }
function __strto_digit(ch: string | undefined, base: number): number {
  if (!ch) return -1;
  const code = ch.charCodeAt(0);
  let value = -1;
  if (code >= 48 && code <= 57) value = code - 48;
  else if (code >= 65 && code <= 90) value = code - 65 + 10;
  else if (code >= 97 && code <= 122) value = code - 97 + 10;
  return value >= 0 && value < base ? value : -1;
}
function __strto_int_core(src: any, base: number, unsigned: boolean, bits: number, preferBigInt = false): any {
  const ss = __strto_source(src);
  let p = 0;
  while (p < ss.length && __strto_space(ss[p])) p++;
  let negative = false;
  if (ss[p] === '+' || ss[p] === '-') { negative = ss[p] === '-'; p++; }
  let b = base | 0;
  if ((b === 0 || b === 16) && ss[p] === '0' && (ss[p + 1] === 'x' || ss[p + 1] === 'X') && __strto_digit(ss[p + 2], 16) >= 0) { b = 16; p += 2; }
  else if (b === 0 && ss[p] === '0') { b = 8; }
  else if (b === 0) { b = 10; }
  if (b < 2 || b > 36) { __strto_set_end(src, null, 0); return { value: 0, endIndex: 0 }; }
  const digitsStart = p;
  let acc = 0n;
  const bitsBig = BigInt(bits);
  const maxBig = unsigned ? ((1n << bitsBig) - 1n) : ((1n << (bitsBig - 1n)) - 1n);
  const minBig = unsigned ? 0n : -(1n << (bitsBig - 1n));
  const limit = unsigned ? maxBig : (negative ? -minBig : maxBig);
  let overflow = false;
  while (p < ss.length) {
    const d = __strto_digit(ss[p], b);
    if (d < 0) break;
    if (!overflow) {
      const digitBig = BigInt(d);
      if (acc > (limit - digitBig) / BigInt(b)) overflow = true;
      else acc = acc * BigInt(b) + digitBig;
    }
    p++;
  }
  if (p === digitsStart) return { value: 0, endIndex: 0 };
  const finish = (value: bigint): any => {
    if (preferBigInt) {
      const asNum = Number(value);
      return Number.isSafeInteger(asNum) ? asNum : value;
    }
    return Number(value);
  };
  if (overflow) {
    if (typeof errno !== 'undefined') errno = typeof ERANGE !== 'undefined' ? ERANGE : 34;
    return { value: finish(unsigned ? maxBig : (negative ? minBig : maxBig)), endIndex: p };
  }
  let signed = negative ? -acc : acc;
  if (!unsigned && (signed < minBig || signed > maxBig)) {
    if (typeof errno !== 'undefined') errno = typeof ERANGE !== 'undefined' ? ERANGE : 34;
    return { value: finish(negative ? minBig : maxBig), endIndex: p };
  }
  if (unsigned && negative) {
    const modulo = 1n << bitsBig;
    signed = (modulo - (acc % modulo)) % modulo;
  }
  return { value: finish(signed), endIndex: p };
}
function __strto_float_core(src: any): { value: number; endIndex: number } {
  const ss = __strto_source(src);
  let p = 0;
  while (p < ss.length && __strto_space(ss[p])) p++;
  const start = p;
  let sign = 1;
  if (ss[p] === '+' || ss[p] === '-') { if (ss[p] === '-') sign = -1; p++; }
  const rest = ss.slice(p).toLowerCase();
  if (rest.startsWith('nan')) {
    let end = p + 3;
    if (ss[end] === '(') { const close = ss.indexOf(')', end); if (close !== -1) end = close + 1; }
    return { value: NaN, endIndex: end };
  }
  if (rest.startsWith('infinity')) return { value: sign * Infinity, endIndex: p + 8 };
  if (rest.startsWith('inf')) return { value: sign * Infinity, endIndex: p + 3 };
  const m = ss.slice(p).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
  if (!m) return { value: 0, endIndex: 0 };
  const parsed = sign * parseFloat(m[0]);
  return { value: parsed, endIndex: p + m[0].length };
}
function atoi(s: string): number { return __strto_int_core(s, 10, false, 32).value | 0; }
function atol(s: string): number { return __strto_int_core(s, 10, false, 32).value | 0; }
function atoll(s: string): number { return __strto_int_core(s, 10, false, 64, true).value; }
function atof(s: string): number { return __strto_float_core(s).value; }
function strtol(s: any, endptr: any, base: number): number { const r = __strto_int_core(s, base, false, 32); __strto_set_end(s, endptr, r.endIndex); return r.value | 0; }
function strtoul(s: any, endptr: any, base: number): number { const r = __strto_int_core(s, base, true, 32); __strto_set_end(s, endptr, r.endIndex); return r.value >>> 0; }
function strtoll(s: any, endptr: any, base: number): number { const r = __strto_int_core(s, base, false, 64, true); __strto_set_end(s, endptr, r.endIndex); return r.value; }
function strtoull(s: any, endptr: any, base: number): number { const r = __strto_int_core(s, base, true, 64, true); __strto_set_end(s, endptr, r.endIndex); return r.value; }
function strtod(s: any, endptr: any): number { const r = __strto_float_core(s); __strto_set_end(s, endptr, r.endIndex); return r.value; }
function strtof(s: any, endptr: any): number { const r = __strto_float_core(s); __strto_set_end(s, endptr, r.endIndex); return Math.fround(r.value); }
function memcpy(dst: any, src: any, n: number): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 if (dst?.buf && src?.buf) { cptr_copy(dst, src, n); /* C17 §6.7.6.1: when src is a slot-bearing CPtr (T** array), copy the parallel slot references into dst so pointer identity survives the byte-copy. Slot stride is 8 bytes (LLP64 sizeof(void*)); slot indices align with byte offset >> 3. */ if ((src as any).slots) { const dstAny: any = dst; if (!dstAny.slots) dstAny.slots = []; const srcSlotBase = ((src.off ?? 0) >> 3); const dstSlotBase = ((dst.off ?? 0) >> 3); const slotCount = Math.floor(n / 8); for (let i = 0; i < slotCount; i++) dstAny.slots[dstSlotBase + i] = (src as any).slots[srcSlotBase + i] ?? null; } return dst; } if (dst?.buf && typeof src === 'string') { for (let i = 0; i < n && i < src.length; i++) dst.buf[dst.off + i] = src.charCodeAt(i); return dst; } if (dst?.buf && src && typeof src === 'object' && 'value' in src && typeof src.value === 'number') { const dv = new DataView(dst.buf.buffer, dst.buf.byteOffset + dst.off); if (n >= 4) dv.setInt32(0, src.value, true); else if (n >= 2) dv.setInt16(0, src.value, true); else dv.setInt8(0, src.value); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src?.buf) { /* BRIDGE: memcpy(box, cptr, n) — read N bytes from a CPtr into a {value} box. C17 §7.24.2.1. n=8 → bigint64 (signed). n=4 → int32. n=2 → int16. n=1 → int8. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const off = src.off ?? 0; if (n >= 8) { const bv = dv.getBigInt64(off, true); dst.value = (typeof dst.value === 'bigint') ? bv : Number(bv); } else if (n >= 4) dst.value = dv.getInt32(off, true); else if (n >= 2) dst.value = dv.getInt16(off, true); else dst.value = dv.getInt8(off); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src && typeof src === 'object' && 'value' in src) { /* C17 §6.5 type-pun via memcpy: reinterpret src.value bytes as dst's type. n=4: int32<->float32. n=8: int64<->float64 (via bigint). */ const __b = new Uint8Array(8); const __dv = new DataView(__b.buffer); const __s = src.value; const __d = dst.value; if (n === 4) { if (Number.isInteger(__s) && !Number.isInteger(__d) && typeof __d === 'number') { __dv.setInt32(0, __s | 0, true); dst.value = __dv.getFloat32(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat32(0, __s, true); dst.value = __dv.getInt32(0, true); } else { dst.value = __s; } } else if (n === 8) { if (typeof __s === 'bigint' && typeof __d !== 'bigint') { __dv.setBigInt64(0, __s, true); dst.value = __dv.getFloat64(0, true); } else if (typeof __s !== 'bigint' && typeof __d === 'bigint') { __dv.setFloat64(0, Number(__s), true); dst.value = __dv.getBigInt64(0, true); } else if (Number.isInteger(__s) && !Number.isInteger(__d)) { __dv.setBigInt64(0, BigInt(Math.trunc(__s)), true); dst.value = __dv.getFloat64(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat64(0, __s, true); dst.value = Number(__dv.getBigInt64(0, true)); } else { dst.value = __s; } } else { dst.value = __s; } return dst; } if (Array.isArray(dst) && Array.isArray(src)) { for (let i = 0; i < n; i++) dst[i] = src[i]; } else if (typeof dst === 'object' && typeof src === 'object') Object.assign(dst, src); return dst; }
function memset(dst: any, val: number, n: number): any { const __zeroObject = (obj: any): void => { for (const k of Object.keys(obj)) { const v = obj[k]; if (typeof v === 'number') obj[k] = val | 0; else if (typeof v === 'boolean') obj[k] = val !== 0; else if (typeof v === 'string') obj[k] = ''; else if (v && typeof v === 'object' && v.buf) cptr_memset(v, val, v.buf.length); else if (Array.isArray(v) && v.length > 0 && typeof Object.values(v).find(x => x !== null && typeof x === 'object') !== 'undefined') { for (const item of v) { if (item && typeof item === 'object') __zeroObject(item); } } else if (Array.isArray(v)) { for (let i = 0; i < Math.min(n, v.length); i++) v[i] = val; } else if (v && typeof v === 'object') __zeroObject(v); else if (v != null) obj[k] = null; } }; if (dst?.buf) { cptr_memset(dst, val, n); return dst; } if (Array.isArray(dst) && dst.length > 0 && typeof Object.values(dst).find(x => x !== null && typeof x === 'object') !== 'undefined') { for (const obj of dst) { if (obj && typeof obj === 'object') __zeroObject(obj); } return dst; } if (Array.isArray(dst)) { for (let _mi = 0; _mi < Math.min(n, dst.length); _mi++) dst[_mi] = val; return dst; } if (dst && typeof dst === 'object') { __zeroObject(dst); return dst; } return dst; }
function strcpy(dst: any, src: any): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 const srcStr = typeof src === 'string' ? src : src?.buf ? cptr_to_string(src) : src?.toString?.() ?? ''; if (dst?.buf) { for (let i = 0; i < srcStr.length; i++) dst.buf[dst.off + i] = srcStr.charCodeAt(i); dst.buf[dst.off + srcStr.length] = 0; return dst; } if (Array.isArray(dst)) { for (let i = 0; i < srcStr.length; i++) dst[i] = srcStr.charCodeAt(i); dst[srcStr.length] = 0; return dst; } if (dst && typeof dst === 'object' && 'value' in dst) dst.value = srcStr; return srcStr; }
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
function reduce(first: any, last: any, init?: any, op?: Function): any { const A = __cpp_arr(first, last); const f = op ?? ((a: any, b: any) => a + b); let acc = init ?? 0; for (let i = A.start; i < A.end; i++) acc = f(acc, A.arr[i]); return acc; }
function prev(it: any, n: number = 1): any { if (it == null) return null; if (it && it.__arr !== undefined) return __cpp_iter(it.__arr, (it.__pos ?? 0) - n); if (typeof it === 'number') return it - n; return it; }
function count(first: any, last: any, value: any): number { const A = __cpp_arr(first, last); let n = 0; for (let i = A.start; i < A.end; i++) if (A.arr[i] === value) n++; return n; }
function exit(code: number): never { process.exit(code); }
function strncmp(a: any, b: any, n: number): number { const sa = ((typeof a === 'string') ? a : (a?.buf ? cptr_to_string(a) : a?.toString?.() ?? '')).substring(0, n); const sb = ((typeof b === 'string') ? b : (b?.buf ? cptr_to_string(b) : b?.toString?.() ?? '')).substring(0, n); return sa < sb ? -1 : sa > sb ? 1 : 0; }
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
  // C17 §6.3.2.3 p7 + §7.19: container_of round-trip recovery. If p
  // is a field reference whose accumulated byte_delta exactly cancels
  // its field_offset (`(T*)((char*)&t.m - offsetof(T, m))`), return
  // the containing struct. Otherwise the cast is UB per §6.3.2.3 p7;
  // best-effort: still return owner so misshapen code at least
  // doesn't crash. A static check catches
  // localized cases; this runtime fallback remains for cross-boundary pointers.
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
let _static_version_0: string = cptr_create(15);
let _static_default_buffer_size_1: number = ((256) >>> 0);

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
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class error {
  json: any | null;
  position: number;
  constructor() {
    this.json = null;
    this.position = 0;
  }
}
(error as any).__fieldTypes = ["int64","int64"];
(error as any).__fieldNames = ["json","position"];
(error as any).__fieldOffsets = [0,8];

let global_error = Object.assign(new error(), { json: null, position: ((0) >>> 0) });
export function cJSON_GetErrorPtr(): string {
  return cptr_clone(((cptr_offset(global_error.json, ((global_error.position) >>> 0)))));
}

export function cJSON_GetStringValue(item: cJSON | null): string {
  if (!cJSON_IsString(item)) {
    return null;
  }
  return cptr_clone((__struct_ptr_at(item, 0)).valuestring);
}

export function cJSON_GetNumberValue(item: cJSON | null): number {
  if (!cJSON_IsNumber(item)) {
    return ((__builtin_nanf("")));
  }
  return (__struct_ptr_at(item, 0)).valuedouble;
}

export function cJSON_Version(): string {
  (() => { const __s = printf_format("%i.%i.%i", 1, 7, 19); strcpy(_static_version_0, __s); return __s.length; })();
  return cptr_clone(_static_version_0);
}

function case_insensitive_strcmp(string1: any | null, string2: any | null): number {
  if (typeof string1 === 'string') string1 = cptr_from_string(string1);
  if (typeof string2 === 'string') string2 = cptr_from_string(string2);

  if ((((cptr_eq(string1, (null))) || (cptr_eq(string2, (null)))) ? 1 : 0)) {
    return 1;
  }
  if (cptr_eq(string1, string2)) {
    return 0;
  }
  for (; tolower(((string1.buf[string1.off]) & 0xFF)) == tolower(((string2.buf[string2.off]) & 0xFF)); (string1.off++), string2.off++) {
    if (((string1.buf[string1.off]) & 0xFF) == 0) {
      return 0;
    }
  }
  return i32(tolower(((string1.buf[string1.off]) & 0xFF)) - tolower(((string2.buf[string2.off]) & 0xFF)));
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class internal_hooks {
  allocate: any;
  deallocate: any;
  reallocate: any;
  constructor() {
    this.allocate = null;
    this.deallocate = null;
    this.reallocate = null;
  }
}
(internal_hooks as any).__fieldTypes = ["int64","int32","int64"];
(internal_hooks as any).__fieldNames = ["allocate","deallocate","reallocate"];
(internal_hooks as any).__fieldOffsets = [0,8,16];

function internal_malloc(size: number): any | null {
  return cptr_clone(malloc(((size) >>> 0)));
}

function internal_free(pointer: any | null): void {
  free(pointer);
}

function internal_realloc(pointer: any | null, size: number): any | null {
  return cptr_clone(realloc(pointer, ((size) >>> 0)));
}

let global_hooks = Object.assign(new internal_hooks(), { allocate: internal_malloc, deallocate: internal_free, reallocate: internal_realloc });
function cJSON_strdup(string: any | null, hooks: internal_hooks | null): any | null {
  let length = ((0) >>> 0);
  let copy = null; /* &ref */
  if (cptr_eq(string, (null))) {
    return null;
  }
  length = strlen(cptr_clone((string))) + 1;
  copy = ((__struct_ptr_at(hooks, 0)).allocate(((length) >>> 0)));
  if (cptr_eq(copy, (null))) {
    return null;
  }
  memcpy(copy, string, ((length) >>> 0));
  return cptr_clone(copy);
}

export function cJSON_InitHooks(hooks: cJSON_Hooks | null): void {
  if (hooks == (null)) {
    global_hooks.allocate = malloc;
    global_hooks.deallocate = free;
    global_hooks.reallocate = realloc;
    return;
  }
  global_hooks.allocate = malloc;
  if ((__struct_ptr_at(hooks, 0)).malloc_fn != (null)) {
    global_hooks.allocate = (__struct_ptr_at(hooks, 0)).malloc_fn;
  }
  global_hooks.deallocate = free;
  if ((__struct_ptr_at(hooks, 0)).free_fn != (null)) {
    global_hooks.deallocate = (__struct_ptr_at(hooks, 0)).free_fn;
  }
  global_hooks.reallocate = null;
  if ((((global_hooks.allocate == malloc) && (global_hooks.deallocate == free)) ? 1 : 0)) {
    global_hooks.reallocate = realloc;
  }
}

function cJSON_New_Item(hooks: internal_hooks | null): cJSON | null {
  let node = (new cJSON()); /* &ref */
  if (node) {
    memset(node, 0, 64);
  }
  return node;
}

export function cJSON_Delete(item: cJSON | null): void {
  let next = null; /* &ref */
  while (item != (null)) {
    next = (__struct_ptr_at(item, 0)).next;
    if (((!((__struct_ptr_at(item, 0)).type & 256) && ((__struct_ptr_at(item, 0)).child != (null))) ? 1 : 0)) {
      cJSON_Delete((__struct_ptr_at(item, 0)).child);
    }
    if (((!((__struct_ptr_at(item, 0)).type & 256) && (!cptr_eq((__struct_ptr_at(item, 0)).valuestring, (null)))) ? 1 : 0)) {
      global_hooks.deallocate((__struct_ptr_at(item, 0)).valuestring);
      (__struct_ptr_at(item, 0)).valuestring = null;
    }
    if (((!((__struct_ptr_at(item, 0)).type & 512) && (!cptr_eq((__struct_ptr_at(item, 0)).string, (null)))) ? 1 : 0)) {
      global_hooks.deallocate((__struct_ptr_at(item, 0)).string);
      (__struct_ptr_at(item, 0)).string = null;
    }
    global_hooks.deallocate(item);
    item = next;
  }
}

function get_decimal_point(): number {
  return ((46) & 0xFF);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class parse_buffer {
  content: any | null;
  length: number;
  offset: number;
  depth: number;
  hooks: internal_hooks;
  constructor() {
    this.content = null;
    this.length = 0;
    this.offset = 0;
    this.depth = 0;
    this.hooks = new internal_hooks();
  }
}
(parse_buffer as any).__fieldTypes = ["int64","int64","int64","int64","int32"];
(parse_buffer as any).__fieldNames = ["content","length","offset","depth","hooks"];
(parse_buffer as any).__fieldOffsets = [0,8,16,24,32];

function parse_number(item: cJSON | null, input_buffer: parse_buffer | null): cJSON_bool {
  let number: number = 0.0;
  let after_end: any | null = null;
  let number_c_string: any | null = null;
  let decimal_point: number = 0;
  let i: number = 0;
  let number_string_length: number = 0;
  let has_decimal_point: cJSON_bool = 0;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      number = 0;
      after_end = null; /* &ref */
      number_c_string = null;
      decimal_point = get_decimal_point();
      i = ((0) >>> 0);
      number_string_length = ((0) >>> 0);
      has_decimal_point = (Math.trunc(+(0)));
      if ((((input_buffer == (null)) || (cptr_eq((__struct_ptr_at(input_buffer, 0)).content, (null)))) ? 1 : 0)) {
        return (Math.trunc(+(0)));
      }
      for (i = ((0) >>> 0); ((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((i) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
        switch ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + ((i) >>> 0)]) & 0xFF)) {
          case 48:
            case 49:
              case 50:
                case 51:
                  case 52:
                    case 53:
                      case 54:
                        case 55:
                          case 56:
                            case 57:
                              case 43:
                                case 45:
                                  case 101:
                                    case 69:
                                    {
                                      (() => { const _t = number_string_length; number_string_length = u32(number_string_length + 1); return _t; })();
          break;
                                    }
          case 46:
          {
            (() => { const _t = number_string_length; number_string_length = u32(number_string_length + 1); return _t; })();
          has_decimal_point = (Math.trunc(+(1)));
          break;
          }
          default:
          {
            _state = 1; continue _sm; /* goto loop_end */
          }
        }
      }
    case 1: /* loop_end */
      number_c_string = ((__struct_ptr_at(input_buffer, 0)).hooks.allocate(((number_string_length) >>> 0) + ((1) >>> 0)));
      if (cptr_eq(number_c_string, (null))) {
        return (Math.trunc(+(0)));
      }
      memcpy(number_c_string, (cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))), ((number_string_length) >>> 0));
      number_c_string.buf[(number_c_string.off ?? 0) + ((number_string_length) >>> 0)] = (((0) & 0xFF)) & 0xFF;
      if (has_decimal_point) {
        for (i = ((0) >>> 0); ((i) >>> 0) < ((number_string_length) >>> 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
          if (((number_c_string.buf[(number_c_string.off ?? 0) + ((i) >>> 0)]) & 0xFF) == 46) {
            number_c_string.buf[(number_c_string.off ?? 0) + ((i) >>> 0)] = (((decimal_point) & 0xFF)) & 0xFF;
          }
        }
      }
      number = (() => { const _box0 = { value: after_end }; const _r = strtod(cptr_clone((number_c_string)), _box0); after_end = _box0.value; return _r; })();
      if (cptr_eq(number_c_string, after_end)) {
        (__struct_ptr_at(input_buffer, 0)).hooks.deallocate(number_c_string);
        return (Math.trunc(+(0)));
      }
      (__struct_ptr_at(item, 0)).valuedouble = number;
      if (number >= 2147483647) {
        (__struct_ptr_at(item, 0)).valueint = 2147483647;
      } else {
        if (number <= ((i32(-2147483647 - 1)))) {
          (__struct_ptr_at(item, 0)).valueint = (i32(-2147483647 - 1));
        } else {
          (__struct_ptr_at(item, 0)).valueint = (Math.trunc(+(number)) | 0);
        }
      }
      (__struct_ptr_at(item, 0)).type = (((1 << 3) | 0));
      (__struct_ptr_at(input_buffer, 0)).offset += ((Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(after_end, number_c_string))))) >>> 0);
      (__struct_ptr_at(input_buffer, 0)).hooks.deallocate(number_c_string);
      return (Math.trunc(+(1)));
      break _sm;
    }
  }
}

export function cJSON_SetNumberHelper(object: cJSON | null, number: number): number {
  if (object == (null)) {
    return ((__builtin_nanf("")));
  }
  if (number >= 2147483647) {
    (__struct_ptr_at(object, 0)).valueint = 2147483647;
  } else {
    if (number <= ((i32(-2147483647 - 1)))) {
      (__struct_ptr_at(object, 0)).valueint = (i32(-2147483647 - 1));
    } else {
      (__struct_ptr_at(object, 0)).valueint = (Math.trunc(+(number)) | 0);
    }
  }
  return (__struct_ptr_at(object, 0)).valuedouble = number;
}

export function cJSON_SetValuestring(object: cJSON | null, valuestring: string): string {
  let copy = null; /* &ref */
  let v1_len = 0;
  let v2_len = 0;
  if ((((((object == (null)) || !((__struct_ptr_at(object, 0)).type & (((1 << 4) | 0)))) ? 1 : 0) || ((__struct_ptr_at(object, 0)).type & 256)) ? 1 : 0)) {
    return null;
  }
  if (((cptr_eq((__struct_ptr_at(object, 0)).valuestring, (null)) || cptr_eq(valuestring, (null))) ? 1 : 0)) {
    return null;
  }
  v1_len = strlen(cptr_clone(valuestring));
  v2_len = strlen(cptr_clone((__struct_ptr_at(object, 0)).valuestring));
  if (((v1_len) >>> 0) <= ((v2_len) >>> 0)) {
    if (!(((((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(cptr_offset(valuestring, ((v1_len) >>> 0)), (__struct_ptr_at(object, 0)).valuestring) || ((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(cptr_offset((__struct_ptr_at(object, 0)).valuestring, ((v2_len) >>> 0)), valuestring)) ? 1 : 0))) {
      return null;
    }
    strcpy((__struct_ptr_at(object, 0)).valuestring, cptr_clone(valuestring));
    return cptr_clone((__struct_ptr_at(object, 0)).valuestring);
  }
  copy = (cJSON_strdup(cptr_clone((valuestring)), global_hooks));
  if (cptr_eq(copy, (null))) {
    return null;
  }
  if (!cptr_eq((__struct_ptr_at(object, 0)).valuestring, (null))) {
    cJSON_free((__struct_ptr_at(object, 0)).valuestring);
  }
  (__struct_ptr_at(object, 0)).valuestring = copy;
  return cptr_clone(copy);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class printbuffer {
  buffer: any | null;
  length: number;
  offset: number;
  depth: number;
  noalloc: cJSON_bool;
  format: cJSON_bool;
  hooks: internal_hooks;
  constructor() {
    this.buffer = null;
    this.length = 0;
    this.offset = 0;
    this.depth = 0;
    this.noalloc = 0;
    this.format = 0;
    this.hooks = new internal_hooks();
  }
}
(printbuffer as any).__fieldTypes = ["int64","int64","int64","int64","int32","int32","int32"];
(printbuffer as any).__fieldNames = ["buffer","length","offset","depth","noalloc","format","hooks"];
(printbuffer as any).__fieldOffsets = [0,8,16,24,32,40,48];

function ensure(p: printbuffer | null, needed: number): any | null {
  let newbuffer = null; /* &ref */
  let newsize = ((0) >>> 0);
  if ((((p == (null)) || (cptr_eq((__struct_ptr_at(p, 0)).buffer, (null)))) ? 1 : 0)) {
    return null;
  }
  if (((((((__struct_ptr_at(p, 0)).length) >>> 0) > ((0) >>> 0)) && ((((__struct_ptr_at(p, 0)).offset) >>> 0) >= (((__struct_ptr_at(p, 0)).length) >>> 0))) ? 1 : 0)) {
    return null;
  }
  if (((needed) >>> 0) > ((2147483647) >>> 0)) {
    return null;
  }
  needed += (((__struct_ptr_at(p, 0)).offset) >>> 0) + ((1) >>> 0);
  if (((needed) >>> 0) <= (((__struct_ptr_at(p, 0)).length) >>> 0)) {
    return cptr_clone(cptr_offset((__struct_ptr_at(p, 0)).buffer, (((__struct_ptr_at(p, 0)).offset) >>> 0)));
  }
  if ((__struct_ptr_at(p, 0)).noalloc) {
    return null;
  }
  if (((needed) >>> 0) > (((__safe_div(2147483647, 2))) >>> 0)) {
    if (((needed) >>> 0) <= ((2147483647) >>> 0)) {
      newsize = ((2147483647) >>> 0);
    } else {
      return null;
    }
  } else {
    newsize = ((needed) >>> 0) * ((2) >>> 0);
  }
  if ((__struct_ptr_at(p, 0)).hooks.reallocate != (null)) {
    newbuffer = ((__struct_ptr_at(p, 0)).hooks.reallocate((__struct_ptr_at(p, 0)).buffer, ((newsize) >>> 0)));
    if (cptr_eq(newbuffer, (null))) {
      (__struct_ptr_at(p, 0)).hooks.deallocate((__struct_ptr_at(p, 0)).buffer);
      (__struct_ptr_at(p, 0)).length = ((0) >>> 0);
      (__struct_ptr_at(p, 0)).buffer = null;
      return null;
    }
  } else {
    newbuffer = ((__struct_ptr_at(p, 0)).hooks.allocate(((newsize) >>> 0)));
    if (!newbuffer) {
      (__struct_ptr_at(p, 0)).hooks.deallocate((__struct_ptr_at(p, 0)).buffer);
      (__struct_ptr_at(p, 0)).length = ((0) >>> 0);
      (__struct_ptr_at(p, 0)).buffer = null;
      return null;
    }
    memcpy(newbuffer, (__struct_ptr_at(p, 0)).buffer, (((__struct_ptr_at(p, 0)).offset) >>> 0) + ((1) >>> 0));
    (__struct_ptr_at(p, 0)).hooks.deallocate((__struct_ptr_at(p, 0)).buffer);
  }
  (__struct_ptr_at(p, 0)).length = ((newsize) >>> 0);
  (__struct_ptr_at(p, 0)).buffer = newbuffer;
  return cptr_clone(cptr_offset(newbuffer, (((__struct_ptr_at(p, 0)).offset) >>> 0)));
}

function update_offset(buffer: printbuffer | null): void {
  let buffer_pointer = null; /* &ref */
  if ((((buffer == (null)) || (cptr_eq((__struct_ptr_at(buffer, 0)).buffer, (null)))) ? 1 : 0)) {
    return;
  }
  buffer_pointer = cptr_clone(cptr_offset((__struct_ptr_at(buffer, 0)).buffer, (((__struct_ptr_at(buffer, 0)).offset) >>> 0)));
  (__struct_ptr_at(buffer, 0)).offset += strlen(cptr_clone((buffer_pointer)));
}

function compare_double(a: number, b: number): cJSON_bool {
  let maxVal = (fabs(a) > fabs(b) ? fabs(a) : fabs(b));
  return (fabs(a - b) <= maxVal * 2.2204460492503131E-16);
}

function print_number(item: cJSON | null, output_buffer: printbuffer | null): cJSON_bool {
  let output_pointer = null; /* &ref */
  let d = (__struct_ptr_at(item, 0)).valuedouble;
  let length = 0;
  let i = ((0) >>> 0);
  let number_buffer = (() => { const __b = cptr_create(26); __b.buf[0] = (((0) & 0xFF)) & 0xFF; return __b; })();
  let decimal_point = get_decimal_point();
  let test_box = { value: 0 };
  if (output_buffer == (null)) {
    return (Math.trunc(+(0)));
  }
  if (((((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((d))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((d))) : _ldclass(((d))))))) == 2) || ((((((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 102 ? _fdclass(Math.fround((d))) : (((8 == 4 ? 102 : (8 == 8 ? 100 : 108))) == 100 ? _dclass(((d))) : _ldclass(((d))))))) == 1)) ? 1 : 0)) {
    length = (() => { const __s = printf_format("null"); strcpy((number_buffer), __s); return __s.length; })();
  } else {
    if (d == ((__struct_ptr_at(item, 0)).valueint)) {
      length = (() => { const __s = printf_format("%d", (__struct_ptr_at(item, 0)).valueint); strcpy((number_buffer), __s); return __s.length; })();
    } else {
      length = (() => { const __s = printf_format("%1.15g", d); strcpy((number_buffer), __s); return __s.length; })();
      if ((((sscanf((number_buffer), "%lg", test_box) != 1) || !compare_double((test_box.value), d)) ? 1 : 0)) {
        length = (() => { const __s = printf_format("%1.17g", d); strcpy((number_buffer), __s); return __s.length; })();
      }
    }
  }
  if ((((length < 0) || (length > (Math.trunc(+((26 - 1))) | 0))) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  output_pointer = ensure(output_buffer, ((Math.trunc(+(length))) >>> 0) + 1);
  if (cptr_eq(output_pointer, (null))) {
    return (Math.trunc(+(0)));
  }
  for (i = ((0) >>> 0); ((i) >>> 0) < (((Math.trunc(+(length))) >>> 0)); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    if (((number_buffer.buf[(number_buffer.off ?? 0) + ((i) >>> 0)]) & 0xFF) == ((decimal_point) & 0xFF)) {
      output_pointer.buf[(output_pointer.off ?? 0) + ((i) >>> 0)] = (((46) & 0xFF)) & 0xFF;
      continue;
    }
    output_pointer.buf[(output_pointer.off ?? 0) + ((i) >>> 0)] = (((number_buffer.buf[(number_buffer.off ?? 0) + ((i) >>> 0)]) & 0xFF)) & 0xFF;
  }
  output_pointer.buf[(output_pointer.off ?? 0) + ((i) >>> 0)] = (((0) & 0xFF)) & 0xFF;
  (__struct_ptr_at(output_buffer, 0)).offset += ((Math.trunc(+(length))) >>> 0);
  return (Math.trunc(+(1)));
}

function parse_hex4(input: any | null): number {
  if (typeof input === 'string') input = cptr_from_string(input);

  let h = ((0) >>> 0);
  let i = ((0) >>> 0);
  for (i = ((0) >>> 0); ((i) >>> 0) < ((4) >>> 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    if ((((((input.buf[(input.off ?? 0) + ((i) >>> 0)]) & 0xFF) >= 48) && (((input.buf[(input.off ?? 0) + ((i) >>> 0)]) & 0xFF) <= 57)) ? 1 : 0)) {
      h = u32(h + u32(((Math.trunc(+(((input.buf[(input.off ?? 0) + ((i) >>> 0)]) & 0xFF)))) >>> 0) - ((48) >>> 0)));
    } else {
      if ((((((input.buf[(input.off ?? 0) + ((i) >>> 0)]) & 0xFF) >= 65) && (((input.buf[(input.off ?? 0) + ((i) >>> 0)]) & 0xFF) <= 70)) ? 1 : 0)) {
        h = u32(h + u32(u32(((Math.trunc(+(10))) >>> 0) + ((((input.buf[(input.off ?? 0) + ((i) >>> 0)]) & 0xFF)) >>> 0)) - ((65) >>> 0)));
      } else {
        if ((((((input.buf[(input.off ?? 0) + ((i) >>> 0)]) & 0xFF) >= 97) && (((input.buf[(input.off ?? 0) + ((i) >>> 0)]) & 0xFF) <= 102)) ? 1 : 0)) {
          h = u32(h + u32(u32(((Math.trunc(+(10))) >>> 0) + ((((input.buf[(input.off ?? 0) + ((i) >>> 0)]) & 0xFF)) >>> 0)) - ((97) >>> 0)));
        } else {
          return ((0) >>> 0);
        }
      }
    }
    if (((i) >>> 0) < ((3) >>> 0)) {
      h = (((h) >>> 0) << 4) >>> 0;
    }
  }
  return ((h) >>> 0);
}

function utf16_literal_to_utf8(input_pointer: any | null, input_end: any | null, output_pointer: { value: any | null }): number {
  let codepoint: number = 0;
  let first_code: number = 0;
  let first_sequence: any | null = null;
  let utf8_length: number = 0;
  let utf8_position: number = 0;
  let sequence_length: number = 0;
  let first_byte_mark: number = 0;
  let second_sequence: any | null = null;
  let second_code: number = 0;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      codepoint = ((0) >>> 0);
      first_code = ((0) >>> 0);
      first_sequence = cptr_clone(input_pointer); /* &ref */
      utf8_length = ((0) & 0xFF);
      utf8_position = ((0) & 0xFF);
      sequence_length = ((0) & 0xFF);
      first_byte_mark = ((0) & 0xFF);
      if ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(input_end, first_sequence)) < 6) {
        _state = 1; continue _sm; /* goto fail */
      }
      first_code = parse_hex4(cptr_offset(first_sequence, 2));
      if (((((((first_code) >>> 0) >= ((56320) >>> 0)) && (((first_code) >>> 0) <= ((57343) >>> 0))) ? 1 : 0))) {
        _state = 1; continue _sm; /* goto fail */
      }
      if ((((((first_code) >>> 0) >= ((55296) >>> 0)) && (((first_code) >>> 0) <= ((56319) >>> 0))) ? 1 : 0)) {
        second_sequence = cptr_offset(first_sequence, 6); /* &ref */
        second_code = ((0) >>> 0);
        sequence_length = (((12) & 0xFF)) & 0xFF;
        if ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(input_end, second_sequence)) < 6) {
          _state = 1; continue _sm; /* goto fail */
        }
        if ((((((second_sequence.buf[(second_sequence.off ?? 0) + 0]) & 0xFF) != 92) || (((second_sequence.buf[(second_sequence.off ?? 0) + 1]) & 0xFF) != 117)) ? 1 : 0)) {
          _state = 1; continue _sm; /* goto fail */
        }
        second_code = parse_hex4(cptr_offset(second_sequence, 2));
        if ((((((second_code) >>> 0) < ((56320) >>> 0)) || (((second_code) >>> 0) > ((57343) >>> 0))) ? 1 : 0)) {
          _state = 1; continue _sm; /* goto fail */
        }
        codepoint = ((u32(((65536) >>> 0) + ((((((((first_code) >>> 0) & ((1023) >>> 0)) >>> 0) << 10) >>> 0) | ((((second_code) >>> 0) & ((1023) >>> 0)) >>> 0)) >>> 0))) >>> 0);
      } else {
        sequence_length = (((6) & 0xFF)) & 0xFF;
        codepoint = ((((first_code) >>> 0)) >>> 0);
      }
      if (((codepoint) >>> 0) < ((128) >>> 0)) {
        utf8_length = (((1) & 0xFF)) & 0xFF;
      } else {
        if (((codepoint) >>> 0) < ((2048) >>> 0)) {
          utf8_length = (((2) & 0xFF)) & 0xFF;
          first_byte_mark = (((192) & 0xFF)) & 0xFF;
        } else {
          if (((codepoint) >>> 0) < ((65536) >>> 0)) {
            utf8_length = (((3) & 0xFF)) & 0xFF;
            first_byte_mark = (((224) & 0xFF)) & 0xFF;
          } else {
            if (((codepoint) >>> 0) <= ((1114111) >>> 0)) {
              utf8_length = (((4) & 0xFF)) & 0xFF;
              first_byte_mark = (((240) & 0xFF)) & 0xFF;
            } else {
              _state = 1; continue _sm; /* goto fail */
            }
          }
        }
      }
      for (utf8_position = (((Math.trunc(+((i32(((utf8_length) & 0xFF) - 1))))) & 0xFF)) & 0xFF; ((utf8_position) & 0xFF) > 0; (() => { const _t = utf8_position; utf8_position = u32(utf8_position - 1); return _t; })()) {
        (output_pointer.value).buf[((output_pointer.value).off ?? 0) + ((utf8_position) & 0xFF)] = (((Math.trunc(+(((((((codepoint) >>> 0) | ((128) >>> 0)) >>> 0) & ((191) >>> 0)) >>> 0)))) & 0xFF)) & 0xFF;
        codepoint = (codepoint >>> 6) >>> 0;
      }
      if (((utf8_length) & 0xFF) > 1) {
        (output_pointer.value).buf[((output_pointer.value).off ?? 0) + 0] = (((Math.trunc(+(((((((codepoint) >>> 0) | ((((first_byte_mark) & 0xFF)) >>> 0)) >>> 0) & ((255) >>> 0)) >>> 0)))) & 0xFF)) & 0xFF;
      } else {
        (output_pointer.value).buf[((output_pointer.value).off ?? 0) + 0] = (((Math.trunc(+(((((codepoint) >>> 0) & ((127) >>> 0)) >>> 0)))) & 0xFF)) & 0xFF;
      }
      output_pointer.value = cptr_offset(output_pointer.value, ((utf8_length) & 0xFF));
      return ((sequence_length) & 0xFF);
    case 1: /* fail */
      return ((0) & 0xFF);
      break _sm;
    }
  }
}

function parse_string(item: cJSON | null, input_buffer: parse_buffer | null): cJSON_bool {
  let input_pointer: any | null = null;
  let input_end: any | null = null;
  let output_pointer: any | null = null;
  let output: any | null = null;
  let allocation_length: number = 0;
  let skipped_bytes: number = 0;
  let sequence_length: number = 0;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      input_pointer = cptr_offset((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))), 1); /* &ref */
      input_end = cptr_offset((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))), 1); /* &ref */
      output_pointer = null; /* &ref */
      output = null; /* &ref */
      if ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) != 34) {
        _state = 1; continue _sm; /* goto fail */
      }
      allocation_length = ((0) >>> 0);
      skipped_bytes = ((0) >>> 0);
      while ((((((Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(input_end, (__struct_ptr_at(input_buffer, 0)).content))))) >>> 0) < (((__struct_ptr_at(input_buffer, 0)).length) >>> 0)) && (((input_end.buf[input_end.off]) & 0xFF) != 34)) ? 1 : 0)) {
        if (((input_end.buf[(input_end.off ?? 0) + 0]) & 0xFF) == 92) {
          if (((Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(cptr_offset(input_end, 1), (__struct_ptr_at(input_buffer, 0)).content))))) >>> 0) >= (((__struct_ptr_at(input_buffer, 0)).length) >>> 0)) {
            _state = 1; continue _sm; /* goto fail */
          }
          (() => { const _t = skipped_bytes; skipped_bytes = u32(skipped_bytes + 1); return _t; })();
          input_end.off++;
        }
        input_end.off++;
      }
      if ((((((Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(input_end, (__struct_ptr_at(input_buffer, 0)).content))))) >>> 0) >= (((__struct_ptr_at(input_buffer, 0)).length) >>> 0)) || (((input_end.buf[input_end.off]) & 0xFF) != 34)) ? 1 : 0)) {
        _state = 1; continue _sm; /* goto fail */
      }
      allocation_length = ((Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(input_end, (cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0)))))))) >>> 0) - ((skipped_bytes) >>> 0);
      output = ((__struct_ptr_at(input_buffer, 0)).hooks.allocate(((allocation_length) >>> 0) + 1));
      if (cptr_eq(output, (null))) {
        _state = 1; continue _sm; /* goto fail */
      }
      output_pointer = cptr_clone(output);
      while (((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(input_pointer, input_end)) {
        if (((input_pointer.buf[input_pointer.off]) & 0xFF) != 92) {
          (output_pointer.buf[output_pointer.off++]) = ((((input_pointer.buf[input_pointer.off++])) & 0xFF)) & 0xFF;
        } else {
          sequence_length = ((2) & 0xFF);
          if ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(input_end, input_pointer)) < 1) {
            _state = 1; continue _sm; /* goto fail */
          }
          switch (((input_pointer.buf[(input_pointer.off ?? 0) + 1]) & 0xFF)) {
            case 98:
            {
              (output_pointer.buf[output_pointer.off++]) = (((8) & 0xFF)) & 0xFF;
            break;
            }
            case 102:
            {
              (output_pointer.buf[output_pointer.off++]) = (((12) & 0xFF)) & 0xFF;
            break;
            }
            case 110:
            {
              (output_pointer.buf[output_pointer.off++]) = (((10) & 0xFF)) & 0xFF;
            break;
            }
            case 114:
            {
              (output_pointer.buf[output_pointer.off++]) = (((13) & 0xFF)) & 0xFF;
            break;
            }
            case 116:
            {
              (output_pointer.buf[output_pointer.off++]) = (((9) & 0xFF)) & 0xFF;
            break;
            }
            case 34:
              case 92:
                case 47:
                {
                  (output_pointer.buf[output_pointer.off++]) = (((input_pointer.buf[(input_pointer.off ?? 0) + 1]) & 0xFF)) & 0xFF;
            break;
                }
            case 117:
            {
              sequence_length = ((() => { const _box0 = { value: output_pointer }; const _r = utf16_literal_to_utf8(cptr_clone(input_pointer), cptr_clone(input_end), _box0); output_pointer = _box0.value; return _r; })()) & 0xFF;
            if (((sequence_length) & 0xFF) == 0) {
              _state = 1; continue _sm; /* goto fail */
            }
            break;
            }
            default:
            {
              _state = 1; continue _sm; /* goto fail */
            }
          }
          input_pointer = cptr_offset(input_pointer, ((sequence_length) & 0xFF));
        }
      }
      output_pointer.buf[output_pointer.off] = (((0) & 0xFF)) & 0xFF;
      (__struct_ptr_at(item, 0)).type = (((1 << 4) | 0));
      (__struct_ptr_at(item, 0)).valuestring = (output);
      (__struct_ptr_at(input_buffer, 0)).offset = ((Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(input_end, (__struct_ptr_at(input_buffer, 0)).content))))) >>> 0);
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset + 1); return _t; })();
      return (Math.trunc(+(1)));
    case 1: /* fail */
      if (!cptr_eq(output, (null))) {
        (__struct_ptr_at(input_buffer, 0)).hooks.deallocate(output);
        output = null;
      }
      if (!cptr_eq(input_pointer, (null))) {
        (__struct_ptr_at(input_buffer, 0)).offset = ((Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(input_pointer, (__struct_ptr_at(input_buffer, 0)).content))))) >>> 0);
      }
      return (Math.trunc(+(0)));
      break _sm;
    }
  }
}

function print_string_ptr(input: any | null, output_buffer: printbuffer | null): cJSON_bool {
  let input_pointer = null; /* &ref */
  let output = null; /* &ref */
  let output_pointer = null; /* &ref */
  let output_length = ((0) >>> 0);
  let escape_characters = ((0) >>> 0);
  if (output_buffer == (null)) {
    return (Math.trunc(+(0)));
  }
  if (cptr_eq(input, (null))) {
    output = ensure(output_buffer, 3);
    if (cptr_eq(output, (null))) {
      return (Math.trunc(+(0)));
    }
    strcpy((output), "\"\"");
    return (Math.trunc(+(1)));
  }
  for (input_pointer = cptr_clone(input); ((input_pointer.buf[input_pointer.off]) & 0xFF); input_pointer.off++) {
    switch (((input_pointer.buf[input_pointer.off]) & 0xFF)) {
      case 34:
        case 92:
          case 8:
            case 12:
              case 10:
                case 13:
                  case 9:
                  {
                    (() => { const _t = escape_characters; escape_characters = u32(escape_characters + 1); return _t; })();
      break;
                  }
      default:
        {
          if (((input_pointer.buf[input_pointer.off]) & 0xFF) < 32) {
            escape_characters += ((5) >>> 0);
          }
        }
      break;
    }
  }
  output_length = ((Math.trunc(+((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(input_pointer, input))))) >>> 0) + ((escape_characters) >>> 0);
  output = ensure(output_buffer, ((output_length) >>> 0) + 3);
  if (cptr_eq(output, (null))) {
    return (Math.trunc(+(0)));
  }
  if (((escape_characters) >>> 0) == ((0) >>> 0)) {
    output.buf[(output.off ?? 0) + 0] = (((34) & 0xFF)) & 0xFF;
    memcpy(cptr_offset(output, 1), input, ((output_length) >>> 0));
    output.buf[(output.off ?? 0) + ((output_length) >>> 0) + ((1) >>> 0)] = (((34) & 0xFF)) & 0xFF;
    output.buf[(output.off ?? 0) + ((output_length) >>> 0) + ((2) >>> 0)] = (((0) & 0xFF)) & 0xFF;
    return (Math.trunc(+(1)));
  }
  output.buf[(output.off ?? 0) + 0] = (((34) & 0xFF)) & 0xFF;
  output_pointer = cptr_offset(output, 1);
  for (input_pointer = cptr_clone(input); ((input_pointer.buf[input_pointer.off]) & 0xFF) != 0; (input_pointer.off++), output_pointer.off++) {
    if ((((((((input_pointer.buf[input_pointer.off]) & 0xFF) > 31) && (((input_pointer.buf[input_pointer.off]) & 0xFF) != 34)) ? 1 : 0) && (((input_pointer.buf[input_pointer.off]) & 0xFF) != 92)) ? 1 : 0)) {
      output_pointer.buf[output_pointer.off] = (((input_pointer.buf[input_pointer.off]) & 0xFF)) & 0xFF;
    } else {
      (output_pointer.buf[output_pointer.off++]) = (((92) & 0xFF)) & 0xFF;
      switch (((input_pointer.buf[input_pointer.off]) & 0xFF)) {
        case 92:
        {
          output_pointer.buf[output_pointer.off] = (((92) & 0xFF)) & 0xFF;
        break;
        }
        case 34:
        {
          output_pointer.buf[output_pointer.off] = (((34) & 0xFF)) & 0xFF;
        break;
        }
        case 8:
        {
          output_pointer.buf[output_pointer.off] = (((98) & 0xFF)) & 0xFF;
        break;
        }
        case 12:
        {
          output_pointer.buf[output_pointer.off] = (((102) & 0xFF)) & 0xFF;
        break;
        }
        case 10:
        {
          output_pointer.buf[output_pointer.off] = (((110) & 0xFF)) & 0xFF;
        break;
        }
        case 13:
        {
          output_pointer.buf[output_pointer.off] = (((114) & 0xFF)) & 0xFF;
        break;
        }
        case 9:
        {
          output_pointer.buf[output_pointer.off] = (((116) & 0xFF)) & 0xFF;
        break;
        }
        default:
        {
          (() => { const __s = printf_format("u%04x", ((input_pointer.buf[input_pointer.off]) & 0xFF)); strcpy((output_pointer), __s); return __s.length; })();
        output_pointer = cptr_offset(output_pointer, 4);
        break;
        }
      }
    }
  }
  output.buf[(output.off ?? 0) + ((output_length) >>> 0) + ((1) >>> 0)] = (((34) & 0xFF)) & 0xFF;
  output.buf[(output.off ?? 0) + ((output_length) >>> 0) + ((2) >>> 0)] = (((0) & 0xFF)) & 0xFF;
  return (Math.trunc(+(1)));
}

function print_string(item: cJSON | null, p: printbuffer | null): cJSON_bool {
  return print_string_ptr(cptr_clone(((__struct_ptr_at(item, 0)).valuestring)), p);
}

function buffer_skip_whitespace(buffer: parse_buffer | null): parse_buffer | null {
  if ((((buffer == (null)) || (cptr_eq((__struct_ptr_at(buffer, 0)).content, (null)))) ? 1 : 0)) {
    return null;
  }
  if ((!((((buffer != (null)) && (((((__struct_ptr_at((buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((buffer), 0)).length) >>> 0))) ? 1 : 0)))) {
    return buffer;
  }
  while (((((((buffer != (null)) && (((((__struct_ptr_at((buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((buffer), 0)).length) >>> 0))) ? 1 : 0)) && ((((cptr_offset((__struct_ptr_at((buffer), 0)).content, (((__struct_ptr_at((buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((buffer), 0)).content, (((__struct_ptr_at((buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) <= 32)) ? 1 : 0)) {
    (() => { const _t = (__struct_ptr_at(buffer, 0)).offset; (__struct_ptr_at(buffer, 0)).offset = u32((__struct_ptr_at(buffer, 0)).offset + 1); return _t; })();
  }
  if ((((__struct_ptr_at(buffer, 0)).offset) >>> 0) == (((__struct_ptr_at(buffer, 0)).length) >>> 0)) {
    (() => { const _t = (__struct_ptr_at(buffer, 0)).offset; (__struct_ptr_at(buffer, 0)).offset = u32((__struct_ptr_at(buffer, 0)).offset - 1); return _t; })();
  }
  return buffer;
}

function skip_utf8_bom(buffer: parse_buffer | null): parse_buffer | null {
  if ((((((buffer == (null)) || (cptr_eq((__struct_ptr_at(buffer, 0)).content, (null)))) ? 1 : 0) || ((((__struct_ptr_at(buffer, 0)).offset) >>> 0) != ((0) >>> 0))) ? 1 : 0)) {
    return null;
  }
  if (((((((buffer != (null)) && (((((__struct_ptr_at((buffer), 0)).offset) >>> 0) + ((4) >>> 0)) < (((__struct_ptr_at((buffer), 0)).length) >>> 0))) ? 1 : 0)) && (strncmp(((cptr_offset((__struct_ptr_at((buffer), 0)).content, (((__struct_ptr_at((buffer), 0)).offset) >>> 0)))), "\xEF\xBB\xBF", 3) == 0)) ? 1 : 0)) {
    (__struct_ptr_at(buffer, 0)).offset += ((3) >>> 0);
  }
  return buffer;
}

export function cJSON_ParseWithOpts(value: string, return_parse_end: { value: string }, require_null_terminated: cJSON_bool): cJSON | null {
  let buffer_length = 0;
  if (cptr_eq((null), value)) {
    return null;
  }
  buffer_length = strlen(cptr_clone(value)) + 1;
  return cJSON_ParseWithLengthOpts(cptr_clone(value), ((buffer_length) >>> 0), return_parse_end, require_null_terminated);
}

export function cJSON_ParseWithLengthOpts(value: string, buffer_length: number, return_parse_end: { value: string }, require_null_terminated: cJSON_bool): cJSON | null {
  let buffer: parse_buffer = new parse_buffer();
  let item: cJSON | null = null;
  let local_error: error = new error();
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      buffer = Object.assign(new parse_buffer(), { content: null, length: ((0) >>> 0), offset: ((0) >>> 0), depth: ((0) >>> 0), hooks: Object.assign(new internal_hooks(), { allocate: null, deallocate: null, reallocate: null }) });
      item = null; /* &ref */
      global_error.json = null;
      global_error.position = ((0) >>> 0);
      if (((cptr_eq(value, (null)) || ((0) >>> 0) == ((buffer_length) >>> 0)) ? 1 : 0)) {
        _state = 1; continue _sm; /* goto fail */
      }
      buffer.content = (value);
      buffer.length = ((buffer_length) >>> 0);
      buffer.offset = ((0) >>> 0);
      Object.assign(buffer.hooks, global_hooks);
      item = cJSON_New_Item(global_hooks);
      if (item == (null)) {
        _state = 1; continue _sm; /* goto fail */
      }
      if (!parse_value(item, buffer_skip_whitespace(skip_utf8_bom(buffer)))) {
        _state = 1; continue _sm; /* goto fail */
      }
      if (require_null_terminated) {
        buffer_skip_whitespace(buffer);
        if ((((((buffer.offset) >>> 0) >= ((buffer.length) >>> 0)) || (((cptr_offset((buffer).content, (((buffer).offset) >>> 0))).buf[((cptr_offset((buffer).content, (((buffer).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) != 0) ? 1 : 0)) {
          _state = 1; continue _sm; /* goto fail */
        }
      }
      if (return_parse_end) {
        return_parse_end.value = ((cptr_offset((buffer).content, (((buffer).offset) >>> 0))));
      }
      return item;
    case 1: /* fail */
      if (item != (null)) {
        cJSON_Delete(item);
      }
      if (!cptr_eq(value, (null))) {
        local_error = new error();
        local_error.json = (value);
        local_error.position = ((0) >>> 0);
        if (((buffer.offset) >>> 0) < ((buffer.length) >>> 0)) {
          local_error.position = ((buffer.offset) >>> 0);
        } else {
          if (((buffer.length) >>> 0) > ((0) >>> 0)) {
            local_error.position = ((buffer.length) >>> 0) - ((1) >>> 0);
          }
        }
        if (!cptr_eq(return_parse_end, (null))) {
          return_parse_end.value = cptr_offset((local_error.json), ((local_error.position) >>> 0));
        }
        Object.assign(global_error, local_error);
      }
      return null;
      break _sm;
    }
  }
}

export function cJSON_Parse(value: string): cJSON | null {
  return cJSON_ParseWithOpts(cptr_clone(value), { value: null }, 0);
}

export function cJSON_ParseWithLength(value: string, buffer_length: number): cJSON | null {
  return cJSON_ParseWithLengthOpts(cptr_clone(value), ((buffer_length) >>> 0), { value: null }, 0);
}

function print(item: cJSON | null, format: cJSON_bool, hooks: internal_hooks | null): any | null {
  let default_buffer_size: number = 0;
  let buffer: printbuffer[] = new printbuffer();
  let printed: any | null = null;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      buffer = new printbuffer();
      printed = null; /* &ref */
      memset(buffer, 0, 56);
      (__struct_ptr_at(buffer, 0)).buffer = ((__struct_ptr_at(hooks, 0)).allocate(((_static_default_buffer_size_1) >>> 0)));
      (__struct_ptr_at(buffer, 0)).length = ((_static_default_buffer_size_1) >>> 0);
      (__struct_ptr_at(buffer, 0)).format = format;
      Object.assign((__struct_ptr_at(buffer, 0)).hooks, hooks);
      if (cptr_eq((__struct_ptr_at(buffer, 0)).buffer, (null))) {
        _state = 1; continue _sm; /* goto fail */
      }
      if (!print_value(item, buffer)) {
        _state = 1; continue _sm; /* goto fail */
      }
      update_offset(buffer);
      if ((__struct_ptr_at(hooks, 0)).reallocate != (null)) {
        printed = ((__struct_ptr_at(hooks, 0)).reallocate((__struct_ptr_at(buffer, 0)).buffer, (((__struct_ptr_at(buffer, 0)).offset) >>> 0) + ((1) >>> 0)));
        if (cptr_eq(printed, (null))) {
          _state = 1; continue _sm; /* goto fail */
        }
        (__struct_ptr_at(buffer, 0)).buffer = null;
      } else {
        printed = ((__struct_ptr_at(hooks, 0)).allocate((((__struct_ptr_at(buffer, 0)).offset) >>> 0) + ((1) >>> 0)));
        if (cptr_eq(printed, (null))) {
          _state = 1; continue _sm; /* goto fail */
        }
        memcpy(printed, (__struct_ptr_at(buffer, 0)).buffer, (((((((__struct_ptr_at(buffer, 0)).length)) >>> 0) < ((((__struct_ptr_at(buffer, 0)).offset) >>> 0) + ((1) >>> 0))) ? ((((__struct_ptr_at(buffer, 0)).length)) >>> 0) : ((((__struct_ptr_at(buffer, 0)).offset) >>> 0) + ((1) >>> 0)))));
        printed.buf[(printed.off ?? 0) + (((__struct_ptr_at(buffer, 0)).offset) >>> 0)] = (((0) & 0xFF)) & 0xFF;
        (__struct_ptr_at(hooks, 0)).deallocate((__struct_ptr_at(buffer, 0)).buffer);
        (__struct_ptr_at(buffer, 0)).buffer = null;
      }
      return cptr_clone(printed);
    case 1: /* fail */
      if (!cptr_eq((__struct_ptr_at(buffer, 0)).buffer, (null))) {
        (__struct_ptr_at(hooks, 0)).deallocate((__struct_ptr_at(buffer, 0)).buffer);
        (__struct_ptr_at(buffer, 0)).buffer = null;
      }
      if (!cptr_eq(printed, (null))) {
        (__struct_ptr_at(hooks, 0)).deallocate(printed);
        printed = null;
      }
      return null;
      break _sm;
    }
  }
}

export function cJSON_Print(item: cJSON | null): string {
  return cptr_clone((print(item, (Math.trunc(+(1))), global_hooks)));
}

export function cJSON_PrintUnformatted(item: cJSON | null): string {
  return cptr_clone((print(item, (Math.trunc(+(0))), global_hooks)));
}

export function cJSON_PrintBuffered(item: cJSON | null, prebuffer: number, fmt: cJSON_bool): string {
  let p = Object.assign(new printbuffer(), { buffer: null, length: ((0) >>> 0), offset: ((0) >>> 0), depth: ((0) >>> 0), noalloc: 0, format: 0, hooks: Object.assign(new internal_hooks(), { allocate: null, deallocate: null, reallocate: null }) });
  if (prebuffer < 0) {
    return null;
  }
  p.buffer = (global_hooks.allocate(((Math.trunc(+(prebuffer))) >>> 0)));
  if (!p.buffer) {
    return null;
  }
  p.length = ((Math.trunc(+(prebuffer))) >>> 0);
  p.offset = ((0) >>> 0);
  p.noalloc = (Math.trunc(+(0)));
  p.format = fmt;
  Object.assign(p.hooks, global_hooks);
  if (!print_value(item, p)) {
    global_hooks.deallocate(p.buffer);
    p.buffer = null;
    return null;
  }
  return cptr_clone((p.buffer));
}

export function cJSON_PrintPreallocated(item: cJSON | null, buffer: string, length: number, format: cJSON_bool): cJSON_bool {
  let p = Object.assign(new printbuffer(), { buffer: null, length: ((0) >>> 0), offset: ((0) >>> 0), depth: ((0) >>> 0), noalloc: 0, format: 0, hooks: Object.assign(new internal_hooks(), { allocate: null, deallocate: null, reallocate: null }) });
  if ((((length < 0) || (cptr_eq(buffer, (null)))) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  p.buffer = (buffer);
  p.length = ((Math.trunc(+(length))) >>> 0);
  p.offset = ((0) >>> 0);
  p.noalloc = (Math.trunc(+(1)));
  p.format = format;
  Object.assign(p.hooks, global_hooks);
  return print_value(item, p);
}

function parse_value(item: cJSON | null, input_buffer: parse_buffer | null): cJSON_bool {
  if ((((input_buffer == (null)) || (cptr_eq((__struct_ptr_at(input_buffer, 0)).content, (null)))) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  if (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((4) >>> 0)) <= (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && (strncmp(((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0)))), "null", 4) == 0)) ? 1 : 0)) {
    (__struct_ptr_at(item, 0)).type = (((1 << 2) | 0));
    (__struct_ptr_at(input_buffer, 0)).offset += ((4) >>> 0);
    return (Math.trunc(+(1)));
  }
  if (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((5) >>> 0)) <= (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && (strncmp(((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0)))), "false", 5) == 0)) ? 1 : 0)) {
    (__struct_ptr_at(item, 0)).type = (((1 << 0) | 0));
    (__struct_ptr_at(input_buffer, 0)).offset += ((5) >>> 0);
    return (Math.trunc(+(1)));
  }
  if (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((4) >>> 0)) <= (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && (strncmp(((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0)))), "true", 4) == 0)) ? 1 : 0)) {
    (__struct_ptr_at(item, 0)).type = (((1 << 1) | 0));
    (__struct_ptr_at(item, 0)).valueint = 1;
    (__struct_ptr_at(input_buffer, 0)).offset += ((4) >>> 0);
    return (Math.trunc(+(1)));
  }
  if (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) == 34)) ? 1 : 0)) {
    return parse_string(item, input_buffer);
  }
  if (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && (((((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) == 45) || (((((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) >= 48) && ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) <= 57)) ? 1 : 0))) ? 1 : 0))) ? 1 : 0)) {
    return parse_number(item, input_buffer);
  }
  if (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) == 91)) ? 1 : 0)) {
    return parse_array(item, input_buffer);
  }
  if (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) == 123)) ? 1 : 0)) {
    return parse_object(item, input_buffer);
  }
  return (Math.trunc(+(0)));
}

function print_value(item: cJSON | null, output_buffer: printbuffer | null): cJSON_bool {
  let output = null; /* &ref */
  if ((((item == (null)) || (output_buffer == (null))) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  switch (((__struct_ptr_at(item, 0)).type) & 255) {
    case (((1 << 2) | 0)):
    {
      output = ensure(output_buffer, ((5) >>> 0));
    if (cptr_eq(output, (null))) {
      return (Math.trunc(+(0)));
    }
    strcpy((output), "null");
    return (Math.trunc(+(1)));
    }
    case (((1 << 0) | 0)):
    {
      output = ensure(output_buffer, ((6) >>> 0));
    if (cptr_eq(output, (null))) {
      return (Math.trunc(+(0)));
    }
    strcpy((output), "false");
    return (Math.trunc(+(1)));
    }
    case (((1 << 1) | 0)):
    {
      output = ensure(output_buffer, ((5) >>> 0));
    if (cptr_eq(output, (null))) {
      return (Math.trunc(+(0)));
    }
    strcpy((output), "true");
    return (Math.trunc(+(1)));
    }
    case (((1 << 3) | 0)):
    {
      return print_number(item, output_buffer);
    }
    case (((1 << 7) | 0)):
      {
        let raw_length = ((0) >>> 0);
        if (cptr_eq((__struct_ptr_at(item, 0)).valuestring, (null))) {
          return (Math.trunc(+(0)));
        }
        raw_length = strlen(cptr_clone((__struct_ptr_at(item, 0)).valuestring)) + 1;
        output = ensure(output_buffer, ((raw_length) >>> 0));
        if (cptr_eq(output, (null))) {
          return (Math.trunc(+(0)));
        }
        memcpy(output, (__struct_ptr_at(item, 0)).valuestring, ((raw_length) >>> 0));
        return (Math.trunc(+(1)));
      }
    case (((1 << 4) | 0)):
    {
      return print_string(item, output_buffer);
    }
    case (((1 << 5) | 0)):
    {
      return print_array(item, output_buffer);
    }
    case (((1 << 6) | 0)):
    {
      return print_object(item, output_buffer);
    }
    default:
    {
      return (Math.trunc(+(0)));
    }
  }
}

function parse_array(item: cJSON | null, input_buffer: parse_buffer | null): cJSON_bool {
  let head: cJSON | null = null;
  let current_item: cJSON | null = null;
  let new_item: cJSON | null = null;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      head = null; /* &ref */
      current_item = null; /* &ref */
      if ((((__struct_ptr_at(input_buffer, 0)).depth) >>> 0) >= ((1000) >>> 0)) {
        return (Math.trunc(+(0)));
      }
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).depth; (__struct_ptr_at(input_buffer, 0)).depth = u32((__struct_ptr_at(input_buffer, 0)).depth + 1); return _t; })();
      if ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) != 91) {
        _state = 2; continue _sm; /* goto fail */
      }
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset + 1); return _t; })();
      buffer_skip_whitespace(input_buffer);
      if (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) == 93)) ? 1 : 0)) {
        _state = 1; continue _sm; /* goto success */
      }
      if ((!((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)))) {
        (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset - 1); return _t; })();
        _state = 2; continue _sm; /* goto fail */
      }
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset - 1); return _t; })();
      do {
        new_item = cJSON_New_Item(__field_ref_aggregate(() => (__struct_ptr_at(input_buffer, 0)), "parse_buffer", "hooks", 32)); /* &ref */
        if (new_item == (null)) {
          _state = 2; continue _sm; /* goto fail */
        }
        if (head == (null)) {
          current_item = head = new_item;
        } else {
          (__struct_ptr_at(current_item, 0)).next = new_item;
          (__struct_ptr_at(new_item, 0)).prev = current_item;
          current_item = new_item;
        }
        (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset + 1); return _t; })();
        buffer_skip_whitespace(input_buffer);
        if (!parse_value(current_item, input_buffer)) {
          _state = 2; continue _sm; /* goto fail */
        }
        buffer_skip_whitespace(input_buffer);
      } while (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) == 44)) ? 1 : 0));
      if ((((!((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0))) || (((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) != 93) ? 1 : 0)) {
        _state = 2; continue _sm; /* goto fail */
      }
    case 1: /* success */
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).depth; (__struct_ptr_at(input_buffer, 0)).depth = u32((__struct_ptr_at(input_buffer, 0)).depth - 1); return _t; })();
      if (head != (null)) {
        (__struct_ptr_at(head, 0)).prev = current_item;
      }
      (__struct_ptr_at(item, 0)).type = (((1 << 5) | 0));
      (__struct_ptr_at(item, 0)).child = head;
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset + 1); return _t; })();
      return (Math.trunc(+(1)));
    case 2: /* fail */
      if (head != (null)) {
        cJSON_Delete(head);
      }
      return (Math.trunc(+(0)));
      break _sm;
    }
  }
}

function print_array(item: cJSON | null, output_buffer: printbuffer | null): cJSON_bool {
  let output_pointer = null; /* &ref */
  let length = ((0) >>> 0);
  let current_element = (__struct_ptr_at(item, 0)).child; /* &ref */
  if (output_buffer == (null)) {
    return (Math.trunc(+(0)));
  }
  if ((((__struct_ptr_at(output_buffer, 0)).depth) >>> 0) >= ((1000) >>> 0)) {
    return (Math.trunc(+(0)));
  }
  output_pointer = ensure(output_buffer, ((1) >>> 0));
  if (cptr_eq(output_pointer, (null))) {
    return (Math.trunc(+(0)));
  }
  output_pointer.buf[output_pointer.off] = (((91) & 0xFF)) & 0xFF;
  (() => { const _t = (__struct_ptr_at(output_buffer, 0)).offset; (__struct_ptr_at(output_buffer, 0)).offset = u32((__struct_ptr_at(output_buffer, 0)).offset + 1); return _t; })();
  (() => { const _t = (__struct_ptr_at(output_buffer, 0)).depth; (__struct_ptr_at(output_buffer, 0)).depth = u32((__struct_ptr_at(output_buffer, 0)).depth + 1); return _t; })();
  while (current_element != (null)) {
    if (!print_value(current_element, output_buffer)) {
      return (Math.trunc(+(0)));
    }
    update_offset(output_buffer);
    if ((__struct_ptr_at(current_element, 0)).next) {
      length = ((Math.trunc(+((((__struct_ptr_at(output_buffer, 0)).format ? 2 : 1))))) >>> 0);
      output_pointer = ensure(output_buffer, ((length) >>> 0) + ((1) >>> 0));
      if (cptr_eq(output_pointer, (null))) {
        return (Math.trunc(+(0)));
      }
      (output_pointer.buf[output_pointer.off++]) = (((44) & 0xFF)) & 0xFF;
      if ((__struct_ptr_at(output_buffer, 0)).format) {
        (output_pointer.buf[output_pointer.off++]) = (((32) & 0xFF)) & 0xFF;
      }
      output_pointer.buf[output_pointer.off] = (((0) & 0xFF)) & 0xFF;
      (__struct_ptr_at(output_buffer, 0)).offset += ((length) >>> 0);
    }
    current_element = (__struct_ptr_at(current_element, 0)).next;
  }
  output_pointer = ensure(output_buffer, ((2) >>> 0));
  if (cptr_eq(output_pointer, (null))) {
    return (Math.trunc(+(0)));
  }
  (output_pointer.buf[output_pointer.off++]) = (((93) & 0xFF)) & 0xFF;
  output_pointer.buf[output_pointer.off] = (((0) & 0xFF)) & 0xFF;
  (() => { const _t = (__struct_ptr_at(output_buffer, 0)).depth; (__struct_ptr_at(output_buffer, 0)).depth = u32((__struct_ptr_at(output_buffer, 0)).depth - 1); return _t; })();
  return (Math.trunc(+(1)));
}

function parse_object(item: cJSON | null, input_buffer: parse_buffer | null): cJSON_bool {
  let head: cJSON | null = null;
  let current_item: cJSON | null = null;
  let new_item: cJSON | null = null;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      head = null; /* &ref */
      current_item = null; /* &ref */
      if ((((__struct_ptr_at(input_buffer, 0)).depth) >>> 0) >= ((1000) >>> 0)) {
        return (Math.trunc(+(0)));
      }
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).depth; (__struct_ptr_at(input_buffer, 0)).depth = u32((__struct_ptr_at(input_buffer, 0)).depth + 1); return _t; })();
      if ((((!((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0))) || ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) != 123)) ? 1 : 0)) {
        _state = 2; continue _sm; /* goto fail */
      }
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset + 1); return _t; })();
      buffer_skip_whitespace(input_buffer);
      if (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) == 125)) ? 1 : 0)) {
        _state = 1; continue _sm; /* goto success */
      }
      if ((!((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)))) {
        (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset - 1); return _t; })();
        _state = 2; continue _sm; /* goto fail */
      }
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset - 1); return _t; })();
      do {
        new_item = cJSON_New_Item(__field_ref_aggregate(() => (__struct_ptr_at(input_buffer, 0)), "parse_buffer", "hooks", 32)); /* &ref */
        if (new_item == (null)) {
          _state = 2; continue _sm; /* goto fail */
        }
        if (head == (null)) {
          current_item = head = new_item;
        } else {
          (__struct_ptr_at(current_item, 0)).next = new_item;
          (__struct_ptr_at(new_item, 0)).prev = current_item;
          current_item = new_item;
        }
        if ((!((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((1) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)))) {
          _state = 2; continue _sm; /* goto fail */
        }
        (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset + 1); return _t; })();
        buffer_skip_whitespace(input_buffer);
        if (!parse_string(current_item, input_buffer)) {
          _state = 2; continue _sm; /* goto fail */
        }
        buffer_skip_whitespace(input_buffer);
        (__struct_ptr_at(current_item, 0)).string = (__struct_ptr_at(current_item, 0)).valuestring;
        (__struct_ptr_at(current_item, 0)).valuestring = null;
        if ((((!((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0))) || ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) != 58)) ? 1 : 0)) {
          _state = 2; continue _sm; /* goto fail */
        }
        (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset + 1); return _t; })();
        buffer_skip_whitespace(input_buffer);
        if (!parse_value(current_item, input_buffer)) {
          _state = 2; continue _sm; /* goto fail */
        }
        buffer_skip_whitespace(input_buffer);
      } while (((((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0)) && ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) == 44)) ? 1 : 0));
      if ((((!((((input_buffer != (null)) && (((((__struct_ptr_at((input_buffer), 0)).offset) >>> 0) + ((0) >>> 0)) < (((__struct_ptr_at((input_buffer), 0)).length) >>> 0))) ? 1 : 0))) || ((((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).buf[((cptr_offset((__struct_ptr_at((input_buffer), 0)).content, (((__struct_ptr_at((input_buffer), 0)).offset) >>> 0))).off ?? 0) + 0]) & 0xFF) != 125)) ? 1 : 0)) {
        _state = 2; continue _sm; /* goto fail */
      }
    case 1: /* success */
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).depth; (__struct_ptr_at(input_buffer, 0)).depth = u32((__struct_ptr_at(input_buffer, 0)).depth - 1); return _t; })();
      if (head != (null)) {
        (__struct_ptr_at(head, 0)).prev = current_item;
      }
      (__struct_ptr_at(item, 0)).type = (((1 << 6) | 0));
      (__struct_ptr_at(item, 0)).child = head;
      (() => { const _t = (__struct_ptr_at(input_buffer, 0)).offset; (__struct_ptr_at(input_buffer, 0)).offset = u32((__struct_ptr_at(input_buffer, 0)).offset + 1); return _t; })();
      return (Math.trunc(+(1)));
    case 2: /* fail */
      if (head != (null)) {
        cJSON_Delete(head);
      }
      return (Math.trunc(+(0)));
      break _sm;
    }
  }
}

function print_object(item: cJSON | null, output_buffer: printbuffer | null): cJSON_bool {
  let output_pointer = null; /* &ref */
  let length = ((0) >>> 0);
  let current_item = (__struct_ptr_at(item, 0)).child; /* &ref */
  if (output_buffer == (null)) {
    return (Math.trunc(+(0)));
  }
  if ((((__struct_ptr_at(output_buffer, 0)).depth) >>> 0) >= ((1000) >>> 0)) {
    return (Math.trunc(+(0)));
  }
  length = ((Math.trunc(+((((__struct_ptr_at(output_buffer, 0)).format ? 2 : 1))))) >>> 0);
  output_pointer = ensure(output_buffer, ((length) >>> 0) + ((1) >>> 0));
  if (cptr_eq(output_pointer, (null))) {
    return (Math.trunc(+(0)));
  }
  (output_pointer.buf[output_pointer.off++]) = (((123) & 0xFF)) & 0xFF;
  (() => { const _t = (__struct_ptr_at(output_buffer, 0)).depth; (__struct_ptr_at(output_buffer, 0)).depth = u32((__struct_ptr_at(output_buffer, 0)).depth + 1); return _t; })();
  if ((__struct_ptr_at(output_buffer, 0)).format) {
    (output_pointer.buf[output_pointer.off++]) = (((10) & 0xFF)) & 0xFF;
  }
  (__struct_ptr_at(output_buffer, 0)).offset += ((length) >>> 0);
  while (current_item) {
    if ((__struct_ptr_at(output_buffer, 0)).format) {
      let i = 0;
      output_pointer = ensure(output_buffer, (((__struct_ptr_at(output_buffer, 0)).depth) >>> 0));
      if (cptr_eq(output_pointer, (null))) {
        return (Math.trunc(+(0)));
      }
      for (i = ((0) >>> 0); ((i) >>> 0) < (((__struct_ptr_at(output_buffer, 0)).depth) >>> 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
        (output_pointer.buf[output_pointer.off++]) = (((9) & 0xFF)) & 0xFF;
      }
      (__struct_ptr_at(output_buffer, 0)).offset += (((__struct_ptr_at(output_buffer, 0)).depth) >>> 0);
    }
    if (!print_string_ptr(cptr_clone(((__struct_ptr_at(current_item, 0)).string)), output_buffer)) {
      return (Math.trunc(+(0)));
    }
    update_offset(output_buffer);
    length = ((Math.trunc(+((((__struct_ptr_at(output_buffer, 0)).format ? 2 : 1))))) >>> 0);
    output_pointer = ensure(output_buffer, ((length) >>> 0));
    if (cptr_eq(output_pointer, (null))) {
      return (Math.trunc(+(0)));
    }
    (output_pointer.buf[output_pointer.off++]) = (((58) & 0xFF)) & 0xFF;
    if ((__struct_ptr_at(output_buffer, 0)).format) {
      (output_pointer.buf[output_pointer.off++]) = (((9) & 0xFF)) & 0xFF;
    }
    (__struct_ptr_at(output_buffer, 0)).offset += ((length) >>> 0);
    if (!print_value(current_item, output_buffer)) {
      return (Math.trunc(+(0)));
    }
    update_offset(output_buffer);
    length = (((Math.trunc(+((((__struct_ptr_at(output_buffer, 0)).format ? 1 : 0))))) >>> 0) + ((Math.trunc(+((((__struct_ptr_at(current_item, 0)).next ? 1 : 0))))) >>> 0));
    output_pointer = ensure(output_buffer, ((length) >>> 0) + ((1) >>> 0));
    if (cptr_eq(output_pointer, (null))) {
      return (Math.trunc(+(0)));
    }
    if ((__struct_ptr_at(current_item, 0)).next) {
      (output_pointer.buf[output_pointer.off++]) = (((44) & 0xFF)) & 0xFF;
    }
    if ((__struct_ptr_at(output_buffer, 0)).format) {
      (output_pointer.buf[output_pointer.off++]) = (((10) & 0xFF)) & 0xFF;
    }
    output_pointer.buf[output_pointer.off] = (((0) & 0xFF)) & 0xFF;
    (__struct_ptr_at(output_buffer, 0)).offset += ((length) >>> 0);
    current_item = (__struct_ptr_at(current_item, 0)).next;
  }
  output_pointer = ensure(output_buffer, ((__struct_ptr_at(output_buffer, 0)).format ? ((((__struct_ptr_at(output_buffer, 0)).depth) >>> 0) + ((1) >>> 0)) : ((2) >>> 0)));
  if (cptr_eq(output_pointer, (null))) {
    return (Math.trunc(+(0)));
  }
  if ((__struct_ptr_at(output_buffer, 0)).format) {
    let i = 0;
    for (i = ((0) >>> 0); ((i) >>> 0) < ((((__struct_ptr_at(output_buffer, 0)).depth) >>> 0) - ((1) >>> 0)); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
      (output_pointer.buf[output_pointer.off++]) = (((9) & 0xFF)) & 0xFF;
    }
  }
  (output_pointer.buf[output_pointer.off++]) = (((125) & 0xFF)) & 0xFF;
  output_pointer.buf[output_pointer.off] = (((0) & 0xFF)) & 0xFF;
  (() => { const _t = (__struct_ptr_at(output_buffer, 0)).depth; (__struct_ptr_at(output_buffer, 0)).depth = u32((__struct_ptr_at(output_buffer, 0)).depth - 1); return _t; })();
  return (Math.trunc(+(1)));
}

export function cJSON_GetArraySize(array: cJSON | null): number {
  let child = null; /* &ref */
  let size = ((0) >>> 0);
  if (array == (null)) {
    return 0;
  }
  child = (__struct_ptr_at(array, 0)).child;
  while (child != (null)) {
    (() => { const _t = size; size = u32(size + 1); return _t; })();
    child = (__struct_ptr_at(child, 0)).next;
  }
  return (Number(BigInt.asIntN(32, __as_bigint(((size) >>> 0)))) | 0);
}

function get_array_item(array: cJSON | null, index: number): cJSON | null {
  let current_child = null; /* &ref */
  if (array == (null)) {
    return null;
  }
  current_child = (__struct_ptr_at(array, 0)).child;
  while ((((current_child != (null)) && (((index) >>> 0) > ((0) >>> 0))) ? 1 : 0)) {
    (() => { const _t = index; index = u32(index - 1); return _t; })();
    current_child = (__struct_ptr_at(current_child, 0)).next;
  }
  return current_child;
}

export function cJSON_GetArrayItem(array: cJSON | null, index: number): cJSON | null {
  if (index < 0) {
    return null;
  }
  return get_array_item(array, ((Math.trunc(+(index))) >>> 0));
}

function get_object_item(object: cJSON | null, name: string, case_sensitive: cJSON_bool): cJSON | null {
  let current_element = null; /* &ref */
  if ((((object == (null)) || (cptr_eq(name, (null)))) ? 1 : 0)) {
    return null;
  }
  current_element = (__struct_ptr_at(object, 0)).child;
  if (case_sensitive) {
    while ((((((current_element != (null)) && (!cptr_eq((__struct_ptr_at(current_element, 0)).string, (null)))) ? 1 : 0) && (strcmp(cptr_clone(name), cptr_clone((__struct_ptr_at(current_element, 0)).string)) != 0)) ? 1 : 0)) {
      current_element = (__struct_ptr_at(current_element, 0)).next;
    }
  } else {
    while ((((current_element != (null)) && (case_insensitive_strcmp(cptr_clone((name)), cptr_clone((((__struct_ptr_at(current_element, 0)).string)))) != 0)) ? 1 : 0)) {
      current_element = (__struct_ptr_at(current_element, 0)).next;
    }
  }
  if ((((current_element == (null)) || (cptr_eq((__struct_ptr_at(current_element, 0)).string, (null)))) ? 1 : 0)) {
    return null;
  }
  return current_element;
}

export function cJSON_GetObjectItem(object: cJSON | null, string: string): cJSON | null {
  return get_object_item(object, cptr_clone(string), (Math.trunc(+(0))));
}

export function cJSON_GetObjectItemCaseSensitive(object: cJSON | null, string: string): cJSON | null {
  return get_object_item(object, cptr_clone(string), (Math.trunc(+(1))));
}

export function cJSON_HasObjectItem(object: cJSON | null, string: string): cJSON_bool {
  return (cJSON_GetObjectItem(object, cptr_clone(string)) ? 1 : 0);
}

function suffix_object(prev: cJSON | null, item: cJSON | null): void {
  (__struct_ptr_at(prev, 0)).next = item;
  (__struct_ptr_at(item, 0)).prev = prev;
}

function create_reference(item: cJSON | null, hooks: internal_hooks | null): cJSON | null {
  let reference = null; /* &ref */
  if (item == (null)) {
    return null;
  }
  reference = cJSON_New_Item(hooks);
  if (reference == (null)) {
    return null;
  }
  memcpy(reference, item, 64);
  (__struct_ptr_at(reference, 0)).string = null;
  (__struct_ptr_at(reference, 0)).type |= 256;
  (__struct_ptr_at(reference, 0)).next = (__struct_ptr_at(reference, 0)).prev = null;
  return reference;
}

function add_item_to_array(array: cJSON | null, item: cJSON | null): cJSON_bool {
  let child = null; /* &ref */
  if ((((((item == (null)) || (array == (null))) ? 1 : 0) || (array == item)) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  child = (__struct_ptr_at(array, 0)).child;
  if (child == (null)) {
    (__struct_ptr_at(array, 0)).child = item;
    (__struct_ptr_at(item, 0)).prev = item;
    (__struct_ptr_at(item, 0)).next = null;
  } else {
    if ((__struct_ptr_at(child, 0)).prev) {
      suffix_object((__struct_ptr_at(child, 0)).prev, item);
      (__struct_ptr_at((__struct_ptr_at(array, 0)).child, 0)).prev = item;
    }
  }
  return (Math.trunc(+(1)));
}

export function cJSON_AddItemToArray(array: cJSON | null, item: cJSON | null): cJSON_bool {
  return add_item_to_array(array, item);
}

function cast_away_const(string: any | null): any | null {
  return cptr_clone((string));
}

function add_item_to_object(object: cJSON | null, string: string, item: cJSON | null, hooks: internal_hooks | null, constant_key: cJSON_bool): cJSON_bool {
  let new_key = null; /* &ref */
  let new_type = (0);
  if ((((((((object == (null)) || (cptr_eq(string, (null)))) ? 1 : 0) || (item == (null))) ? 1 : 0) || (object == item)) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  if (constant_key) {
    new_key = (cast_away_const(string));
    new_type = (__struct_ptr_at(item, 0)).type | 512;
  } else {
    new_key = (cJSON_strdup(cptr_clone((string)), hooks));
    if (cptr_eq(new_key, (null))) {
      return (Math.trunc(+(0)));
    }
    new_type = (__struct_ptr_at(item, 0)).type & ~512;
  }
  if (((!((__struct_ptr_at(item, 0)).type & 512) && (!cptr_eq((__struct_ptr_at(item, 0)).string, (null)))) ? 1 : 0)) {
    (__struct_ptr_at(hooks, 0)).deallocate((__struct_ptr_at(item, 0)).string);
  }
  (__struct_ptr_at(item, 0)).string = new_key;
  (__struct_ptr_at(item, 0)).type = new_type;
  return add_item_to_array(object, item);
}

export function cJSON_AddItemToObject(object: cJSON | null, string: string, item: cJSON | null): cJSON_bool {
  return add_item_to_object(object, cptr_clone(string), item, global_hooks, (Math.trunc(+(0))));
}

export function cJSON_AddItemToObjectCS(object: cJSON | null, string: string, item: cJSON | null): cJSON_bool {
  return add_item_to_object(object, cptr_clone(string), item, global_hooks, (Math.trunc(+(1))));
}

export function cJSON_AddItemReferenceToArray(array: cJSON | null, item: cJSON | null): cJSON_bool {
  if (array == (null)) {
    return (Math.trunc(+(0)));
  }
  return add_item_to_array(array, create_reference(item, global_hooks));
}

export function cJSON_AddItemReferenceToObject(object: cJSON | null, string: string, item: cJSON | null): cJSON_bool {
  if ((((object == (null)) || (cptr_eq(string, (null)))) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  return add_item_to_object(object, cptr_clone(string), create_reference(item, global_hooks), global_hooks, (Math.trunc(+(0))));
}

export function cJSON_AddNullToObject(object: cJSON | null, name: string): cJSON | null {
  let _null = cJSON_CreateNull(); /* &ref */
  if (add_item_to_object(object, cptr_clone(name), _null, global_hooks, (Math.trunc(+(0))))) {
    return _null;
  }
  cJSON_Delete(_null);
  return null;
}

export function cJSON_AddTrueToObject(object: cJSON | null, name: string): cJSON | null {
  let true_item = cJSON_CreateTrue(); /* &ref */
  if (add_item_to_object(object, cptr_clone(name), true_item, global_hooks, (Math.trunc(+(0))))) {
    return true_item;
  }
  cJSON_Delete(true_item);
  return null;
}

export function cJSON_AddFalseToObject(object: cJSON | null, name: string): cJSON | null {
  let false_item = cJSON_CreateFalse(); /* &ref */
  if (add_item_to_object(object, cptr_clone(name), false_item, global_hooks, (Math.trunc(+(0))))) {
    return false_item;
  }
  cJSON_Delete(false_item);
  return null;
}

export function cJSON_AddBoolToObject(object: cJSON | null, name: string, _boolean: cJSON_bool): cJSON | null {
  let bool_item = cJSON_CreateBool(_boolean); /* &ref */
  if (add_item_to_object(object, cptr_clone(name), bool_item, global_hooks, (Math.trunc(+(0))))) {
    return bool_item;
  }
  cJSON_Delete(bool_item);
  return null;
}

export function cJSON_AddNumberToObject(object: cJSON | null, name: string, number: number): cJSON | null {
  let number_item = cJSON_CreateNumber(number); /* &ref */
  if (add_item_to_object(object, cptr_clone(name), number_item, global_hooks, (Math.trunc(+(0))))) {
    return number_item;
  }
  cJSON_Delete(number_item);
  return null;
}

export function cJSON_AddStringToObject(object: cJSON | null, name: string, string: string): cJSON | null {
  let string_item = cJSON_CreateString(cptr_clone(string)); /* &ref */
  if (add_item_to_object(object, cptr_clone(name), string_item, global_hooks, (Math.trunc(+(0))))) {
    return string_item;
  }
  cJSON_Delete(string_item);
  return null;
}

export function cJSON_AddRawToObject(object: cJSON | null, name: string, raw: string): cJSON | null {
  let raw_item = cJSON_CreateRaw(cptr_clone(raw)); /* &ref */
  if (add_item_to_object(object, cptr_clone(name), raw_item, global_hooks, (Math.trunc(+(0))))) {
    return raw_item;
  }
  cJSON_Delete(raw_item);
  return null;
}

export function cJSON_AddObjectToObject(object: cJSON | null, name: string): cJSON | null {
  let object_item = cJSON_CreateObject(); /* &ref */
  if (add_item_to_object(object, cptr_clone(name), object_item, global_hooks, (Math.trunc(+(0))))) {
    return object_item;
  }
  cJSON_Delete(object_item);
  return null;
}

export function cJSON_AddArrayToObject(object: cJSON | null, name: string): cJSON | null {
  let array = cJSON_CreateArray(); /* &ref */
  if (add_item_to_object(object, cptr_clone(name), array, global_hooks, (Math.trunc(+(0))))) {
    return array;
  }
  cJSON_Delete(array);
  return null;
}

export function cJSON_DetachItemViaPointer(parent: cJSON | null, item: cJSON | null): cJSON | null {
  if ((((((parent == (null)) || (item == (null))) ? 1 : 0) || (((item != (__struct_ptr_at(parent, 0)).child && (__struct_ptr_at(item, 0)).prev == (null)) ? 1 : 0))) ? 1 : 0)) {
    return null;
  }
  if (item != (__struct_ptr_at(parent, 0)).child) {
    (__struct_ptr_at((__struct_ptr_at(item, 0)).prev, 0)).next = (__struct_ptr_at(item, 0)).next;
  }
  if ((__struct_ptr_at(item, 0)).next != (null)) {
    (__struct_ptr_at((__struct_ptr_at(item, 0)).next, 0)).prev = (__struct_ptr_at(item, 0)).prev;
  }
  if (item == (__struct_ptr_at(parent, 0)).child) {
    (__struct_ptr_at(parent, 0)).child = (__struct_ptr_at(item, 0)).next;
  } else {
    if ((__struct_ptr_at(item, 0)).next == (null)) {
      (__struct_ptr_at((__struct_ptr_at(parent, 0)).child, 0)).prev = (__struct_ptr_at(item, 0)).prev;
    }
  }
  (__struct_ptr_at(item, 0)).prev = null;
  (__struct_ptr_at(item, 0)).next = null;
  return item;
}

export function cJSON_DetachItemFromArray(array: cJSON | null, which: number): cJSON | null {
  if (which < 0) {
    return null;
  }
  return cJSON_DetachItemViaPointer(array, get_array_item(array, ((Math.trunc(+(which))) >>> 0)));
}

export function cJSON_DeleteItemFromArray(array: cJSON | null, which: number): void {
  cJSON_Delete(cJSON_DetachItemFromArray(array, which));
}

export function cJSON_DetachItemFromObject(object: cJSON | null, string: string): cJSON | null {
  let to_detach = cJSON_GetObjectItem(object, cptr_clone(string)); /* &ref */
  return cJSON_DetachItemViaPointer(object, to_detach);
}

export function cJSON_DetachItemFromObjectCaseSensitive(object: cJSON | null, string: string): cJSON | null {
  let to_detach = cJSON_GetObjectItemCaseSensitive(object, cptr_clone(string)); /* &ref */
  return cJSON_DetachItemViaPointer(object, to_detach);
}

export function cJSON_DeleteItemFromObject(object: cJSON | null, string: string): void {
  cJSON_Delete(cJSON_DetachItemFromObject(object, cptr_clone(string)));
}

export function cJSON_DeleteItemFromObjectCaseSensitive(object: cJSON | null, string: string): void {
  cJSON_Delete(cJSON_DetachItemFromObjectCaseSensitive(object, cptr_clone(string)));
}

export function cJSON_InsertItemInArray(array: cJSON | null, which: number, newitem: cJSON | null): cJSON_bool {
  let after_inserted = null; /* &ref */
  if (((which < 0 || newitem == (null)) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  after_inserted = get_array_item(array, ((Math.trunc(+(which))) >>> 0));
  if (after_inserted == (null)) {
    return add_item_to_array(array, newitem);
  }
  if (((after_inserted != (__struct_ptr_at(array, 0)).child && (__struct_ptr_at(after_inserted, 0)).prev == (null)) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  (__struct_ptr_at(newitem, 0)).next = after_inserted;
  (__struct_ptr_at(newitem, 0)).prev = (__struct_ptr_at(after_inserted, 0)).prev;
  (__struct_ptr_at(after_inserted, 0)).prev = newitem;
  if (after_inserted == (__struct_ptr_at(array, 0)).child) {
    (__struct_ptr_at(array, 0)).child = newitem;
  } else {
    (__struct_ptr_at((__struct_ptr_at(newitem, 0)).prev, 0)).next = newitem;
  }
  return (Math.trunc(+(1)));
}

export function cJSON_ReplaceItemViaPointer(parent: cJSON | null, item: cJSON | null, replacement: cJSON | null): cJSON_bool {
  if ((((((((parent == (null)) || ((__struct_ptr_at(parent, 0)).child == (null))) ? 1 : 0) || (replacement == (null))) ? 1 : 0) || (item == (null))) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  if (replacement == item) {
    return (Math.trunc(+(1)));
  }
  (__struct_ptr_at(replacement, 0)).next = (__struct_ptr_at(item, 0)).next;
  (__struct_ptr_at(replacement, 0)).prev = (__struct_ptr_at(item, 0)).prev;
  if ((__struct_ptr_at(replacement, 0)).next != (null)) {
    (__struct_ptr_at((__struct_ptr_at(replacement, 0)).next, 0)).prev = replacement;
  }
  if ((__struct_ptr_at(parent, 0)).child == item) {
    if ((__struct_ptr_at((__struct_ptr_at(parent, 0)).child, 0)).prev == (__struct_ptr_at(parent, 0)).child) {
      (__struct_ptr_at(replacement, 0)).prev = replacement;
    }
    (__struct_ptr_at(parent, 0)).child = replacement;
  } else {
    if ((__struct_ptr_at(replacement, 0)).prev != (null)) {
      (__struct_ptr_at((__struct_ptr_at(replacement, 0)).prev, 0)).next = replacement;
    }
    if ((__struct_ptr_at(replacement, 0)).next == (null)) {
      (__struct_ptr_at((__struct_ptr_at(parent, 0)).child, 0)).prev = replacement;
    }
  }
  (__struct_ptr_at(item, 0)).next = null;
  (__struct_ptr_at(item, 0)).prev = null;
  cJSON_Delete(item);
  return (Math.trunc(+(1)));
}

export function cJSON_ReplaceItemInArray(array: cJSON | null, which: number, newitem: cJSON | null): cJSON_bool {
  if (which < 0) {
    return (Math.trunc(+(0)));
  }
  return cJSON_ReplaceItemViaPointer(array, get_array_item(array, ((Math.trunc(+(which))) >>> 0)), newitem);
}

function replace_item_in_object(object: cJSON | null, string: string, replacement: cJSON | null, case_sensitive: cJSON_bool): cJSON_bool {
  if ((((replacement == (null)) || (cptr_eq(string, (null)))) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  if (((!((__struct_ptr_at(replacement, 0)).type & 512) && (!cptr_eq((__struct_ptr_at(replacement, 0)).string, (null)))) ? 1 : 0)) {
    cJSON_free((__struct_ptr_at(replacement, 0)).string);
  }
  (__struct_ptr_at(replacement, 0)).string = (cJSON_strdup(cptr_clone((string)), global_hooks));
  if (cptr_eq((__struct_ptr_at(replacement, 0)).string, (null))) {
    return (Math.trunc(+(0)));
  }
  (__struct_ptr_at(replacement, 0)).type &= ~512;
  return cJSON_ReplaceItemViaPointer(object, get_object_item(object, cptr_clone(string), case_sensitive), replacement);
}

export function cJSON_ReplaceItemInObject(object: cJSON | null, string: string, newitem: cJSON | null): cJSON_bool {
  return replace_item_in_object(object, cptr_clone(string), newitem, (Math.trunc(+(0))));
}

export function cJSON_ReplaceItemInObjectCaseSensitive(object: cJSON | null, string: string, newitem: cJSON | null): cJSON_bool {
  return replace_item_in_object(object, cptr_clone(string), newitem, (Math.trunc(+(1))));
}

export function cJSON_CreateNull(): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item) {
    (__struct_ptr_at(item, 0)).type = (((1 << 2) | 0));
  }
  return item;
}

export function cJSON_CreateTrue(): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item) {
    (__struct_ptr_at(item, 0)).type = (((1 << 1) | 0));
  }
  return item;
}

export function cJSON_CreateFalse(): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item) {
    (__struct_ptr_at(item, 0)).type = (((1 << 0) | 0));
  }
  return item;
}

export function cJSON_CreateBool(_boolean: cJSON_bool): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item) {
    (__struct_ptr_at(item, 0)).type = (_boolean ? (((1 << 1) | 0)) : (((1 << 0) | 0)));
  }
  return item;
}

export function cJSON_CreateNumber(num: number): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item) {
    (__struct_ptr_at(item, 0)).type = (((1 << 3) | 0));
    (__struct_ptr_at(item, 0)).valuedouble = num;
    if (num >= 2147483647) {
      (__struct_ptr_at(item, 0)).valueint = 2147483647;
    } else {
      if (num <= ((i32(-2147483647 - 1)))) {
        (__struct_ptr_at(item, 0)).valueint = (i32(-2147483647 - 1));
      } else {
        (__struct_ptr_at(item, 0)).valueint = (Math.trunc(+(num)) | 0);
      }
    }
  }
  return item;
}

export function cJSON_CreateString(string: string): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item) {
    (__struct_ptr_at(item, 0)).type = (((1 << 4) | 0));
    (__struct_ptr_at(item, 0)).valuestring = (cJSON_strdup(cptr_clone((string)), global_hooks));
    if (!(__struct_ptr_at(item, 0)).valuestring) {
      cJSON_Delete(item);
      return null;
    }
  }
  return item;
}

export function cJSON_CreateStringReference(string: string): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item != (null)) {
    (__struct_ptr_at(item, 0)).type = (((1 << 4) | 0)) | 256;
    (__struct_ptr_at(item, 0)).valuestring = (cast_away_const(string));
  }
  return item;
}

export function cJSON_CreateObjectReference(child: cJSON | null): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item != (null)) {
    (__struct_ptr_at(item, 0)).type = (((1 << 6) | 0)) | 256;
    (__struct_ptr_at(item, 0)).child = (new cJSON());
  }
  return item;
}

export function cJSON_CreateArrayReference(child: cJSON | null): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item != (null)) {
    (__struct_ptr_at(item, 0)).type = (((1 << 5) | 0)) | 256;
    (__struct_ptr_at(item, 0)).child = (new cJSON());
  }
  return item;
}

export function cJSON_CreateRaw(raw: string): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item) {
    (__struct_ptr_at(item, 0)).type = (((1 << 7) | 0));
    (__struct_ptr_at(item, 0)).valuestring = (cJSON_strdup(cptr_clone((raw)), global_hooks));
    if (!(__struct_ptr_at(item, 0)).valuestring) {
      cJSON_Delete(item);
      return null;
    }
  }
  return item;
}

export function cJSON_CreateArray(): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item) {
    (__struct_ptr_at(item, 0)).type = (((1 << 5) | 0));
  }
  return item;
}

export function cJSON_CreateObject(): cJSON | null {
  let item = cJSON_New_Item(global_hooks); /* &ref */
  if (item) {
    (__struct_ptr_at(item, 0)).type = (((1 << 6) | 0));
  }
  return item;
}

export function cJSON_CreateIntArray(numbers: number | null, count: number): cJSON | null {
  let i = ((0) >>> 0);
  let n = null; /* &ref */
  let p = null; /* &ref */
  let a = null; /* &ref */
  if ((((count < 0) || (cptr_eq(numbers, (null)))) ? 1 : 0)) {
    return null;
  }
  a = cJSON_CreateArray();
  for (i = ((0) >>> 0); ((a && (((i) >>> 0) < ((Math.trunc(+(count))) >>> 0))) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    n = cJSON_CreateNumber(cptr_read_int32(numbers, ((i) >>> 0)));
    if (!n) {
      cJSON_Delete(a);
      return null;
    }
    if (!((i) >>> 0)) {
      (__struct_ptr_at(a, 0)).child = n;
    } else {
      suffix_object(p, n);
    }
    p = n;
  }
  if (((a && (__struct_ptr_at(a, 0)).child) ? 1 : 0)) {
    (__struct_ptr_at((__struct_ptr_at(a, 0)).child, 0)).prev = n;
  }
  return a;
}

export function cJSON_CreateFloatArray(numbers: number | null, count: number): cJSON | null {
  let i = ((0) >>> 0);
  let n = null; /* &ref */
  let p = null; /* &ref */
  let a = null; /* &ref */
  if ((((count < 0) || (cptr_eq(numbers, (null)))) ? 1 : 0)) {
    return null;
  }
  a = cJSON_CreateArray();
  for (i = ((0) >>> 0); ((a && (((i) >>> 0) < ((Math.trunc(+(count))) >>> 0))) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    n = cJSON_CreateNumber((cptr_read_float32(numbers, ((i) >>> 0))));
    if (!n) {
      cJSON_Delete(a);
      return null;
    }
    if (!((i) >>> 0)) {
      (__struct_ptr_at(a, 0)).child = n;
    } else {
      suffix_object(p, n);
    }
    p = n;
  }
  if (((a && (__struct_ptr_at(a, 0)).child) ? 1 : 0)) {
    (__struct_ptr_at((__struct_ptr_at(a, 0)).child, 0)).prev = n;
  }
  return a;
}

export function cJSON_CreateDoubleArray(numbers: number | null, count: number): cJSON | null {
  let i = ((0) >>> 0);
  let n = null; /* &ref */
  let p = null; /* &ref */
  let a = null; /* &ref */
  if ((((count < 0) || (cptr_eq(numbers, (null)))) ? 1 : 0)) {
    return null;
  }
  a = cJSON_CreateArray();
  for (i = ((0) >>> 0); ((a && (((i) >>> 0) < ((Math.trunc(+(count))) >>> 0))) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    n = cJSON_CreateNumber(cptr_read_float64(numbers, ((i) >>> 0)));
    if (!n) {
      cJSON_Delete(a);
      return null;
    }
    if (!((i) >>> 0)) {
      (__struct_ptr_at(a, 0)).child = n;
    } else {
      suffix_object(p, n);
    }
    p = n;
  }
  if (((a && (__struct_ptr_at(a, 0)).child) ? 1 : 0)) {
    (__struct_ptr_at((__struct_ptr_at(a, 0)).child, 0)).prev = n;
  }
  return a;
}

export function cJSON_CreateStringArray(strings: { value: string }, count: number): cJSON | null {
  let i = ((0) >>> 0);
  let n = null; /* &ref */
  let p = null; /* &ref */
  let a = null; /* &ref */
  if ((((count < 0) || (cptr_eq(strings, (null)))) ? 1 : 0)) {
    return null;
  }
  a = cJSON_CreateArray();
  for (i = ((0) >>> 0); ((a && (((i) >>> 0) < ((Math.trunc(+(count))) >>> 0))) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
    n = cJSON_CreateString(cptr_clone(cptr_read_ptr(strings, ((i) >>> 0))));
    if (!n) {
      cJSON_Delete(a);
      return null;
    }
    if (!((i) >>> 0)) {
      (__struct_ptr_at(a, 0)).child = n;
    } else {
      suffix_object(p, n);
    }
    p = n;
  }
  if (((a && (__struct_ptr_at(a, 0)).child) ? 1 : 0)) {
    (__struct_ptr_at((__struct_ptr_at(a, 0)).child, 0)).prev = n;
  }
  return a;
}

export function cJSON_Duplicate(item: cJSON | null, recurse: cJSON_bool): cJSON | null {
  return cJSON_Duplicate_rec(item, ((0) >>> 0), recurse);
}

export function cJSON_Duplicate_rec(item: cJSON | null, depth: number, recurse: cJSON_bool): cJSON | null {
  let newitem: cJSON | null = null;
  let child: cJSON | null = null;
  let next: cJSON | null = null;
  let newchild: cJSON | null = null;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      newitem = null; /* &ref */
      child = null; /* &ref */
      next = null; /* &ref */
      newchild = null; /* &ref */
      if (!item) {
        _state = 1; continue _sm; /* goto fail */
      }
      newitem = cJSON_New_Item(global_hooks);
      if (!newitem) {
        _state = 1; continue _sm; /* goto fail */
      }
      (__struct_ptr_at(newitem, 0)).type = (__struct_ptr_at(item, 0)).type & (~256);
      (__struct_ptr_at(newitem, 0)).valueint = (__struct_ptr_at(item, 0)).valueint;
      (__struct_ptr_at(newitem, 0)).valuedouble = (__struct_ptr_at(item, 0)).valuedouble;
      if ((__struct_ptr_at(item, 0)).valuestring) {
        (__struct_ptr_at(newitem, 0)).valuestring = (cJSON_strdup(cptr_clone(((__struct_ptr_at(item, 0)).valuestring)), global_hooks));
        if (!(__struct_ptr_at(newitem, 0)).valuestring) {
          _state = 1; continue _sm; /* goto fail */
        }
      }
      if ((__struct_ptr_at(item, 0)).string) {
        (__struct_ptr_at(newitem, 0)).string = (((__struct_ptr_at(item, 0)).type & 512) ? (__struct_ptr_at(item, 0)).string : (cJSON_strdup(cptr_clone(((__struct_ptr_at(item, 0)).string)), global_hooks)));
        if (!(__struct_ptr_at(newitem, 0)).string) {
          _state = 1; continue _sm; /* goto fail */
        }
      }
      if (!recurse) {
        return newitem;
      }
      child = (__struct_ptr_at(item, 0)).child;
      while (child != (null)) {
        if (((depth) >>> 0) >= ((10000) >>> 0)) {
          _state = 1; continue _sm; /* goto fail */
        }
        newchild = cJSON_Duplicate_rec(child, ((depth) >>> 0) + ((1) >>> 0), (Math.trunc(+(1))));
        if (!newchild) {
          _state = 1; continue _sm; /* goto fail */
        }
        if (next != (null)) {
          (__struct_ptr_at(next, 0)).next = newchild;
          (__struct_ptr_at(newchild, 0)).prev = next;
          next = newchild;
        } else {
          (__struct_ptr_at(newitem, 0)).child = newchild;
          next = newchild;
        }
        child = (__struct_ptr_at(child, 0)).next;
      }
      if (((newitem && (__struct_ptr_at(newitem, 0)).child) ? 1 : 0)) {
        (__struct_ptr_at((__struct_ptr_at(newitem, 0)).child, 0)).prev = newchild;
      }
      return newitem;
    case 1: /* fail */
      if (newitem != (null)) {
        cJSON_Delete(newitem);
      }
      return null;
      break _sm;
    }
  }
}

function skip_oneline_comment(input: { value: string }): void {
  input.value = cptr_offset(input.value, (3 - 1));
  for (; (((input.value).buf[((input.value).off ?? 0) + 0]) << 24 >> 24) != 0; ++(input.value).off) {
    if ((((input.value).buf[((input.value).off ?? 0) + 0]) << 24 >> 24) == 10) {
      input.value = cptr_offset(input.value, (2 - 1));
      return;
    }
  }
}

function skip_multiline_comment(input: { value: string }): void {
  input.value = cptr_offset(input.value, (3 - 1));
  for (; (((input.value).buf[((input.value).off ?? 0) + 0]) << 24 >> 24) != 0; ++(input.value).off) {
    if (((((((input.value).buf[((input.value).off ?? 0) + 0]) << 24 >> 24) == 42) && ((((input.value).buf[((input.value).off ?? 0) + 1]) << 24 >> 24) == 47)) ? 1 : 0)) {
      input.value = cptr_offset(input.value, (3 - 1));
      return;
    }
  }
}

function minify_string(input: { value: string }, output: { value: string }): void {
  (output.value).buf[((output.value).off ?? 0) + 0] = ((((input.value).buf[((input.value).off ?? 0) + 0]) << 24 >> 24)) << 24 >> 24;
  input.value = cptr_offset(input.value, (2 - 1));
  output.value = cptr_offset(output.value, (2 - 1));
  for (; (((input.value).buf[((input.value).off ?? 0) + 0]) << 24 >> 24) != 0; (++(input.value).off), ++(output.value).off) {
    (output.value).buf[((output.value).off ?? 0) + 0] = ((((input.value).buf[((input.value).off ?? 0) + 0]) << 24 >> 24)) << 24 >> 24;
    if ((((input.value).buf[((input.value).off ?? 0) + 0]) << 24 >> 24) == 34) {
      (output.value).buf[((output.value).off ?? 0) + 0] = (((34) << 24 >> 24)) << 24 >> 24;
      input.value = cptr_offset(input.value, (2 - 1));
      output.value = cptr_offset(output.value, (2 - 1));
      return;
    } else {
      if (((((((input.value).buf[((input.value).off ?? 0) + 0]) << 24 >> 24) == 92) && ((((input.value).buf[((input.value).off ?? 0) + 1]) << 24 >> 24) == 34)) ? 1 : 0)) {
        (output.value).buf[((output.value).off ?? 0) + 1] = ((((input.value).buf[((input.value).off ?? 0) + 1]) << 24 >> 24)) << 24 >> 24;
        input.value = cptr_offset(input.value, (2 - 1));
        output.value = cptr_offset(output.value, (2 - 1));
      }
    }
  }
}

export function cJSON_Minify(json: any): void {
  if (typeof json === 'string') json = cptr_from_string(json);

  let into = cptr_clone(json); /* &ref */
  if (cptr_eq(json, (null))) {
    return;
  }
  while (((json.buf[(json.off ?? 0) + 0]) << 24 >> 24) != 0) {
    switch (((json.buf[(json.off ?? 0) + 0]) << 24 >> 24)) {
      case 32:
        case 9:
          case 13:
            case 10:
            {
              json.off++;
      break;
            }
      case 47:
        {
          if (((json.buf[(json.off ?? 0) + 1]) << 24 >> 24) == 47) {
            let _ref0 = { value: json };
            skip_oneline_comment(_ref0);
            json = _ref0.value;
          } else {
            if (((json.buf[(json.off ?? 0) + 1]) << 24 >> 24) == 42) {
              let _ref1 = { value: json };
              skip_multiline_comment(_ref1);
              json = _ref1.value;
            } else {
              json.off++;
            }
          }
        }
      break;
      case 34:
      {
        let _ref2 = { value: json };
        let _ref3 = { value: into };
        minify_string(_ref2, _ref3);
        json = _ref2.value;
        into = _ref3.value;
      break;
      }
      default:
      {
        into.buf[(into.off ?? 0) + 0] = (((json.buf[(json.off ?? 0) + 0]) << 24 >> 24)) << 24 >> 24;
      json.off++;
      into.off++;
      }
    }
  }
  into.buf[into.off] = (((0) << 24 >> 24)) << 24 >> 24;
}

export function cJSON_IsInvalid(item: cJSON | null): cJSON_bool {
  if (item == (null)) {
    return (Math.trunc(+(0)));
  }
  return ((__struct_ptr_at(item, 0)).type & 255) == (0);
}

export function cJSON_IsFalse(item: cJSON | null): cJSON_bool {
  if (item == (null)) {
    return (Math.trunc(+(0)));
  }
  return ((__struct_ptr_at(item, 0)).type & 255) == (((1 << 0) | 0));
}

export function cJSON_IsTrue(item: cJSON | null): cJSON_bool {
  if (item == (null)) {
    return (Math.trunc(+(0)));
  }
  return ((__struct_ptr_at(item, 0)).type & 255) == (((1 << 1) | 0));
}

export function cJSON_IsBool(item: cJSON | null): cJSON_bool {
  if (item == (null)) {
    return (Math.trunc(+(0)));
  }
  return ((__struct_ptr_at(item, 0)).type & ((((1 << 1) | 0)) | (((1 << 0) | 0)))) != 0;
}

export function cJSON_IsNull(item: cJSON | null): cJSON_bool {
  if (item == (null)) {
    return (Math.trunc(+(0)));
  }
  return ((__struct_ptr_at(item, 0)).type & 255) == (((1 << 2) | 0));
}

export function cJSON_IsNumber(item: cJSON | null): cJSON_bool {
  if (item == (null)) {
    return (Math.trunc(+(0)));
  }
  return ((__struct_ptr_at(item, 0)).type & 255) == (((1 << 3) | 0));
}

export function cJSON_IsString(item: cJSON | null): cJSON_bool {
  if (item == (null)) {
    return (Math.trunc(+(0)));
  }
  return ((__struct_ptr_at(item, 0)).type & 255) == (((1 << 4) | 0));
}

export function cJSON_IsArray(item: cJSON | null): cJSON_bool {
  if (item == (null)) {
    return (Math.trunc(+(0)));
  }
  return ((__struct_ptr_at(item, 0)).type & 255) == (((1 << 5) | 0));
}

export function cJSON_IsObject(item: cJSON | null): cJSON_bool {
  if (item == (null)) {
    return (Math.trunc(+(0)));
  }
  return ((__struct_ptr_at(item, 0)).type & 255) == (((1 << 6) | 0));
}

export function cJSON_IsRaw(item: cJSON | null): cJSON_bool {
  if (item == (null)) {
    return (Math.trunc(+(0)));
  }
  return ((__struct_ptr_at(item, 0)).type & 255) == (((1 << 7) | 0));
}

export function cJSON_Compare(a: cJSON | null, b: cJSON | null, case_sensitive: cJSON_bool): cJSON_bool {
  if ((((((a == (null)) || (b == (null))) ? 1 : 0) || (((__struct_ptr_at(a, 0)).type & 255) != ((__struct_ptr_at(b, 0)).type & 255))) ? 1 : 0)) {
    return (Math.trunc(+(0)));
  }
  switch ((__struct_ptr_at(a, 0)).type & 255) {
    case (((1 << 0) | 0)):
      case (((1 << 1) | 0)):
        case (((1 << 2) | 0)):
          case (((1 << 3) | 0)):
            case (((1 << 4) | 0)):
              case (((1 << 7) | 0)):
                case (((1 << 5) | 0)):
                  case (((1 << 6) | 0)):
                  {
                    break;
                  }
    default:
    {
      return (Math.trunc(+(0)));
    }
  }
  if (a == b) {
    return (Math.trunc(+(1)));
  }
  switch ((__struct_ptr_at(a, 0)).type & 255) {
    case (((1 << 0) | 0)):
      case (((1 << 1) | 0)):
        case (((1 << 2) | 0)):
        {
          return (Math.trunc(+(1)));
        }
    case (((1 << 3) | 0)):
      {
        if (compare_double((__struct_ptr_at(a, 0)).valuedouble, (__struct_ptr_at(b, 0)).valuedouble)) {
          return (Math.trunc(+(1)));
        }
      }
    return (Math.trunc(+(0)));
    case (((1 << 4) | 0)):
      case (((1 << 7) | 0)):
        {
          if ((((cptr_eq((__struct_ptr_at(a, 0)).valuestring, (null))) || (cptr_eq((__struct_ptr_at(b, 0)).valuestring, (null)))) ? 1 : 0)) {
            return (Math.trunc(+(0)));
          }
        }
    if (strcmp(cptr_clone((__struct_ptr_at(a, 0)).valuestring), cptr_clone((__struct_ptr_at(b, 0)).valuestring)) == 0) {
      return (Math.trunc(+(1)));
    }
    return (Math.trunc(+(0)));
    case (((1 << 5) | 0)):
      {
        let a_element = (__struct_ptr_at(a, 0)).child; /* &ref */
        let b_element = (__struct_ptr_at(b, 0)).child; /* &ref */
        for (; (((a_element != (null)) && (b_element != (null))) ? 1 : 0); ) {
          if (!cJSON_Compare(a_element, b_element, case_sensitive)) {
            return (Math.trunc(+(0)));
          }
          a_element = (__struct_ptr_at(a_element, 0)).next;
          b_element = (__struct_ptr_at(b_element, 0)).next;
        }
        if (a_element != b_element) {
          return (Math.trunc(+(0)));
        }
        return (Math.trunc(+(1)));
      }
    case (((1 << 6) | 0)):
      {
        let a_element = null; /* &ref */
        let b_element = null; /* &ref */
        for (a_element = ((a != (null)) ? (__struct_ptr_at((a), 0)).child : null); a_element != (null); a_element = (__struct_ptr_at(a_element, 0)).next) {
          b_element = get_object_item(b, cptr_clone((__struct_ptr_at(a_element, 0)).string), case_sensitive);
          if (b_element == (null)) {
            return (Math.trunc(+(0)));
          }
          if (!cJSON_Compare(a_element, b_element, case_sensitive)) {
            return (Math.trunc(+(0)));
          }
        }
        for (b_element = ((b != (null)) ? (__struct_ptr_at((b), 0)).child : null); b_element != (null); b_element = (__struct_ptr_at(b_element, 0)).next) {
          a_element = get_object_item(a, cptr_clone((__struct_ptr_at(b_element, 0)).string), case_sensitive);
          if (a_element == (null)) {
            return (Math.trunc(+(0)));
          }
          if (!cJSON_Compare(b_element, a_element, case_sensitive)) {
            return (Math.trunc(+(0)));
          }
        }
        return (Math.trunc(+(1)));
      }
    default:
    {
      return (Math.trunc(+(0)));
    }
  }
}

export function cJSON_malloc(size: number): any | null {
  return cptr_clone(global_hooks.allocate(((size) >>> 0)));
}

export function cJSON_free(object: any | null): void {
  global_hooks.deallocate(object);
  object = (null);
}

export function reset(item: cJSON | null): void {
  if ((((item != (null)) && ((__struct_ptr_at(item, 0)).child != (null))) ? 1 : 0)) {
    cJSON_Delete((__struct_ptr_at(item, 0)).child);
  }
  if ((((!cptr_eq((__struct_ptr_at(item, 0)).valuestring, (null))) && !((__struct_ptr_at(item, 0)).type & 256)) ? 1 : 0)) {
    global_hooks.deallocate((__struct_ptr_at(item, 0)).valuestring);
  }
  if ((((!cptr_eq((__struct_ptr_at(item, 0)).string, (null))) && !((__struct_ptr_at(item, 0)).type & 512)) ? 1 : 0)) {
    global_hooks.deallocate((__struct_ptr_at(item, 0)).string);
  }
  memset(item, 0, 64);
}

export function read_file(filename: string): string {
  let file: any | null = null;
  let length: number = 0;
  let content: string | null = null;
  let read_chars: number = 0;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      file = null; /* &ref */
      length = 0;
      content = null; /* &ref */
      read_chars = ((0) >>> 0);
      file = _fopen(cptr_clone(filename), "rb");
      if (cptr_eq(file, (null))) {
        _state = 1; continue _sm; /* goto cleanup */
      }
      if (_fseek(file, 0, 2) != 0) {
        _state = 1; continue _sm; /* goto cleanup */
      }
      length = _ftell(file);
      if (length < 0) {
        _state = 1; continue _sm; /* goto cleanup */
      }
      if (_fseek(file, 0, 0) != 0) {
        _state = 1; continue _sm; /* goto cleanup */
      }
      content = (malloc(((Math.trunc(+(length))) >>> 0) + 1));
      if (cptr_eq(content, (null))) {
        _state = 1; continue _sm; /* goto cleanup */
      }
      read_chars = _fread(content, 1, ((Math.trunc(+(length))) >>> 0), file);
      if ((Number(BigInt.asIntN(32, __as_bigint(((read_chars) >>> 0)))) | 0) != length) {
        free(content);
        content = null;
        _state = 1; continue _sm; /* goto cleanup */
      }
      content.buf[(content.off ?? 0) + ((read_chars) >>> 0)] = (((0) << 24 >> 24)) << 24 >> 24;
    case 1: /* cleanup */
      if (!cptr_eq(file, (null))) {
        _fclose(file);
      }
      return cptr_clone(content);
      break _sm;
    }
  }
}

let item = new cJSON();
function assert_is_number(number_item: cJSON | null): void {
  if ((((number_item)) != (null))) {
  } else {
    UnityFail((((("Item is NULL.")))), __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint((35))))))))));
  }
  if (((((__struct_ptr_at(number_item, 0)).next)) == (null))) {
  } else {
    UnityFail((((("Linked list next pointer is not NULL.")))), __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint((37))))))))));
  }
  if (((((__struct_ptr_at(number_item, 0)).prev)) == (null))) {
  } else {
    UnityFail((((("Linked list previous pointer is not NULL.")))), __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint((37))))))))));
  }
  if (((((__struct_ptr_at(number_item, 0)).child)) == (null))) {
  } else {
    UnityFail((((("Item has a child.")))), __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint((38))))))))));
  }
  UnityAssertBits(__i64(__as_bigint(((255)))), __i64(__as_bigint((((((1 << 3) | 0)))))), __i64(__as_bigint((((__struct_ptr_at(number_item, 0)).type)))), (("Item doesn't have expected type.")), __u64(__as_bigint((39))));
  UnityAssertBits(__i64(__as_bigint(((256)))), __i64(__as_bigint(((0)))), __i64(__as_bigint((((__struct_ptr_at(number_item, 0)).type)))), (("Item should not have a string as reference.")), __u64(__as_bigint((40))));
  UnityAssertBits(__i64(__as_bigint(((512)))), __i64(__as_bigint(((0)))), __i64(__as_bigint((((__struct_ptr_at(number_item, 0)).type)))), (("Item should not have a const string.")), __u64(__as_bigint((41))));
  if ((cptr_eq((((__struct_ptr_at(number_item, 0)).valuestring)), (null)))) {
  } else {
    UnityFail((((("Valuestring is not NULL.")))), __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint((42))))))))));
  }
  if ((cptr_eq((((__struct_ptr_at(number_item, 0)).string)), (null)))) {
  } else {
    UnityFail((((("String is not NULL.")))), __u64(__as_bigint((__u64(__as_bigint((__u64(__as_bigint((43))))))))));
  }
}

function assert_parse_number(string: string, integer: number, real: number): void {
  let buffer = Object.assign(new parse_buffer(), { content: null, length: ((0) >>> 0), offset: ((0) >>> 0), depth: ((0) >>> 0), hooks: Object.assign(new internal_hooks(), { allocate: null, deallocate: null, reallocate: null }) });
  buffer.content = (string);
  buffer.length = strlen(cptr_clone(string)) + 1;
  Object.assign(buffer.hooks, global_hooks);
  if ((parse_number(item, buffer))) {
  } else {
    UnityFail(((" Expected TRUE Was FALSE")), __u64(__as_bigint((__u64(__as_bigint((53)))))));
  }
  assert_is_number(item);
  UnityAssertEqualNumber(__i64(__as_bigint(((integer)))), __i64(__as_bigint((((__struct_ptr_at(item, 0)).valueint)))), null, __u64(__as_bigint((55))), UNITY_DISPLAY_STYLE_INT);
  UnityAssertDoublesWithin((((((real))) * ((9.9999999999999998E-13)))), ((((real)))), (((((__struct_ptr_at(item, 0)).valuedouble)))), null, __u64(__as_bigint(__u64(__as_bigint((56))))));
}

function assert_parse_big_number(string: string): void {
  let buffer = Object.assign(new parse_buffer(), { content: null, length: ((0) >>> 0), offset: ((0) >>> 0), depth: ((0) >>> 0), hooks: Object.assign(new internal_hooks(), { allocate: null, deallocate: null, reallocate: null }) });
  buffer.content = (string);
  buffer.length = strlen(cptr_clone(string)) + 1;
  Object.assign(buffer.hooks, global_hooks);
  if ((parse_number(item, buffer))) {
  } else {
    UnityFail(((" Expected TRUE Was FALSE")), __u64(__as_bigint((__u64(__as_bigint((66)))))));
  }
  assert_is_number(item);
}

function parse_number_should_parse_zero(): void {
  assert_parse_number("0", 0, 0);
  assert_parse_number("0.0", 0, 0);
  assert_parse_number("-0", 0, -0);
}

function parse_number_should_parse_negative_integers(): void {
  assert_parse_number("-1", -1, -1);
  assert_parse_number("-32768", -32768, -32768);
  assert_parse_number("-2147483648", (Math.trunc(+(-2147483648)) | 0), -2147483648);
}

function parse_number_should_parse_positive_integers(): void {
  assert_parse_number("1", 1, 1);
  assert_parse_number("32767", 32767, 32767);
  assert_parse_number("2147483647", (Math.trunc(+(2147483647)) | 0), 2147483647);
}

function parse_number_should_parse_positive_reals(): void {
  assert_parse_number("0.001", 0, 0.001);
  assert_parse_number("10e-10", 0, 1.0000000000000001E-9);
  assert_parse_number("10E-10", 0, 1.0000000000000001E-9);
  assert_parse_number("10e10", 2147483647, 1.0E+11);
  assert_parse_number("123e+127", 2147483647, 1.23E+129);
  assert_parse_number("123e-128", 0, 1.2299999999999999E-126);
}

function parse_number_should_parse_negative_reals(): void {
  assert_parse_number("-0.001", 0, -0.001);
  assert_parse_number("-10e-10", 0, -1.0000000000000001E-9);
  assert_parse_number("-10E-10", 0, -1.0000000000000001E-9);
  assert_parse_number("-10e20", (i32(-2147483647 - 1)), -1.0E+21);
  assert_parse_number("-123e+127", (i32(-2147483647 - 1)), -1.23E+129);
  assert_parse_number("-123e-128", 0, -1.2299999999999999E-126);
}

function parse_number_should_parse_big_numbers(): void {
  assert_parse_big_number("9999999999999999999999999999999999999999999999912345678901234567");
  assert_parse_big_number("9999999999999999999999999999999999999999999999912345678901234567E10");
  assert_parse_big_number("999999999999999999999999999999999999999999999991234567890.1234567");
}

export function main(): number {
  memset(item, 0, 64);
  UnityBegin("tests/real-world/cjson/tests/parse_number.c");
  UnityDefaultTestRun((parse_number_should_parse_zero), "parse_number_should_parse_zero", (123));
  UnityDefaultTestRun((parse_number_should_parse_negative_integers), "parse_number_should_parse_negative_integers", (124));
  UnityDefaultTestRun((parse_number_should_parse_positive_integers), "parse_number_should_parse_positive_integers", (125));
  UnityDefaultTestRun((parse_number_should_parse_positive_reals), "parse_number_should_parse_positive_reals", (126));
  UnityDefaultTestRun((parse_number_should_parse_negative_reals), "parse_number_should_parse_negative_reals", (127));
  UnityDefaultTestRun((parse_number_should_parse_big_numbers), "parse_number_should_parse_big_numbers", (128));
  return UnityEnd();
}

process.exit(main());
