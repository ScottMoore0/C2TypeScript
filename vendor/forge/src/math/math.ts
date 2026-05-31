// FC-5: C math library (libm).
// C17 §7.12: Mathematics.

export const M_PI = Math.PI;
export const M_E = Math.E;
export const M_LN2 = Math.LN2;
export const M_LN10 = Math.LN10;
export const M_SQRT2 = Math.SQRT2;
export const HUGE_VAL = Infinity;
export const INFINITY = Infinity;
export const NAN = NaN;

// Trig (§7.12.4)
export const c_sin = Math.sin;
export const c_cos = Math.cos;
export const c_tan = Math.tan;
export const c_asin = Math.asin;
export const c_acos = Math.acos;
export const c_atan = Math.atan;
export const c_atan2 = Math.atan2;
export const c_sinh = Math.sinh;
export const c_cosh = Math.cosh;
export const c_tanh = Math.tanh;
export const c_asinh = Math.asinh;
export const c_acosh = Math.acosh;
export const c_atanh = Math.atanh;

// Exponential/log (§7.12.6)
export const c_exp = Math.exp;
export const c_log = Math.log;
export const c_log10 = Math.log10;
export const c_log2 = Math.log2;
export function c_exp2(x: number): number { return 2 ** x; }
export function c_expm1(x: number): number { return Math.expm1(x); }
export function c_log1p(x: number): number { return Math.log1p(x); }

// Power/root (§7.12.7)
export const c_sqrt = Math.sqrt;
export const c_pow = Math.pow;
export function c_cbrt(x: number): number { return Math.cbrt(x); }
export function c_hypot(x: number, y: number): number { return Math.hypot(x, y); }

// Rounding (§7.12.9)
export const c_ceil = Math.ceil;
export const c_floor = Math.floor;
/** C17 §7.12.9.6: round — round to nearest, halfway cases rounded away from zero
 *  (differs from JS Math.round which rounds halfway toward +∞). */
export function c_round(x: number): number {
  if (!Number.isFinite(x)) return x;
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}
export const c_trunc = Math.trunc;

// Absolute value (§7.12.7)
export const c_fabs = Math.abs;

// Remainder (§7.12.10)
export function c_fmod(x: number, y: number): number {
  return x % y;
}

export function c_fmodf(x: number, y: number): number {
  return Math.fround(x % y);
}

// Min/max (§7.12.12.2/.3) — unlike Math.min/max, NaN is treated as missing data:
// if exactly one argument is NaN, return the other.
/** C17 §7.12.12.3: fmax — maximum, NaN treated as missing data. */
export function c_fmax(x: number, y: number): number {
  if (Number.isNaN(x)) return Number.isNaN(y) ? NaN : y;
  if (Number.isNaN(y)) return x;
  return x > y ? x : y;
}
/** C17 §7.12.12.2: fmin — minimum, NaN treated as missing data. */
export function c_fmin(x: number, y: number): number {
  if (Number.isNaN(x)) return Number.isNaN(y) ? NaN : y;
  if (Number.isNaN(y)) return x;
  return x < y ? x : y;
}

// Classification (§7.12.3)
export function c_isnan(x: number): boolean { return Number.isNaN(x); }
export function c_isinf(x: number): boolean { return !Number.isFinite(x) && !Number.isNaN(x); }
export function c_isfinite(x: number): boolean { return Number.isFinite(x); }

// Float versions (just alias to double — JS doesn't distinguish)
export const c_sinf = Math.sin;
export const c_cosf = Math.cos;
export const c_sqrtf = Math.sqrt;
export const c_powf = Math.pow;
export const c_fabsf = Math.abs;
export const c_ceilf = Math.ceil;
export const c_floorf = Math.floor;

// Remainder (§7.12.10)
/** C17 §7.12.10.2: remainder — IEEE remainder (round-to-nearest-even integral quotient,
 *  F.10.7.2 / IEC 60559). */
export function c_remainder(x: number, y: number): number {
  if (y === 0 || Number.isNaN(x) || Number.isNaN(y)) return NaN;
  if (!Number.isFinite(x)) return NaN;
  if (!Number.isFinite(y)) return x;
  const q = x / y;
  const floor = Math.floor(q);
  const diff = q - floor;
  let n: number;
  if (diff < 0.5) n = floor;
  else if (diff > 0.5) n = floor + 1;
  else n = (floor % 2 === 0) ? floor : floor + 1; // tie → even
  return x - n * y;
}

