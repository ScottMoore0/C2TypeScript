// FC-10: C limits and float constants.
// C17 §5.2.4.2.1 (limits.h), §5.2.4.2.2 (float.h), §7.8 (inttypes.h), §7.20 (stdint.h)

// limits.h (C17 §5.2.4.2.1)
export const CHAR_BIT = 8;
export const CHAR_MIN = -128;
export const CHAR_MAX = 127;
export const SCHAR_MIN = -128;
export const SCHAR_MAX = 127;
export const UCHAR_MAX = 255;
export const SHRT_MIN = -32768;
export const SHRT_MAX = 32767;
export const USHRT_MAX = 65535;
export const INT_MIN = -2147483648;
export const INT_MAX = 2147483647;
export const UINT_MAX = 4294967295;
export const LONG_MIN = -2147483648;
export const LONG_MAX = 2147483647;
export const ULONG_MAX = 4294967295;
export const LLONG_MIN = -9007199254740991; // JS safe integer min (not true 64-bit min)
export const LLONG_MAX = 9007199254740991;  // JS safe integer max (not true 64-bit max)
export const ULLONG_MAX = 18446744073709551615; // 2^64-1 (loses precision in JS)

// float.h (C17 §5.2.4.2.2)
export const FLT_EPSILON = 1.1920928955078125e-7;
export const FLT_MIN = 1.175494350822288e-38;
export const FLT_MAX = 3.4028234663852886e+38;
export const FLT_RADIX = 2;
export const FLT_DIG = 6;
export const FLT_MANT_DIG = 24;
export const FLT_MIN_EXP = -125;
export const FLT_MAX_EXP = 128;
export const FLT_MIN_10_EXP = -37;
export const FLT_MAX_10_EXP = 38;

export const DBL_EPSILON = 2.220446049250313e-16;
export const DBL_MIN = 2.2250738585072014e-308;
export const DBL_MAX = 1.7976931348623157e+308;
export const DBL_DIG = 15;
export const DBL_MANT_DIG = 53;
export const DBL_MIN_EXP = -1021;
export const DBL_MAX_EXP = 1024;
export const DBL_MIN_10_EXP = -307;
export const DBL_MAX_10_EXP = 308;

export const LDBL_EPSILON = DBL_EPSILON;  // No long double in JS
export const LDBL_MIN = DBL_MIN;
export const LDBL_MAX = DBL_MAX;
export const LDBL_DIG = DBL_DIG;
export const LDBL_MANT_DIG = DBL_MANT_DIG;

// stdint.h (C17 §7.20)
export const INT8_MIN = -128;
export const INT8_MAX = 127;
export const UINT8_MAX = 255;
export const INT16_MIN = -32768;
export const INT16_MAX = 32767;
export const UINT16_MAX = 65535;
export const INT32_MIN = -2147483648;
export const INT32_MAX = 2147483647;
export const UINT32_MAX = 4294967295;
export const INT64_MIN = -9007199254740991;
export const INT64_MAX = 9007199254740991;
export const SIZE_MAX = 4294967295;
export const PTRDIFF_MIN = -2147483648;
export const PTRDIFF_MAX = 2147483647;
export const INTPTR_MIN = -2147483648;
export const INTPTR_MAX = 2147483647;
export const UINTPTR_MAX = 4294967295;
export const INTMAX_MIN = -9007199254740991;
export const INTMAX_MAX = 9007199254740991;

// inttypes.h (C17 §7.8)
import { c_wcstol, c_wcstoul } from "../wchar/wchar.js";

/** C17 §7.8.2.1: imaxabs — absolute value of intmax_t. */
export function c_imaxabs(j: number): number {
  return Math.abs(j);
}

/** C17 §7.8.2.2: imaxdiv — division of intmax_t. */
export function c_imaxdiv(numer: number, denom: number): { quot: number; rem: number } {
  const quot = Math.trunc(numer / denom);
  return { quot, rem: numer - quot * denom };
}

/** C17 §7.8.2.3: strtoimax — string to intmax_t. */
export function c_strtoimax(s: string, base: number = 10): { value: number; endIndex: number } {
  const trimmed = s.trimStart();
  const parsed = parseInt(trimmed, base);
  if (isNaN(parsed)) return { value: 0, endIndex: 0 };
  const match = trimmed.match(/^[+-]?(?:0[xX])?[0-9a-fA-F]+/);
  return { value: parsed, endIndex: s.length - trimmed.length + (match ? match[0].length : 0) };
}

/** C17 §7.8.2.3: strtoumax — string to uintmax_t. */
export function c_strtoumax(s: string, base: number = 10): { value: number; endIndex: number } {
  const r = c_strtoimax(s, base);
  return { value: r.value >= 0 ? r.value : r.value + 2 ** 32, endIndex: r.endIndex };
}

/** C17 §7.8.2.4: wcstoimax — wide string to intmax_t. Delegates to wcstol. */
export function c_wcstoimax(ws: number[], base: number = 10): { value: number; endIndex: number } {
  return c_wcstol(ws, base);
}

/** C17 §7.8.2.4: wcstoumax — wide string to uintmax_t. Delegates to wcstoul. */
export function c_wcstoumax(ws: number[], base: number = 10): { value: number; endIndex: number } {
  return c_wcstoul(ws, base);
}
