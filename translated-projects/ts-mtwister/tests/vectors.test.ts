/**
 * Reference-vector tests for ts-mtwister.
 *
 * Source: ESultanik/mtwister — a state-object Mersenne Twister API
 * variant. The seeding routine in this implementation uses a
 * different (older) recurrence than Matsumoto/Nishimura's
 * mt19937ar.c, so the per-seed output stream differs from the
 * canonical mt19937 stream. For the canonical Matsumoto/Nishimura
 * stream see the sibling package ts-mt19937.
 *
 * The reference values below are this implementation's deterministic
 * outputs for seed 5489, captured from the published dist/ output and
 * re-validated bit-for-bit against an independent build of the
 * upstream C source.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { seedRand, genRand, genRandLong } from '../dist/index.js';

// genRand(state) returns a double in [0, 1).
const SEED_5489_REAL_FIRST_5 = [
  0.40178815517616184,
  0.16095630036689254,
  0.19289933708331067,
  0.4858424492380215,
  0.707423876670055,
];

// genRandLong(state) returns a uint32.
const SEED_5489_LONG_FIRST_5 = [
  0x66db96aa, 0x29346e9e, 0x3161d9d8, 0x7c602bb6, 0xb519bb2e,
];

test('seedRand(5489) returns an MTState with a 624-word state vector', () => {
  const s: any = seedRand(5489);
  assert.equal(typeof s, 'object');
  assert.ok(s.mt, 'state.mt must exist');
  assert.equal(s.mt.length, 624, 'state vector must be 624 32-bit words');
  assert.equal(typeof s.index, 'number');
});

test('genRand(seed=5489) produces the expected first 5 reals in [0,1)', () => {
  const s = seedRand(5489);
  const out: number[] = [];
  for (let i = 0; i < 5; i++) out.push(genRand(s));
  for (let i = 0; i < 5; i++) {
    assert.ok(
      Math.abs(out[i] - SEED_5489_REAL_FIRST_5[i]) < 1e-15,
      `genRand[${i}]: got ${out[i]}, expected ${SEED_5489_REAL_FIRST_5[i]}`,
    );
  }
});

test('genRandLong(seed=5489) produces the expected first 5 uint32 values', () => {
  const s = seedRand(5489);
  const out: number[] = [];
  for (let i = 0; i < 5; i++) out.push(genRandLong(s) >>> 0);
  assert.deepEqual(out, SEED_5489_LONG_FIRST_5);
});

test('genRand returns values strictly in [0, 1)', () => {
  const s = seedRand(5489);
  for (let i = 0; i < 200; i++) {
    const v = genRand(s);
    assert.ok(v >= 0 && v < 1, `genRand out of range: ${v}`);
  }
});

test('genRandLong returns 32-bit unsigned integers', () => {
  const s = seedRand(5489);
  for (let i = 0; i < 200; i++) {
    const v = genRandLong(s) >>> 0;
    assert.ok(v >= 0 && v <= 0xffffffff, `genRandLong out of range: ${v}`);
    assert.ok(Number.isInteger(v));
  }
});

test('reseeding from the same seed reproduces the same sequence', () => {
  const a = seedRand(5489);
  const b = seedRand(5489);
  for (let i = 0; i < 50; i++) {
    assert.equal(genRandLong(a) >>> 0, genRandLong(b) >>> 0);
  }
});

test('different seeds produce different first values', () => {
  const a = seedRand(5489);
  const b = seedRand(42);
  assert.notEqual(genRandLong(a) >>> 0, genRandLong(b) >>> 0);
});

test('first genRand matches the Phase 1.5 calibration value (0.40178815517616184)', () => {
  const s = seedRand(5489);
  const v = genRand(s);
  assert.equal(v, 0.40178815517616184);
});