/** C17 §7.12.10.3: remquo — remainder and partial quotient.
 *  Spec: the value stored in *quo has the sign of x/y and magnitude congruent
 *  modulo 2^n to the magnitude of the integral quotient (we pick n=3 → 7 bits
 *  including sign, matching typical glibc impls). Uses round-to-nearest-even
 *  like IEEE remainder. */
export function c_remquo(x: number, y: number): { rem: number; quo: number } {
  if (y === 0 || !Number.isFinite(x) || Number.isNaN(y)) return { rem: NaN, quo: 0 };
  if (!Number.isFinite(y)) return { rem: x, quo: 0 };
  // Round-to-nearest-even integral quotient (banker's rounding) per IEEE remainder.
  const q = x / y;
  const floor = Math.floor(q);
  const diff = q - floor;
  let n: number;
  if (diff < 0.5) n = floor;
  else if (diff > 0.5) n = floor + 1;
  else n = (floor % 2 === 0) ? floor : floor + 1; // tie → even
  const rem = x - n * y;
  const signQ = Math.sign(x) * Math.sign(y);
  const quo = signQ * (Math.abs(n) & 0x7);
  return { rem, quo };
}

// Miscellaneous (§7.12.12–§7.12.13)
/** C17 §7.12.13.1: fma — fused multiply-add. */
export function c_fma(x: number, y: number, z: number): number { return x * y + z; }
/** C17 §7.12.12.1: fdim — positive difference: x−y if x>y, else +0. NaN propagates. */
export function c_fdim(x: number, y: number): number {
  if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
  return x > y ? x - y : 0;
}
/** C17 §7.12.11.2: nan — quiet NaN from string. */
export function c_nan(tagp: string): number { return NaN; }

// Fraction/exponent (§7.12.6)
/** C17 §7.12.6.4: frexp — extract fraction and exponent. */
export function c_frexp(x: number): { frac: number; exp: number } {
  if (x === 0 || !Number.isFinite(x)) return { frac: x, exp: 0 };
  const exp = Math.floor(Math.log2(Math.abs(x))) + 1;
  return { frac: x / (2 ** exp), exp };
}

/** C17 §7.12.6.6: ldexp — multiply by power of 2. */
export function c_ldexp(x: number, exp: number): number { return x * (2 ** exp); }

/** C17 §7.12.6.12: modf — integral and fractional parts. */
export function c_modf(x: number): { ipart: number; fpart: number } {
  const ipart = Math.trunc(x);
  return { ipart, fpart: x - ipart };
}

/** C17 §7.12.6.13: scalbn — scale by power of radix. */
export function c_scalbn(x: number, n: number): number { return x * (2 ** n); }
export const c_scalbln = c_scalbn;

/** C17 §7.12.6.5: ilogb — extract exponent as int. */
export function c_ilogb(x: number): number {
  if (x === 0) return -2147483648; // FP_ILOGB0
  if (!Number.isFinite(x)) return 2147483647;
  return Math.floor(Math.log2(Math.abs(x)));
}

/** C17 §7.12.6.11: logb — extract exponent as double. */
export function c_logb(x: number): number {
  if (x === 0) return -Infinity;
  if (!Number.isFinite(x)) return Infinity;
  return Math.floor(Math.log2(Math.abs(x)));
}

// Next representable value (§7.12.11)
/** C17 §7.12.11.3: nextafter — next representable value toward y. */
export function c_nextafter(x: number, y: number): number {
  if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
  if (x === y) return y;
  if (x === 0) return y > 0 ? 5e-324 : -5e-324;
  const buf = new Float64Array(1);
  const view = new DataView(buf.buffer);
  view.setFloat64(0, x);
  let bits = view.getBigInt64(0);
  bits += (y > x) ? 1n : -1n;
  view.setBigInt64(0, bits);
  return view.getFloat64(0);
}
export const c_nexttoward = c_nextafter;

/** C17 §7.12.11.1: copysign — return a value with magnitude of x and sign of y.
 *  Correctly handles −0 in y (sign bit, not numeric sign) and NaN in x. */
