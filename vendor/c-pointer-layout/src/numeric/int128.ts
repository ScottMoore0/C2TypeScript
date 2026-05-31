// GCC/Clang extension: __int128 / unsigned __int128 via BigInt.
// GCC Manual §6.9 "128-bit Integers": supported on 64-bit targets.
// Semantics mirror C17 §6.2.5 ¶6–¶9 (standard integer types) and
// §6.3.1.3 (integer conversion rules) extended to 128-bit width.
// Two's-complement wrap is used for signed overflow, matching GCC/Clang.
//
// BigInt is unbounded (ECMAScript 2020 §21.2); every operation must
// be explicitly truncated back to 128 bits.

import type { CPtr } from "../memory/cptr.js";

// --- Width constants (128-bit) ---

/** Signed 128-bit minimum: -2^127. */
export const I128_MIN: bigint = -(1n << 127n);
/** Signed 128-bit maximum: 2^127 - 1. */
export const I128_MAX: bigint = (1n << 127n) - 1n;
/** Unsigned 128-bit maximum: 2^128 - 1. */
export const U128_MAX: bigint = (1n << 128n) - 1n;

const MASK128: bigint = (1n << 128n) - 1n;
const SIGN_BIT128: bigint = 1n << 127n;
const MASK64: bigint = (1n << 64n) - 1n;

// --- Truncation (C17 §6.3.1.3, extended to 128-bit) ---

/** Truncate to signed 128-bit with two's-complement wrap. */
export function i128(x: number | bigint): bigint {
  const b = typeof x === "bigint" ? x : BigInt(Math.trunc(x));
  const u = b & MASK128;
  return (u & SIGN_BIT128) !== 0n ? u - (1n << 128n) : u;
}

/** Truncate to unsigned 128-bit (modulo 2^128). */
export function u128(x: number | bigint): bigint {
  const b = typeof x === "bigint" ? x : BigInt(Math.trunc(x));
  return ((b % (1n << 128n)) + (1n << 128n)) % (1n << 128n);
}

// --- Signed arithmetic (two's-complement wrap) ---

export function i128_add(a: bigint, b: bigint): bigint { return i128(a + b); }
export function i128_sub(a: bigint, b: bigint): bigint { return i128(a - b); }
export function i128_mul(a: bigint, b: bigint): bigint { return i128(a * b); }

/** Signed division, truncating toward zero. */
export function i128_div(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new RangeError("division by zero");
  return i128(a / b);
}

/** Signed remainder: (a/b)*b + a%b == a. */
export function i128_mod(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new RangeError("division by zero");
  return i128(a % b);
}

export function i128_neg(a: bigint): bigint { return i128(-a); }

// --- Unsigned arithmetic (modulo 2^128) ---

export function u128_add(a: bigint, b: bigint): bigint { return u128(a + b); }
export function u128_sub(a: bigint, b: bigint): bigint { return u128(a - b); }
export function u128_mul(a: bigint, b: bigint): bigint { return u128(a * b); }

export function u128_div(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new RangeError("division by zero");
  return u128(a) / u128(b);
}

export function u128_mod(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new RangeError("division by zero");
  return u128(a) % u128(b);
}

// --- Bit operations ---
// NOTE: GCC doesn't formally specify shift-count masking for __int128;
// we mask to 7 bits (0..127) matching how 64-bit shifts mask to 6 on x86-64,
// for predictable and well-defined behavior across inputs.

/** Left shift, signed 128. */
export function i128_shl(a: bigint, n: number | bigint): bigint {
  const k = Number(BigInt(n) & 127n);
  return i128(a << BigInt(k));
}

/** Logical right shift (unsigned fill). */
export function i128_shr(a: bigint, n: number | bigint): bigint {
  const k = Number(BigInt(n) & 127n);
  return u128(u128(a) >> BigInt(k));
}

/** Arithmetic right shift (sign fill). */
export function i128_sar(a: bigint, n: number | bigint): bigint {
  const k = Number(BigInt(n) & 127n);
  return i128(i128(a) >> BigInt(k));
}

