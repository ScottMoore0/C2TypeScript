/**
 * Reference / round-trip tests for ts-fastlz.
 *
 * FastLZ is not standardised, so the authoritative test is round-trip:
 * compress(input) -> decompress -> equals input byte-for-byte. We exercise
 * level 1, level 2 (via fastlz_compress_level), and the auto-level
 * fastlz_compress entry point, on highly compressible, mixed, and
 * pseudo-random inputs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fastlz_compress,
  fastlz_compress_level,
  fastlz_decompress,
} from '../dist/index.js';

const ptr = (data: Uint8Array) => ({ buf: data, off: 0 });

// FastLZ requires the destination buffer be at least max(66, ceil(1.05 * len)).
const outSize = (len: number): number => Math.max(66, Math.ceil(len * 1.05) + 16);

const eq = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

const repeating = (n: number, pattern: string): Uint8Array => {
  const enc = new TextEncoder().encode(pattern);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = enc[i % enc.length];
  return out;
};

// Deterministic xorshift32 PRNG so tests are reproducible across runs.
const xorshiftBytes = (n: number, seed: number): Uint8Array => {
  let s = seed >>> 0;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    out[i] = s & 0xff;
  }
  return out;
};

test('round-trip: 1024 bytes of repeating "Hello, World! " (highly compressible)', () => {
  const input = repeating(1024, 'Hello, World! ');
  const compressed = new Uint8Array(outSize(input.length));
  const cLen = fastlz_compress(ptr(input), input.length, ptr(compressed));
  assert.ok(cLen > 0, `fastlz_compress returned ${cLen}, expected > 0`);
  // Sanity: highly repetitive input should compress strictly smaller.
  assert.ok(cLen < input.length, `expected cLen < input.length, got ${cLen} vs ${input.length}`);

  const decompressed = new Uint8Array(input.length);
  const dLen = fastlz_decompress(ptr(compressed), cLen, ptr(decompressed), decompressed.length);
  assert.equal(dLen, input.length);
  assert.ok(eq(decompressed, input), 'decompressed bytes do not match input');
});

test('round-trip: 1024 bytes of pseudo-random data (low compressibility)', () => {
  const input = xorshiftBytes(1024, 0xC0FFEE01);
  const compressed = new Uint8Array(outSize(input.length));
  const cLen = fastlz_compress(ptr(input), input.length, ptr(compressed));
  assert.ok(cLen > 0, `fastlz_compress returned ${cLen}, expected > 0`);

  const decompressed = new Uint8Array(input.length);
  const dLen = fastlz_decompress(ptr(compressed), cLen, ptr(decompressed), decompressed.length);
  assert.equal(dLen, input.length);
  assert.ok(eq(decompressed, input), 'decompressed bytes do not match input');
});

test('round-trip via fastlz_compress_level(1, ...): repetitive 4 KiB', () => {
  const input = repeating(4096, 'The quick brown fox jumps over the lazy dog. ');
  const compressed = new Uint8Array(outSize(input.length));
  const cLen = fastlz_compress_level(1, ptr(input), input.length, ptr(compressed));
  assert.ok(cLen > 0, `cLen=${cLen}`);
  // Header byte's top 3 bits encode the level: level 1 => bits 0b000xxxxx.
  assert.equal((compressed[0] >> 5) & 0x07, 0, 'level-1 stream should start with header byte 0..31');

  const decompressed = new Uint8Array(input.length);
  const dLen = fastlz_decompress(ptr(compressed), cLen, ptr(decompressed), decompressed.length);
  assert.equal(dLen, input.length);
  assert.ok(eq(decompressed, input));
});

test('round-trip via fastlz_compress_level(2, ...): repetitive 4 KiB', () => {
  const input = repeating(4096, 'The quick brown fox jumps over the lazy dog. ');
  const compressed = new Uint8Array(outSize(input.length));
  const cLen = fastlz_compress_level(2, ptr(input), input.length, ptr(compressed));
  assert.ok(cLen > 0, `cLen=${cLen}`);
  // Header byte's top 3 bits encode the level: level 2 => bits 0b001xxxxx.
  assert.equal((compressed[0] >> 5) & 0x07, 1, 'level-2 stream should start with header byte 32..63');

  const decompressed = new Uint8Array(input.length);
  const dLen = fastlz_decompress(ptr(compressed), cLen, ptr(decompressed), decompressed.length);
  assert.equal(dLen, input.length);
  assert.ok(eq(decompressed, input));
});

test('round-trip: 64 KiB triggers fastlz_compress level-2 auto path', () => {
  // Auto-pick threshold is 65536 bytes (length < 65536 -> level 1, else level 2).
  const input = repeating(65536, 'fastlz-auto-level-threshold.');
  const compressed = new Uint8Array(outSize(input.length));
  const cLen = fastlz_compress(ptr(input), input.length, ptr(compressed));
  assert.ok(cLen > 0, `cLen=${cLen}`);
  assert.ok(cLen < input.length, 'large repetitive input should compress smaller');

  const decompressed = new Uint8Array(input.length);
  const dLen = fastlz_decompress(ptr(compressed), cLen, ptr(decompressed), decompressed.length);
  assert.equal(dLen, input.length);
  assert.ok(eq(decompressed, input));
});

test('round-trip: 65535 bytes (just below the level-2 threshold, exercises level 1)', () => {
  const input = repeating(65535, 'one-below-threshold.');
  const compressed = new Uint8Array(outSize(input.length));
  const cLen = fastlz_compress(ptr(input), input.length, ptr(compressed));
  assert.ok(cLen > 0);
  assert.equal((compressed[0] >> 5) & 0x07, 0, 'expected level-1 header for 65535-byte input');

  const decompressed = new Uint8Array(input.length);
  const dLen = fastlz_decompress(ptr(compressed), cLen, ptr(decompressed), decompressed.length);
  assert.equal(dLen, input.length);
  assert.ok(eq(decompressed, input));
});
