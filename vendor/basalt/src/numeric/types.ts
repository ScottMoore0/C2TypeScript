// BC-3: C numeric type semantics in TypeScript.
// C17 §6.2.5: Types. §6.3.1: Arithmetic operands — integer conversions.
//
// JavaScript numbers are IEEE 754 double (53-bit mantissa). C integers
// are fixed-width with defined overflow behavior:
// - Unsigned: wraps modulo 2^N (C17 §6.2.5 ¶9)
// - Signed: implementation-defined on overflow (we use two's complement wrap)
// - Conversions: C17 §6.3.1.1–§6.3.1.4

// --- Width constants ---

export const INT8_MIN = -128;
export const INT8_MAX = 127;
export const UINT8_MAX = 255;

export const INT16_MIN = -32768;
export const INT16_MAX = 32767;
export const UINT16_MAX = 65535;

export const INT32_MIN = -2147483648;
export const INT32_MAX = 2147483647;
export const UINT32_MAX = 4294967295;

// For 64-bit, use BigInt in the conversion functions.
export const INT64_MIN = -9223372036854775808n;
export const INT64_MAX = 9223372036854775807n;
export const UINT64_MAX = 18446744073709551615n;

// --- Signed integer truncation (two's complement wrap) ---
// C17 §6.3.1.3: signed integer conversion is impl-defined; we use wrap.

/** Truncate to signed 8-bit. */
export function toInt8(v: number): number {
  return (v << 24) >> 24;
}

/** Truncate to signed 16-bit. */
export function toInt16(v: number): number {
  return (v << 16) >> 16;
}

/** Truncate to signed 32-bit. C17 §6.3.1.3. */
export function toInt32(v: number): number {
  return v | 0;
}

// --- Unsigned integer truncation (modular wrap) ---
// C17 §6.3.1.3 ¶2: conversion to unsigned is always modulo 2^N.

/** Truncate to unsigned 8-bit. */
export function toUint8(v: number): number {
  return v & 0xFF;
}

/** Truncate to unsigned 16-bit. */
export function toUint16(v: number): number {
  return v & 0xFFFF;
}

/** Truncate to unsigned 32-bit. */
export function toUint32(v: number): number {
  return v >>> 0;
}

// --- Float truncation ---

/** Truncate double to float (lose precision). C17 §6.3.1.5. */
export function toFloat32(v: number): number {
  return Math.fround(v);
}

// --- Integer arithmetic with overflow ---
// These perform the operation then truncate to the target width.

export function addInt32(a: number, b: number): number {
  return (a + b) | 0;
}

export function subInt32(a: number, b: number): number {
  return (a - b) | 0;
}

export function mulInt32(a: number, b: number): number {
  return Math.imul(a, b);
}

export function addUint32(a: number, b: number): number {
  return (a + b) >>> 0;
}

export function subUint32(a: number, b: number): number {
  return (a - b) >>> 0;
}

export function mulUint32(a: number, b: number): number {
  return Math.imul(a, b) >>> 0;
}

// --- Division ---
// C17 §6.5.5: integer division truncates toward zero.

export function divInt32(a: number, b: number): number {
  if (b === 0) throw new Error("division by zero");
  return Math.trunc(a / b) | 0;
}

export function modInt32(a: number, b: number): number {
  if (b === 0) throw new Error("division by zero");
  return (a % b) | 0;
}

export function divUint32(a: number, b: number): number {
  if (b === 0) throw new Error("division by zero");
  return ((a >>> 0) / (b >>> 0)) >>> 0;
}

export function modUint32(a: number, b: number): number {
  if (b === 0) throw new Error("division by zero");
  return ((a >>> 0) % (b >>> 0)) >>> 0;
}

// --- Bitwise operations (always 32-bit in JS, matching C int) ---

export function shl32(a: number, b: number): number {
  return (a << (b & 31)) | 0;
}

export function shr32(a: number, b: number): number {
  return (a >> (b & 31)) | 0;
}

export function shrUnsigned32(a: number, b: number): number {
  return (a >>> (b & 31)) >>> 0;
}

export function bitwiseAnd32(a: number, b: number): number {
  return (a & b) | 0;
}

export function bitwiseOr32(a: number, b: number): number {
  return (a | b) | 0;
}

export function bitwiseXor32(a: number, b: number): number {
  return (a ^ b) | 0;
}

export function bitwiseNot32(a: number): number {
  return ~a | 0;
}

// --- Type coercion helpers ---
// C17 §6.3.1.4: float → integer conversion truncates toward zero.

/** Convert float to int32, truncating toward zero. */
export function floatToInt32(v: number): number {
  return Math.trunc(v) | 0;
}

/** Convert float to uint32, truncating toward zero. */
export function floatToUint32(v: number): number {
  return Math.trunc(v) >>> 0;
}

/** Check if a number fits in int32 range without overflow. */
export function fitsInt32(v: number): boolean {
  return v >= INT32_MIN && v <= INT32_MAX && Number.isInteger(v);
}

/** Check if a number fits in uint32 range. */
export function fitsUint32(v: number): boolean {
  return v >= 0 && v <= UINT32_MAX && Number.isInteger(v);
}

// --- Boolean (C17 §6.3.1.2) ---

/** C truthiness: 0 is false, everything else is true. */
export function cBool(v: number): boolean {
  return v !== 0;
}

/** Convert boolean to C int (0 or 1). */
export function boolToInt(v: boolean): number {
  return v ? 1 : 0;
}
