// BC-3d: C99 complex number support (<complex.h>).
// C17 §7.3: complex arithmetic.
// C17 §6.2.5 ¶11: complex types have same representation and alignment
//   requirements as an array of two elements of the corresponding real type.
// C17 §6.2.5 ¶13: _Complex types: float _Complex, double _Complex, long double _Complex.
//
// JavaScript has no native complex type, so we model complex values as
// plain structs {re, im} with two IEEE-754 doubles. All three C _Complex
// widths (float/double/long double) degrade to double precision; the
// *f / *l variants are aliases for API-compatibility.

import type { CPtr } from "../memory/cptr.js";

// --- Core type (C17 §6.2.5 ¶13) ---

/** C99 complex number: re + im·i. C17 §6.2.5 ¶13. */
export interface Complex {
  re: number;
  im: number;
}

/** Construct a complex number. Second arg defaults to 0 (pure real). */
export function complex(re: number, im: number = 0): Complex {
  return { re, im };
}

/** Imaginary unit i. C17 §7.3.1 ¶4: I expands to _Complex_I. */
export const I: Complex = { re: 0, im: 1 };

// --- Accessors (C17 §7.3.9) ---

/** Real part. C17 §7.3.9.5 (creal). */
export function c_creal(a: Complex): number { return a.re; }

/** Imaginary part. C17 §7.3.9.3 (cimag). */
export function c_cimag(a: Complex): number { return a.im; }

/** Complex conjugate: (re, -im). C17 §7.3.9.1 (conj). */
export function c_conj(a: Complex): Complex { return { re: a.re, im: -a.im }; }

/** Magnitude |a| = sqrt(re² + im²). C17 §7.3.8.1 (cabs). */
export function c_cabs(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

/** Argument / phase angle: atan2(im, re). C17 §7.3.9.1 (carg). */
export function c_carg(a: Complex): number {
  return Math.atan2(a.im, a.re);
}

/** Projection onto the Riemann sphere. C17 §7.3.9.4 (cproj).
 *  If either component is infinite, result is (+inf, copysign(0, im)). */
export function c_cproj(a: Complex): Complex {
  if (!Number.isFinite(a.re) || !Number.isFinite(a.im)) {
    // Copy sign of im onto zero.
    const signIm = Object.is(a.im, -0) || a.im < 0 ? -0 : 0;
    return { re: Infinity, im: signIm };
  }
  return { re: a.re, im: a.im };
}

// --- Arithmetic (C17 §6.5.X for +,-,*,/; §7.3.3 overview) ---

/** Complex addition: (a+bi) + (c+di) = (a+c) + (b+d)i. */
export function c_cadd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

/** Complex subtraction. */
export function c_csub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

/** Complex multiplication: (a+bi)(c+di) = (ac-bd) + (ad+bc)i. */
export function c_cmul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/** Complex division: (a+bi)/(c+di) = ((ac+bd) + (bc-ad)i) / (c²+d²).
 *  C17 §G.5.1 describes a more careful algorithm handling inf/NaN; we use
 *  the naive form (sufficient for finite inputs). */
export function c_cdiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom,
  };
}

/** Unary negation. */
export function c_cneg(a: Complex): Complex {
  return { re: -a.re, im: -a.im };
}

// --- Exponential / log / power / root (C17 §7.3.7, §7.3.8) ---

/** cexp(z) = e^re · (cos(im) + i·sin(im)). C17 §7.3.7.1. */
export function c_cexp(a: Complex): Complex {
  const r = Math.exp(a.re);
  return { re: r * Math.cos(a.im), im: r * Math.sin(a.im) };
}

/** clog(z) = log|z| + i·arg(z). C17 §7.3.7.2.
 *  Branch cut along the negative real axis. */
export function c_clog(a: Complex): Complex {
  return { re: Math.log(c_cabs(a)), im: c_carg(a) };
}