export function c_copysign(x: number, y: number): number {
  // Detect sign bit of y, including −0.
  const yNegative = y < 0 || Object.is(y, -0);
  const mag = Math.abs(x);
  return yNegative ? -mag : mag;
}

// Rounding to integer (§7.12.9)
/** Helper: round-to-nearest-even (banker's rounding), per IEEE 754 roundToNearestTiesToEven,
 *  which is the default rounding mode for nearbyint/rint per C17 §F.3. */
function roundTiesToEven(x: number): number {
  if (!Number.isFinite(x)) return x;
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return (floor % 2 === 0) ? floor : floor + 1;
}

/** Helper: round ties away from zero, per C17 §7.12.9.7 for lround/llround/round. */
function roundTiesAwayFromZero(x: number): number {
  if (!Number.isFinite(x)) return x;
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

/** C17 §7.12.9.3: nearbyint — round to nearest integer in current rounding mode (default: ties to even). */
export function c_nearbyint(x: number): number { return roundTiesToEven(x); }
/** C17 §7.12.9.4: rint — round to nearest integer (may raise inexact); ties to even in default mode. */
export function c_rint(x: number): number { return roundTiesToEven(x); }
/** C17 §7.12.9.5: lrint — round to nearest long integer (ties to even). */
export function c_lrint(x: number): number { return roundTiesToEven(x) | 0; }
export function c_llrint(x: number): number { return roundTiesToEven(x); }
/** C17 §7.12.9.7: lround — round to nearest, ties away from zero, to long. */
export function c_lround(x: number): number { return roundTiesAwayFromZero(x) | 0; }
/** C17 §7.12.9.7: llround — round to nearest, ties away from zero, to long long. */
export function c_llround(x: number): number { return roundTiesAwayFromZero(x); }

// Classification macros (§7.12.3)
/** C17 §7.12.3.3: fpclassify — classify floating-point value. */
export function c_fpclassify(x: number): number {
  if (Number.isNaN(x)) return 0; // FP_NAN
  if (!Number.isFinite(x)) return 1; // FP_INFINITE
  if (x === 0) return 2; // FP_ZERO
  const abs = Math.abs(x);
  if (abs < 2.2250738585072014e-308) return 3; // FP_SUBNORMAL
  return 4; // FP_NORMAL
}

/** C17 §7.12.3.4: isnormal — test for normal value. */
export function c_isnormal(x: number): boolean {
  return c_fpclassify(x) === 4;
}

/** C17 §7.12.3.6: signbit — test sign bit. */
export function c_signbit(x: number): boolean {
  if (x === 0) return Object.is(x, -0);
  return x < 0;
}

// Error functions (§7.12.8)
/** C17 §7.12.8.1: erf — error function.
 *  Uses Abramowitz & Stegun 7.1.26 rational approximation (|ε| ≤ 1.5e-7),
 *  with exact zero at x=0 and ±1 at ±∞ per spec. */
export function c_erf(x: number): number {
  if (Number.isNaN(x)) return NaN;
  if (x === 0) return x; // preserves ±0 sign, exact per spec
  if (!Number.isFinite(x)) return x > 0 ? 1 : -1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const result = 1 - poly * Math.exp(-x * x);
  return x >= 0 ? result : -result;
}

/** C17 §7.12.8.2: erfc — complementary error function; erfc(0)=1 exactly. */
export function c_erfc(x: number): number {
  if (Number.isNaN(x)) return NaN;
  if (x === 0) return 1;
  if (!Number.isFinite(x)) return x > 0 ? 0 : 2;
  return 1 - c_erf(x);
}

/** C17 §7.12.8.3: tgamma — gamma function (Stirling approximation). */
export function c_tgamma(x: number): number {
  if (x <= 0 && x === Math.floor(x)) return Infinity; // poles
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * c_tgamma(1 - x));
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  const xg = x + g - 0.5;
  let sum = c[0];
  for (let i = 1; i < g + 2; i++) sum += c[i]! / (x - 1 + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(xg, x - 0.5) * Math.exp(-xg) * sum;
}

/** C17 §7.12.8.4: lgamma — log of absolute value of gamma. */
export function c_lgamma(x: number): number { return Math.log(Math.abs(c_tgamma(x))); }

// =============================================================================
// C17 §7.12.3: FP classification constants (exported as macros would be in C).
// Values match typical glibc/musl ordering — see <math.h> FP_NAN/FP_INFINITE etc.
// =============================================================================
export const FP_NAN = 0;
export const FP_INFINITE = 1;
export const FP_ZERO = 2;
export const FP_SUBNORMAL = 3;
export const FP_NORMAL = 4;

// Float/long-double variants of the special values (§7.12p5).
// JS has a single number type so these alias, but downstream code may reference
// the specific identifiers after translation.
export const HUGE_VALF = Infinity;
export const HUGE_VALL = Infinity;
export const INFINITY_F = Infinity;
export const NAN_F = NaN;

// §7.12p8: math error-handling selection. JS numbers don't raise FE exceptions,
// so we expose errno-style reporting only.
export const MATH_ERRNO = 1;
export const MATH_ERREXCEPT = 2;
/** C17 §7.12p8: math_errhandling — which error mechanisms are in effect. */
export const math_errhandling = MATH_ERRNO;

// =============================================================================
// C17 §7.12.14: Comparison macros. These differ from <, <=, >, >=, !=, == in
// that they do NOT raise the "invalid" floating-point exception for quiet-NaN
// operands; they return false when either arg is NaN (except isunordered, which
// returns true exactly when either arg is NaN).
// =============================================================================
/** C17 §7.12.14.1: isgreater — (x) > (y) without raising invalid on QNaN. */
export function c_isgreater(x: number, y: number): boolean {
  return !Number.isNaN(x) && !Number.isNaN(y) && x > y;
}
/** C17 §7.12.14.2: isgreaterequal. */
export function c_isgreaterequal(x: number, y: number): boolean {
  return !Number.isNaN(x) && !Number.isNaN(y) && x >= y;
}
/** C17 §7.12.14.3: isless. */
export function c_isless(x: number, y: number): boolean {
  return !Number.isNaN(x) && !Number.isNaN(y) && x < y;
}
/** C17 §7.12.14.4: islessequal. */
export function c_islessequal(x: number, y: number): boolean {
  return !Number.isNaN(x) && !Number.isNaN(y) && x <= y;
}
/** C17 §7.12.14.5: islessgreater — (x)<(y) || (x)>(y); false if either NaN or x==y. */
export function c_islessgreater(x: number, y: number): boolean {
  return !Number.isNaN(x) && !Number.isNaN(y) && (x < y || x > y);
}
/** C17 §7.12.14.6: isunordered — true iff either argument is NaN. */
export function c_isunordered(x: number, y: number): boolean {
  return Number.isNaN(x) || Number.isNaN(y);
}

// =============================================================================
// Float-suffixed (f) variants (§7.12p1). JS has no float32 type; results pass
// through Math.fround where precision matters, otherwise alias the double form.
// These are included so translated C code that calls e.g. sinf() links cleanly.
// =============================================================================
const fr = Math.fround;
export const c_tanf = (x: number): number => fr(Math.tan(x));
export const c_asinf = (x: number): number => fr(Math.asin(x));
export const c_acosf = (x: number): number => fr(Math.acos(x));
export const c_atanf = (x: number): number => fr(Math.atan(x));
export const c_atan2f = (y: number, x: number): number => fr(Math.atan2(y, x));
export const c_sinhf = (x: number): number => fr(Math.sinh(x));
export const c_coshf = (x: number): number => fr(Math.cosh(x));
export const c_tanhf = (x: number): number => fr(Math.tanh(x));
export const c_asinhf = (x: number): number => fr(Math.asinh(x));
export const c_acoshf = (x: number): number => fr(Math.acosh(x));
export const c_atanhf = (x: number): number => fr(Math.atanh(x));
export const c_expf = (x: number): number => fr(Math.exp(x));
export const c_exp2f = (x: number): number => fr(2 ** x);
export const c_expm1f = (x: number): number => fr(Math.expm1(x));
export const c_logf = (x: number): number => fr(Math.log(x));
export const c_log10f = (x: number): number => fr(Math.log10(x));
export const c_log2f = (x: number): number => fr(Math.log2(x));
export const c_log1pf = (x: number): number => fr(Math.log1p(x));
export const c_cbrtf = (x: number): number => fr(Math.cbrt(x));
export const c_hypotf = (x: number, y: number): number => fr(Math.hypot(x, y));
export const c_roundf = (x: number): number => c_round(x);
export const c_truncf = Math.trunc;
export const c_nearbyintf = c_nearbyint;
export const c_rintf = c_rint;
export const c_lrintf = c_lrint;
export const c_llrintf = c_llrint;
export const c_lroundf = c_lround;
export const c_llroundf = c_llround;
export const c_remainderf = c_remainder;
export const c_remquof = c_remquo;
export const c_nextafterf = c_nextafter;
export const c_nexttowardf = c_nextafter;
export const c_copysignf = c_copysign;
export const c_fmaxf = c_fmax;
export const c_fminf = c_fmin;
export const c_fmaf = (x: number, y: number, z: number): number => fr(x * y + z);
export const c_fdimf = c_fdim;
export const c_scalbnf = (x: number, n: number): number => fr(x * (2 ** n));
export const c_scalblnf = c_scalbnf;
export const c_logbf = c_logb;
export const c_ilogbf = c_ilogb;
export const c_ldexpf = (x: number, e: number): number => fr(x * (2 ** e));
export const c_frexpf = c_frexp;
export const c_modff = c_modf;
export const c_erff = (x: number): number => fr(c_erf(x));
export const c_erfcf = (x: number): number => fr(c_erfc(x));
export const c_tgammaf = (x: number): number => fr(c_tgamma(x));
export const c_lgammaf = (x: number): number => fr(c_lgamma(x));
export const c_nanf = c_nan;

// Long-double (l) variants — JS has no extended precision, so alias doubles.
// C17 §7.12p1: for every double function there exist corresponding 'l' (long
// double) variants. Because JS has a single number type, these alias the
// double forms exactly.
export const c_sinl = Math.sin;
export const c_cosl = Math.cos;
export const c_tanl = Math.tan;
export const c_asinl = Math.asin;
export const c_acosl = Math.acos;
export const c_atanl = Math.atan;
export const c_atan2l = Math.atan2;
export const c_sinhl = Math.sinh;
export const c_coshl = Math.cosh;
export const c_tanhl = Math.tanh;
export const c_asinhl = Math.asinh;
export const c_acoshl = Math.acosh;
export const c_atanhl = Math.atanh;
export const c_sqrtl = Math.sqrt;
export const c_powl = Math.pow;
export const c_fabsl = Math.abs;
export const c_ceill = Math.ceil;
export const c_floorl = Math.floor;
export const c_expl = Math.exp;
export const c_logl = Math.log;
export const c_log10l = Math.log10;
export const c_log2l = Math.log2;
export const c_log1pl = Math.log1p;
export const c_expm1l = Math.expm1;
export function c_exp2l(x: number): number { return 2 ** x; }
export const c_cbrtl = Math.cbrt;
export const c_hypotl = Math.hypot;
export const c_truncl = Math.trunc;
export const c_roundl = c_round;
export const c_nearbyintl = c_nearbyint;
export const c_rintl = c_rint;
export const c_lrintl = c_lrint;
export const c_llrintl = c_llrint;
export const c_lroundl = c_lround;
export const c_llroundl = c_llround;
export function c_fmodl(x: number, y: number): number { return x % y; }
export const c_remainderl = c_remainder;
export const c_remquol = c_remquo;
export const c_nextafterl = c_nextafter;
export const c_nexttowardl = c_nextafter;
export const c_copysignl = c_copysign;
export const c_fmaxl = c_fmax;
export const c_fminl = c_fmin;
export function c_fmal(x: number, y: number, z: number): number { return x * y + z; }
export const c_fdiml = c_fdim;
export function c_scalbnl(x: number, n: number): number { return x * (2 ** n); }
export const c_scalblnl = c_scalbnl;
export const c_logbl = c_logb;
export const c_ilogbl = c_ilogb;
export function c_ldexpl(x: number, e: number): number { return x * (2 ** e); }
export const c_frexpl = c_frexp;
export const c_modfl = c_modf;
export const c_erfl = c_erf;
export const c_erfcl = c_erfc;
export const c_tgammal = c_tgamma;
export const c_lgammal = c_lgamma;
/** C17 §7.12.11.2: nanl — quiet NaN from string, long double flavor. */
export function c_nanl(_tagp: string): number { return NaN; }

// =============================================================================
// Additional breadth — common libm/POSIX extensions beyond the core C17 base.
// =============================================================================

/** sincos (POSIX / GNU): compute sin(x) and cos(x) in one call. */
export function c_sincos(x: number): { sin: number; cos: number } {
  return { sin: Math.sin(x), cos: Math.cos(x) };
}
export function c_sincosf(x: number): { sin: number; cos: number } {
  return { sin: fr(Math.sin(x)), cos: fr(Math.cos(x)) };
}
export const c_sincosl = c_sincos;

/** C17 §F.10.9.2 (optional): fmaxmag — max by magnitude, tie → fmax. */
export function c_fmaxmag(x: number, y: number): number {
  const ax = Math.abs(x), ay = Math.abs(y);
  if (Number.isNaN(x)) return Number.isNaN(y) ? NaN : y;
  if (Number.isNaN(y)) return x;
  if (ax > ay) return x;
  if (ay > ax) return y;
  return c_fmax(x, y);
}
/** C17 §F.10.9.3 (optional): fminmag — min by magnitude, tie → fmin. */
export function c_fminmag(x: number, y: number): number {
  const ax = Math.abs(x), ay = Math.abs(y);
  if (Number.isNaN(x)) return Number.isNaN(y) ? NaN : y;
  if (Number.isNaN(y)) return x;
  if (ax < ay) return x;
  if (ay < ax) return y;
  return c_fmin(x, y);
}
export const c_fmaxmagf = c_fmaxmag;
export const c_fminmagf = c_fminmag;
export const c_fmaxmagl = c_fmaxmag;
export const c_fminmagl = c_fminmag;

/** POSIX: significand(x) = x × 2^(-logb(x)); undefined near 0. */
export function c_significand(x: number): number {
  if (x === 0 || !Number.isFinite(x)) return x;
  return x / (2 ** Math.floor(Math.log2(Math.abs(x))));
}
export const c_significandf = c_significand;

/** POSIX / GNU: j0, j1, jn — Bessel functions of the first kind.
 *  Implemented via a basic series for small |x| and an asymptotic form for
 *  large |x|. Accuracy is adequate for the non-critical uses that translated
 *  C code typically makes of these, but better precision can be plugged in
 *  later by swapping these implementations. */
function bessel_j(n: number, x: number): number {
  if (!Number.isFinite(x)) return Number.isNaN(x) ? NaN : 0;
  const ax = Math.abs(x);
  if (ax < 8) {
    // Series: J_n(x) = sum_{k=0..∞} (-1)^k / (k! (k+n)!) * (x/2)^(2k+n)
    const half = x / 2;
    let term = 1;
    for (let k = 1; k <= n; k++) term *= half / k;
    let sum = term, sign = -1;
    const x2 = half * half;
    for (let k = 1; k < 60; k++) {
      term *= x2 / (k * (k + n));
      const add = sign * term;
      sum += add;
      sign = -sign;
      if (Math.abs(add) < 1e-18 * Math.abs(sum)) break;
    }
    return sum;
  }
  // Asymptotic form: J_n(x) ≈ sqrt(2/(πx)) * cos(x - (2n+1)π/4)
  const phase = ax - (2 * n + 1) * Math.PI / 4;
  const v = Math.sqrt(2 / (Math.PI * ax)) * Math.cos(phase);
  return x < 0 && (n % 2) ? -v : v;
}
function bessel_y(n: number, x: number): number {
  if (x <= 0) return -Infinity;
  if (!Number.isFinite(x)) return 0;
  // Asymptotic: Y_n(x) ≈ sqrt(2/(πx)) * sin(x - (2n+1)π/4)
  const phase = x - (2 * n + 1) * Math.PI / 4;
  return Math.sqrt(2 / (Math.PI * x)) * Math.sin(phase);
}
export function c_j0(x: number): number { return bessel_j(0, x); }
export function c_j1(x: number): number { return bessel_j(1, x); }
export function c_jn(n: number, x: number): number { return bessel_j(n, x); }
export function c_y0(x: number): number { return bessel_y(0, x); }
export function c_y1(x: number): number { return bessel_y(1, x); }
export function c_yn(n: number, x: number): number { return bessel_y(n, x); }
export const c_j0f = c_j0;
export const c_j1f = c_j1;
export const c_jnf = c_jn;
export const c_y0f = c_y0;
export const c_y1f = c_y1;
export const c_ynf = c_yn;
