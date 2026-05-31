// SIMD type tags — opaque byte-buffer wrappers for Intel/AMD vector types.
// __m64 (MMX, 8 bytes), __m128 (SSE, 16 bytes), __m256 (AVX, 32 bytes),
// __m512 (AVX-512, 64 bytes). Defined by the Intel Intrinsics Guide
// and exposed by <mmintrin.h>, <xmmintrin.h>, <immintrin.h> headers.
//
// NOTE: These are CORRECTNESS STUBS only. Intel SIMD intrinsics like
// _mm_add_ps are not part of the C/C++ standards — they're compiler-
// specific vendor extensions. The implementations here run one lane at a
// time via DataView and are not performant. They exist so that translated
// code declaring __m128 variables has a well-defined JS shape and its byte
// buffer can be inspected / loaded / stored correctly.

import type { CPtr } from "../memory/cptr.js";

// --- Opaque vector tags ---

export interface M64 { bytes: Uint8Array }    // 8 bytes
export interface M128 { bytes: Uint8Array }   // 16 bytes
export interface M256 { bytes: Uint8Array }   // 32 bytes
export interface M512 { bytes: Uint8Array }   // 64 bytes

// --- Factories ---

export function m64_zero(): M64 { return { bytes: new Uint8Array(8) }; }
export function m128_zero(): M128 { return { bytes: new Uint8Array(16) }; }
export function m256_zero(): M256 { return { bytes: new Uint8Array(32) }; }
export function m512_zero(): M512 { return { bytes: new Uint8Array(64) }; }

// --- Internal helpers ---

