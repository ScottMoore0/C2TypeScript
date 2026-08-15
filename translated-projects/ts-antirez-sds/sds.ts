function __builtin_unreachable(): never { throw new Error('__builtin_unreachable reached (C17 §6.5.2.2 UB)'); }
function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }
function sscanf(str: any, fmt: any, ...args: any[]): number {
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
// ESM-safe require: synthesise a CJS-style require() via createRequire so
// shims using require("fs") / require("os") keep working under tsx ESM
// loaders. ECMAScript section 15.10 modules have no global require; Node
// exposes createRequire(url) to produce one bound to a given URL. This shim
// is idempotent (uses var + ??=) so multiple injections don't collide.
import { createRequire as __rt_cr } from "node:module";
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
function _fprintf(fh: any, fmt: any, ...args: any[]): number { const s = printf_format(fmt, ...args); /* MSVC: __acrt_iob_func(0)=stdin, (1)=stdout, (2)=stderr — fh comes through as the index. Route to process.stdout/.stderr at the OS level so test output reaches the matrix's stdout sink. */ const fhNum = (fh && typeof fh === 'object' && '__fd' in fh) ? fh.__fd : Number(fh); if (fhNum === 1 || fhNum === 0) { process.stdout.write(s); return s.length; } if (fhNum === 2) { process.stderr.write(s); return s.length; } const h = _fileHandles.get(fhNum); if (!h) return -1; const buf = Buffer.from(s); _fs.writeSync(h.fd, buf, 0, buf.length, h.pos); h.pos += buf.length; return s.length; }
function _fgets(fh: number, size: number): any {
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
function __annex_k_invoke(msg: any, ptr: any, err: number): number { const g: any = globalThis as any; const h = g.__annex_k_handler; if (typeof h === 'function') { try { h(msg, ptr, err); } catch {} } else { process.stderr.write(`Annex K constraint violation: ${msg} (errno_t=${err})\n`); } return err; }
function snprintf_s(dst: any, dstmax: number, fmt: any, ...args: any[]): number {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 if (dstmax === 0 || dstmax > 0x7fffffff) { __annex_k_invoke('snprintf_s: bad dstmax', dst, 34); return -1; } const s = typeof printf_format === 'function' ? printf_format(typeof fmt === 'string' ? fmt : cptr_to_string(fmt), ...args) : String(fmt); const copy = s.length >= dstmax ? s.substring(0, dstmax - 1) : s; if (dst?.buf) { for (let i = 0; i < copy.length; i++) dst.buf[(dst.off ?? 0) + i] = copy.charCodeAt(i); dst.buf[(dst.off ?? 0) + copy.length] = 0; } return s.length; }
function dup(fd: number): number { return fd; }
function _write(fd: number, buf: any, count: number): number { try { const data = typeof buf === 'string' ? buf : Buffer.from(buf); require('fs').writeSync(fd, data, 0, count); return count; } catch { return -1; } }
function _read(fd: number, buf: any, count: number): number { try { const b = Buffer.alloc(count); const n = require('fs').readSync(fd, b, 0, count, null); if (Array.isArray(buf)) { for (let i = 0; i < n; i++) buf[i] = b[i]; } else if (buf && typeof buf === 'object' && 'value' in buf) { buf.value = b.toString('utf-8', 0, n); } return n; } catch { return -1; } }
function __local_stdio_scanf_options(): any { return { value: 0 }; }
function __local_stdio_printf_options(): any { return { value: 0 }; }
function _assert(_expr: any, _file: any, _line: any): void { const m = 'Assertion failed: ' + String(_expr); process.stderr.write(m + '\n'); throw new Error(m); }
function __stdio_common_vswscanf(_opts: any, str: any, _n: number, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); return sscanf(str, fmt, ...args); }
function __stdio_common_vsprintf_p(_opts: any, buf: any, _n: number, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); const s = printf_format(fmt, ...args); if (buf && typeof buf === 'object' && 'value' in buf) buf.value = s; return s.length; }
function __stdio_common_vsnprintf_s(_opts: any, buf: any, _n: number, _max: number, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); fmt = typeof fmt === 'string' ? fmt : (fmt?.buf ? cptr_to_string(fmt) : String(fmt ?? '')); const s = printf_format(fmt, ...args).slice(0, _n - 1); if (buf && typeof buf === 'object' && 'value' in buf) buf.value = s; return s.length; }
function __stdio_common_vfwprintf_s(_opts: any, fp: any, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); fmt = typeof fmt === 'string' ? fmt : (fmt?.buf ? cptr_to_string(fmt) : String(fmt ?? '')); return _fprintf(fp, fmt, ...args); }
function __stdio_common_vsnwprintf_s(_opts: any, buf: any, _n: number, _max: number, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); fmt = typeof fmt === 'string' ? fmt : (fmt?.buf ? cptr_to_string(fmt) : String(fmt ?? '')); const s = printf_format(fmt, ...args).slice(0, _n - 1); if (buf && typeof buf === 'object' && 'value' in buf) buf.value = s; return s.length; }
function __stdio_common_vswprintf_s(_opts: any, buf: any, _n: number, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); fmt = typeof fmt === 'string' ? fmt : (fmt?.buf ? cptr_to_string(fmt) : String(fmt ?? '')); const s = printf_format(fmt, ...args).slice(0, _n - 1); if (buf && typeof buf === 'object' && 'value' in buf) buf.value = s; return s.length; }
function __stdio_common_vfwscanf(_opts: any, fp: any, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); fmt = typeof fmt === 'string' ? fmt : (fmt?.buf ? cptr_to_string(fmt) : String(fmt ?? '')); return fscanf(fp, fmt, ...args); }
function __stdio_common_vfprintf_p(_opts: any, fp: any, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); fmt = typeof fmt === 'string' ? fmt : (fmt?.buf ? cptr_to_string(fmt) : String(fmt ?? '')); return _fprintf(fp, fmt, ...args); }
function __stdio_common_vfprintf_s(_opts: any, fp: any, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); fmt = typeof fmt === 'string' ? fmt : (fmt?.buf ? cptr_to_string(fmt) : String(fmt ?? '')); return _fprintf(fp, fmt, ...args); }
function __stdio_common_vsprintf_s(_opts: any, buf: any, _n: number, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); const s = printf_format(fmt, ...args); if (buf && typeof buf === 'object' && 'value' in buf) buf.value = s; return s.length; }
function __stdio_common_vfprintf(_opts: any, fp: any, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); return _fprintf(fp, fmt, ...args); }
function __stdio_common_vfscanf(_opts: any, fp: any, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); return fscanf(fp, fmt, ...args); }
function __stdio_common_vsscanf(_opts: any, str: any, _n: number, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); return sscanf(str, fmt, ...args); }
function __stdio_common_vsprintf(_opts: any, buf: any, _n: number, fmt: any, _loc: any, ap: any): number { const args = Array.isArray(ap) ? ap : (ap?.args ?? []); const s = printf_format(fmt, ...args); if (buf && typeof buf === 'object' && 'value' in buf) buf.value = s; return s.length; }
function wcsnlen(s: any, n: number): number { if (s == null) return 0; const str = typeof s === 'string' ? s : (s?.buf ? cptr_to_string(s) : String(s)); return Math.min(str.length, n); }
function __builtin_llabs(x: any): any { const v = typeof x === 'bigint' ? x : BigInt(Math.trunc(Number(x))); return v < 0n ? -v : v; }
function llabs(x: any): any { if (typeof x === 'bigint') return x < 0n ? -x : x; return Math.abs(Number(x)); }
function fscanf(fp: any, fmt: any, ...args: any[]): number { const line = (typeof _fgets === 'function' ? _fgets(fp, 4096) : '') ?? ''; if (!line) return -1; return sscanf(line, fmt, ...args); }
function __acrt_iob_func(idx: number): number { return idx; }
const ENOENT = 2, EACCES = 13, EEXIST = 17, EINTR = 4, EAGAIN = 11, EBADF = 9, EPERM = 1, ENOMEM = 12, EINVAL = 22, ENOSYS = 38, ERANGE = 34, EDOM = 33, EILSEQ = 84, ENFILE = 23, EMFILE = 24, ENOTTY = 25, EBUSY = 16, ENOSPC = 28, EROFS = 30, EPIPE = 32, ECONNREFUSED = 111, EADDRINUSE = 98, ETIMEDOUT = 110, ECONNRESET = 104;
let errno = 0;
function rint(x: number): number { return Math.round(x); }
function labs(x: number): number { return Math.abs(x); }
function assert(expr: any, msg?: string): void { if (!expr) { const m = 'Assertion failed' + (msg ? ': ' + msg : ''); process.stderr.write(m + '\n'); throw new Error(m); } }
function printf_format(fmt: any, ...args: any[]): any {
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
        case "s": s = (a?.buf ? cptr_to_string(a) : (a && typeof a === "object" && typeof a.c_str === "function") ? a.c_str() : ("" + (a ?? ""))); if (prec) s = s.slice(0, parseInt(prec)); break;
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
function abs(x: number): number { if (x == null) return 0; return Math.abs(x); }
function memcpy(dst: any, src: any, n: number): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
 if (dst?.buf && src?.buf) { cptr_copy(dst, src, n); /* C17 §6.7.6.1: when src is a slot-bearing CPtr (T** array), copy the parallel slot references into dst so pointer identity survives the byte-copy. Slot stride is 8 bytes (LLP64 sizeof(void*)); slot indices align with byte offset >> 3. */ if ((src as any).slots) { const dstAny: any = dst; if (!dstAny.slots) dstAny.slots = []; const srcSlotBase = ((src.off ?? 0) >> 3); const dstSlotBase = ((dst.off ?? 0) >> 3); const slotCount = Math.floor(n / 8); for (let i = 0; i < slotCount; i++) dstAny.slots[dstSlotBase + i] = (src as any).slots[srcSlotBase + i] ?? null; } return dst; } if (dst?.buf && typeof src === 'string') { for (let i = 0; i < n && i < src.length; i++) dst.buf[dst.off + i] = src.charCodeAt(i); return dst; } if (dst?.buf && src && typeof src === 'object' && 'value' in src && typeof src.value === 'number') { const dv = new DataView(dst.buf.buffer, dst.buf.byteOffset + dst.off); if (n >= 4) dv.setInt32(0, src.value, true); else if (n >= 2) dv.setInt16(0, src.value, true); else dv.setInt8(0, src.value); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src?.buf) { /* BRIDGE: memcpy(box, cptr, n) — read N bytes from a CPtr into a {value} box. C17 §7.24.2.1. n=8 → bigint64 (signed). n=4 → int32. n=2 → int16. n=1 → int8. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const off = src.off ?? 0; if (n >= 8) { const bv = dv.getBigInt64(off, true); dst.value = (typeof dst.value === 'bigint') ? bv : Number(bv); } else if (n >= 4) dst.value = dv.getInt32(off, true); else if (n >= 2) dst.value = dv.getInt16(off, true); else dst.value = dv.getInt8(off); return dst; } if (dst && typeof dst === 'object' && 'value' in dst && src && typeof src === 'object' && 'value' in src) { /* C17 §6.5 type-pun via memcpy: reinterpret src.value bytes as dst's type. n=4: int32<->float32. n=8: int64<->float64 (via bigint). */ const __b = new Uint8Array(8); const __dv = new DataView(__b.buffer); const __s = src.value; const __d = dst.value; if (n === 4) { if (Number.isInteger(__s) && !Number.isInteger(__d) && typeof __d === 'number') { __dv.setInt32(0, __s | 0, true); dst.value = __dv.getFloat32(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat32(0, __s, true); dst.value = __dv.getInt32(0, true); } else { dst.value = __s; } } else if (n === 8) { if (typeof __s === 'bigint' && typeof __d !== 'bigint') { __dv.setBigInt64(0, __s, true); dst.value = __dv.getFloat64(0, true); } else if (typeof __s !== 'bigint' && typeof __d === 'bigint') { __dv.setFloat64(0, Number(__s), true); dst.value = __dv.getBigInt64(0, true); } else if (Number.isInteger(__s) && !Number.isInteger(__d)) { __dv.setBigInt64(0, BigInt(Math.trunc(__s)), true); dst.value = __dv.getFloat64(0, true); } else if (!Number.isInteger(__s) && Number.isInteger(__d)) { __dv.setFloat64(0, __s, true); dst.value = Number(__dv.getBigInt64(0, true)); } else { dst.value = __s; } } else { dst.value = __s; } return dst; } if (Array.isArray(dst) && src && src.buf) { /* BRIDGE: memcpy(Array, CPtr, n) — destination is a JS Array decayed from a struct/array of i64/i32/etc., source is a CPtr backed by a Uint8Array. Read element-wise via DataView using src.__elem_size when available, defaulting to 8 (int64 — covers curve25519 fcontract / fmonty origx<-x and BLAKE2 buffer staging). C17 §7.24.2.1: memcpy copies n bytes; element-size routing is the byte-addressable lowering for an i64 destination. */ const dv = new DataView(src.buf.buffer, src.buf.byteOffset); const baseOff = src.off ?? 0; const elemSize = (src.__elem_size as number) || 8; const count = Math.floor(n / elemSize); for (let i = 0; i < count; i++) { const eoff = baseOff + i * elemSize; if (elemSize === 8) dst[i] = dv.getBigInt64(eoff, true); else if (elemSize === 4) dst[i] = dv.getInt32(eoff, true); else if (elemSize === 2) dst[i] = dv.getInt16(eoff, true); else dst[i] = dv.getInt8(eoff); } return dst; } if (Array.isArray(dst) && Array.isArray(src)) { for (let i = 0; i < n; i++) dst[i] = src[i]; } else if (typeof dst === 'object' && typeof src === 'object') Object.assign(dst, src); return dst; }
function memset(dst: any, val: number, n: number): any { const __zeroObject = (obj: any): void => { for (const k of Object.keys(obj)) { const v = obj[k]; if (typeof v === 'number') obj[k] = val | 0; else if (typeof v === 'boolean') obj[k] = val !== 0; else if (typeof v === 'string') obj[k] = ''; else if (v && typeof v === 'object' && v.buf) cptr_memset(v, val, v.buf.length); else if (Array.isArray(v) && v.length > 0 && typeof Object.values(v).find(x => x !== null && typeof x === 'object') !== 'undefined') { for (const item of v) { if (item && typeof item === 'object') __zeroObject(item); } } else if (Array.isArray(v)) { for (let i = 0; i < Math.min(n, v.length); i++) v[i] = val; } else if (v && typeof v === 'object') __zeroObject(v); else if (v != null) obj[k] = null; } }; if (dst?.buf) { cptr_memset(dst, val, n); return dst; } if (Array.isArray(dst) && dst.length > 0 && typeof Object.values(dst).find(x => x !== null && typeof x === 'object') !== 'undefined') { for (const obj of dst) { if (obj && typeof obj === 'object') __zeroObject(obj); } return dst; } if (Array.isArray(dst)) { for (let _mi = 0; _mi < Math.min(n, dst.length); _mi++) dst[_mi] = val; return dst; } if (dst && typeof dst === 'object') { __zeroObject(dst); return dst; } return dst; }
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
function count(first: any, last: any, value: any): number { const A = __cpp_arr(first, last); let n = 0; for (let i = A.start; i < A.end; i++) if (A.arr[i] === value) n++; return n; }
function __va_list_to_array(args: any[]): any[] {
  if (args.length === 1) {
    const a = args[0];
    if (a && typeof a === 'object' && Array.isArray(a.args) && typeof a.pos === 'number') {
      return a.args.slice(a.pos);
    }
    if (Array.isArray(a)) return a;
  }
  return args;
}
function isspace(c: number): number { if (c == null) return 0; return (c === 32 || (c >= 9 && c <= 13)) ? 1 : 0; }
function isprint(c: number): number { return (c >= 32 && c <= 126) ? 1 : 0; }
function memcmp(a: any, b: any, n: number): number {
  if (typeof a === 'string') a = cptr_from_string(a);
  if (typeof b === 'string') b = cptr_from_string(b);
 if (a?.value !== undefined && b?.value !== undefined) { return a.value === b.value ? 0 : (a.value < b.value ? -1 : 1); } for (let i = 0; i < n; i++) { const av = a?.buf ? a.buf[a.off + i] : (typeof a === 'string' ? a.charCodeAt(i) : a?.[i] ?? 0); const bv = b?.buf ? b.buf[b.off + i] : (typeof b === 'string' ? b.charCodeAt(i) : b?.[i] ?? 0); if (av !== bv) return av - bv; } return 0; }
function toupper(c: number): number { if (c == null) return 0; const ch = String.fromCharCode(c); return ch.toUpperCase().charCodeAt(0); }
function tolower(c: number): number { if (c == null) return 0; const ch = String.fromCharCode(c); return ch.toLowerCase().charCodeAt(0); }
function memmove(dst: any, src: any, n: number): any {
  if (typeof dst === 'string') dst = cptr_from_string(dst);
  if (typeof src === 'string') src = cptr_from_string(src);
 if (dst?.buf && src?.buf) { const tmp = new Uint8Array(n); for (let i = 0; i < n; i++) tmp[i] = src.buf[src.off + i] ?? 0; for (let i = 0; i < n; i++) dst.buf[dst.off + i] = tmp[i]; return dst; } if (Array.isArray(dst) && Array.isArray(src)) { const tmp = src.slice(0, n); for (let i = 0; i < n; i++) dst[i] = tmp[i]; } else if (typeof dst === 'object' && typeof src === 'object') Object.assign(dst, src); return dst; }
function strchr(s: any, c: number): any {
  if (typeof s === 'string') s = cptr_from_string(s);
 if (s == null) return null; if (s?.buf) { for (let i = s.off; i < s.buf.length && s.buf[i] !== 0; i++) if (s.buf[i] === c) return { buf: s.buf, off: i }; return null; } if (typeof s === 'string') { const idx = s.indexOf(String.fromCharCode(c)); if (idx < 0) return null; const p = cptr_from_string(s); p.off = idx; return p; } return null; }
function vsnprintf(buf: any, size: number, fmt: any, ...args: any[]): number {
  if (typeof buf === 'string') buf = cptr_from_string(buf);
 // C17 §7.21.6.12: bounded format. Returns full unbounded length per spec.
const __fmt = (fmt && typeof fmt === 'object' && (fmt as any).buf) ? cptr_to_string(fmt as any) : String(fmt ?? ''); const __va = __va_list_to_array(args); const s = printf_format(__fmt, ...__va); const lim = Math.max(0, size - 1); if (buf?.buf) { for (let i = 0; i < Math.min(lim, s.length); i++) buf.buf[(buf.off ?? 0) + i] = s.charCodeAt(i); if (size > 0) buf.buf[(buf.off ?? 0) + Math.min(lim, s.length)] = 0; } else if (Array.isArray(buf)) { for (let i = 0; i < Math.min(lim, s.length); i++) buf[i] = s.charCodeAt(i); if (size > 0) buf[Math.min(lim, s.length)] = 0; } return s.length; }
function pow(x: number, y: number): number { return Math.pow(x, y); }
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
 * ── ERRORS (2) ──
 *   [unsupported]
 *     inline assembly is platform-specific and cannot be translated to TypeScript: (asm template not exposed in AST)
 *   [unsupported]
 *     inline assembly is platform-specific and cannot be translated to TypeScript: Sum is: 
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

// BRIDGE: c-out-pointer alias — C17 §6.5.3.2 + §6.7.6.1; structurally `{ value: T }`.
type COutParam<T> = { value: T };

// C17 §7.16 <stdarg.h> runtime.
function __va_start(argv: any[]): { args: any[]; pos: number } { return { args: argv ?? [], pos: 0 }; }
function __va_arg(ap: any, typeHint: any): any {
  // Accept either a {args,pos} va_list or a bare rest-args array forwarded through `any`.
  if (Array.isArray(ap)) { const v = ap.shift(); return __va_coerce(v, typeHint); }
  if (!ap || !Array.isArray(ap.args)) return undefined;
  const v = ap.args[ap.pos++];
  return __va_coerce(v, typeHint);
}
function __va_coerce(v: any, typeHint: any): any {
  switch (typeHint) {
    case 'int': case 'signed int': case 'long': case 'long int': case 'signed long': case 'short': case 'signed short': case 'char': case 'signed char':
    {
      return (v == null) ? 0 : Math.trunc(Number(v)) | 0;
    }
    case 'unsigned int': case 'unsigned': case 'unsigned long': case 'unsigned short': case 'unsigned char': case 'size_t':
    {
      return (v == null) ? 0 : (Math.trunc(Number(v)) >>> 0);
    }
    case 'long long': case 'signed long long': case 'unsigned long long':
    {
      return (typeof v === 'bigint') ? v : BigInt(Math.trunc(Number(v ?? 0)));
    }
    case 'double': case 'long double': case 'float':
    {
      return Number(v ?? 0);
    }
    case 'const char *': case 'char *': case 'const char*': case 'char*':
    {
      return (v && typeof v === 'object' && (v as any).buf) ? v : (v == null ? '' : String(v));
    }
    default: return v;
  }
}
function __va_end(_ap: unknown): void { /* no-op */ }
function __va_copy(dest: any, src: any): void {
  if (dest && typeof dest === 'object' && src && typeof src === 'object' && Array.isArray(src.args)) {
    dest.args = src.args; dest.pos = src.pos;
  }
}
function __va_copy_new(src: any): { args: any[]; pos: number } {
  if (src && typeof src === 'object' && Array.isArray(src.args)) return { args: src.args, pos: src.pos };
  if (Array.isArray(src)) return { args: src.slice(), pos: 0 };
  return { args: [], pos: 0 };
}

function strlen(s: any): number { if (s == null) return 0; if (typeof s === 'string') return s.length; if (s.buf) return cptr_strlen(s); if (Array.isArray(s)) { let i = 0; while (s[i] !== 0 && s[i] !== undefined && i < s.length) i++; return i; } return s?.length ?? 0; }
function __debugbreak(): void {
  ((): never => { throw new Error("inline asm not supported in TS translation: (asm template not exposed in AST)"); })() /* BRIDGE: c-inline-asm — GCC manual "Extended Asm" */;
}

function __fastfail(_Code: number): void {
  ((): never => { throw new Error("inline asm not supported in TS translation: Sum is: "); })() /* BRIDGE: c-inline-asm — GCC manual "Extended Asm" */;
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
export class _iobuf {
  _Placeholder: any | null;
  constructor() {
    this._Placeholder = null;
  }
}
const FILE = _iobuf;
type FILE = _iobuf;
(_iobuf as any).__fieldTypes = ["int64"];
(_iobuf as any).__fieldNames = ["_Placeholder"];
(_iobuf as any).__fieldOffsets = [0];

type _off_t = number;
type off32_t = number;
type _off64_t = number;
type off64_t = number;
export function _vfscanf_s_l(_File: any | null, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vfscanf(1n, _File, cptr_clone(_Format), _Locale, _ArgList);
}

export function vfscanf_s(_File: any | null, _Format: any, _ArgList: any): number {
  return _vfscanf_s_l(_File, cptr_clone(_Format), null, _ArgList);
}

export function _vscanf_s_l(_Format: any, _Locale: any, _ArgList: any): number {
  return _vfscanf_s_l((__acrt_iob_func(((0) >>> 0))), cptr_clone(_Format), _Locale, _ArgList);
}

export function vscanf_s(_Format: any, _ArgList: any): number {
  return _vfscanf_s_l((__acrt_iob_func(((0) >>> 0))), cptr_clone(_Format), null, _ArgList);
}

export function _fscanf_s_l(_File: any | null, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfscanf_s_l(_File, cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function fscanf_s(_File: any | null, _Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfscanf_s_l(_File, cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _scanf_s_l(_Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfscanf_s_l((__acrt_iob_func(((0) >>> 0))), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function scanf_s(_Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfscanf_s_l((__acrt_iob_func(((0) >>> 0))), cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vfscanf_l(_File: any | null, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vfscanf(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 0, _File, cptr_clone(_Format), _Locale, _ArgList);
}

export function _vscanf_l(_Format: any, _Locale: any, _ArgList: any): number {
  return _vfscanf_l((__acrt_iob_func(((0) >>> 0))), cptr_clone(_Format), _Locale, _ArgList);
}

export function _fscanf_l(_File: any | null, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfscanf_l(_File, cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _scanf_l(_Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfscanf_l((__acrt_iob_func(((0) >>> 0))), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vsscanf_s_l(_Src: any, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vsscanf(1n, cptr_clone(_Src), ((Math.trunc(+(-1))) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
}

export function vsscanf_s(_Src: any, _Format: any, _ArgList: any): number {
  return _vsscanf_s_l(cptr_clone(_Src), cptr_clone(_Format), null, _ArgList);
}

export function _sscanf_s_l(_Src: any, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsscanf_s_l(cptr_clone(_Src), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function sscanf_s(_Src: any, _Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsscanf_s_l(cptr_clone(_Src), cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vsscanf_l(_Src: any, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vsscanf(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 0, cptr_clone(_Src), ((Math.trunc(+(-1))) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
}

export function _sscanf_l(_Src: any, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsscanf_l(cptr_clone(_Src), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _snscanf_s_l(_Src: any, _MaxCount: number, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = Number(__stdio_common_vsscanf(1n, cptr_clone(_Src), ((_MaxCount) >>> 0), cptr_clone(_Format), _Locale, _ArgList));
  undefined /* va_end no-op */;
  return _Ret;
}

export function _snscanf_s(_Src: any, _MaxCount: number, _Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = Number(__stdio_common_vsscanf(1n, cptr_clone(_Src), ((_MaxCount) >>> 0), cptr_clone(_Format), null, _ArgList));
  undefined /* va_end no-op */;
  return _Ret;
}

export function _snscanf_l(_Src: any, _MaxCount: number, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = __stdio_common_vsscanf(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 0, cptr_clone(_Src), ((_MaxCount) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vfprintf_s_l(_File: any | null, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vfprintf_s(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), _File, cptr_clone(_Format), _Locale, _ArgList);
}

export function vfprintf_s(_File: any | null, _Format: any, _ArgList: any): number {
  return _vfprintf_s_l(_File, cptr_clone(_Format), null, _ArgList);
}

export function _vprintf_s_l(_Format: any, _Locale: any, _ArgList: any): number {
  return _vfprintf_s_l((__acrt_iob_func(((1) >>> 0))), cptr_clone(_Format), _Locale, _ArgList);
}

export function vprintf_s(_Format: any, _ArgList: any): number {
  return _vfprintf_s_l((__acrt_iob_func(((1) >>> 0))), cptr_clone(_Format), null, _ArgList);
}

export function _fprintf_s_l(_File: any | null, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfprintf_s_l(_File, cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _printf_s_l(_Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfprintf_s_l((__acrt_iob_func(((1) >>> 0))), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function fprintf_s(_File: any | null, _Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfprintf_s_l(_File, cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function printf_s(_Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfprintf_s_l((__acrt_iob_func(((1) >>> 0))), cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vsnprintf_c_l(_DstBuf: any, _MaxCount: number, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vsprintf(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), cptr_clone(_DstBuf), ((_MaxCount) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
}

export function _vsnprintf_c(_DstBuf: any, _MaxCount: number, _Format: any, _ArgList: any): number {
  return _vsnprintf_c_l(cptr_clone(_DstBuf), ((_MaxCount) >>> 0), cptr_clone(_Format), null, _ArgList);
}

export function _snprintf_c_l(_DstBuf: any, _MaxCount: number, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsnprintf_c_l(cptr_clone(_DstBuf), ((_MaxCount) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _snprintf_c(_DstBuf: any, _MaxCount: number, _Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsnprintf_c_l(cptr_clone(_DstBuf), ((_MaxCount) >>> 0), cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vsnprintf_s_l(_DstBuf: any, _DstSize: number, _MaxCount: number, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vsnprintf_s(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), cptr_clone(_DstBuf), ((_DstSize) >>> 0), ((_MaxCount) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
}

export function vsnprintf_s(_DstBuf: any, _DstSize: number, _MaxCount: number, _Format: any, _ArgList: any): number {
  return _vsnprintf_s_l(cptr_clone(_DstBuf), ((_DstSize) >>> 0), ((_MaxCount) >>> 0), cptr_clone(_Format), null, _ArgList);
}

export function _vsnprintf_s(_DstBuf: any, _DstSize: number, _MaxCount: number, _Format: any, _ArgList: any): number {
  return _vsnprintf_s_l(cptr_clone(_DstBuf), ((_DstSize) >>> 0), ((_MaxCount) >>> 0), cptr_clone(_Format), null, _ArgList);
}

export function _snprintf_s_l(_DstBuf: any, _DstSize: number, _MaxCount: number, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsnprintf_s_l(cptr_clone(_DstBuf), ((_DstSize) >>> 0), ((_MaxCount) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _snprintf_s(_DstBuf: any, _DstSize: number, _MaxCount: number, _Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsnprintf_s_l(cptr_clone(_DstBuf), ((_DstSize) >>> 0), ((_MaxCount) >>> 0), cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vsprintf_s_l(_DstBuf: any, _DstSize: number, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vsprintf_s(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), cptr_clone(_DstBuf), ((_DstSize) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
}

export function vsprintf_s(_DstBuf: any, _Size: number, _Format: any, _ArgList: any): number {
  return _vsprintf_s_l(cptr_clone(_DstBuf), ((_Size) >>> 0), cptr_clone(_Format), null, _ArgList);
}

export function _sprintf_s_l(_DstBuf: any, _DstSize: number, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsprintf_s_l(cptr_clone(_DstBuf), ((_DstSize) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function sprintf_s(_DstBuf: any, _DstSize: number, _Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsprintf_s_l(cptr_clone(_DstBuf), ((_DstSize) >>> 0), cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vfprintf_p_l(_File: any | null, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vfprintf_p(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), _File, cptr_clone(_Format), _Locale, _ArgList);
}

export function _vfprintf_p(_File: any | null, _Format: any, _ArgList: any): number {
  return _vfprintf_p_l(_File, cptr_clone(_Format), null, _ArgList);
}

export function _vprintf_p_l(_Format: any, _Locale: any, _ArgList: any): number {
  return _vfprintf_p_l((__acrt_iob_func(((1) >>> 0))), cptr_clone(_Format), _Locale, _ArgList);
}

export function _vprintf_p(_Format: any, _ArgList: any): number {
  return _vfprintf_p_l((__acrt_iob_func(((1) >>> 0))), cptr_clone(_Format), null, _ArgList);
}

export function _fprintf_p_l(_File: any | null, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = __stdio_common_vfprintf_p(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), _File, cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _fprintf_p(_File: any | null, _Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfprintf_p_l(_File, cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _printf_p_l(_Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfprintf_p_l((__acrt_iob_func(((1) >>> 0))), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _printf_p(_Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfprintf_p_l((__acrt_iob_func(((1) >>> 0))), cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vsprintf_p_l(_DstBuf: any, _MaxCount: number, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vsprintf_p(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), cptr_clone(_DstBuf), ((_MaxCount) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
}

export function _vsprintf_p(_Dst: any, _MaxCount: number, _Format: any, _ArgList: any): number {
  return _vsprintf_p_l(cptr_clone(_Dst), ((_MaxCount) >>> 0), cptr_clone(_Format), null, _ArgList);
}

export function _sprintf_p_l(_DstBuf: any, _MaxCount: number, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsprintf_p_l(cptr_clone(_DstBuf), ((_MaxCount) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _sprintf_p(_Dst: any, _MaxCount: number, _Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsprintf_p_l(cptr_clone(_Dst), ((_MaxCount) >>> 0), cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vscprintf_p_l(_Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vsprintf_p(2n, null, ((0) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
}

export function _vscprintf_p(_Format: any, _ArgList: any): number {
  return _vscprintf_p_l(cptr_clone(_Format), null, _ArgList);
}

export function _scprintf_p_l(_Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vscprintf_p_l(cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _scprintf_p(_Format: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vscprintf_p_l(cptr_clone(_Format), null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vfprintf_l(_File: any | null, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vfprintf(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), _File, cptr_clone(_Format), _Locale, _ArgList);
}

export function _vprintf_l(_Format: any, _Locale: any, _ArgList: any): number {
  return _vfprintf_l((__acrt_iob_func(((1) >>> 0))), cptr_clone(_Format), _Locale, _ArgList);
}

export function _fprintf_l(_File: any | null, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfprintf_l(_File, cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _printf_l(_Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfprintf_l((__acrt_iob_func(((1) >>> 0))), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vsnprintf_l(_DstBuf: any, _MaxCount: number, _Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vsprintf(1n, cptr_clone(_DstBuf), ((_MaxCount) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
}

export function _snprintf_l(_DstBuf: any, _MaxCount: number, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsnprintf_l(cptr_clone(_DstBuf), ((_MaxCount) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vsprintf_l(_DstBuf: any, _Format: any, _Locale: any, _ArgList: any): number {
  return _vsnprintf_l(cptr_clone(_DstBuf), ((Math.trunc(+(-1))) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
}

export function _sprintf_l(_DstBuf: any, _Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsprintf_l(cptr_clone(_DstBuf), cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vscprintf_l(_Format: any, _Locale: any, _ArgList: any): number {
  return __stdio_common_vsprintf(2n, null, ((0) >>> 0), cptr_clone(_Format), _Locale, _ArgList);
}

export function _scprintf_l(_Format: any, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vscprintf_l(cptr_clone(_Format), _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vfwscanf_s_l(_File: any | null, _Format: number | null, _Locale: any, _ArgList: any): number {
  return __stdio_common_vfwscanf(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_scanf_options()))) | __as_bigint(1n)), _File, _Format, _Locale, _ArgList);
}

export function vfwscanf_s(_File: any | null, _Format: number | null, _ArgList: any): number {
  return _vfwscanf_s_l(_File, _Format, null, _ArgList);
}

export function _vwscanf_s_l(_Format: number | null, _Locale: any, _ArgList: any): number {
  return _vfwscanf_s_l((__acrt_iob_func(((0) >>> 0))), _Format, _Locale, _ArgList);
}

export function vwscanf_s(_Format: number | null, _ArgList: any): number {
  return _vfwscanf_s_l((__acrt_iob_func(((0) >>> 0))), _Format, null, _ArgList);
}

export function _fwscanf_s_l(_File: any | null, _Format: number | null, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfwscanf_s_l(_File, _Format, _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function fwscanf_s(_File: any | null, _Format: number | null, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfwscanf_s_l(_File, _Format, null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _wscanf_s_l(_Format: number | null, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfwscanf_s_l((__acrt_iob_func(((0) >>> 0))), _Format, _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function wscanf_s(_Format: number | null, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfwscanf_s_l((__acrt_iob_func(((0) >>> 0))), _Format, null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vswscanf_s_l(_Src: number | null, _Format: number | null, _Locale: any, _ArgList: any): number {
  return __stdio_common_vswscanf(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_scanf_options()))) | __as_bigint(1n)), _Src, ((Math.trunc(+(-1))) >>> 0), _Format, _Locale, _ArgList);
}

export function vswscanf_s(_Src: number | null, _Format: number | null, _ArgList: any): number {
  return _vswscanf_s_l(_Src, _Format, null, _ArgList);
}

export function _swscanf_s_l(_Src: number | null, _Format: number | null, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vswscanf_s_l(_Src, _Format, _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function swscanf_s(_Src: number | null, _Format: number | null, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vswscanf_s_l(_Src, _Format, null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vsnwscanf_s_l(_Src: number | null, _MaxCount: number, _Format: number | null, _Locale: any, _ArgList: any): number {
  return __stdio_common_vswscanf(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_scanf_options()))) | __as_bigint(1n)), _Src, ((_MaxCount) >>> 0), _Format, _Locale, _ArgList);
}

export function _snwscanf_s_l(_Src: number | null, _MaxCount: number, _Format: number | null, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsnwscanf_s_l(_Src, ((_MaxCount) >>> 0), _Format, _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _snwscanf_s(_Src: number | null, _MaxCount: number, _Format: number | null, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsnwscanf_s_l(_Src, ((_MaxCount) >>> 0), _Format, null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vfwprintf_s_l(_File: any | null, _Format: number | null, _Locale: any, _ArgList: any): number {
  return __stdio_common_vfwprintf_s(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), _File, _Format, _Locale, _ArgList);
}

export function _vwprintf_s_l(_Format: number | null, _Locale: any, _ArgList: any): number {
  return _vfwprintf_s_l((__acrt_iob_func(((1) >>> 0))), _Format, _Locale, _ArgList);
}

export function vfwprintf_s(_File: any | null, _Format: number | null, _ArgList: any): number {
  return _vfwprintf_s_l(_File, _Format, null, _ArgList);
}

export function vwprintf_s(_Format: number | null, _ArgList: any): number {
  return _vfwprintf_s_l((__acrt_iob_func(((1) >>> 0))), _Format, null, _ArgList);
}

export function _fwprintf_s_l(_File: any | null, _Format: number | null, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfwprintf_s_l(_File, _Format, _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _wprintf_s_l(_Format: number | null, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfwprintf_s_l((__acrt_iob_func(((1) >>> 0))), _Format, _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function fwprintf_s(_File: any | null, _Format: number | null, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfwprintf_s_l(_File, _Format, null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function wprintf_s(_Format: number | null, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vfwprintf_s_l((__acrt_iob_func(((1) >>> 0))), _Format, null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vswprintf_s_l(_DstBuf: number | null, _DstSize: number, _Format: number | null, _Locale: any, _ArgList: any): number {
  return __stdio_common_vswprintf_s(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), _DstBuf, ((_DstSize) >>> 0), _Format, _Locale, _ArgList);
}

export function vswprintf_s(_DstBuf: number | null, _DstSize: number, _Format: number | null, _ArgList: any): number {
  return _vswprintf_s_l(_DstBuf, ((_DstSize) >>> 0), _Format, null, _ArgList);
}

export function _swprintf_s_l(_DstBuf: number | null, _DstSize: number, _Format: number | null, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vswprintf_s_l(_DstBuf, ((_DstSize) >>> 0), _Format, _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function swprintf_s(_DstBuf: number | null, _DstSize: number, _Format: number | null, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vswprintf_s_l(_DstBuf, ((_DstSize) >>> 0), _Format, null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _vsnwprintf_s_l(_DstBuf: number | null, _DstSize: number, _MaxCount: number, _Format: number | null, _Locale: any, _ArgList: any): number {
  return __stdio_common_vsnwprintf_s(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (cptr_read_uint64(__local_stdio_printf_options())), _DstBuf, ((_DstSize) >>> 0), ((_MaxCount) >>> 0), _Format, _Locale, _ArgList);
}

export function _vsnwprintf_s(_DstBuf: number | null, _DstSize: number, _MaxCount: number, _Format: number | null, _ArgList: any): number {
  return _vsnwprintf_s_l(_DstBuf, ((_DstSize) >>> 0), ((_MaxCount) >>> 0), _Format, null, _ArgList);
}

export function _snwprintf_s_l(_DstBuf: number | null, _DstSize: number, _MaxCount: number, _Format: number | null, _Locale: any, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsnwprintf_s_l(_DstBuf, ((_DstSize) >>> 0), ((_MaxCount) >>> 0), _Format, _Locale, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

export function _snwprintf_s(_DstBuf: number | null, _DstSize: number, _MaxCount: number, _Format: number | null, ...__va_args: any[]): number {
  let _ArgList = undefined;
  let _Ret = 0;
  (_ArgList = __va_start(__va_args));
  _Ret = _vsnwprintf_s_l(_DstBuf, ((_DstSize) >>> 0), ((_MaxCount) >>> 0), _Format, null, _ArgList);
  undefined /* va_end no-op */;
  return _Ret;
}

type _onexit_t = (...args: any[]) => any;
// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _div_t {
  quot: number;
  rem: number;
  constructor() {
    this.quot = 0;
    this.rem = 0;
  }
}
const div_t = _div_t;
type div_t = _div_t;
(_div_t as any).__fieldTypes = ["int32","int32"];
(_div_t as any).__fieldNames = ["quot","rem"];
(_div_t as any).__fieldOffsets = [0,4];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _ldiv_t {
  quot: number;
  rem: number;
  constructor() {
    this.quot = 0;
    this.rem = 0;
  }
}
const ldiv_t = _ldiv_t;
type ldiv_t = _ldiv_t;
(_ldiv_t as any).__fieldTypes = ["int64","int64"];
(_ldiv_t as any).__fieldNames = ["quot","rem"];
(_ldiv_t as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _LDOUBLE {
  ld: any = cptr_create(10);
  constructor() {
    this.ld = cptr_create(10);
  }
}
(_LDOUBLE as any).__fieldTypes = ["bytes"];
(_LDOUBLE as any).__fieldNames = ["ld"];
(_LDOUBLE as any).__fieldOffsets = [0];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _CRT_DOUBLE {
  x: number;
  constructor() {
    this.x = 0.0;
  }
}
(_CRT_DOUBLE as any).__fieldTypes = ["double"];
(_CRT_DOUBLE as any).__fieldNames = ["x"];
(_CRT_DOUBLE as any).__fieldOffsets = [0];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _CRT_FLOAT {
  f: number;
  constructor() {
    this.f = 0.0;
  }
}
(_CRT_FLOAT as any).__fieldTypes = ["float"];
(_CRT_FLOAT as any).__fieldNames = ["f"];
(_CRT_FLOAT as any).__fieldOffsets = [0];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _LONGDOUBLE {
  x: number;
  constructor() {
    this.x = 0.0;
  }
}
(_LONGDOUBLE as any).__fieldTypes = ["double"];
(_LONGDOUBLE as any).__fieldNames = ["x"];
(_LONGDOUBLE as any).__fieldOffsets = [0];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _LDBL12 {
  ld12: any = cptr_create(12);
  constructor() {
    this.ld12 = cptr_create(12);
  }
}
(_LDBL12 as any).__fieldTypes = ["bytes"];
(_LDBL12 as any).__fieldNames = ["ld12"];
(_LDBL12 as any).__fieldOffsets = [0];

type _purecall_handler = (...args: any[]) => any;
type _invalid_parameter_handler = (...args: any[]) => any;
export function _abs64(x: number): number {
  return __builtin_llabs(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ x);
}

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class lldiv_t {
  quot: number;
  rem: number;
  constructor() {
    this.quot = 0;
    this.rem = 0;
  }
}
(lldiv_t as any).__fieldTypes = ["int64","int64"];
(lldiv_t as any).__fieldNames = ["quot","rem"];
(lldiv_t as any).__fieldOffsets = [0,8];

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class _heapinfo {
  _pentry: number | null;
  _size: number;
  _useflag: number;
  constructor() {
    this._pentry = null;
    this._size = 0;
    this._useflag = 0;
  }
}
const _HEAPINFO = _heapinfo;
type _HEAPINFO = _heapinfo;
(_heapinfo as any).__fieldTypes = ["int64","int64","int32"];
(_heapinfo as any).__fieldNames = ["_pentry","_size","_useflag"];
(_heapinfo as any).__fieldOffsets = [0,8,16];

export function _MarkAllocaS(_Ptr: any, _Marker: number): any | null {
  if (_Ptr) {
    (() => { const __p: any = (((_Ptr))); const __v: any = (((_Marker) >>> 0)); if (__p && __p.__field_ref === true) { __p.value = __v; } else { cptr_write_uint32(__p, 0, __v); } })();
    _Ptr = cptr_offset((_Ptr), 16);
  }
  return cptr_clone(_Ptr);
}

export function _freea(_Memory: any | null): void {
  let _Marker = 0;
  if (_Memory) {
    _Memory = cptr_offset((_Memory), -(16));
    _Marker = ((cptr_read_uint32((_Memory))) >>> 0);
    if ((((_Marker) >>> 0) == ((56797) >>> 0) ? 1 : 0)) {
      free(_Memory);
    }
  }
}

export function strnlen_s(_src: any, _count: number): number {
  return (_src ? strnlen(cptr_clone(_src), ((_count) >>> 0)) : ((0) >>> 0));
}

export function wcsnlen_s(_src: number | null, _count: number): number {
  return (_src ? wcsnlen(_src, ((_count) >>> 0)) : ((0) >>> 0));
}

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
export class sdshdr5 {
  flags: number;
  buf: any[] = [];
  constructor() {
    this.flags = 0;
    this.buf = [];
  }
}
(sdshdr5 as any).__fieldTypes = ["int8","bytes"];
(sdshdr5 as any).__fieldNames = ["flags","buf"];
(sdshdr5 as any).__fieldOffsets = [0,1];
(sdshdr5 as any).__packed = true;

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sdshdr8 {
  len: number;
  alloc: number;
  flags: number;
  buf: any[] = [];
  constructor() {
    this.len = 0;
    this.alloc = 0;
    this.flags = 0;
    this.buf = [];
  }
}
(sdshdr8 as any).__fieldTypes = ["int8","int8","int8","bytes"];
(sdshdr8 as any).__fieldNames = ["len","alloc","flags","buf"];
(sdshdr8 as any).__fieldOffsets = [0,1,2,3];
(sdshdr8 as any).__packed = true;

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sdshdr16 {
  len: number;
  alloc: number;
  flags: number;
  buf: any[] = [];
  constructor() {
    this.len = 0;
    this.alloc = 0;
    this.flags = 0;
    this.buf = [];
  }
}
(sdshdr16 as any).__fieldTypes = ["int16","int16","int8","bytes"];
(sdshdr16 as any).__fieldNames = ["len","alloc","flags","buf"];
(sdshdr16 as any).__fieldOffsets = [0,2,4,5];
(sdshdr16 as any).__packed = true;

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sdshdr32 {
  len: number;
  alloc: number;
  flags: number;
  buf: any[] = [];
  constructor() {
    this.len = 0;
    this.alloc = 0;
    this.flags = 0;
    this.buf = [];
  }
}
(sdshdr32 as any).__fieldTypes = ["int32","int32","int8","bytes"];
(sdshdr32 as any).__fieldNames = ["len","alloc","flags","buf"];
(sdshdr32 as any).__fieldOffsets = [0,4,8,9];
(sdshdr32 as any).__packed = true;

// BRIDGE: struct-as-class — C17 §6.7.2.1 / C++20 [class]
export class sdshdr64 {
  len: number;
  alloc: number;
  flags: number;
  buf: any[] = [];
  constructor() {
    this.len = 0;
    this.alloc = 0;
    this.flags = 0;
    this.buf = [];
  }
}
(sdshdr64 as any).__fieldTypes = ["int64","int64","int8","bytes"];
(sdshdr64 as any).__fieldNames = ["len","alloc","flags","buf"];
(sdshdr64 as any).__fieldOffsets = [0,8,16,17];
(sdshdr64 as any).__packed = true;

export function sdslen(s: any): number {
  if (typeof s === 'string') s = cptr_from_string(s);

  let flags = (((s.buf[(s.off ?? 0) + -1])) & 0xFF);
  switch (((flags) & 0xFF) & 7) {
    case 0:
    {
      return ((((((((flags)) & 0xFF) >> 3) | 0))) >>> 0);
    }
    case 1:
    {
      return (((((__struct_ptr_at((cptr_struct_overlay(sdshdr8, (cptr_offset((s), -((3)))))), 0)).len) & 0xFF)) >>> 0);
    }
    case 2:
    {
      return (((((__struct_ptr_at((cptr_struct_overlay(sdshdr16, (cptr_offset((s), -((5)))))), 0)).len) & 0xFFFF)) >>> 0);
    }
    case 3:
    {
      return (((((__struct_ptr_at((cptr_struct_overlay(sdshdr32, (cptr_offset((s), -((9)))))), 0)).len) >>> 0)) >>> 0);
    }
    case 4:
    {
      return /* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at((cptr_struct_overlay(sdshdr64, (cptr_offset((s), -((17)))))), 0)).len;
    }
  }
  return ((0) >>> 0);
}

export function sdsavail(s: any): number {
  if (typeof s === 'string') s = cptr_from_string(s);

  let flags = (((s.buf[(s.off ?? 0) + -1])) & 0xFF);
  switch (((flags) & 0xFF) & 7) {
    case 0:
      {
        return ((0) >>> 0);
      }
    case 1:
      {
        let sh = cptr_struct_overlay(sdshdr8, ((cptr_offset((s), -((3)))))); /* &ref */
        return ((i32((((__struct_ptr_at(sh, 0)).alloc) & 0xFF) - (((__struct_ptr_at(sh, 0)).len) & 0xFF))) >>> 0);
      }
    case 2:
      {
        let sh = cptr_struct_overlay(sdshdr16, ((cptr_offset((s), -((5)))))); /* &ref */
        return ((i32((((__struct_ptr_at(sh, 0)).alloc) & 0xFFFF) - (((__struct_ptr_at(sh, 0)).len) & 0xFFFF))) >>> 0);
      }
    case 3:
      {
        let sh = cptr_struct_overlay(sdshdr32, ((cptr_offset((s), -((9)))))); /* &ref */
        return ((u32((((__struct_ptr_at(sh, 0)).alloc) >>> 0) - (((__struct_ptr_at(sh, 0)).len) >>> 0))) >>> 0);
      }
    case 4:
      {
        let sh = cptr_struct_overlay(sdshdr64, ((cptr_offset((s), -((17)))))); /* &ref */
        return Number(__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(sh, 0)).alloc) - __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(sh, 0)).len))));
      }
  }
  return ((0) >>> 0);
}

export function sdssetlen(s: any, newlen: number): void {
  if (typeof s === 'string') s = cptr_from_string(s);

  let flags = (((s.buf[(s.off ?? 0) + -1])) & 0xFF);
  switch (((flags) & 0xFF) & 7) {
    case 0:
      {
        let fp = cptr_offset(((s)), -(1)); /* &ref */
        fp.buf[fp.off] = (((((0) >>> 0) | ((((newlen) >>> 0) * Math.pow(2, 3)))) & 0xFF)) & 0xFF;
      }
    break;
    case 1:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr8, (cptr_offset((s), -((3)))))), 0)).len = (((((newlen) >>> 0)) & 0xFF)) & 0xFF;
    break;
    }
    case 2:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr16, (cptr_offset((s), -((5)))))), 0)).len = (((((newlen) >>> 0)) & 0xFFFF)) & 0xFFFF;
    break;
    }
    case 3:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr32, (cptr_offset((s), -((9)))))), 0)).len = ((((newlen) >>> 0)) >>> 0);
    break;
    }
    case 4:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr64, (cptr_offset((s), -((17)))))), 0)).len = ((newlen) >>> 0);
    break;
    }
  }
}

export function sdsinclen(s: any, inc: number): void {
  if (typeof s === 'string') s = cptr_from_string(s);

  let flags = (((s.buf[(s.off ?? 0) + -1])) & 0xFF);
  switch (((flags) & 0xFF) & 7) {
    case 0:
      {
        let fp = cptr_offset(((s)), -(1)); /* &ref */
        let newlen = ((((((((((flags)) & 0xFF) >> 3) | 0))) >>> 0) + ((inc) >>> 0)) & 0xFF);
        fp.buf[fp.off] = (((0 | (((((newlen) & 0xFF) << 3) | 0))) & 0xFF)) & 0xFF;
      }
    break;
    case 1:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr8, (cptr_offset((s), -((3)))))), 0)).len = u32((__struct_ptr_at((cptr_struct_overlay(sdshdr8, (cptr_offset((s), -((3)))))), 0)).len + ((inc) >>> 0));
    break;
    }
    case 2:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr16, (cptr_offset((s), -((5)))))), 0)).len = u32((__struct_ptr_at((cptr_struct_overlay(sdshdr16, (cptr_offset((s), -((5)))))), 0)).len + ((inc) >>> 0));
    break;
    }
    case 3:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr32, (cptr_offset((s), -((9)))))), 0)).len = u32((__struct_ptr_at((cptr_struct_overlay(sdshdr32, (cptr_offset((s), -((9)))))), 0)).len + ((inc) >>> 0));
    break;
    }
    case 4:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr64, (cptr_offset((s), -((17)))))), 0)).len = Number(__u64(__as_bigint((__struct_ptr_at((cptr_struct_overlay(sdshdr64, (cptr_offset((s), -((17)))))), 0)).len) + __as_bigint(((inc) >>> 0))));
    break;
    }
  }
}

export function sdsalloc(s: any): number {
  if (typeof s === 'string') s = cptr_from_string(s);

  let flags = (((s.buf[(s.off ?? 0) + -1])) & 0xFF);
  switch (((flags) & 0xFF) & 7) {
    case 0:
    {
      return ((((((((flags)) & 0xFF) >> 3) | 0))) >>> 0);
    }
    case 1:
    {
      return (((((__struct_ptr_at((cptr_struct_overlay(sdshdr8, (cptr_offset((s), -((3)))))), 0)).alloc) & 0xFF)) >>> 0);
    }
    case 2:
    {
      return (((((__struct_ptr_at((cptr_struct_overlay(sdshdr16, (cptr_offset((s), -((5)))))), 0)).alloc) & 0xFFFF)) >>> 0);
    }
    case 3:
    {
      return (((((__struct_ptr_at((cptr_struct_overlay(sdshdr32, (cptr_offset((s), -((9)))))), 0)).alloc) >>> 0)) >>> 0);
    }
    case 4:
    {
      return /* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at((cptr_struct_overlay(sdshdr64, (cptr_offset((s), -((17)))))), 0)).alloc;
    }
  }
  return ((0) >>> 0);
}

export function sdssetalloc(s: any, newlen: number): void {
  if (typeof s === 'string') s = cptr_from_string(s);

  let flags = (((s.buf[(s.off ?? 0) + -1])) & 0xFF);
  switch (((flags) & 0xFF) & 7) {
    case 0:
    {
      break;
    }
    case 1:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr8, (cptr_offset((s), -((3)))))), 0)).alloc = (((((newlen) >>> 0)) & 0xFF)) & 0xFF;
    break;
    }
    case 2:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr16, (cptr_offset((s), -((5)))))), 0)).alloc = (((((newlen) >>> 0)) & 0xFFFF)) & 0xFFFF;
    break;
    }
    case 3:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr32, (cptr_offset((s), -((9)))))), 0)).alloc = ((((newlen) >>> 0)) >>> 0);
    break;
    }
    case 4:
    {
      (__struct_ptr_at((cptr_struct_overlay(sdshdr64, (cptr_offset((s), -((17)))))), 0)).alloc = ((newlen) >>> 0);
    break;
    }
  }
}

export const SDS_NOINIT = cptr_from_string("SDS_NOINIT"); /* &ref */
export function sdsHdrSize(type: number): number {
  switch (((type) << 24 >> 24) & 7) {
    case 0:
    {
      return 1;
    }
    case 1:
    {
      return 3;
    }
    case 2:
    {
      return 5;
    }
    case 3:
    {
      return 9;
    }
    case 4:
    {
      return 17;
    }
  }
  return 0;
}

export function sdsReqType(string_size: number): number {
  if ((((string_size) >>> 0) < ((((1 << 5) | 0)) >>> 0) ? 1 : 0)) {
    return ((0) << 24 >> 24);
  }
  if ((((string_size) >>> 0) < ((((1 << 8) | 0)) >>> 0) ? 1 : 0)) {
    return ((1) << 24 >> 24);
  }
  if ((((string_size) >>> 0) < ((((1 << 16) | 0)) >>> 0) ? 1 : 0)) {
    return ((2) << 24 >> 24);
  }
  return ((3) << 24 >> 24);
}

export function sdsnewlen(init: any | null, initlen: number): any {
  let sh = null;
  let s = undefined;
  let type = sdsReqType(((initlen) >>> 0));
  if ((((((type) << 24 >> 24) == 0 ? 1 : 0) && (((initlen) >>> 0) == ((0) >>> 0) ? 1 : 0)) ? 1 : 0)) {
    type = (((1) << 24 >> 24)) << 24 >> 24;
  }
  let hdrlen = sdsHdrSize(((type) << 24 >> 24));
  let fp = null;
  sh = malloc(((hdrlen) >>> 0) + ((initlen) >>> 0) + ((1) >>> 0));
  if ((cptr_eq(sh, (null)) ? 1 : 0)) {
    return null;
  }
  if ((cptr_eq(init, SDS_NOINIT) ? 1 : 0)) {
    init = null;
  } else {
    if ((!init ? 1 : 0)) {
      memset(sh, 0, ((hdrlen) >>> 0) + ((initlen) >>> 0) + ((1) >>> 0));
    }
  }
  s = cptr_offset((sh), hdrlen);
  fp = cptr_offset(((s)), -(1));
  switch (((type) << 24 >> 24)) {
    case 0:
      {
        fp.buf[fp.off] = (((((((type) << 24 >> 24)) >>> 0) | ((((initlen) >>> 0) * Math.pow(2, 3)))) & 0xFF)) & 0xFF;
        break;
      }
    case 1:
      {
        let sh = cptr_struct_overlay(sdshdr8, ((cptr_offset((s), -((3)))))); /* &ref */
        (__struct_ptr_at(sh, 0)).len = (((((initlen) >>> 0)) & 0xFF)) & 0xFF;
        (__struct_ptr_at(sh, 0)).alloc = (((((initlen) >>> 0)) & 0xFF)) & 0xFF;
        fp.buf[fp.off] = (((((type) << 24 >> 24)) & 0xFF)) & 0xFF;
        break;
      }
    case 2:
      {
        let sh = cptr_struct_overlay(sdshdr16, ((cptr_offset((s), -((5)))))); /* &ref */
        (__struct_ptr_at(sh, 0)).len = (((((initlen) >>> 0)) & 0xFFFF)) & 0xFFFF;
        (__struct_ptr_at(sh, 0)).alloc = (((((initlen) >>> 0)) & 0xFFFF)) & 0xFFFF;
        fp.buf[fp.off] = (((((type) << 24 >> 24)) & 0xFF)) & 0xFF;
        break;
      }
    case 3:
      {
        let sh = cptr_struct_overlay(sdshdr32, ((cptr_offset((s), -((9)))))); /* &ref */
        (__struct_ptr_at(sh, 0)).len = ((((initlen) >>> 0)) >>> 0);
        (__struct_ptr_at(sh, 0)).alloc = ((((initlen) >>> 0)) >>> 0);
        fp.buf[fp.off] = (((((type) << 24 >> 24)) & 0xFF)) & 0xFF;
        break;
      }
    case 4:
      {
        let sh = cptr_struct_overlay(sdshdr64, ((cptr_offset((s), -((17)))))); /* &ref */
        (__struct_ptr_at(sh, 0)).len = ((initlen) >>> 0);
        (__struct_ptr_at(sh, 0)).alloc = ((initlen) >>> 0);
        fp.buf[fp.off] = (((((type) << 24 >> 24)) & 0xFF)) & 0xFF;
        break;
      }
  }
  if (((((initlen) >>> 0) && init) ? 1 : 0)) {
    memcpy(s, init, ((initlen) >>> 0));
  }
  s.buf[(s.off ?? 0) + ((initlen) >>> 0)] = (((0) << 24 >> 24)) << 24 >> 24;
  return cptr_clone(s);
}

export function sdsempty(): any {
  return cptr_clone(sdsnewlen("", ((0) >>> 0)));
}

export function sdsnew(init: any): any {
  let initlen = (((cptr_eq(init, (null)) ? 1 : 0)) ? 0 : strlen(cptr_clone(init)));
  return cptr_clone(sdsnewlen(init, ((initlen) >>> 0)));
}

export function sdsdup(s: any): any {
  if (typeof s === 'string') s = cptr_from_string(s);

  return cptr_clone(sdsnewlen(s, sdslen(s)));
}

export function sdsfree(s: any): void {
  if (typeof s === 'string') s = cptr_from_string(s);

  if ((s == (null) ? 1 : 0)) {
    return;
  }
  free(cptr_offset((s), -(sdsHdrSize((s.buf[(s.off ?? 0) + -1])))));
}

export function sdsupdatelen(s: any): void {
  if (typeof s === 'string') s = cptr_from_string(s);

  let reallen = strlen(cptr_clone(s));
  sdssetlen(s, ((reallen) >>> 0));
}

export function sdsclear(s: any): void {
  if (typeof s === 'string') s = cptr_from_string(s);

  sdssetlen(s, ((0) >>> 0));
  s.buf[(s.off ?? 0) + 0] = (((0) << 24 >> 24)) << 24 >> 24;
}

export function sdsMakeRoomFor(s: any, addlen: number): any {
  if (typeof s === 'string') s = cptr_from_string(s);

  let sh = null;
  let newsh = null;
  let avail = sdsavail(s);
  let len = 0;
  let newlen = 0;
  let reqlen = 0;
  let type = 0;
  let oldtype = ((s.buf[(s.off ?? 0) + -1]) & 7);
  let hdrlen = 0;
  if ((((Number(BigInt.asUintN(32, __as_bigint(avail)))) >>> 0) >= ((addlen) >>> 0) ? 1 : 0)) {
    return cptr_clone(s);
  }
  len = sdslen(s);
  sh = cptr_offset((s), -(sdsHdrSize(((oldtype) << 24 >> 24))));
  reqlen = newlen = (((len) >>> 0) + ((addlen) >>> 0));
  if ((((newlen) >>> 0) < (((Math.imul(1024, 1024))) >>> 0) ? 1 : 0)) {
    newlen *= ((2) >>> 0);
  } else {
    newlen += (((Math.imul(1024, 1024))) >>> 0);
  }
  type = (sdsReqType(((newlen) >>> 0))) << 24 >> 24;
  if ((((type) << 24 >> 24) == 0 ? 1 : 0)) {
    type = (((1) << 24 >> 24)) << 24 >> 24;
  }
  hdrlen = sdsHdrSize(((type) << 24 >> 24));
  ((((((!(!((((hdrlen) >>> 0) + ((newlen) >>> 0) + ((1) >>> 0) > ((reqlen) >>> 0) ? 1 : 0)) ? 1 : 0) ? 1 : 0)) || (((): any => { _assert("hdrlen + newlen + 1 > reqlen", "sds.c", ((230) >>> 0)); return 0; })())) ? 1 : 0)));
  if ((((oldtype) << 24 >> 24) == ((type) << 24 >> 24) ? 1 : 0)) {
    newsh = realloc(sh, ((hdrlen) >>> 0) + ((newlen) >>> 0) + ((1) >>> 0));
    if ((cptr_eq(newsh, (null)) ? 1 : 0)) {
      return null;
    }
    s = cptr_offset((newsh), hdrlen);
  } else {
    newsh = malloc(((hdrlen) >>> 0) + ((newlen) >>> 0) + ((1) >>> 0));
    if ((cptr_eq(newsh, (null)) ? 1 : 0)) {
      return null;
    }
    memcpy(cptr_offset((newsh), hdrlen), s, ((len) >>> 0) + ((1) >>> 0));
    free(sh);
    s = cptr_offset((newsh), hdrlen);
    s.buf[(s.off ?? 0) + -1] = (((type) << 24 >> 24)) << 24 >> 24;
    sdssetlen(s, ((len) >>> 0));
  }
  sdssetalloc(s, ((newlen) >>> 0));
  return cptr_clone(s);
}

export function sdsRemoveFreeSpace(s: any): any {
  if (typeof s === 'string') s = cptr_from_string(s);

  let sh = null;
  let newsh = null;
  let type = 0;
  let oldtype = ((s.buf[(s.off ?? 0) + -1]) & 7);
  let hdrlen = 0;
  let oldhdrlen = sdsHdrSize(((oldtype) << 24 >> 24));
  let len = sdslen(s);
  let avail = sdsavail(s);
  sh = cptr_offset((s), -(oldhdrlen));
  if ((((Number(BigInt.asUintN(32, __as_bigint(avail)))) >>> 0) == ((0) >>> 0) ? 1 : 0)) {
    return cptr_clone(s);
  }
  type = (sdsReqType(((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0))) << 24 >> 24;
  hdrlen = sdsHdrSize(((type) << 24 >> 24));
  if ((((((oldtype) << 24 >> 24) == ((type) << 24 >> 24) ? 1 : 0) || (((type) << 24 >> 24) > 1 ? 1 : 0)) ? 1 : 0)) {
    newsh = realloc(sh, ((oldhdrlen) >>> 0) + ((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0) + ((1) >>> 0));
    if ((cptr_eq(newsh, (null)) ? 1 : 0)) {
      return null;
    }
    s = cptr_offset((newsh), oldhdrlen);
  } else {
    newsh = malloc(((hdrlen) >>> 0) + ((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0) + ((1) >>> 0));
    if ((cptr_eq(newsh, (null)) ? 1 : 0)) {
      return null;
    }
    memcpy(cptr_offset((newsh), hdrlen), s, ((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0) + ((1) >>> 0));
    free(sh);
    s = cptr_offset((newsh), hdrlen);
    s.buf[(s.off ?? 0) + -1] = (((type) << 24 >> 24)) << 24 >> 24;
    sdssetlen(s, ((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0));
  }
  sdssetalloc(s, ((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0));
  return cptr_clone(s);
}

export function sdsAllocSize(s: any): number {
  if (typeof s === 'string') s = cptr_from_string(s);

  let alloc = sdsalloc(s);
  return ((sdsHdrSize((s.buf[(s.off ?? 0) + -1]))) >>> 0) + ((Number(BigInt.asUintN(32, __as_bigint(alloc)))) >>> 0) + ((1) >>> 0);
}

export function sdsAllocPtr(s: any): any | null {
  if (typeof s === 'string') s = cptr_from_string(s);

  return cptr_clone(((cptr_offset(s, -(sdsHdrSize((s.buf[(s.off ?? 0) + -1])))))));
}

export function sdsIncrLen(s: any, incr: number): void {
  if (typeof s === 'string') s = cptr_from_string(s);

  let flags = (((s.buf[(s.off ?? 0) + -1])) & 0xFF);
  let len = 0;
  switch (((flags) & 0xFF) & 7) {
    case 0:
      {
        let fp = cptr_offset(((s)), -(1)); /* &ref */
        let oldlen = ((((((((flags)) & 0xFF) >> 3) | 0))) & 0xFF);
        ((((((!(!(((((((incr > 0 ? 1 : 0) && (((oldlen) & 0xFF) + incr < 32 ? 1 : 0)) ? 1 : 0)) || ((((incr < 0 ? 1 : 0) && (((((oldlen) & 0xFF)) >>> 0) >= ((Number(BigInt.asUintN(32, __as_bigint((-incr))))) >>> 0) ? 1 : 0)) ? 1 : 0))) ? 1 : 0)) ? 1 : 0) ? 1 : 0)) || (((): any => { _assert("(incr > 0 && oldlen+incr < 32) || (incr < 0 && oldlen >= (unsigned int)(-incr))", "sds.c", ((341) >>> 0)); return 0; })())) ? 1 : 0)));
        fp.buf[fp.off] = (((0 | (((((oldlen) & 0xFF) + incr) * Math.pow(2, 3)))) & 0xFF)) & 0xFF;
        len = ((((oldlen) & 0xFF) + incr) >>> 0);
        break;
      }
    case 1:
      {
        let sh = cptr_struct_overlay(sdshdr8, ((cptr_offset((s), -((3)))))); /* &ref */
        ((((((!(!(((((((incr >= 0 ? 1 : 0) && (i32((((__struct_ptr_at(sh, 0)).alloc) & 0xFF) - (((__struct_ptr_at(sh, 0)).len) & 0xFF)) >= incr ? 1 : 0)) ? 1 : 0)) || ((((incr < 0 ? 1 : 0) && ((((((__struct_ptr_at(sh, 0)).len) & 0xFF)) >>> 0) >= ((Number(BigInt.asUintN(32, __as_bigint((-incr))))) >>> 0) ? 1 : 0)) ? 1 : 0))) ? 1 : 0)) ? 1 : 0) ? 1 : 0)) || (((): any => { _assert("(incr >= 0 && sh->alloc-sh->len >= incr) || (incr < 0 && sh->len >= (unsigned int)(-incr))", "sds.c", ((348) >>> 0)); return 0; })())) ? 1 : 0)));
        len = ((((__struct_ptr_at(sh, 0)).len = u32((__struct_ptr_at(sh, 0)).len + incr))) >>> 0);
        break;
      }
    case 2:
      {
        let sh = cptr_struct_overlay(sdshdr16, ((cptr_offset((s), -((5)))))); /* &ref */
        ((((((!(!(((((((incr >= 0 ? 1 : 0) && (i32((((__struct_ptr_at(sh, 0)).alloc) & 0xFFFF) - (((__struct_ptr_at(sh, 0)).len) & 0xFFFF)) >= incr ? 1 : 0)) ? 1 : 0)) || ((((incr < 0 ? 1 : 0) && ((((((__struct_ptr_at(sh, 0)).len) & 0xFFFF)) >>> 0) >= ((Number(BigInt.asUintN(32, __as_bigint((-incr))))) >>> 0) ? 1 : 0)) ? 1 : 0))) ? 1 : 0)) ? 1 : 0) ? 1 : 0)) || (((): any => { _assert("(incr >= 0 && sh->alloc-sh->len >= incr) || (incr < 0 && sh->len >= (unsigned int)(-incr))", "sds.c", ((354) >>> 0)); return 0; })())) ? 1 : 0)));
        len = ((((__struct_ptr_at(sh, 0)).len = u32((__struct_ptr_at(sh, 0)).len + incr))) >>> 0);
        break;
      }
    case 3:
      {
        let sh = cptr_struct_overlay(sdshdr32, ((cptr_offset((s), -((9)))))); /* &ref */
        ((((((!(!(((((((incr >= 0 ? 1 : 0) && (u32((((__struct_ptr_at(sh, 0)).alloc) >>> 0) - (((__struct_ptr_at(sh, 0)).len) >>> 0)) >= ((Number(BigInt.asUintN(32, __as_bigint(incr)))) >>> 0) ? 1 : 0)) ? 1 : 0)) || ((((incr < 0 ? 1 : 0) && ((((__struct_ptr_at(sh, 0)).len) >>> 0) >= ((Number(BigInt.asUintN(32, __as_bigint((-incr))))) >>> 0) ? 1 : 0)) ? 1 : 0))) ? 1 : 0)) ? 1 : 0) ? 1 : 0)) || (((): any => { _assert("(incr >= 0 && sh->alloc-sh->len >= (unsigned int)incr) || (incr < 0 && sh->len >= (unsigned int)(-incr))", "sds.c", ((360) >>> 0)); return 0; })())) ? 1 : 0)));
        len = ((((__struct_ptr_at(sh, 0)).len = u32((__struct_ptr_at(sh, 0)).len + incr))) >>> 0);
        break;
      }
    case 4:
      {
        let sh = cptr_struct_overlay(sdshdr64, ((cptr_offset((s), -((17)))))); /* &ref */
        ((((((!(!(((((((incr >= 0 ? 1 : 0) && ((__as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(sh, 0)).alloc) - __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(sh, 0)).len))) >= __as_bigint(__u64(__as_bigint(incr)))) ? 1 : 0)) ? 1 : 0)) || ((((incr < 0 ? 1 : 0) && ((__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ (__struct_ptr_at(sh, 0)).len) >= __as_bigint(__u64(__as_bigint((-incr))))) ? 1 : 0)) ? 1 : 0))) ? 1 : 0)) ? 1 : 0) ? 1 : 0)) || (((): any => { _assert("(incr >= 0 && sh->alloc-sh->len >= (uint64_t)incr) || (incr < 0 && sh->len >= (uint64_t)(-incr))", "sds.c", ((366) >>> 0)); return 0; })())) ? 1 : 0)));
        len = Number(((__struct_ptr_at(sh, 0)).len = Number(__u64(__as_bigint((__struct_ptr_at(sh, 0)).len) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ incr)))));
        break;
      }
    default:
    {
      len = ((0) >>> 0);
    }
  }
  s.buf[(s.off ?? 0) + ((len) >>> 0)] = (((0) << 24 >> 24)) << 24 >> 24;
}

export function sdsgrowzero(s: any, len: number): any {
  if (typeof s === 'string') s = cptr_from_string(s);

  let curlen = sdslen(s);
  if ((((len) >>> 0) <= ((Number(BigInt.asUintN(32, __as_bigint(curlen)))) >>> 0) ? 1 : 0)) {
    return cptr_clone(s);
  }
  s = sdsMakeRoomFor(s, ((len) >>> 0) - ((Number(BigInt.asUintN(32, __as_bigint(curlen)))) >>> 0));
  if ((s == (null) ? 1 : 0)) {
    return null;
  }
  memset(cptr_offset(s, Number(((Number(BigInt.asUintN(32, __as_bigint(curlen)))) >>> 0))), 0, (((len) >>> 0) - ((Number(BigInt.asUintN(32, __as_bigint(curlen)))) >>> 0) + ((1) >>> 0)));
  sdssetlen(s, ((len) >>> 0));
  return cptr_clone(s);
}

export function sdscatlen(s: any, t: any | null, len: number): any {
  if (typeof s === 'string') s = cptr_from_string(s);

  let curlen = sdslen(s);
  s = sdsMakeRoomFor(s, ((len) >>> 0));
  if ((s == (null) ? 1 : 0)) {
    return null;
  }
  memcpy(cptr_offset(s, Number(((Number(BigInt.asUintN(32, __as_bigint(curlen)))) >>> 0))), t, ((len) >>> 0));
  sdssetlen(s, ((Number(BigInt.asUintN(32, __as_bigint(curlen)))) >>> 0) + ((len) >>> 0));
  s.buf[(s.off ?? 0) + Number(((Number(BigInt.asUintN(32, __as_bigint(curlen)))) >>> 0) + ((len) >>> 0))] = (((0) << 24 >> 24)) << 24 >> 24;
  return cptr_clone(s);
}

export function sdscat(s: any, t: any): any {
  if (typeof s === 'string') s = cptr_from_string(s);

  return cptr_clone(sdscatlen(s, t, strlen(cptr_clone(t))));
}

export function sdscatsds(s: any, t: any): any {
  if (typeof s === 'string') s = cptr_from_string(s);

  return cptr_clone(sdscatlen(s, t, sdslen(t)));
}

export function sdscpylen(s: any, t: any, len: number): any {
  if (typeof s === 'string') s = cptr_from_string(s);

  if ((sdsalloc(s) < ((len) >>> 0) ? 1 : 0)) {
    s = sdsMakeRoomFor(s, ((len) >>> 0) - sdslen(s));
    if ((s == (null) ? 1 : 0)) {
      return null;
    }
  }
  memcpy(s, t, ((len) >>> 0));
  s.buf[(s.off ?? 0) + ((len) >>> 0)] = (((0) << 24 >> 24)) << 24 >> 24;
  sdssetlen(s, ((len) >>> 0));
  return cptr_clone(s);
}

export function sdscpy(s: any, t: any): any {
  return cptr_clone(sdscpylen(s, cptr_clone(t), strlen(cptr_clone(t))));
}

export function sdsll2str(s: any, value: number): number {
  let p = null;
  let aux = 0;
  let v = 0;
  let l = 0;
  if (((__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ value) < __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 0)) ? 1 : 0)) {
    if (((__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ value) != __as_bigint((__i64(__as_bigint(__i64(-__as_bigint(9223372036854775807n))) - __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 1))))) ? 1 : 0)) {
      v = /* WARNING: 64-bit integer may lose precision beyond 2^53 */ Number(__i64(-__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ value)));
    } else {
      v = Number(__u64(__as_bigint((__u64(__as_bigint(9223372036854775807n)))) + __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 1)));
    }
  } else {
    v = /* WARNING: 64-bit integer may lose precision beyond 2^53 */ /* WARNING: 64-bit integer may lose precision beyond 2^53 */ value;
  }
  p = cptr_clone(s);
  do {
    (p.buf[p.off++]) = (((Number(BigInt.asUintN(32, __as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 48) + __as_bigint((__safe_mod_i64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v), __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 10))))))))) << 24 >> 24)) << 24 >> 24;
    v = Number(__safe_div_i64(__as_bigint(v), __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 10)));
  } while (/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v);
  if (((__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ value) < __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 0)) ? 1 : 0)) {
    (p.buf[p.off++]) = (((45) << 24 >> 24)) << 24 >> 24;
  }
  l = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(p, s)) >>> 0);
  p.buf[p.off] = (((0) << 24 >> 24)) << 24 >> 24;
  p.off--;
  while ((((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(s, p) ? 1 : 0)) {
    aux = ((s.buf[s.off])) << 24 >> 24;
    s.buf[s.off] = (((p.buf[p.off]) << 24 >> 24)) << 24 >> 24;
    p.buf[p.off] = (((aux) << 24 >> 24)) << 24 >> 24;
    s.off++;
    p.off--;
  }
  return ((((l) >>> 0)) | 0);
}

export function sdsull2str(s: any, v: number): number {
  if (typeof s === 'string') s = cptr_from_string(s);

  let p = null;
  let aux = 0;
  let l = 0;
  p = cptr_clone(s);
  do {
    (p.buf[p.off++]) = (((Number(BigInt.asUintN(32, __as_bigint(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 48) + __as_bigint((__safe_mod_i64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v), __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 10))))))))) << 24 >> 24)) << 24 >> 24;
    v = Number(__safe_div_i64(__as_bigint(v), __as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ 10)));
  } while (/* WARNING: 64-bit integer may lose precision beyond 2^53 */ v);
  l = ((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(p, s)) >>> 0);
  p.buf[p.off] = (((0) << 24 >> 24)) << 24 >> 24;
  p.off--;
  while ((((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) < (__r.off ?? 0)); if (__lb || __rb) return (__rt_ptr_to_intptr(__l) < __rt_ptr_to_intptr(__r)); return ((__l ?? 0) < (__r ?? 0)); })(s, p) ? 1 : 0)) {
    aux = ((s.buf[s.off])) << 24 >> 24;
    s.buf[s.off] = (((p.buf[p.off]) << 24 >> 24)) << 24 >> 24;
    p.buf[p.off] = (((aux) << 24 >> 24)) << 24 >> 24;
    s.off++;
    p.off--;
  }
  return ((((l) >>> 0)) | 0);
}

export function sdsfromlonglong(value: number): any {
  let buf = cptr_create(21);
  let len = sdsll2str(cptr_clone(buf), /* WARNING: 64-bit integer may lose precision beyond 2^53 */ value);
  return cptr_clone(sdsnewlen(buf, ((len) >>> 0)));
}

export function sdscatvprintf(s: any, fmt: any, ap: any): any {
  let cpy = undefined;
  let staticbuf = cptr_create(1024);
  let buf = cptr_clone(cptr_clone(staticbuf)); /* &ref */
  let t = null;
  let buflen = strlen(cptr_clone(fmt)) * 2;
  let bufstrlen = 0;
  if ((((buflen) >>> 0) > 1024 ? 1 : 0)) {
    buf = cptr_clone(malloc(((buflen) >>> 0)));
    if ((cptr_eq(buf, (null)) ? 1 : 0)) {
      return null;
    }
  } else {
    buflen = 1024;
  }
  while (1) {
    (cpy = __va_copy_new(ap));
    bufstrlen = vsnprintf(buf, ((buflen) >>> 0), cptr_clone(fmt), cpy);
    undefined /* va_end no-op */;
    if ((bufstrlen < 0 ? 1 : 0)) {
      if ((!cptr_eq(buf, staticbuf) ? 1 : 0)) {
        free(buf);
      }
      return null;
    }
    if (((((Math.trunc(+(bufstrlen))) >>> 0)) >= ((buflen) >>> 0) ? 1 : 0)) {
      if ((!cptr_eq(buf, staticbuf) ? 1 : 0)) {
        free(buf);
      }
      buflen = (((Math.trunc(+(bufstrlen))) >>> 0)) + ((1) >>> 0);
      buf = cptr_clone(malloc(((buflen) >>> 0)));
      if ((cptr_eq(buf, (null)) ? 1 : 0)) {
        return null;
      }
      continue;
    }
    break;
  }
  t = (typeof sdscatlen(s, buf, ((bufstrlen) >>> 0)) === 'string' ? cptr_from_string(sdscatlen(s, buf, ((bufstrlen) >>> 0))) : sdscatlen(s, buf, ((bufstrlen) >>> 0)));
  if ((!cptr_eq(buf, staticbuf) ? 1 : 0)) {
    free(buf);
  }
  return cptr_clone(t);
}

export function sdscatprintf(s: any, fmt: any, ...__va_args: any[]): any {
  let ap = undefined;
  let t = null;
  (ap = __va_start(__va_args));
  t = (typeof sdscatvprintf(s, cptr_clone(fmt), ap) === 'string' ? cptr_from_string(sdscatvprintf(s, cptr_clone(fmt), ap)) : sdscatvprintf(s, cptr_clone(fmt), ap));
  undefined /* va_end no-op */;
  return cptr_clone(t);
}

export function sdscatfmt(s: any, fmt: any, ...__va_args: any[]): any {
  let initlen = sdslen(s);
  let f = cptr_clone(cptr_clone(fmt)); /* &ref */
  let i = 0;
  let ap = undefined;
  s = sdsMakeRoomFor(s, ((Number(BigInt.asUintN(32, __as_bigint(initlen)))) >>> 0) + strlen(cptr_clone(fmt)) * 2);
  (ap = __va_start(__va_args));
  f = cptr_clone(fmt);
  i = Number(((Number(BigInt.asUintN(32, __as_bigint(((Number(BigInt.asUintN(32, __as_bigint(initlen)))) >>> 0))))) | 0));
  while (((f.buf[f.off]) << 24 >> 24)) {
    let next = 0;
    let str = null;
    let l = 0;
    let num = 0;
    let unum = 0;
    if ((sdsavail(s) == ((0) >>> 0) ? 1 : 0)) {
      s = sdsMakeRoomFor(s, ((1) >>> 0));
    }
    switch (((f.buf[f.off]) << 24 >> 24)) {
      case 37:
      {
        next = ((((cptr_offset(f, 1)).buf[(cptr_offset(f, 1)).off]) << 24 >> 24)) << 24 >> 24;
      if ((((next) << 24 >> 24) == 0 ? 1 : 0)) {
        break;
      }
      f.off++;
      switch (((next) << 24 >> 24)) {
        case 115:
          case 83:
          {
            str = __va_arg(ap, "char *");
        l = Number((((((next) << 24 >> 24) == 115 ? 1 : 0)) ? __as_bigint(strlen(cptr_clone(str))) : __as_bigint(sdslen(cptr_clone(str)))));
        if ((sdsavail(s) < ((l) >>> 0) ? 1 : 0)) {
          s = sdsMakeRoomFor(s, ((l) >>> 0));
        }
        memcpy(cptr_offset(s, i), str, ((l) >>> 0));
        sdsinclen(s, ((l) >>> 0));
        i = i32(i + ((l) >>> 0));
        break;
          }
        case 105:
          case 73:
          {
            if ((((next) << 24 >> 24) == 105 ? 1 : 0)) {
              num = /* WARNING: 64-bit integer may lose precision beyond 2^53 */ __va_arg(ap, "int");
            } else {
              num = __va_arg(ap, "long long");
            }
        {
          {
            let buf = cptr_create(21);
            l = ((sdsll2str(cptr_clone(buf), /* WARNING: 64-bit integer may lose precision beyond 2^53 */ num)) >>> 0);
            if ((sdsavail(s) < ((l) >>> 0) ? 1 : 0)) {
              s = sdsMakeRoomFor(s, ((l) >>> 0));
            }
            memcpy(cptr_offset(s, i), buf, ((l) >>> 0));
            sdsinclen(s, ((l) >>> 0));
            i = i32(i + ((l) >>> 0));
          }
        }
        break;
          }
        case 117:
          case 85:
          {
            if ((((next) << 24 >> 24) == 117 ? 1 : 0)) {
              unum = /* WARNING: 64-bit integer may lose precision beyond 2^53 */ __va_arg(ap, "unsigned int");
            } else {
              unum = __va_arg(ap, "unsigned long long");
            }
        {
          {
            let buf = cptr_create(21);
            l = ((sdsull2str(cptr_clone(buf), /* WARNING: 64-bit integer may lose precision beyond 2^53 */ unum)) >>> 0);
            if ((sdsavail(s) < ((l) >>> 0) ? 1 : 0)) {
              s = sdsMakeRoomFor(s, ((l) >>> 0));
            }
            memcpy(cptr_offset(s, i), buf, ((l) >>> 0));
            sdsinclen(s, ((l) >>> 0));
            i = i32(i + ((l) >>> 0));
          }
        }
        break;
          }
        default:
        {
          s.buf[(s.off ?? 0) + i++] = (((next) << 24 >> 24)) << 24 >> 24;
        sdsinclen(s, ((1) >>> 0));
        break;
        }
      }
      break;
      }
      default:
      {
        s.buf[(s.off ?? 0) + i++] = (((f.buf[f.off]) << 24 >> 24)) << 24 >> 24;
      sdsinclen(s, ((1) >>> 0));
      break;
      }
    }
    f.off++;
  }
  undefined /* va_end no-op */;
  s.buf[(s.off ?? 0) + i] = (((0) << 24 >> 24)) << 24 >> 24;
  return cptr_clone(s);
}

export function sdstrim(s: any, cset: any): any {
  if (typeof s === 'string') s = cptr_from_string(s);

  let end = null;
  let sp = null;
  let ep = null;
  let len = 0;
  sp = (typeof s === 'string' ? cptr_from_string(s) : s);
  ep = end = cptr_offset(cptr_offset(s, sdslen(s)), -(1));
  while ((((((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) <= (__r.off ?? 0)); if (__lb || __rb) return (__rt_ptr_to_intptr(__l) <= __rt_ptr_to_intptr(__r)); return ((__l ?? 0) <= (__r ?? 0)); })(sp, end) ? 1 : 0) && strchr(cptr_clone(cset), ((sp.buf[sp.off]) << 24 >> 24))) ? 1 : 0)) {
    sp.off++;
  }
  while ((((((__l: any, __r: any) => { const __lb = __l && __l.buf; const __rb = __r && __r.buf; if (__lb && __rb && __lb === __rb) return ((__l.off ?? 0) > (__r.off ?? 0)); if (__lb || __rb) return (__rt_ptr_to_intptr(__l) > __rt_ptr_to_intptr(__r)); return ((__l ?? 0) > (__r ?? 0)); })(ep, sp) ? 1 : 0) && strchr(cptr_clone(cset), ((ep.buf[ep.off]) << 24 >> 24))) ? 1 : 0)) {
    ep.off--;
  }
  len = (((((__lp: any, __rp: any) => { const __lb = __lp && __lp.buf; const __rb = __rp && __rp.buf; if (__lb && __rb && __lb !== __rb) return (__rt_ptr_to_intptr(__lp) - __rt_ptr_to_intptr(__rp)); return (((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__lp) - ((__x) => __x == null ? 0 : (typeof __x === 'string' ? 0 : (__x && __x.__field_ref === true ? ((__x.__field_offset ?? 0) + (__x.__byte_delta ?? 0)) : (typeof __x === 'object' && __x.off === undefined ? 0 : (__x.off ?? __x)))))(__rp)); })(ep, sp)) + 1) >>> 0);
  if ((s != sp ? 1 : 0)) {
    memmove(s, sp, ((len) >>> 0));
  }
  s.buf[(s.off ?? 0) + ((len) >>> 0)] = (((0) << 24 >> 24)) << 24 >> 24;
  sdssetlen(s, ((len) >>> 0));
  return cptr_clone(s);
}

export function sdsrange(s: any, start: number, end: number): void {
  if (typeof s === 'string') s = cptr_from_string(s);

  let newlen = 0;
  let len = sdslen(s);
  if ((((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0) == ((0) >>> 0) ? 1 : 0)) {
    return;
  }
  if ((start < 0 ? 1 : 0)) {
    start = Number(((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0) + ((start) >>> 0));
    if ((start < 0 ? 1 : 0)) {
      start = 0;
    }
  }
  if ((end < 0 ? 1 : 0)) {
    end = Number(((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0) + ((end) >>> 0));
    if ((end < 0 ? 1 : 0)) {
      end = 0;
    }
  }
  newlen = (((((start > end ? 1 : 0)) ? 0 : (end - start) + 1)) >>> 0);
  if ((((newlen) >>> 0) != ((0) >>> 0) ? 1 : 0)) {
    if ((start >= Number(BigInt.asIntN(32, __as_bigint(((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0)))) ? 1 : 0)) {
      newlen = ((0) >>> 0);
    } else {
      if ((end >= Number(BigInt.asIntN(32, __as_bigint(((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0)))) ? 1 : 0)) {
        end = Number(((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0) - ((1) >>> 0));
        newlen = (((end - start) + 1) >>> 0);
      }
    }
  }
  if (((start && ((newlen) >>> 0)) ? 1 : 0)) {
    memmove(s, cptr_offset(s, start), ((newlen) >>> 0));
  }
  s.buf[(s.off ?? 0) + ((newlen) >>> 0)] = (((0) << 24 >> 24)) << 24 >> 24;
  sdssetlen(s, ((newlen) >>> 0));
}

export function sdstolower(s: any): void {
  if (typeof s === 'string') s = cptr_from_string(s);

  let len = sdslen(s);
  let j = 0;
  for (j = ((0) >>> 0); (((j) >>> 0) < ((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0) ? 1 : 0); (() => { const _t = j; j = u32(j + 1); return _t; })()) {
    s.buf[(s.off ?? 0) + ((j) >>> 0)] = ((tolower((s.buf[(s.off ?? 0) + ((j) >>> 0)])))) << 24 >> 24;
  }
}

export function sdstoupper(s: any): void {
  if (typeof s === 'string') s = cptr_from_string(s);

  let len = sdslen(s);
  let j = 0;
  for (j = ((0) >>> 0); (((j) >>> 0) < ((Number(BigInt.asUintN(32, __as_bigint(len)))) >>> 0) ? 1 : 0); (() => { const _t = j; j = u32(j + 1); return _t; })()) {
    s.buf[(s.off ?? 0) + ((j) >>> 0)] = ((toupper((s.buf[(s.off ?? 0) + ((j) >>> 0)])))) << 24 >> 24;
  }
}

export function sdscmp(s1: any, s2: any): number {
  let l1 = 0;
  let l2 = 0;
  let minlen = 0;
  let cmp = 0;
  l1 = sdslen(s1);
  l2 = sdslen(s2);
  minlen = (((((l1) >>> 0) < ((l2) >>> 0) ? 1 : 0)) ? ((l1) >>> 0) : ((l2) >>> 0));
  cmp = memcmp(s1, s2, ((minlen) >>> 0));
  if ((cmp == 0 ? 1 : 0)) {
    return ((((l1) >>> 0) > ((l2) >>> 0) ? 1 : 0) ? 1 : (((((l1) >>> 0) < ((l2) >>> 0) ? 1 : 0) ? -1 : 0)));
  }
  return cmp;
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: count.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
export function sdssplitlen(s: any, len: number, sep: any, seplen: number, count: COutParam<number>): any {
  if (typeof sep === 'string') sep = cptr_from_string(sep);

  let elements: number = 0;
  let slots: number = 0;
  let start: number = 0;
  let j: number = 0;
  let tokens: CPtr | null = null;
  let newtokens: CPtr | null = null;
  let i: number = 0;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      elements = 0;
      slots = 5;
      start = 0;
      j = 0;
      tokens = null;
      if ((((seplen < 1 ? 1 : 0) || (len <= 0 ? 1 : 0)) ? 1 : 0)) {
        (() => { const __p: any = (count); const __v: any = (0); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
        return null;
      }
      tokens = malloc(8 * slots);
      if ((cptr_eq(tokens, (null)) ? 1 : 0)) {
        return null;
      }
      for (j = 0; (j < (len - (i32(seplen - 1))) ? 1 : 0); j++) {
        if ((slots < i32(elements + 2) ? 1 : 0)) {
          newtokens = null;
          slots = Math.imul(slots, 2);
          newtokens = realloc(tokens, 8 * slots);
          if ((cptr_eq(newtokens, (null)) ? 1 : 0)) {
            _state = 1; continue _sm; /* goto cleanup */
          }
          tokens = newtokens;
        }
        if (((((((seplen == 1 ? 1 : 0) && (((cptr_offset(s, j)).buf[(cptr_offset(s, j)).off]) == ((sep.buf[(sep.off ?? 0) + 0]) << 24 >> 24) ? 1 : 0)) ? 1 : 0)) || ((memcmp(cptr_offset(s, j), sep, seplen) == 0 ? 1 : 0))) ? 1 : 0)) {
          cptr_write_int8(tokens, elements, sdsnewlen(cptr_offset(s, start), ((i32(j - start)) >>> 0)));
          if ((cptr_read_ptr(tokens, elements) == (null) ? 1 : 0)) {
            _state = 1; continue _sm; /* goto cleanup */
          }
          elements++;
          start = i32(j + seplen);
          j = i32(i32(j + seplen) - 1);
        }
      }
      cptr_write_int8(tokens, elements, sdsnewlen(cptr_offset(s, start), ((len - start) >>> 0)));
      if ((cptr_read_ptr(tokens, elements) == (null) ? 1 : 0)) {
        _state = 1; continue _sm; /* goto cleanup */
      }
      elements++;
      (() => { const __p: any = (count); const __v: any = (elements); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return tokens;
    case 1: /* cleanup */
      i = 0;
      for (i = 0; (i < elements ? 1 : 0); i++) {
        sdsfree(cptr_read_ptr(tokens, i));
      }
      free(tokens);
      (() => { const __p: any = (count); const __v: any = (0); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
      break _sm;
    }
  }
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: tokens.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
export function sdsfreesplitres(tokens: COutParam<CPtr>, count: number): void {
  if ((!tokens ? 1 : 0)) {
    return;
  }
  while (count--) {
    sdsfree(cptr_read_ptr(tokens, count));
  }
  free(tokens);
}

export function sdscatrepr(s: any, p: any, len: number): any {
  if (typeof p === 'string') p = cptr_from_string(p);

  s = sdscatlen(s, "\"", ((1) >>> 0));
  while ((() => { const _t = len; len = u32(len - 1); return _t; })()) {
    switch (((p.buf[p.off]) << 24 >> 24)) {
      case 92:
        case 34:
        {
          s = sdscatprintf(s, "\\%c", ((p.buf[p.off]) << 24 >> 24));
      break;
        }
      case 10:
      {
        s = sdscatlen(s, "\\n", ((2) >>> 0));
      break;
      }
      case 13:
      {
        s = sdscatlen(s, "\\r", ((2) >>> 0));
      break;
      }
      case 9:
      {
        s = sdscatlen(s, "\\t", ((2) >>> 0));
      break;
      }
      case 7:
      {
        s = sdscatlen(s, "\\a", ((2) >>> 0));
      break;
      }
      case 8:
      {
        s = sdscatlen(s, "\\b", ((2) >>> 0));
      break;
      }
      default:
      {
        if (isprint(((p.buf[p.off]) << 24 >> 24))) {
          s = sdscatprintf(s, "%c", ((p.buf[p.off]) << 24 >> 24));
        } else {
          s = sdscatprintf(s, "\\x%02x", ((Math.trunc(+(((p.buf[p.off]) << 24 >> 24)))) & 0xFF));
        }
      break;
      }
    }
    p.off++;
  }
  return cptr_clone(sdscatlen(s, "\"", ((1) >>> 0)));
}

export function is_hex_digit(c: number): number {
  return (((((((((((c) << 24 >> 24) >= 48 ? 1 : 0) && (((c) << 24 >> 24) <= 57 ? 1 : 0)) ? 1 : 0)) || ((((((c) << 24 >> 24) >= 97 ? 1 : 0) && (((c) << 24 >> 24) <= 102 ? 1 : 0)) ? 1 : 0))) ? 1 : 0) || ((((((c) << 24 >> 24) >= 65 ? 1 : 0) && (((c) << 24 >> 24) <= 70 ? 1 : 0)) ? 1 : 0))) ? 1 : 0) ? 1 : 0);
}

export function hex_digit_to_int(c: number): number {
  switch (((c) << 24 >> 24)) {
    case 48:
    {
      return 0;
    }
    case 49:
    {
      return 1;
    }
    case 50:
    {
      return 2;
    }
    case 51:
    {
      return 3;
    }
    case 52:
    {
      return 4;
    }
    case 53:
    {
      return 5;
    }
    case 54:
    {
      return 6;
    }
    case 55:
    {
      return 7;
    }
    case 56:
    {
      return 8;
    }
    case 57:
    {
      return 9;
    }
    case 97:
      case 65:
      {
        return 10;
      }
    case 98:
      case 66:
      {
        return 11;
      }
    case 99:
      case 67:
      {
        return 12;
      }
    case 100:
      case 68:
      {
        return 13;
      }
    case 101:
      case 69:
      {
        return 14;
      }
    case 102:
      case 70:
      {
        return 15;
      }
    default:
    {
      return 0;
    }
  }
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: argc.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
export function sdssplitargs(line: any, argc: COutParam<number>): any {
  let p: CPtr = null;
  let current: CPtr = null;
  let vector: CPtr | null = null;
  let inq: number = 0;
  let insq: number = 0;
  let done: number = 0;
  let byte = (() => { const __b = new Uint8Array(4); new DataView(__b.buffer).setInt32(0, 0, true); return { buf: __b, off: 0 }; })();
  let c: number = 0;
  let _state = 0;
  _sm: while (true) {
    switch (_state) {
    case 0:
      p = cptr_clone(cptr_clone(line)); /* &ref */
      current = null; /* &ref */
      vector = null; /* &ref */
      (() => { const __p: any = (argc); const __v: any = (0); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      while (1) {
        while (((((p.buf[p.off]) << 24 >> 24) && isspace(((p.buf[p.off]) << 24 >> 24))) ? 1 : 0)) {
          p.off++;
        }
        if (((p.buf[p.off]) << 24 >> 24)) {
          inq = 0;
          insq = 0;
          done = 0;
          if ((cptr_eq(current, (null)) ? 1 : 0)) {
            current = (typeof sdsempty() === 'string' ? cptr_from_string(sdsempty()) : sdsempty());
          }
          while ((!done ? 1 : 0)) {
            if (inq) {
              if ((((((((((p.buf[p.off]) << 24 >> 24) == 92 ? 1 : 0) && ((((cptr_offset(p, 1)).buf[(cptr_offset(p, 1)).off]) << 24 >> 24) == 120 ? 1 : 0)) ? 1 : 0) && is_hex_digit((((cptr_offset(p, 2)).buf[(cptr_offset(p, 2)).off]) << 24 >> 24))) ? 1 : 0) && is_hex_digit((((cptr_offset(p, 3)).buf[(cptr_offset(p, 3)).off]) << 24 >> 24))) ? 1 : 0)) {
                let _byte = 0;
                new DataView(byte.buf.buffer, byte.buf.byteOffset).setInt32(0, ((i32((Math.imul(hex_digit_to_int((((cptr_offset(p, 2)).buf[(cptr_offset(p, 2)).off]) << 24 >> 24)), 16)) + hex_digit_to_int((((cptr_offset(p, 3)).buf[(cptr_offset(p, 3)).off]) << 24 >> 24)))) & 0xFF), true);
                current = (typeof sdscatlen(cptr_clone(current), (() => { const __b = new Uint8Array(1); new DataView(__b.buffer).setUint8(0, _byte); return { buf: __b, off: 0 }; })(), ((1) >>> 0)) === 'string' ? cptr_from_string(sdscatlen(cptr_clone(current), (() => { const __b = new Uint8Array(1); new DataView(__b.buffer).setUint8(0, _byte); return { buf: __b, off: 0 }; })(), ((1) >>> 0))) : sdscatlen(cptr_clone(current), (() => { const __b = new Uint8Array(1); new DataView(__b.buffer).setUint8(0, _byte); return { buf: __b, off: 0 }; })(), ((1) >>> 0)));
                p = cptr_offset(p, 3);
              } else {
                if ((((((p.buf[p.off]) << 24 >> 24) == 92 ? 1 : 0) && (((cptr_offset(p, 1)).buf[(cptr_offset(p, 1)).off]) << 24 >> 24)) ? 1 : 0)) {
                  c = 0;
                  p.off++;
                  switch (((p.buf[p.off]) << 24 >> 24)) {
                    case 110:
                    {
                      c = (((10) << 24 >> 24)) << 24 >> 24;
                    break;
                    }
                    case 114:
                    {
                      c = (((13) << 24 >> 24)) << 24 >> 24;
                    break;
                    }
                    case 116:
                    {
                      c = (((9) << 24 >> 24)) << 24 >> 24;
                    break;
                    }
                    case 98:
                    {
                      c = (((8) << 24 >> 24)) << 24 >> 24;
                    break;
                    }
                    case 97:
                    {
                      c = (((7) << 24 >> 24)) << 24 >> 24;
                    break;
                    }
                    default:
                    {
                      c = (((p.buf[p.off]) << 24 >> 24)) << 24 >> 24;
                    break;
                    }
                  }
                  current = (typeof sdscatlen(cptr_clone(current), c, ((1) >>> 0)) === 'string' ? cptr_from_string(sdscatlen(cptr_clone(current), c, ((1) >>> 0))) : sdscatlen(cptr_clone(current), c, ((1) >>> 0)));
                } else {
                  if ((((p.buf[p.off]) << 24 >> 24) == 34 ? 1 : 0)) {
                    if ((((((cptr_offset(p, 1)).buf[(cptr_offset(p, 1)).off]) << 24 >> 24) && (!isspace((((cptr_offset(p, 1)).buf[(cptr_offset(p, 1)).off]) << 24 >> 24)) ? 1 : 0)) ? 1 : 0)) {
                      _state = 1; continue _sm; /* goto err */
                    }
                    done = 1;
                  } else {
                    if ((!((p.buf[p.off]) << 24 >> 24) ? 1 : 0)) {
                      _state = 1; continue _sm; /* goto err */
                    } else {
                      current = (typeof sdscatlen(cptr_clone(current), p, ((1) >>> 0)) === 'string' ? cptr_from_string(sdscatlen(cptr_clone(current), p, ((1) >>> 0))) : sdscatlen(cptr_clone(current), p, ((1) >>> 0)));
                    }
                  }
                }
              }
            } else {
              if (insq) {
                if ((((((p.buf[p.off]) << 24 >> 24) == 92 ? 1 : 0) && ((((cptr_offset(p, 1)).buf[(cptr_offset(p, 1)).off]) << 24 >> 24) == 39 ? 1 : 0)) ? 1 : 0)) {
                  p.off++;
                  current = (typeof sdscatlen(cptr_clone(current), "'", ((1) >>> 0)) === 'string' ? cptr_from_string(sdscatlen(cptr_clone(current), "'", ((1) >>> 0))) : sdscatlen(cptr_clone(current), "'", ((1) >>> 0)));
                } else {
                  if ((((p.buf[p.off]) << 24 >> 24) == 39 ? 1 : 0)) {
                    if ((((((cptr_offset(p, 1)).buf[(cptr_offset(p, 1)).off]) << 24 >> 24) && (!isspace((((cptr_offset(p, 1)).buf[(cptr_offset(p, 1)).off]) << 24 >> 24)) ? 1 : 0)) ? 1 : 0)) {
                      _state = 1; continue _sm; /* goto err */
                    }
                    done = 1;
                  } else {
                    if ((!((p.buf[p.off]) << 24 >> 24) ? 1 : 0)) {
                      _state = 1; continue _sm; /* goto err */
                    } else {
                      current = (typeof sdscatlen(cptr_clone(current), p, ((1) >>> 0)) === 'string' ? cptr_from_string(sdscatlen(cptr_clone(current), p, ((1) >>> 0))) : sdscatlen(cptr_clone(current), p, ((1) >>> 0)));
                    }
                  }
                }
              } else {
                switch (((p.buf[p.off]) << 24 >> 24)) {
                  case 32:
                    case 10:
                      case 13:
                        case 9:
                          case 0:
                          {
                            done = 1;
                  break;
                          }
                  case 34:
                  {
                    inq = 1;
                  break;
                  }
                  case 39:
                  {
                    insq = 1;
                  break;
                  }
                  default:
                  {
                    current = (typeof sdscatlen(cptr_clone(current), p, ((1) >>> 0)) === 'string' ? cptr_from_string(sdscatlen(cptr_clone(current), p, ((1) >>> 0))) : sdscatlen(cptr_clone(current), p, ((1) >>> 0)));
                  break;
                  }
                }
              }
            }
            if (((p.buf[p.off]) << 24 >> 24)) {
              p.off++;
            }
          }
          vector = cptr_clone(realloc(vector, (i32((argc.value) + 1)) * 8));
          cptr_write_ptr(vector, argc.value, current);
          (argc.value++, argc.value - (1));
          current = null;
        } else {
          if ((cptr_eq(vector, (null)) ? 1 : 0)) {
            vector = cptr_clone(malloc(8));
          }
          return vector;
        }
      }
    case 1: /* err */
      while ((argc.value--, argc.value - (-1))) {
        sdsfree(cptr_clone(cptr_read_ptr(vector, argc.value)));
      }
      free(vector);
      if (current) {
        sdsfree(cptr_clone(current));
      }
      (() => { const __p: any = (argc); const __v: any = (0); if (__p && __p.__field_ref === true) { __p.value = __v; } else if (__p && __p.buf) { cptr_write_int32(__p, 0, __v); } else if (__p) { __p.value = __v; } })();
      return null;
      break _sm;
    }
  }
}

export function sdsmapchars(s: any, _from: any, to: any, setlen: number): any {
  if (typeof s === 'string') s = cptr_from_string(s);
  if (typeof _from === 'string') _from = cptr_from_string(_from);
  if (typeof to === 'string') to = cptr_from_string(to);

  let j = 0;
  let i = 0;
  let l = sdslen(s);
  for (j = ((0) >>> 0); (((j) >>> 0) < ((Number(BigInt.asUintN(32, __as_bigint(l)))) >>> 0) ? 1 : 0); (() => { const _t = j; j = u32(j + 1); return _t; })()) {
    for (i = ((0) >>> 0); (((i) >>> 0) < ((setlen) >>> 0) ? 1 : 0); (() => { const _t = i; i = u32(i + 1); return _t; })()) {
      if (((s.buf[(s.off ?? 0) + ((j) >>> 0)]) == ((_from.buf[(_from.off ?? 0) + ((i) >>> 0)]) << 24 >> 24) ? 1 : 0)) {
        s.buf[(s.off ?? 0) + ((j) >>> 0)] = (((to.buf[(to.off ?? 0) + ((i) >>> 0)]) << 24 >> 24)) << 24 >> 24;
        break;
      }
    }
  }
  return cptr_clone(s);
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: argv.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
export function sdsjoin(argv: COutParam<CPtr>, argc: number, sep: any): any {
  let join = sdsempty();
  let j = 0;
  for (j = 0; (j < argc ? 1 : 0); j++) {
    join = sdscat(join, cptr_clone(cptr_read_ptr(argv, j)));
    if ((j != i32(argc - 1) ? 1 : 0)) {
      join = sdscat(join, cptr_clone(sep));
    }
  }
  return cptr_clone(join);
}

// BRIDGE: c-out-pointer — C17 §6.5.3.2 + §6.7.6.1: T*/T** out parameters lowered as COutParam<T> = { value: T }. Affected params: argv.
// BRIDGE-HINT: to refactor into idiomatic TypeScript, return [<original-return>, ...out_types] and drop the COutParam parameters; callers replace box.value reads with destructuring.
export function sdsjoinsds(argv: COutParam<CPtr>, argc: number, sep: any, seplen: number): any {
  let join = sdsempty();
  let j = 0;
  for (j = 0; (j < argc ? 1 : 0); j++) {
    join = sdscatsds(join, cptr_read_ptr(argv, j));
    if ((j != i32(argc - 1) ? 1 : 0)) {
      join = sdscatlen(join, sep, ((seplen) >>> 0));
    }
  }
  return cptr_clone(join);
}

export function sds_malloc(size: number): any | null {
  return cptr_clone(malloc(((size) >>> 0)));
}

export function sds_realloc(ptr: any | null, size: number): any | null {
  return cptr_clone(realloc(ptr, ((size) >>> 0)));
}

export function sds_free(ptr: any | null): void {
  free(ptr);
}