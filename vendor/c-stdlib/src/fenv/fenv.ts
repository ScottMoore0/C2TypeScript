// Forge — C floating-point environment (C17 §7.6).
//
// JavaScript performs all double arithmetic in round-to-nearest-even (IEEE 754
// roundTiesToEven) and never exposes the FP exception flags. To support C code
// that calls `fesetround` / `feraiseexcept` / `fetestexcept`, we maintain an
// in-process snapshot of the rounding mode + exception-flag set, and provide
// `__cpp_fenv_add` / `_sub` / `_mul` / `_div` helpers that the emitter routes
// FP arithmetic through when the surrounding function has a visible
// `fesetround` call (i.e. the rounding mode is non-default).
//
// Hot-path FP code that never calls `fesetround` should keep using native
// `a + b` etc. — the emitter checks per-function whether fenv is active and
// only dispatches in that case, so we don't pay the helper cost everywhere.

/** C17 §7.6.2: exception flags. Values match MinGW <fenv.h> on Windows, which
 *  is the toolchain Clang uses for preprocessing in this project. The C
 *  source is preprocessed with these values and the emitter sees the
 *  expanded integer literals (e.g. `fetestexcept(8)` for FE_DIVBYZERO),
 *  so c-stdlib must agree to keep state synchronised with the emitter's
 *  inlined `__cpp_fenv_*` helpers and shim-database stubs. */
export const FE_INEXACT   = 1;
export const FE_UNDERFLOW = 2;
export const FE_OVERFLOW  = 4;
export const FE_DIVBYZERO = 8;
export const FE_INVALID   = 16;
export const FE_ALL_EXCEPT = FE_INVALID | FE_DIVBYZERO | FE_OVERFLOW | FE_UNDERFLOW | FE_INEXACT;

/** C17 §7.6.3: rounding modes. MinGW <fenv.h> values (Clang preprocessing). */
export const FE_TONEAREST  = 0;
export const FE_DOWNWARD   = 0x100;
export const FE_UPWARD     = 0x200;
export const FE_TOWARDZERO = 0x300;

// In-process FP environment state.
let _roundingMode = FE_TONEAREST;
let _exceptionFlags = 0;

// Mirror exception flags + rounding mode into a globalThis slot so the
// emitter's inlined `fetestexcept` / `feclearexcept` shim-database stubs
// (which read from globalThis.__fenvExc) and the c-stdlib `c_fetestexcept`
// implementation observe the same state. Without this mirror, an FP
// arithmetic op routed through `__cpp_fenv_*` would update `_exceptionFlags`
// but the user's downstream `fetestexcept(FE_DIVBYZERO)` (lowered as the
// inline shim) would read 0 from globalThis. Mirror is one-way: inlined
// shims still write to globalThis directly, and the c-stdlib functions
// re-read globalThis on every call so the two state spaces stay in sync.
function _syncToGlobal(): void {
  (globalThis as any).__fenvExc = _exceptionFlags;
  (globalThis as any).__fenvRound = _roundingMode;
}
function _syncFromGlobal(): void {
  const g = globalThis as any;
  if (typeof g.__fenvExc === 'number') _exceptionFlags = g.__fenvExc | 0;
  if (typeof g.__fenvRound === 'number') _roundingMode = g.__fenvRound | 0;
}

/** Floating-point environment snapshot (fenv_t). */
export interface FEnv {
  roundingMode: number;
  exceptionFlags: number;
}

/** fexcept_t — exception-flag bag, distinct from fenv_t per C17 §7.6 p2. */
export interface FExcept {
  value: number;
}

/** C17 §7.6.2.1: feclearexcept — clear exception flags. */
export function c_feclearexcept(excepts: number): number {
  _syncFromGlobal();
  _exceptionFlags &= ~(excepts & FE_ALL_EXCEPT);
  _syncToGlobal();
  return 0;
}

/** C17 §7.6.2.3: feraiseexcept — raise exception flags. */
export function c_feraiseexcept(excepts: number): number {
  _syncFromGlobal();
  _exceptionFlags |= (excepts & FE_ALL_EXCEPT);
  _syncToGlobal();
  return 0;
}