function _dv(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function _ptrView(ptr: CPtr): DataView {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
}

function _expectSize(bytes: Uint8Array, want: number, op: string): void {
  if (bytes.byteLength !== want) {
    throw new RangeError(`${op}: expected ${want}-byte vector, got ${bytes.byteLength}`);
  }
}

// --- M128 load / store ---

/** Load 4 float32 lanes into an __m128. Little-endian. */
export function m128_load_float32x4(ptr: CPtr): M128 {
  const v = _ptrView(ptr);
  const out = new Uint8Array(16);
  const dv = _dv(out);
  for (let i = 0; i < 4; i++) {
    dv.setFloat32(i * 4, v.getFloat32(ptr.off + i * 4, true), true);
  }
  return { bytes: out };
}

export function m128_store_float32x4(ptr: CPtr, v: M128): void {
  _expectSize(v.bytes, 16, "m128_store_float32x4");
  const dst = _ptrView(ptr);
  const src = _dv(v.bytes);
  for (let i = 0; i < 4; i++) {
    dst.setFloat32(ptr.off + i * 4, src.getFloat32(i * 4, true), true);
  }
}

/** Load 2 float64 lanes into an __m128d. */
export function m128_load_float64x2(ptr: CPtr): M128 {
  const v = _ptrView(ptr);
  const out = new Uint8Array(16);
  const dv = _dv(out);
  for (let i = 0; i < 2; i++) {
    dv.setFloat64(i * 8, v.getFloat64(ptr.off + i * 8, true), true);
  }
  return { bytes: out };
}

export function m128_store_float64x2(ptr: CPtr, v: M128): void {
  _expectSize(v.bytes, 16, "m128_store_float64x2");
  const dst = _ptrView(ptr);
  const src = _dv(v.bytes);
  for (let i = 0; i < 2; i++) {
    dst.setFloat64(ptr.off + i * 8, src.getFloat64(i * 8, true), true);
  }
}

/** Load 4 int32 lanes into an __m128i. */
export function m128_load_int32x4(ptr: CPtr): M128 {
  const v = _ptrView(ptr);
  const out = new Uint8Array(16);
  const dv = _dv(out);
  for (let i = 0; i < 4; i++) {
    dv.setInt32(i * 4, v.getInt32(ptr.off + i * 4, true), true);
  }
  return { bytes: out };
}

export function m128_store_int32x4(ptr: CPtr, v: M128): void {
  _expectSize(v.bytes, 16, "m128_store_int32x4");
  const dst = _ptrView(ptr);
  const src = _dv(v.bytes);
  for (let i = 0; i < 4; i++) {
    dst.setInt32(ptr.off + i * 4, src.getInt32(i * 4, true), true);
  }
}

/** Load 2 int64 lanes into an __m128i. */
export function m128_load_int64x2(ptr: CPtr): M128 {
  const v = _ptrView(ptr);
  const out = new Uint8Array(16);
  const dv = _dv(out);
  for (let i = 0; i < 2; i++) {
    dv.setBigInt64(i * 8, v.getBigInt64(ptr.off + i * 8, true), true);
  }
  return { bytes: out };
}

export function m128_store_int64x2(ptr: CPtr, v: M128): void {
  _expectSize(v.bytes, 16, "m128_store_int64x2");
  const dst = _ptrView(ptr);
  const src = _dv(v.bytes);
  for (let i = 0; i < 2; i++) {
    dst.setBigInt64(ptr.off + i * 8, src.getBigInt64(i * 8, true), true);
  }
}

// --- M256 load / store ---

export function m256_load_float32x8(ptr: CPtr): M256 {
  const v = _ptrView(ptr);
  const out = new Uint8Array(32);
  const dv = _dv(out);
  for (let i = 0; i < 8; i++) {
    dv.setFloat32(i * 4, v.getFloat32(ptr.off + i * 4, true), true);
  }
  return { bytes: out };
}

export function m256_store_float32x8(ptr: CPtr, v: M256): void {
  _expectSize(v.bytes, 32, "m256_store_float32x8");
  const dst = _ptrView(ptr);
  const src = _dv(v.bytes);
  for (let i = 0; i < 8; i++) {
    dst.setFloat32(ptr.off + i * 4, src.getFloat32(i * 4, true), true);
  }
}

export function m256_load_float64x4(ptr: CPtr): M256 {
  const v = _ptrView(ptr);
  const out = new Uint8Array(32);
  const dv = _dv(out);
  for (let i = 0; i < 4; i++) {
    dv.setFloat64(i * 8, v.getFloat64(ptr.off + i * 8, true), true);
  }
  return { bytes: out };
}

export function m256_store_float64x4(ptr: CPtr, v: M256): void {
  _expectSize(v.bytes, 32, "m256_store_float64x4");
  const dst = _ptrView(ptr);
  const src = _dv(v.bytes);
  for (let i = 0; i < 4; i++) {
    dst.setFloat64(ptr.off + i * 8, src.getFloat64(i * 8, true), true);
  }
}

export function m256_load_int32x8(ptr: CPtr): M256 {
  const v = _ptrView(ptr);
  const out = new Uint8Array(32);
  const dv = _dv(out);
  for (let i = 0; i < 8; i++) {
    dv.setInt32(i * 4, v.getInt32(ptr.off + i * 4, true), true);
  }
  return { bytes: out };
}

export function m256_store_int32x8(ptr: CPtr, v: M256): void {
  _expectSize(v.bytes, 32, "m256_store_int32x8");
  const dst = _ptrView(ptr);
  const src = _dv(v.bytes);
  for (let i = 0; i < 8; i++) {
    dst.setInt32(ptr.off + i * 4, src.getInt32(i * 4, true), true);
  }
}

// --- Limited element-wise ops (NOT performant; correctness stubs) ---

/** Element-wise add of four float32 lanes: mimics _mm_add_ps. */
export function m128_add_float32x4(a: M128, b: M128): M128 {
  _expectSize(a.bytes, 16, "m128_add_float32x4");
  _expectSize(b.bytes, 16, "m128_add_float32x4");
  const out = new Uint8Array(16);
  const da = _dv(a.bytes), db = _dv(b.bytes), dr = _dv(out);
  for (let i = 0; i < 4; i++) {
    dr.setFloat32(i * 4, da.getFloat32(i * 4, true) + db.getFloat32(i * 4, true), true);
  }
  return { bytes: out };
}

/** Element-wise multiply of four float32 lanes: mimics _mm_mul_ps. */
export function m128_mul_float32x4(a: M128, b: M128): M128 {
  _expectSize(a.bytes, 16, "m128_mul_float32x4");
  _expectSize(b.bytes, 16, "m128_mul_float32x4");
  const out = new Uint8Array(16);
  const da = _dv(a.bytes), db = _dv(b.bytes), dr = _dv(out);
  for (let i = 0; i < 4; i++) {
    dr.setFloat32(i * 4, da.getFloat32(i * 4, true) * db.getFloat32(i * 4, true), true);
  }
  return { bytes: out };
}

/** Element-wise add of eight float32 lanes: mimics _mm256_add_ps. */
export function m256_add_float32x8(a: M256, b: M256): M256 {
  _expectSize(a.bytes, 32, "m256_add_float32x8");
  _expectSize(b.bytes, 32, "m256_add_float32x8");
  const out = new Uint8Array(32);
  const da = _dv(a.bytes), db = _dv(b.bytes), dr = _dv(out);
  for (let i = 0; i < 8; i++) {
    dr.setFloat32(i * 4, da.getFloat32(i * 4, true) + db.getFloat32(i * 4, true), true);
  }
  return { bytes: out };
}
