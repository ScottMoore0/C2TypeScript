// C17 §7.3 <complex.h> — complex-number arithmetic.
//
// JS has no native complex type. We represent `double complex` as
// `{ re: number, im: number }`. Translated C code that uses
// `double complex z; creal(z); cimag(z); cabs(z);` receives this shape.
//
// Spec grounding: each function below cites its C17 §7.3 section.
// Behaviour follows the real-axis restriction where documented
// (§7.3.2: infinities / NaNs in real/imag parts per Annex G where specified).

export interface CComplex { re: number; im: number }

function ccx(re: number, im: number = 0): CComplex { return { re, im }; }

// §7.3.8.1 — CMPLX/CMPLXF/CMPLXL: construct a complex from real + imag.
export function c_CMPLX(re: number, im: number): CComplex { return ccx(re, im); }
export const c_CMPLXF = c_CMPLX;
export const c_CMPLXL = c_CMPLX;

// §7.3.9.1 cabs — complex absolute value (Euclidean norm).
export function c_cabs(z: CComplex): number { return Math.hypot(z.re, z.im); }
export const c_cabsf = c_cabs;
export const c_cabsl = c_cabs;

// §7.3.9.2 carg — argument (phase angle).
export function c_carg(z: CComplex): number { return Math.atan2(z.im, z.re); }
export const c_cargf = c_carg;
export const c_cargl = c_carg;

// §7.3.9.3 cimag — imaginary part.
export function c_cimag(z: CComplex): number { return z.im; }
export const c_cimagf = c_cimag;
export const c_cimagl = c_cimag;

// §7.3.9.4 conj — complex conjugate.
export function c_conj(z: CComplex): CComplex { return ccx(z.re, -z.im); }
export const c_conjf = c_conj;
export const c_conjl = c_conj;

// §7.3.9.5 cproj — Riemann-sphere projection.
export function c_cproj(z: CComplex): CComplex {
  if (!isFinite(z.re) || !isFinite(z.im)) return ccx(Infinity, Math.sign(z.im) * 0);
  return z;
}
export const c_cprojf = c_cproj;
export const c_cprojl = c_cproj;

// §7.3.9.6 creal — real part.
export function c_creal(z: CComplex): number { return z.re; }
export const c_crealf = c_creal;
export const c_creall = c_creal;

// §7.3.7 cexp — complex exponential.
export function c_cexp(z: CComplex): CComplex {
  const ea = Math.exp(z.re);
  return ccx(ea * Math.cos(z.im), ea * Math.sin(z.im));
}
export const c_cexpf = c_cexp;
export const c_cexpl = c_cexp;

// §7.3.7 clog — complex natural log. Principal branch: imag in (-π, π].
export function c_clog(z: CComplex): CComplex {
  return ccx(Math.log(Math.hypot(z.re, z.im)), Math.atan2(z.im, z.re));
}
export const c_clogf = c_clog;
export const c_clogl = c_clog;

// §7.3.8.2 cpow — complex power z^w = exp(w * log(z)).
export function c_cpow(z: CComplex, w: CComplex): CComplex {
  return c_cexp(__cmul(w, c_clog(z)));
}
export const c_cpowf = c_cpow;
export const c_cpowl = c_cpow;

// §7.3.8.3 csqrt — principal square root.
export function c_csqrt(z: CComplex): CComplex {
  const r = Math.hypot(z.re, z.im);
  const re = Math.sqrt((r + z.re) / 2);
  const im = (z.im >= 0 ? 1 : -1) * Math.sqrt((r - z.re) / 2);
  return ccx(re, im);
}
export const c_csqrtf = c_csqrt;
export const c_csqrtl = c_csqrt;

// §7.3.5 csin — complex sine.  sin(a + bi) = sin a cosh b + i cos a sinh b.
export function c_csin(z: CComplex): CComplex {
  return ccx(Math.sin(z.re) * Math.cosh(z.im), Math.cos(z.re) * Math.sinh(z.im));
}
export const c_csinf = c_csin;
export const c_csinl = c_csin;

// §7.3.5 ccos — complex cosine. cos(a + bi) = cos a cosh b - i sin a sinh b.
export function c_ccos(z: CComplex): CComplex {
  return ccx(Math.cos(z.re) * Math.cosh(z.im), -Math.sin(z.re) * Math.sinh(z.im));
}
export const c_ccosf = c_ccos;
export const c_ccosl = c_ccos;

// §7.3.5 ctan — complex tangent.
export function c_ctan(z: CComplex): CComplex {
  const s = c_csin(z), c = c_ccos(z);
  return __cdiv(s, c);
}
export const c_ctanf = c_ctan;
export const c_ctanl = c_ctan;

// §7.3.6 csinh / ccosh / ctanh — hyperbolic variants.
export function c_csinh(z: CComplex): CComplex {
  return ccx(Math.sinh(z.re) * Math.cos(z.im), Math.cosh(z.re) * Math.sin(z.im));
}
export const c_csinhf = c_csinh;
export const c_csinhl = c_csinh;

export function c_ccosh(z: CComplex): CComplex {
  return ccx(Math.cosh(z.re) * Math.cos(z.im), Math.sinh(z.re) * Math.sin(z.im));
}
export const c_ccoshf = c_ccosh;
export const c_ccoshl = c_ccosh;

