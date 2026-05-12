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

export let splitmix64_state: any = /* WARNING: 64-bit integer may lose precision beyond 2^53 */ 0;
export function splitmix64_next(): number {
  let z: any = (splitmix64_state = __u64(__as_bigint(splitmix64_state) + __as_bigint((11400714819323198485n))));
  z = __u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ z) ^ __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ z)) >> __as_bigint(30))))))) * __as_bigint((13787848793156543929n)));
  z = __u64(__as_bigint((__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ z) ^ __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ z)) >> __as_bigint(27))))))) * __as_bigint((10723151780598845931n)));
  return __u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ z) ^ __as_bigint((__u64(__u64(__as_bigint(/* WARNING: 64-bit integer may lose precision beyond 2^53 */ z)) >> __as_bigint(31)))));
}

export function splitmix64_seed(s: number): void {
  splitmix64_state = /* WARNING: 64-bit integer may lose precision beyond 2^53 */ s;
}

export function splitmix64_get_state(): number {
  return /* WARNING: 64-bit integer may lose precision beyond 2^53 */ splitmix64_state;
}