/** cpow(a,b) = cexp(b · clog(a)). C17 §7.3.7.3. */
export function c_cpow(a: Complex, b: Complex): Complex {
  return c_cexp(c_cmul(b, c_clog(a)));
}

/** csqrt(z) = √|z| · (cos(arg/2) + i·sin(arg/2)). C17 §7.3.8.3.
 *  Principal branch: result has non-negative real part. */
export function c_csqrt(a: Complex): Complex {
  const r = Math.sqrt(c_cabs(a));
  const t = c_carg(a) / 2;
  return { re: r * Math.cos(t), im: r * Math.sin(t) };
}

// --- Trigonometric (C17 §7.3.5) ---

/** csin(z) = sin(re)cosh(im) + i·cos(re)sinh(im). C17 §7.3.5.5. */
export function c_csin(a: Complex): Complex {
  return {
    re: Math.sin(a.re) * Math.cosh(a.im),
    im: Math.cos(a.re) * Math.sinh(a.im),
  };
}

/** ccos(z) = cos(re)cosh(im) - i·sin(re)sinh(im). C17 §7.3.5.3. */
export function c_ccos(a: Complex): Complex {
  return {
    re: Math.cos(a.re) * Math.cosh(a.im),
    im: -Math.sin(a.re) * Math.sinh(a.im),
  };
}

/** ctan(z) = csin(z) / ccos(z). C17 §7.3.5.7. */
export function c_ctan(a: Complex): Complex {
  return c_cdiv(c_csin(a), c_ccos(a));
}

/** casin(z) = -i · clog(i·z + csqrt(1 - z²)). C17 §7.3.5.2. */
export function c_casin(a: Complex): Complex {
  const zz = c_cmul(a, a);
  const one: Complex = { re: 1, im: 0 };
  const s = c_csqrt(c_csub(one, zz));
  const arg = c_cadd(c_cmul(I, a), s);
  return c_cmul(c_cneg(I), c_clog(arg));
}

/** cacos(z) = -i · clog(z + i·csqrt(1 - z²)). C17 §7.3.5.1. */
export function c_cacos(a: Complex): Complex {
  const zz = c_cmul(a, a);
  const one: Complex = { re: 1, im: 0 };
  const s = c_csqrt(c_csub(one, zz));
  const arg = c_cadd(a, c_cmul(I, s));
  return c_cmul(c_cneg(I), c_clog(arg));
}

/** catan(z) = (i/2) · (clog(1-iz) - clog(1+iz)). C17 §7.3.5.4. */
export function c_catan(a: Complex): Complex {
  const one: Complex = { re: 1, im: 0 };
  const iz = c_cmul(I, a);
  const num = c_clog(c_csub(one, iz));
  const den = c_clog(c_cadd(one, iz));
  const half_i: Complex = { re: 0, im: 0.5 };
  return c_cmul(half_i, c_csub(num, den));
}

// --- Hyperbolic (C17 §7.3.6) ---

/** csinh(z) = sinh(re)cos(im) + i·cosh(re)sin(im). C17 §7.3.6.5. */
export function c_csinh(a: Complex): Complex {
  return {
    re: Math.sinh(a.re) * Math.cos(a.im),
    im: Math.cosh(a.re) * Math.sin(a.im),
  };
}

/** ccosh(z) = cosh(re)cos(im) + i·sinh(re)sin(im). C17 §7.3.6.3. */
export function c_ccosh(a: Complex): Complex {
  return {
    re: Math.cosh(a.re) * Math.cos(a.im),
    im: Math.sinh(a.re) * Math.sin(a.im),
  };
}

/** ctanh(z) = csinh(z)/ccosh(z). C17 §7.3.6.7. */
export function c_ctanh(a: Complex): Complex {
  return c_cdiv(c_csinh(a), c_ccosh(a));
}