export function c_ctanh(z: CComplex): CComplex {
  const s = c_csinh(z), c = c_ccosh(z);
  return __cdiv(s, c);
}
export const c_ctanhf = c_ctanh;
export const c_ctanhl = c_ctanh;

// Internal complex arithmetic helpers. Not spec-exposed but mirror the
// semantics of C's `+` / `-` / `*` / `/` operators on complex types
// (C17 §6.5.5 p6 — complex arithmetic rules).
function __cmul(a: CComplex, b: CComplex): CComplex {
  return ccx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}
function __cdiv(a: CComplex, b: CComplex): CComplex {
  const denom = b.re * b.re + b.im * b.im;
  return ccx((a.re * b.re + a.im * b.im) / denom, (a.im * b.re - a.re * b.im) / denom);
}
function __cadd(a: CComplex, b: CComplex): CComplex { return ccx(a.re + b.re, a.im + b.im); }
function __csub(a: CComplex, b: CComplex): CComplex { return ccx(a.re - b.re, a.im - b.im); }
function __cneg(a: CComplex): CComplex { return ccx(-a.re, -a.im); }
function __cmuli(a: CComplex): CComplex { return ccx(-a.im, a.re); } // a * i

// §7.3.5.1 cacos — principal value of arc cosine. cacos(z) = -i * log(z + i*sqrt(1 - z^2))
// Range: real part in [0, π], imaginary part unbounded.
export function c_cacos(z: CComplex): CComplex {
  const one = ccx(1, 0);
  const z2 = __cmul(z, z);
  const s = c_csqrt(__csub(one, z2));
  const arg = __cadd(z, __cmuli(s));
  const lg = c_clog(arg);
  // -i * lg = (lg.im, -lg.re)
  return ccx(lg.im, -lg.re);
}
export const c_cacosf = c_cacos;
export const c_cacosl = c_cacos;

// §7.3.5.2 casin — principal value of arc sine. casin(z) = -i * log(i*z + sqrt(1 - z^2))
// Range: real part in [-π/2, π/2].
export function c_casin(z: CComplex): CComplex {
  const one = ccx(1, 0);
  const z2 = __cmul(z, z);
  const s = c_csqrt(__csub(one, z2));
  const arg = __cadd(__cmuli(z), s);
  const lg = c_clog(arg);
  return ccx(lg.im, -lg.re);
}
export const c_casinf = c_casin;
export const c_casinl = c_casin;

// §7.3.5.3 catan — principal value of arc tangent.
// catan(z) = (i/2) * (log(1 - i*z) - log(1 + i*z))
// Range: real part in [-π/2, π/2].
export function c_catan(z: CComplex): CComplex {
  const iz = __cmuli(z); // i*z
  const a = c_clog(__csub(ccx(1, 0), iz));
  const b = c_clog(__cadd(ccx(1, 0), iz));
  const diff = __csub(a, b);
  // (i/2) * diff = (-diff.im/2, diff.re/2)
  return ccx(-diff.im / 2, diff.re / 2);
}
export const c_catanf = c_catan;
export const c_catanl = c_catan;

// §7.3.6.1 cacosh — principal value of arc hyperbolic cosine.
// cacosh(z) = log(z + sqrt(z-1) * sqrt(z+1)).
// Range: real part >= 0, imaginary part in [-π, π].
export function c_cacosh(z: CComplex): CComplex {
  const a = c_csqrt(__csub(z, ccx(1, 0)));
  const b = c_csqrt(__cadd(z, ccx(1, 0)));
  return c_clog(__cadd(z, __cmul(a, b)));
}
export const c_cacoshf = c_cacosh;
export const c_cacoshl = c_cacosh;

// §7.3.6.2 casinh — principal value of arc hyperbolic sine.
// casinh(z) = log(z + sqrt(z^2 + 1)).
// Range: imaginary part in [-π/2, π/2].
export function c_casinh(z: CComplex): CComplex {
  const z2 = __cmul(z, z);
  const s = c_csqrt(__cadd(z2, ccx(1, 0)));
  return c_clog(__cadd(z, s));
}
export const c_casinhf = c_casinh;
export const c_casinhl = c_casinh;

// §7.3.6.3 catanh — principal value of arc hyperbolic tangent.
// catanh(z) = (1/2) * log((1 + z) / (1 - z)).
// Range: imaginary part in [-π/2, π/2].
export function c_catanh(z: CComplex): CComplex {
  const num = __cadd(ccx(1, 0), z);
  const den = __csub(ccx(1, 0), z);
  const lg = c_clog(__cdiv(num, den));
  return ccx(lg.re / 2, lg.im / 2);
}
export const c_catanhf = c_catanh;
export const c_catanhl = c_catanh;

// §7.3.9 (C2x extension, common in MSVC/glibc) cnorm — squared magnitude.
// cnorm(z) = re*re + im*im. Avoids the sqrt of cabs and is what
// std::norm in C++ reports; many DSP codes call it.
export function c_cnorm(z: CComplex): number { return z.re * z.re + z.im * z.im; }
export const c_cnormf = c_cnorm;
export const c_cnorml = c_cnorm;
