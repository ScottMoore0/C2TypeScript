/**
 * Reference-vector tests for ts-base64-nibble.
 *
 * Source: RFC 4648 §10 "Test Vectors" (Base 64).
 *
 * The translated API is the chibi-scheme / NibbleAndAHalf "small C" shape:
 *   b64_encode(in_cptr, in_len, out_cptr) -> out_len
 *   b64_decode(in_cptr, in_len, out_cptr) -> out_len
 *   b64e_size(in_size) / b64d_size(in_size) for output buffer sizing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  b64_encode,
  b64_decode,
  b64e_size,
  b64d_size,
} from '../dist/index.js';

const ptr = (data: Uint8Array) => ({ buf: data, off: 0 });
const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);
const str = (b: Uint8Array, len: number): string =>
  new TextDecoder().decode(b.subarray(0, len));

const RFC4648_VECTORS: ReadonlyArray<readonly [string, string]> = [
  ['',       ''],
  ['f',      'Zg=='],
  ['fo',     'Zm8='],
  ['foo',    'Zm9v'],
  ['foob',   'Zm9vYg=='],
  ['fooba',  'Zm9vYmE='],
  ['foobar', 'Zm9vYmFy'],
];

for (const [plain, encoded] of RFC4648_VECTORS) {
  test(`RFC 4648 §10: b64_encode(${JSON.stringify(plain)}) === ${JSON.stringify(encoded)}`, () => {
    const input = bytes(plain);
    // +1 for the NUL the encoder appends past the returned length.
    const out = new Uint8Array(b64e_size(input.length) + 1);
    const outLen = b64_encode(ptr(input), input.length, ptr(out));
    assert.equal(outLen, encoded.length, 'encoded length mismatch');
    assert.equal(str(out, outLen), encoded);
  });

  test(`RFC 4648 §10: b64_decode(${JSON.stringify(encoded)}) === ${JSON.stringify(plain)}`, () => {
    const input = bytes(encoded);
    const out = new Uint8Array(b64d_size(input.length) + 4);
    const outLen = b64_decode(ptr(input), input.length, ptr(out));
    assert.equal(outLen, plain.length, 'decoded length mismatch');
    assert.equal(str(out, outLen), plain);
  });
}

test('round-trip: arbitrary 13-byte string "Hello, World!"', () => {
  const plain = bytes('Hello, World!');
  const enc = new Uint8Array(b64e_size(plain.length) + 1);
  const eLen = b64_encode(ptr(plain), plain.length, ptr(enc));
  // Standard base64 of "Hello, World!" = "SGVsbG8sIFdvcmxkIQ=="
  assert.equal(str(enc, eLen), 'SGVsbG8sIFdvcmxkIQ==');

  const dec = new Uint8Array(b64d_size(eLen) + 4);
  const dLen = b64_decode(ptr(enc), eLen, ptr(dec));
  assert.equal(dLen, plain.length);
  assert.deepEqual(Array.from(dec.subarray(0, dLen)), Array.from(plain));
});

test('round-trip: 256 bytes of all byte values 0..255 are preserved', () => {
  const plain = new Uint8Array(256);
  for (let i = 0; i < 256; i++) plain[i] = i;
  const enc = new Uint8Array(b64e_size(plain.length) + 1);
  const eLen = b64_encode(ptr(plain), plain.length, ptr(enc));
  // 256 bytes -> 344 chars (256/3 = 85 full groups + 1 rem) -> 86*4 = 344.
  assert.equal(eLen, 344);

  const dec = new Uint8Array(plain.length + 4);
  const dLen = b64_decode(ptr(enc), eLen, ptr(dec));
  assert.equal(dLen, plain.length);
  assert.deepEqual(Array.from(dec.subarray(0, dLen)), Array.from(plain));
});