/** C17 §7.6.2.5: fetestexcept — test exception flags. */
export function c_fetestexcept(excepts: number): number {
  _syncFromGlobal();
  return _exceptionFlags & excepts & FE_ALL_EXCEPT;
}

/** C17 §7.6.2.2: fegetexceptflag — store flags into a fexcept_t. */
export function c_fegetexceptflag(flagp: FExcept, excepts: number): number {
  _syncFromGlobal();
  if (flagp) flagp.value = _exceptionFlags & excepts & FE_ALL_EXCEPT;
  return 0;
}

/** C17 §7.6.2.4: fesetexceptflag — restore listed flags from a fexcept_t. */
export function c_fesetexceptflag(flagp: FExcept, excepts: number): number {
  _syncFromGlobal();
  const mask = excepts & FE_ALL_EXCEPT;
  const incoming = ((flagp?.value ?? 0) & mask);
  _exceptionFlags = (_exceptionFlags & ~mask) | incoming;
  _syncToGlobal();
  return 0;
}

/** C17 §7.6.3.1: fegetround — get rounding mode. */
export function c_fegetround(): number {
  _syncFromGlobal();
  return _roundingMode;
}

/** C17 §7.6.3.2: fesetround — set rounding mode. Returns 0 on success. */
export function c_fesetround(mode: number): number {
  if (mode !== FE_TONEAREST && mode !== FE_DOWNWARD &&
      mode !== FE_UPWARD && mode !== FE_TOWARDZERO) {
    return -1;
  }
  _roundingMode = mode;
  _syncToGlobal();
  return 0;
}

/** C17 §7.6.4.1: fegetenv — save environment. */
export function c_fegetenv(env: FEnv): number {
  _syncFromGlobal();
  if (env) {
    env.roundingMode = _roundingMode;
    env.exceptionFlags = _exceptionFlags;
  }
  return 0;
}

/** C17 §7.6.4.3: fesetenv — restore environment. */
export function c_fesetenv(env: FEnv): number {
  if (env) {
    _roundingMode = env.roundingMode ?? FE_TONEAREST;
    _exceptionFlags = env.exceptionFlags ?? 0;
    _syncToGlobal();
  }
  return 0;
}

/** C17 §7.6.4.2: feholdexcept — save env, clear all exceptions. */
export function c_feholdexcept(env: FEnv): number {
  c_fegetenv(env);
  _exceptionFlags = 0;
  _syncToGlobal();
  return 0;
}

/** C17 §7.6.4.4: feupdateenv — restore env and OR in any currently-raised flags. */
export function c_feupdateenv(env: FEnv): number {
  _syncFromGlobal();
  const current = _exceptionFlags;
  c_fesetenv(env);
  _exceptionFlags |= current;
  _syncToGlobal();
  return 0;
}

// ───────────────────────────── arithmetic helpers ─────────────────────────────
//
// Strategy: JS computes every result in round-to-nearest-even. To emulate other
// rounding modes we (a) compute the unrounded reference using DataView round-trip
// to detect whether the IEEE result was inexact, (b) re-round to the requested
// mode, (c) raise FE_INEXACT / FE_OVERFLOW / FE_UNDERFLOW / FE_DIVBYZERO /
// FE_INVALID per §7.12.1 as the operation dictates.
//
// For modes other than round-to-nearest, when the IEEE-rounded result is
// inexact we may need to step one ULP toward zero or away from zero depending
// on the sign and the requested mode. We use `Math.fround` is not appropriate
// for double; instead we step by `nextafter`-style ULP manipulation via
// Float64Array bit manipulation — which is what hardware does.

const _f64 = new Float64Array(1);
const _u32 = new Uint32Array(_f64.buffer);