/** casinh(z) = clog(z + csqrt(z² + 1)). C17 §7.3.6.2. */
export function c_casinh(a: Complex): Complex {
  const zz = c_cmul(a, a);
  const one: Complex = { re: 1, im: 0 };
  return c_clog(c_cadd(a, c_csqrt(c_cadd(zz, one))));
}

/** cacosh(z) = clog(z + csqrt(z² - 1)). C17 §7.3.6.1. */
export function c_cacosh(a: Complex): Complex {
  const zz = c_cmul(a, a);
  const one: Complex = { re: 1, im: 0 };
  return c_clog(c_cadd(a, c_csqrt(c_csub(zz, one))));
}

/** catanh(z) = (1/2) · clog((1+z)/(1-z)). C17 §7.3.6.4. */
export function c_catanh(a: Complex): Complex {
  const one: Complex = { re: 1, im: 0 };
  const half: Complex = { re: 0.5, im: 0 };
  return c_cmul(half, c_clog(c_cdiv(c_cadd(one, a), c_csub(one, a))));
}

// --- float / long double variants (C17 §7.3 ¶2) ---
// C17 §7.3 ¶2 defines suffixed variants operating at float / long double
// precision. JavaScript has only double, so these alias the double versions.

export const c_cexpf = c_cexp;
export const c_cexpl = c_cexp;
export const c_clogf = c_clog;
export const c_clogl = c_clog;
export const c_cpowf = c_cpow;
export const c_cpowl = c_cpow;
export const c_csqrtf = c_csqrt;
export const c_csqrtl = c_csqrt;
export const c_csinf = c_csin;
export const c_csinl = c_csin;
export const c_ccosf = c_ccos;
export const c_ccosl = c_ccos;
export const c_ctanf = c_ctan;
export const c_ctanl = c_ctan;
export const c_casinf = c_casin;
export const c_casinl = c_casin;
export const c_cacosf = c_cacos;
export const c_cacosl = c_cacos;
export const c_catanf = c_catan;
export const c_catanl = c_catan;
export const c_csinhf = c_csinh;
export const c_csinhl = c_csinh;
export const c_ccoshf = c_ccosh;
export const c_ccoshl = c_ccosh;
export const c_ctanhf = c_ctanh;
export const c_ctanhl = c_ctanh;
export const c_casinhf = c_casinh;
export const c_casinhl = c_casinh;
export const c_cacoshf = c_cacosh;
export const c_cacoshl = c_cacosh;
export const c_catanhf = c_catanh;
export const c_catanhl = c_catanh;
export const c_cabsf = c_cabs;
export const c_cabsl = c_cabs;
export const c_cargf = c_carg;
export const c_cargl = c_carg;
export const c_conjf = c_conj;
export const c_conjl = c_conj;
export const c_cprojf = c_cproj;
export const c_cprojl = c_cproj;
export const c_crealf = c_creal;
export const c_creall = c_creal;
export const c_cimagf = c_cimag;
export const c_cimagl = c_cimag;

// --- CPtr integration (C17 §6.2.5 ¶11: stored as array of two reals) ---
// x86-64 SysV ABI: double _Complex occupies 16 bytes, little-endian,
// real part first at offset 0, imaginary part at offset 8.

/** Size of double _Complex in the target ABI. */
export const COMPLEX_SIZE: number = 16;

function _view(ptr: CPtr): DataView {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
}

/** Read a double _Complex at ptr + offset (little-endian, re then im). */
export function cptr_read_complex(ptr: CPtr, offset: number = 0): Complex {
  const dv = _view(ptr);
  const base = ptr.off + offset;
  return {
    re: dv.getFloat64(base, true),
    im: dv.getFloat64(base + 8, true),
  };
}

/** Write a double _Complex at ptr + offset (little-endian, re then im). */
export function cptr_write_complex(ptr: CPtr, offset: number, c: Complex): void {
  const dv = _view(ptr);
  const base = ptr.off + offset;
  dv.setFloat64(base, c.re, true);
  dv.setFloat64(base + 8, c.im, true);
}
