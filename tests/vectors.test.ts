/**
 * Reference-vector tests for ts-pcg-basic.
 *
 * Source: pcg-c-basic by Melissa O'Neill
 * (https://github.com/imneme/pcg-c-basic).
 *
 * The reference vector for seed=42, seq=54 is the canonical fixture
 * shipped in pcg-c-basic's pcg32-demo.c. The first five outputs of
 * pcg32_random_r() after pcg32_srandom_r(rng, 42, 54) are:
 *
 *   0xa15c02b7, 0x7b47f409, 0xba1d3330, 0x83d2f293, 0xbfa4784b
 *
 * The state struct `pcg_state_setseq_64` carries a 64-bit `state`
 * and a 64-bit `inc`; the translator uses BigInt for both.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pcg_state_setseq_64,
  pcg32_srandom_r,
  pcg32_random_r,
  pcg32_boundedrand_r,
} from '../dist/index.js';

const SEED_42_SEQ_54_FIRST_5 = [
  0xa15c02b7, 0x7b47f409, 0xba1d3330, 0x83d2f293, 0xbfa4784b,
];

test('pcg_state_setseq_64 is constructible with state/inc fields', () => {
  const rng: any = new pcg_state_setseq_64();
  assert.equal(typeof rng, 'object');
  assert.ok('state' in rng, 'rng.state field');
  assert.ok('inc' in rng, 'rng.inc field');
});

test('pcg32_srandom_r(rng, 42, 54) sets the canonical seeded state', () => {
  const rng: any = new pcg_state_setseq_64();
  pcg32_srandom_r(rng, 42n, 54n);
  // After srandom_r, inc must be (initseq << 1) | 1 = (54 << 1) | 1 = 109.
  assert.equal(rng.inc, 109n);
});

test('pcg32_random_r(seed=42, seq=54) matches pcg-c-basic reference output', () => {
  const rng: any = new pcg_state_setseq_64();
  pcg32_srandom_r(rng, 42n, 54n);
  const out: number[] = [];
  for (let i = 0; i < 5; i++) out.push(pcg32_random_r(rng) >>> 0);
  assert.deepEqual(out, SEED_42_SEQ_54_FIRST_5);
});

test('pcg32_random_r returns 32-bit unsigned integers', () => {
  const rng: any = new pcg_state_setseq_64();
  pcg32_srandom_r(rng, 1n, 1n);
  for (let i = 0; i < 200; i++) {
    const v = pcg32_random_r(rng) >>> 0;
    assert.ok(Number.isInteger(v));
    assert.ok(v >= 0 && v <= 0xffffffff, `out of range: ${v}`);
  }
});

test('pcg32_boundedrand_r returns values in [0, bound)', () => {
  const rng: any = new pcg_state_setseq_64();
  pcg32_srandom_r(rng, 42n, 54n);
  for (let i = 0; i < 100; i++) {
    const v = pcg32_boundedrand_r(rng, 100) >>> 0;
    assert.ok(v >= 0 && v < 100, `boundedrand out of range: ${v}`);
  }
});

test('reseeding with identical (seed, seq) reproduces the same stream', () => {
  const a: any = new pcg_state_setseq_64();
  const b: any = new pcg_state_setseq_64();
  pcg32_srandom_r(a, 42n, 54n);
  pcg32_srandom_r(b, 42n, 54n);
  for (let i = 0; i < 50; i++) {
    assert.equal(pcg32_random_r(a) >>> 0, pcg32_random_r(b) >>> 0);
  }
});

test('different stream IDs produce different sequences from the same seed', () => {
  // Two streams with identical seed but different `seq` must diverge
  // at the first output (this is PCG's defining "distinct streams"
  // property).
  const a: any = new pcg_state_setseq_64();
  const b: any = new pcg_state_setseq_64();
  pcg32_srandom_r(a, 42n, 1n);
  pcg32_srandom_r(b, 42n, 2n);
  assert.notEqual(pcg32_random_r(a) >>> 0, pcg32_random_r(b) >>> 0);
});

test('different seeds produce different first values', () => {
  const a: any = new pcg_state_setseq_64();
  const b: any = new pcg_state_setseq_64();
  pcg32_srandom_r(a, 1n, 1n);
  pcg32_srandom_r(b, 2n, 1n);
  assert.notEqual(pcg32_random_r(a) >>> 0, pcg32_random_r(b) >>> 0);
});