/** Bit-step a finite double by one ULP toward +∞ (positive direction). */
function _ulpUp(x: number): number {
  if (Number.isNaN(x) || x === Infinity) return x;
  if (x === 0) {
    _u32[0] = 1; _u32[1] = 0;
    return _f64[0]; // smallest positive subnormal
  }
  _f64[0] = x;
  // Little-endian: lo at index 0, hi at index 1.
  const sign = _u32[1] >>> 31;
  if (sign === 0) {
    // positive: increment magnitude
    if (_u32[0] === 0xFFFFFFFF) { _u32[0] = 0; _u32[1] = (_u32[1] + 1) >>> 0; }
    else _u32[0] = (_u32[0] + 1) >>> 0;
  } else {
    // negative: decrement magnitude (move toward 0, then toward +∞)
    if (_u32[0] === 0) { _u32[0] = 0xFFFFFFFF; _u32[1] = (_u32[1] - 1) >>> 0; }
    else _u32[0] = (_u32[0] - 1) >>> 0;
  }
  return _f64[0];
}

/** Bit-step a finite double by one ULP toward −∞. */
function _ulpDown(x: number): number {
  if (Number.isNaN(x) || x === -Infinity) return x;
  if (x === 0) {
    _u32[0] = 1; _u32[1] = 0x80000000 >>> 0;
    return _f64[0]; // smallest negative subnormal
  }
  _f64[0] = x;
  const sign = _u32[1] >>> 31;
  if (sign === 0) {
    if (_u32[0] === 0) { _u32[0] = 0xFFFFFFFF; _u32[1] = (_u32[1] - 1) >>> 0; }
    else _u32[0] = (_u32[0] - 1) >>> 0;
  } else {
    if (_u32[0] === 0xFFFFFFFF) { _u32[0] = 0; _u32[1] = (_u32[1] + 1) >>> 0; }
    else _u32[0] = (_u32[0] + 1) >>> 0;
  }
  return _f64[0];
}

/**
 * Re-round an IEEE round-to-nearest-even result `r` to the current rounding
 * mode, given the operands and operation. We detect inexactness by computing
 * the operation in Number (IEEE-RTE) and comparing to a higher-precision
 * reference where one exists; for +/-/* we rely on the fact that JS already
 * delivered the correctly-rounded RTE result, so we only need to step at most
 * one ULP toward the requested direction.
 *
 * For +/-, exactness is determined by Veltkamp-style 2Sum: if `x + y` round-trips
 * (a = r - y; b = r - a; x == a && y == b after implicit conversion) the
 * result is exact. For multiplication we use 2Prod via fma — JS's Math.fma is
 * not standard, so we fall back to a Dekker split.
 */
function _detectInexactSum(a: number, b: number, r: number): boolean {
  if (!Number.isFinite(r)) return false; // overflow handled separately
  const ax = r - b;
  const by = r - ax;
  const da = a - ax;
  const dbb = b - by;
  return (da + dbb) !== 0;
}

function _detectInexactProd(a: number, b: number, r: number): boolean {
  if (!Number.isFinite(r) || a === 0 || b === 0) return false;
  // Dekker split: split each operand into hi+lo with 26 bits each.
  const split = (x: number) => {
    const c = 134217729 * x; // 2^27 + 1
    const hi = c - (c - x);
    const lo = x - hi;
    return [hi, lo] as const;
  };
  const [ahi, alo] = split(a);
  const [bhi, blo] = split(b);
  const err = ((ahi * bhi - r) + ahi * blo + alo * bhi) + alo * blo;
  return err !== 0;
}

/** Re-round `rRTE` (RTE-rounded result) per current mode given inexactness. */
function _applyRounding(rRTE: number, inexact: boolean, signHint: number): number {
  if (!inexact) return rRTE;
  const mode = _roundingMode;
  if (mode === FE_TONEAREST) return rRTE;
  // signHint: sign of the true (unrounded) result; for +/- it equals sign of rRTE
  // when not exactly zero; for * it equals sign(a)*sign(b).
  if (mode === FE_TOWARDZERO) {
    // Round toward zero: snap rRTE one ULP toward 0 if rRTE has same sign as result.
    if (rRTE > 0) return _ulpDown(rRTE);
    if (rRTE < 0) return _ulpUp(rRTE);
    return rRTE;
  }
  if (mode === FE_DOWNWARD) {
    // Round toward -∞.
    return _ulpDown(rRTE);
  }
  if (mode === FE_UPWARD) {
    // Round toward +∞.
    return _ulpUp(rRTE);
  }
  return rRTE;
}

