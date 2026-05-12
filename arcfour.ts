function cptr_from_string(s: string): any { const buf = new Uint8Array(s.length + 1); for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i); buf[s.length] = 0; return {buf, off: 0}; }
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

type BYTE = number;
export function arcfour_key_setup(state: any | null, key: any | null, len: number): void {
  if (typeof state === 'string') state = cptr_from_string(state);
  if (typeof key === 'string') key = cptr_from_string(key);

  let i = 0;
  let j = 0;
  let t = 0;
  for (i = 0; (i < 256 ? 1 : 0); ++i) {
    state.buf[(state.off ?? 0) + i] = ((i) & 0xFF);
  }
  for (i = 0, j = 0; (i < 256 ? 1 : 0); ++i) {
    j = i32((i32(i32(j + ((state.buf[(state.off ?? 0) + i]) & 0xFF)) + ((key.buf[(key.off ?? 0) + i32(i % len)]) & 0xFF))) % 256);
    t = ((state.buf[(state.off ?? 0) + i]) & 0xFF);
    state.buf[(state.off ?? 0) + i] = ((state.buf[(state.off ?? 0) + j]) & 0xFF);
    state.buf[(state.off ?? 0) + j] = ((t) & 0xFF);
  }
}

export function arcfour_generate_stream(state: any | null, out: any | null, len: number): void {
  if (typeof state === 'string') state = cptr_from_string(state);
  if (typeof out === 'string') out = cptr_from_string(out);

  let i = 0;
  let j = 0;
  let idx = 0;
  let t = 0;
  for (idx = ((0) >>> 0), i = 0, j = 0; (((idx) >>> 0) < ((len) >>> 0) ? 1 : 0); (idx = u32(idx + 1))) {
    i = i32((i32(i + 1)) % 256);
    j = i32((i32(j + ((state.buf[(state.off ?? 0) + i]) & 0xFF))) % 256);
    t = ((state.buf[(state.off ?? 0) + i]) & 0xFF);
    state.buf[(state.off ?? 0) + i] = ((state.buf[(state.off ?? 0) + j]) & 0xFF);
    state.buf[(state.off ?? 0) + j] = ((t) & 0xFF);
    out.buf[(out.off ?? 0) + ((idx) >>> 0)] = ((state.buf[(state.off ?? 0) + i32((i32(((state.buf[(state.off ?? 0) + i]) & 0xFF) + ((state.buf[(state.off ?? 0) + j]) & 0xFF))) % 256)]) & 0xFF);
  }
}