export function i128_and(a: bigint, b: bigint): bigint { return i128(a & b); }
export function i128_or(a: bigint, b: bigint): bigint { return i128(a | b); }
export function i128_xor(a: bigint, b: bigint): bigint { return i128(a ^ b); }
/** Bitwise complement. */
export function i128_not(a: bigint): bigint { return i128(~a); }

// --- Conversions ---

let _lastI128Warning: string | null = null;

/** Read (and clear) the last int128 precision-loss warning, if any. */
export function i128_take_warning(): string | null {
  const w = _lastI128Warning;
  _lastI128Warning = null;
  return w;
}

/** Convert signed 128-bit BigInt to JS number; flag if precision lost. */
export function i128_to_number(x: bigint): number {
  const v = Number(x);
  if (x > BigInt(Number.MAX_SAFE_INTEGER) || x < BigInt(Number.MIN_SAFE_INTEGER)) {
    _lastI128Warning = `i128_to_number: precision loss converting ${x.toString()} to double`;
  }
  return v;
}

/** Convert JS number to signed 128-bit. Non-integer is truncated. */
export function number_to_i128(x: number): bigint {
  if (!Number.isFinite(x)) throw new Error("number_to_i128: non-finite input");
  return i128(Math.trunc(x));
}

/** Reinterpret signed 128-bit as unsigned 128-bit (same bit pattern). */
export function i128_to_u128(x: bigint): bigint { return u128(x); }

/** Reinterpret unsigned 128-bit as signed 128-bit (same bit pattern). */
export function u128_to_i128(x: bigint): bigint { return i128(x); }

/** Convert to signed 64-bit (low 64 bits). Diagnostic if high bits non-zero. */
export function i128_to_i64(x: bigint): bigint {
  const u = u128(x);
  const hi = u >> 64n;
  // For negative 128-bit, high half is all-ones; that's lossless iff low
  // half's sign-extension equals the original.
  const lo = u & MASK64;
  const signExtended = (lo & (1n << 63n)) !== 0n ? lo - (1n << 64n) : lo;
  if (i128(signExtended) !== i128(x)) {
    _lastI128Warning = `i128_to_i64: high bits truncated (hi=0x${hi.toString(16)})`;
  }
  // Return signed 64-bit.
  return signExtended;
}

// --- CPtr 16-byte reads/writes (little-endian) ---
// Read/write the two 64-bit halves via DataView; low 8 bytes first.

function _view(ptr: CPtr): DataView {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
}

/** Read signed 128-bit at ptr + offset (little-endian). */
export function cptr_read_int128(ptr: CPtr, offset: number = 0): bigint {
  const v = _view(ptr);
  const lo = v.getBigUint64(ptr.off + offset, true);
  const hi = v.getBigInt64(ptr.off + offset + 8, true);
  // Compose: value = (hi << 64) | lo, with hi signed.
  return (hi << 64n) | lo;
}

/** Write signed 128-bit at ptr + offset (little-endian, wraps on overflow). */
export function cptr_write_int128(ptr: CPtr, offset: number, value: bigint): void {
  const v = _view(ptr);
  const u = u128(value);
  const lo = u & MASK64;
  const hiU = u >> 64n;
  // High half written as signed 64-bit (bit pattern identical).
  const hi = (hiU & (1n << 63n)) !== 0n ? hiU - (1n << 64n) : hiU;
  v.setBigUint64(ptr.off + offset, lo, true);
  v.setBigInt64(ptr.off + offset + 8, hi, true);
}

/** Read unsigned 128-bit at ptr + offset (little-endian). */
export function cptr_read_uint128(ptr: CPtr, offset: number = 0): bigint {
  const v = _view(ptr);
  const lo = v.getBigUint64(ptr.off + offset, true);
  const hi = v.getBigUint64(ptr.off + offset + 8, true);
  return (hi << 64n) | lo;
}

/** Write unsigned 128-bit at ptr + offset (little-endian). */
export function cptr_write_uint128(ptr: CPtr, offset: number, value: bigint): void {
  const v = _view(ptr);
  const u = u128(value);
  v.setBigUint64(ptr.off + offset, u & MASK64, true);
  v.setBigUint64(ptr.off + offset + 8, u >> 64n, true);
}