/** Public — emitter dispatches FP `a + b` here when fenv is active. */
export function __cpp_fenv_add(a: number, b: number): number {
  _syncFromGlobal();
  const r = a + b;
  if (Number.isNaN(r)) {
    if ((a === Infinity && b === -Infinity) || (a === -Infinity && b === Infinity)) {
      _exceptionFlags |= FE_INVALID;
    }
    _syncToGlobal();
    return r;
  }
  if (!Number.isFinite(r) && Number.isFinite(a) && Number.isFinite(b)) {
    _exceptionFlags |= FE_OVERFLOW | FE_INEXACT;
    _syncToGlobal();
    return r;
  }
  const inexact = _detectInexactSum(a, b, r);
  if (inexact) _exceptionFlags |= FE_INEXACT;
  const out = _applyRounding(r, inexact, Math.sign(r));
  _syncToGlobal();
  return out;
}

export function __cpp_fenv_sub(a: number, b: number): number {
  return __cpp_fenv_add(a, -b);
}

export function __cpp_fenv_mul(a: number, b: number): number {
  _syncFromGlobal();
  const r = a * b;
  if (Number.isNaN(r)) {
    // 0 * inf is invalid per §7.12.1.
    if ((a === 0 && !Number.isFinite(b)) || (b === 0 && !Number.isFinite(a))) {
      _exceptionFlags |= FE_INVALID;
    }
    _syncToGlobal();
    return r;
  }
  if (!Number.isFinite(r) && Number.isFinite(a) && Number.isFinite(b)) {
    _exceptionFlags |= FE_OVERFLOW | FE_INEXACT;
    _syncToGlobal();
    return r;
  }
  const inexact = _detectInexactProd(a, b, r);
  if (inexact) _exceptionFlags |= FE_INEXACT;
  const out = _applyRounding(r, inexact, Math.sign(a) * Math.sign(b));
  _syncToGlobal();
  return out;
}

export function __cpp_fenv_div(a: number, b: number): number {
  _syncFromGlobal();
  if (b === 0) {
    if (a === 0 || Number.isNaN(a)) {
      _exceptionFlags |= FE_INVALID;
      _syncToGlobal();
      return NaN;
    }
    _exceptionFlags |= FE_DIVBYZERO;
    _syncToGlobal();
    return (Math.sign(a) === Math.sign(1 / b)) ? Infinity : -Infinity;
  }
  const r = a / b;
  if (Number.isNaN(r)) {
    if (!Number.isFinite(a) && !Number.isFinite(b)) _exceptionFlags |= FE_INVALID;
    _syncToGlobal();
    return r;
  }
  if (!Number.isFinite(r) && Number.isFinite(a) && Number.isFinite(b)) {
    _exceptionFlags |= FE_OVERFLOW | FE_INEXACT;
    _syncToGlobal();
    return r;
  }
  // Inexactness for division: r is exact iff r * b == a exactly. Use 2Prod.
  let inexact = false;
  if (Number.isFinite(r) && Number.isFinite(a) && Number.isFinite(b)) {
    const inexactProd = _detectInexactProd(r, b, r * b);
    inexact = inexactProd || (r * b !== a);
  }
  if (inexact) _exceptionFlags |= FE_INEXACT;
  const out = _applyRounding(r, inexact, Math.sign(a) * Math.sign(b));
  _syncToGlobal();
  return out;
}

/** Test-only: reset internal state. Not part of C17. */
export function __cpp_fenv_reset(): void {
  _roundingMode = FE_TONEAREST;
  _exceptionFlags = 0;
  _syncToGlobal();
}
