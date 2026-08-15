let adler: any = null; // BRIDGE: dropped-file-scope-static — see Rule 41j (lvalue without decl)
let len: any = null; // BRIDGE: dropped-file-scope-static — see Rule 41j (lvalue without decl)
function __safe_div(a: any, b: any): any { const aBig = typeof a === 'bigint'; const bBig = typeof b === 'bigint'; if (aBig && bBig) { if (b === 0n) throw new Error('Division by zero'); return a / b; } const an = aBig ? Number(a) : Number(a ?? 0); const bn = bBig ? Number(b) : Number(b ?? 0); if (bn === 0) throw new Error('Division by zero'); return Math.trunc(an / bn); }
function __safe_mod(a: any, b: any): any { const aBig = typeof a === 'bigint'; const bBig = typeof b === 'bigint'; if (aBig && bBig) { if (b === 0n) throw new Error('Division by zero'); return a % b; } const an = aBig ? Number(a) : Number(a ?? 0); const bn = bBig ? Number(b) : Number(b ?? 0); if (bn === 0) throw new Error('Division by zero'); return an % bn; }
function trunc(x: number): number { return Math.trunc(x); }
function i32(x: number) { return x | 0; }
function u32(x: number) { return x >>> 0; }
function __as_bigint(x: any): bigint { if (typeof x === 'bigint') return x; if (typeof x === 'number') return BigInt(Math.trunc(x)); if (x && typeof x === 'object' && 'value' in x) { const v = (x as any).value; return typeof v === 'bigint' ? v : BigInt(Math.trunc(Number(v ?? 0))); } if (typeof x === 'boolean') return x ? 1n : 0n; return BigInt(Math.trunc(Number(x ?? 0))); }
function __u64(x: bigint): any { return BigInt.asUintN(64, x); }
function __i64(x: bigint): any { return BigInt.asIntN(64, x); }
function __safe_div_i64(a: bigint, b: bigint): any { if (b === 0n) throw new Error('Division by zero'); return a / b; }
function __safe_mod_i64(a: bigint, b: bigint): any { if (b === 0n) throw new Error('Division by zero'); return a % b; }

export function adler32(adler: number, buffer: any | null, len: number): number {
  let buf = null;
  let sum2 = 0;
  let n = 0;
  if ((((!buffer ? 1 : 0) || ((len <= 0 ? 1 : 0))) ? 1 : 0)) {
    return ((1) >>> 0);
  }
  buf = (buffer);
  sum2 = (((((adler) >>> 0) >>> 16) >>> 0) & ((65535) >>> 0)) >>> 0;
  adler = (adler & ((65535) >>> 0)) >>> 0;
  while ((len >= 5552 ? 1 : 0)) {
    n = ((5552) >>> 0);
    while ((() => { const _t = n; n = u32(n - 1); return _t; })()) {
      adler = u32(adler + (((((buf.buf[buf.off++])) & 0xFF)) >>> 0));
      sum2 = u32(sum2 + ((adler) >>> 0));
    }
    adler = u32(adler % ((65521) >>> 0));
    sum2 = u32(sum2 % ((65521) >>> 0));
    len = i32(len - 5552);
  }
  if ((len > 0 ? 1 : 0)) {
    while (len--) {
      adler = u32(adler + (((((buf.buf[buf.off++])) & 0xFF)) >>> 0));
      sum2 = u32(sum2 + ((adler) >>> 0));
    }
    adler = u32(adler % ((65521) >>> 0));
    sum2 = u32(sum2 % ((65521) >>> 0));
  }
  return (((adler) >>> 0) | ((((sum2) >>> 0) << 16) >>> 0)) >>> 0;
}

export function adler32_combine(adler1: number, adler2: number, len2: number): number {
  let sum1 = 0;
  let sum2 = 0;
  let rem = 0;
  rem = ((Math.trunc(+((i32(len2 % 65521))))) >>> 0);
  sum1 = (((adler1) >>> 0) & ((65535) >>> 0)) >>> 0;
  sum2 = u32(((Math.imul(((rem) >>> 0), ((sum1) >>> 0)) >>> 0)) % ((65521) >>> 0));
  sum1 = u32(sum1 + u32(u32(((((adler2) >>> 0) & ((65535) >>> 0)) >>> 0) + ((65521) >>> 0)) - ((1) >>> 0)));
  sum2 = u32(sum2 + u32(u32(u32(((((((adler1) >>> 0) >>> 16) >>> 0) & ((65535) >>> 0)) >>> 0) + ((((((adler2) >>> 0) >>> 16) >>> 0) & ((65535) >>> 0)) >>> 0)) + ((65521) >>> 0)) - ((rem) >>> 0)));
  if ((((sum1) >>> 0) >= ((65521) >>> 0) ? 1 : 0)) {
    sum1 = u32(sum1 - ((65521) >>> 0));
  }
  if ((((sum1) >>> 0) >= ((65521) >>> 0) ? 1 : 0)) {
    sum1 = u32(sum1 - ((65521) >>> 0));
  }
  if ((((sum2) >>> 0) >= (((((65521 << 1) | 0))) >>> 0) ? 1 : 0)) {
    sum2 = u32(sum2 - (((((65521 << 1) | 0))) >>> 0));
  }
  if ((((sum2) >>> 0) >= ((65521) >>> 0) ? 1 : 0)) {
    sum2 = u32(sum2 - ((65521) >>> 0));
  }
  return (((sum1) >>> 0) | ((((sum2) >>> 0) << 16) >>> 0)) >>> 0;
}

export function adler32_rolling(adler: number, inbyte: number, outbyte: number, window_size: number): number {
  let sum1 = 0;
  let sum2 = 0;
  sum1 = ((adler) >>> 0);
  sum2 = (((((sum1) >>> 0) >>> 16) >>> 0) & ((65535) >>> 0)) >>> 0;
  sum1 = (sum1 & ((65535) >>> 0)) >>> 0;
  sum1 = u32((u32(u32(((sum1) >>> 0) - ((((outbyte) & 0xFF)) >>> 0)) + ((((inbyte) & 0xFF)) >>> 0))) % ((65521) >>> 0));
  sum2 = u32((u32(u32(u32(((sum2) >>> 0) - (((Math.imul(window_size, ((outbyte) & 0xFF)))) >>> 0)) + ((sum1) >>> 0)) - ((1) >>> 0))) % ((65521) >>> 0));
  return (((((sum2) >>> 0) << 16) >>> 0) | ((sum1) >>> 0)) >>> 0;
}

