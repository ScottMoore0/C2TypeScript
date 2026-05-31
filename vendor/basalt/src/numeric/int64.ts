// BC-3b: int64_t / uint64_t semantics via JS BigInt.
// C17 §6.2.5 ¶6–¶9: standard signed/unsigned integer types.
// C17 §6.3.1.3: integer conversion rules (signed wrap is impl-defined;
// we use two's-complement wrap, matching GCC/Clang on mainstream targets).
// C17 §6.5.5, §6.5.6, §6.5.7: arithmetic and shift operators.
//
// JS Number is IEEE-754 double with 53-bit mantissa, so 64-bit integers
// require BigInt (ECMAScript 2020 §21.2). BigInt is unbounded, so we
// must explicitly truncate back to 64 bits after every operation.

import type { CPtr } from "../memory/cptr.js";

// --- Width constants (64-bit) ---

/** Signed 64-bit minimum: -2^63. C17 §5.2.4.2.1. */
export const I64_MIN: bigint = -(1n << 63n);
/** Signed 64-bit maximum: 2^63 - 1. */
export const I64_MAX: bigint = (1n << 63n) - 1n;
/** Unsigned 64-bit maximum: 2^64 - 1. */
export const U64_MAX: bigint = (1n << 64n) - 1n;

const MASK64: bigint = (1n << 64n) - 1n;
const SIGN_BIT64: bigint = 1n << 63n;

// --- Truncation (C17 §6.3.1.3) ---

/** Truncate to signed 64-bit with two's-complement wrap. */
export function i64(x: number | bigint): bigint {
  const b = typeof x === "bigint" ? x : BigInt(Math.trunc(x));
  const u = b & MASK64;
  // If sign bit set, convert to negative two's-complement value.
  return (u & SIGN_BIT64) !== 0n ? u - (1n << 64n) : u;
}

/** Truncate to unsigned 64-bit (modulo 2^64). C17 §6.3.1.3 ¶2. */
export function u64(x: number | bigint): bigint {
  const b = typeof x === "bigint" ? x : BigInt(Math.trunc(x));
  return ((b % (1n << 64n)) + (1n << 64n)) % (1n << 64n);
}

// --- Signed arithmetic (wrap per two's-complement) ---
// C17 §6.5 ¶5: overflow of signed integers is UB, but real impls wrap.

export function i64_add(a: bigint, b: bigint): bigint { return i64(a + b); }
export function i64_sub(a: bigint, b: bigint): bigint { return i64(a - b); }
export function i64_mul(a: bigint, b: bigint): bigint { return i64(a * b); }

/** Signed division, truncating toward zero. C17 §6.5.5 ¶6. */
export function i64_div(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new Error("division by zero");
  // BigInt / already truncates toward zero for signed operands.
  return i64(a / b);
}

/** Signed remainder. C17 §6.5.5 ¶6: (a/b)*b + a%b == a. */
export function i64_mod(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new Error("division by zero");
  return i64(a % b);
}

export function i64_neg(a: bigint): bigint { return i64(-a); }

// --- Unsigned arithmetic (modulo 2^64; C17 §6.2.5 ¶9) ---

export function u64_add(a: bigint, b: bigint): bigint { return u64(a + b); }
export function u64_sub(a: bigint, b: bigint): bigint { return u64(a - b); }
export function u64_mul(a: bigint, b: bigint): bigint { return u64(a * b); }

export function u64_div(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new Error("division by zero");
  const ua = u64(a);
  const ub = u64(b);
  return ua / ub;
}

export function u64_mod(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new Error("division by zero");
  const ua = u64(a);
  const ub = u64(b);
  return ua % ub;
}

// --- Bit operations (C17 §6.5.7, §6.5.10–§6.5.12) ---
// C17 §6.5.7 ¶3: shift count must be < type width and non-negative.
// We mask the count to the low 6 bits to match x86-64 behaviour.

/** Left shift, signed 64. C17 §6.5.7 ¶4: low bits zero-filled. */
export function i64_shl(a: bigint, n: number | bigint): bigint {
  const k = Number(BigInt(n) & 63n);
  return i64(a << BigInt(k));
}

/** Logical right shift (unsigned fill). For uint64. */
export function i64_shr(a: bigint, n: number | bigint): bigint {
  const k = Number(BigInt(n) & 63n);
  return u64(u64(a) >> BigInt(k));
}

/** Arithmetic right shift (sign fill). C17 §6.5.7 ¶5: impl-defined for
 *  negative signed; we sign-extend, matching GCC/Clang. */
export function i64_sar(a: bigint, n: number | bigint): bigint {
  const k = Number(BigInt(n) & 63n);
  // BigInt >> is arithmetic for negative operands.
  return i64(i64(a) >> BigInt(k));
}

export function i64_and(a: bigint, b: bigint): bigint { return i64(a & b); }
export function i64_or(a: bigint, b: bigint): bigint { return i64(a | b); }
export function i64_xor(a: bigint, b: bigint): bigint { return i64(a ^ b); }
/** Bitwise complement. C17 §6.5.3.3 ¶4. */
export function i64_not(a: bigint): bigint { return i64(~a); }

// --- Conversions ---

/** Last captured precision-loss warning (for diagnostic collection). */
let _lastI64Warning: string | null = null;

/** Read (and clear) the last int64 precision-loss warning, if any. */
export function i64_take_warning(): string | null {
  const w = _lastI64Warning;
  _lastI64Warning = null;
  return w;
}

/** Convert signed 64-bit BigInt to JS number; flag if precision lost.
 *  C17 §6.3.1.4: integer → floating conversion may lose precision. */
export function i64_to_number(x: bigint): number {
  const v = Number(x);
  if (x > BigInt(Number.MAX_SAFE_INTEGER) || x < BigInt(Number.MIN_SAFE_INTEGER)) {
    _lastI64Warning = `i64_to_number: precision loss converting ${x.toString()} to double`;
  }
  return v;
}

/** Convert JS number to signed 64-bit. Non-integer is truncated. */
export function number_to_i64(x: number): bigint {
  if (!Number.isFinite(x)) throw new Error("number_to_i64: non-finite input");
  return i64(Math.trunc(x));
}

/** Reinterpret signed 64-bit as unsigned 64-bit (same bit pattern). */
export function i64_to_u64(x: bigint): bigint { return u64(x); }

/** Reinterpret unsigned 64-bit as signed 64-bit (same bit pattern). */
export function u64_to_i64(x: bigint): bigint { return i64(x); }

// --- CPtr 8-byte reads/writes (little-endian, matching x86-64 ABI) ---
// C17 §6.2.6.1: object representation is a sequence of bytes.

function _view(ptr: CPtr): DataView {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
}

/** Read signed 64-bit at ptr + offset (little-endian). */
export function cptr_read_int64(ptr: CPtr, offset: number = 0): bigint {
  return _view(ptr).getBigInt64(ptr.off + offset, true);
}

/** Write signed 64-bit at ptr + offset (little-endian, wraps on overflow). */
export function cptr_write_int64(ptr: CPtr, offset: number, value: bigint): void {
  _view(ptr).setBigInt64(ptr.off + offset, i64(value), true);
}

/** Read unsigned 64-bit at ptr + offset (little-endian). */
export function cptr_read_uint64(ptr: CPtr, offset: number = 0): bigint {
  return _view(ptr).getBigUint64(ptr.off + offset, true);
}

/** Write unsigned 64-bit at ptr + offset (little-endian). */
export function cptr_write_uint64(ptr: CPtr, offset: number, value: bigint): void {
  _view(ptr).setBigUint64(ptr.off + offset, u64(value), true);
}
