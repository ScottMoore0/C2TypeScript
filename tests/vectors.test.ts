/**
 * Reference-vector tests for ts-mt19937.
 *
 * Source: Matsumoto and Nishimura's canonical reference C
 * implementation, mt19937ar.c (the "improved 2002/1/26" variant with
 * the 1812433253 seeding constant), available at:
 *
 *   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/MT2002/CODES/mt19937ar.c
 *
 * The canonical reference outputs come from the upstream
 * mt19937ar.out file shipped alongside the source. They are the
 * single, unambiguous test fixture for any MT19937 port.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  init_genrand,
  init_by_array,
  genrand_int32,
  genrand_int31,
  genrand_real1,
  genrand_real2,
  genrand_real3,
  genrand_res53,
} from '../dist/index.js';

// Reference vector: init_genrand(5489) (the documented default seed).
// First 10 outputs of genrand_int32(). Verified against Matsumoto's
// reference and against several other independent ports (Boost, NumPy,
// libc++ std::mt19937).
const SEED_5489_FIRST_10 = [
  3499211612, 581869302,  3890346734, 3586334585, 545404204,
  4161255391, 3922919429, 949333985,  2715962298, 1323567403,
];

// Reference vector: init_by_array({0x123, 0x234, 0x345, 0x456}, 4).
// First 10 outputs of genrand_int32(). These are the first 10 lines
// of the canonical mt19937ar.out file shipped with the C reference.
const INIT_BY_ARRAY_FIRST_10 = [
  1067595299, 955945823,  477289528,  4107218783, 4228976476,
  3344332714, 3355579695, 227628506,  810200273,  2591290167,
];

test('init_genrand(5489) + first 10 genrand_int32() match reference vector', () => {
  init_genrand(5489);
  const out: number[] = [];
  for (let i = 0; i < 10; i++) out.push(genrand_int32() >>> 0);
  assert.deepEqual(out, SEED_5489_FIRST_10);
});

test('init_by_array({0x123,0x234,0x345,0x456}, 4) matches Matsumoto mt19937ar.out', () => {
  const seed = new Uint32Array([0x123, 0x234, 0x345, 0x456]);
  init_by_array({ buf: seed, off: 0 } as any, 4);
  const out: number[] = [];
  for (let i = 0; i < 10; i++) out.push(genrand_int32() >>> 0);
  assert.deepEqual(out, INIT_BY_ARRAY_FIRST_10);
});

test('genrand_int31 produces values in [0, 2^31)', () => {
  init_genrand(5489);
  for (let i = 0; i < 100; i++) {
    const v = genrand_int31();
    assert.ok(Number.isInteger(v));
    assert.ok(v >= 0 && v < 0x80000000, `genrand_int31 out of range: ${v}`);
  }
});

test('genrand_real1 produces values in [0, 1] (closed)', () => {
  init_genrand(5489);
  for (let i = 0; i < 100; i++) {
    const v = genrand_real1();
    assert.ok(v >= 0 && v <= 1, `genrand_real1 out of range: ${v}`);
  }
});

test('genrand_real2 produces values in [0, 1)', () => {
  init_genrand(5489);
  for (let i = 0; i < 100; i++) {
    const v = genrand_real2();
    assert.ok(v >= 0 && v < 1, `genrand_real2 out of range: ${v}`);
  }
});

test('genrand_real3 produces values in (0, 1)', () => {
  init_genrand(5489);
  for (let i = 0; i < 100; i++) {
    const v = genrand_real3();
    assert.ok(v > 0 && v < 1, `genrand_real3 out of range: ${v}`);
  }
});

test('genrand_res53 produces 53-bit values in [0, 1)', () => {
  init_genrand(5489);
  for (let i = 0; i < 100; i++) {
    const v = genrand_res53();
    assert.ok(v >= 0 && v < 1, `genrand_res53 out of range: ${v}`);
  }
});

test('genrand_int32 sequence is consistent across reseeds', () => {
  // Re-seeding and re-drawing must yield identical outputs.
  init_genrand(5489);
  const a: number[] = [];
  for (let i = 0; i < 50; i++) a.push(genrand_int32() >>> 0);

  init_genrand(5489);
  const b: number[] = [];
  for (let i = 0; i < 50; i++) b.push(genrand_int32() >>> 0);

  assert.deepEqual(a, b);
});

test('different seeds produce different sequences', () => {
  init_genrand(5489);
  const a = genrand_int32() >>> 0;
  init_genrand(42);
  const b = genrand_int32() >>> 0;
  assert.notEqual(a, b);
});

test('genrand_real1 first value matches the textbook reference (0.8147236921...)', () => {
  // The first real1 = first int32 / 0xFFFFFFFF.
  // 3499211612 / 4294967295 = 0.8147236920927473 (double precision).
  init_genrand(5489);
  const v = genrand_real1();
  assert.ok(Math.abs(v - 0.8147236920927473) < 1e-15, `got ${v}`);
});
