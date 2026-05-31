// AUTO-GENERATED — C17 §7.12 math functions → JS Math.* wrappers.
// Regenerate with: npx tsx compiler/scripts/build-catalogue/generate-c-stdlib-trivials.ts
// Generated: 2026-04-22T00:07:28.455Z
//
// Per CONVENTIONS.md §A1, §E6, §E7: thin wrappers over Math.*, with BRIDGE
// markers so a refactor-to-native pass can collapse to Math.* directly.
// Functions with no direct Math equivalent have a custom body.

/**
 * C17 §7.12.4.1: acos
 * BRIDGE: libc-math
 */
export function c_acos(x: number): number {
  return Math.acos(x);
}

/**
 * C17 §7.12.4.2: asin
 * BRIDGE: libc-math
 */
export function c_asin(x: number): number {
  return Math.asin(x);
}

/**
 * C17 §7.12.4.3: atan
 * BRIDGE: libc-math
 */
export function c_atan(x: number): number {
  return Math.atan(x);
}

/**
 * C17 §7.12.4.4: atan2
 * BRIDGE: libc-math
 */
export function c_atan2(x: number, y: number): number {
  return Math.atan2(x, y);
}

/**
 * C17 §7.12.4.5: cos
 * BRIDGE: libc-math
 */
export function c_cos(x: number): number {
  return Math.cos(x);
}

/**
 * C17 §7.12.4.6: sin
 * BRIDGE: libc-math
 */
export function c_sin(x: number): number {
  return Math.sin(x);
}

/**
 * C17 §7.12.4.7: tan
 * BRIDGE: libc-math
 */
export function c_tan(x: number): number {
  return Math.tan(x);
}

/**
 * C17 §7.12.5.1: acosh
 * BRIDGE: libc-math
 */
export function c_acosh(x: number): number {
  return Math.acosh(x);
}

/**
 * C17 §7.12.5.2: asinh
 * BRIDGE: libc-math
 */
export function c_asinh(x: number): number {
  return Math.asinh(x);
}

/**
 * C17 §7.12.5.3: atanh
 * BRIDGE: libc-math
 */
export function c_atanh(x: number): number {
  return Math.atanh(x);
}

/**
 * C17 §7.12.5.4: cosh
 * BRIDGE: libc-math
 */
export function c_cosh(x: number): number {
  return Math.cosh(x);
}

/**
 * C17 §7.12.5.5: sinh
 * BRIDGE: libc-math
 */
export function c_sinh(x: number): number {
  return Math.sinh(x);
}

/**
 * C17 §7.12.5.6: tanh
 * BRIDGE: libc-math
 */
export function c_tanh(x: number): number {
  return Math.tanh(x);
}

/**
 * C17 §7.12.6.1: exp
 * BRIDGE: libc-math
 */
export function c_exp(x: number): number {
  return Math.exp(x);
}

/**
 * C17 §7.12.6.2: exp2
 * BRIDGE: libc-math
 * BRIDGE-HINT: Math.pow(2, x)
 */
export function c_exp2(x: number): number {
  return Math.pow(2, x);
}

/**
 * C17 §7.12.6.3: expm1
 * BRIDGE: libc-math
 */
export function c_expm1(x: number): number {
  return Math.expm1(x);
}

/**
 * C17 §7.12.6.7: log
 * BRIDGE: libc-math
 */
export function c_log(x: number): number {
  return Math.log(x);
}

/**
 * C17 §7.12.6.8: log10
 * BRIDGE: libc-math
 */
export function c_log10(x: number): number {
  return Math.log10(x);
}

/**
 * C17 §7.12.6.9: log1p
 * BRIDGE: libc-math
 */
export function c_log1p(x: number): number {
  return Math.log1p(x);
}

/**
 * C17 §7.12.6.10: log2
 * BRIDGE: libc-math
 */
export function c_log2(x: number): number {
  return Math.log2(x);
}

/**
 * C17 §7.12.7.1: cbrt
 * BRIDGE: libc-math
 */
export function c_cbrt(x: number): number {
  return Math.cbrt(x);
}

/**
 * C17 §7.12.7.2: fabs
 * BRIDGE: libc-math
 * BRIDGE-HINT: Math.abs in JS covers both float and integer abs
 */
export function c_fabs(x: number): number {
  return Math.abs(x);
}

/**
 * C17 §7.12.7.3: hypot
 * BRIDGE: libc-math
 */
export function c_hypot(x: number, y: number): number {
  return Math.hypot(x, y);
}

/**
 * C17 §7.12.7.4: pow
 * BRIDGE: libc-math
 */
export function c_pow(x: number, y: number): number {
  return Math.pow(x, y);
}

/**
 * C17 §7.12.7.5: sqrt
 * BRIDGE: libc-math
 */
export function c_sqrt(x: number): number {
  return Math.sqrt(x);
}

/**
 * C17 §7.12.9.1: ceil
 * BRIDGE: libc-math
 */
export function c_ceil(x: number): number {
  return Math.ceil(x);
}

/**
 * C17 §7.12.9.2: floor
 * BRIDGE: libc-math
 */
export function c_floor(x: number): number {
  return Math.floor(x);
}

/**
 * C17 §7.12.9.6: round
 * BRIDGE: libc-math
 * BRIDGE-HINT: JS round is round-half-to-even; C is round-half-away-from-zero. See custom impl if exact match needed.
 */
export function c_round(x: number): number {
  return Math.round(x);
}

/**
 * C17 §7.12.9.8: trunc
 * BRIDGE: libc-math
 */
export function c_trunc(x: number): number {
  return Math.trunc(x);
}

/**
 * C17 §7.12.11.1: copysign
 * BRIDGE: libc-math
 * BRIDGE-HINT: Math.sign-based impl
 */
export function c_copysign(x: number, y: number): number {
  return Math.sign(y) === 0 ? Math.abs(x) * (Object.is(y, -0) ? -1 : 1) : Math.abs(x) * Math.sign(y);
}

/**
 * C17 §7.12.10.1: fmod
 * BRIDGE: libc-math
 * BRIDGE-HINT: x - Math.trunc(x/y) * y
 */
export function c_fmod(x: number, y: number): number {
  return x - Math.trunc(x / y) * y;
}

/**
 * C17 §7.12.12.1: fdim
 * BRIDGE: libc-math
 * BRIDGE-HINT: Math.max(x - y, 0)
 */
export function c_fdim(x: number, y: number): number {
  return x > y ? x - y : 0;
}

/**
 * C17 §7.12.12.2: fmax
 * BRIDGE: libc-math
 */
export function c_fmax(x: number, y: number): number {
  return Math.max(x, y);
}

/**
 * C17 §7.12.12.3: fmin
 * BRIDGE: libc-math
 */
export function c_fmin(x: number, y: number): number {
  return Math.min(x, y);
}

/**
 * C17 §7.12.13.1: fma
 * BRIDGE: libc-math
 * BRIDGE-HINT: (x * y) + z; note: simpler than IEEE fused-multiply-add
 */
export function c_fma(x: number, y: number, z: number): number {
  // Note: simpler than IEEE fma; rounds intermediate. For exact fma, use BigDecimal or similar.
  return (x * y) + z;
}
