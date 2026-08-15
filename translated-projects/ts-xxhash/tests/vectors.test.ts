// Reference vector tests for ts-xxhash.
//
// Source of truth: the xxHash sanity-check vectors at
//   https://github.com/Cyan4973/xxHash/blob/dev/cli/xsum_sanity_check.c
//
// The sanity buffer is generated deterministically from PRIME32 = 2654435761:
//   byteGen = PRIME32
//   for i in 0..N-1:
//     buf[i] = (byteGen >> 24) & 0xFF
//     byteGen = byteGen * PRIME32 (mod 2^32)
//
// We use the published expected hashes for selected lengths and seeds.
//
// NOT TESTED:
//   * XXH3_generateSecret_fromSeed is exercised by `probe.mjs`. The
//     translator now selects the portable XXH_VECTOR=XXH_SCALAR build
//     for xxhash (cppFlags `-DXXH_VECTOR=0` in the fixture), so the
//     SSE2 intrinsics path (_mm_set_epi64x, _mm_loadu_si128, ...) is
//     compiled out and the function reaches the scalar fallback.

import assert from 'node:assert/strict';
import {
  XXH32,
  XXH64,
  XXH32_createState,
  XXH32_reset,
  XXH32_update,
  XXH32_digest,
  XXH64_createState,
  XXH64_reset,
  XXH64_update,
  XXH64_digest,
  XXH3_generateSecret_fromSeed,
} from '../dist/index.js';

const PRIME32 = 2654435761;
const PRIME64 = 11400714785074694797n;

function makeSanityBuf(n) {
  const buf = new Uint8Array(n);
  let g = PRIME32 >>> 0;
  for (let i = 0; i < n; i++) {
    buf[i] = (g >>> 24) & 0xFF;
    g = Math.imul(g, PRIME32) >>> 0;
  }
  return buf;
}

const SANITY = makeSanityBuf(2367);
const enc = new TextEncoder();
const hex32 = (n) => '0x' + (n >>> 0).toString(16).padStart(8, '0');
const hex64 = (n) => '0x' + n.toString(16).padStart(16, '0');

let passed = 0;
let failed = 0;
const fail = (name, e) => { failed++; console.error('FAIL', name, e?.message || e); };
const ok = (name) => { passed++; console.log('ok', name); };
function check(name, fn) { try { fn(); ok(name); } catch (e) { fail(name, e); } }

// ---------- XXH32 one-shot reference vectors ----------
check('XXH32(seed=0, "") == 0x02cc5d05', () => {
  const e = enc.encode('');
  assert.equal(hex32(XXH32({ buf: e, off: 0 }, 0, 0)), '0x02cc5d05');
});

check('XXH32(seed=0, "a") == 0x550d7456', () => {
  const a = enc.encode('a');
  assert.equal(hex32(XXH32({ buf: a, off: 0 }, 1, 0)), '0x550d7456');
});

// xsum_sanity_check vectors (XXH32, sanity buffer)
check('XXH32(sanity[0..0], seed=0) == 0x02cc5d05', () => {
  assert.equal(hex32(XXH32({ buf: SANITY, off: 0 }, 0, 0)), '0x02cc5d05');
});

check('XXH32(sanity[0..1], seed=0) == 0xb85cbee5', () => {
  assert.equal(hex32(XXH32({ buf: SANITY, off: 0 }, 1, 0)), '0xb85cbee5');
});

check('XXH32(sanity[0..1], seed=PRIME32) == 0xd5845d64', () => {
  assert.equal(hex32(XXH32({ buf: SANITY, off: 0 }, 1, PRIME32)), '0xd5845d64');
});

check('XXH32(sanity[0..14], seed=0) == 0xf79901db', () => {
  assert.equal(hex32(XXH32({ buf: SANITY, off: 0 }, 14, 0)), '0xf79901db');
});

check('XXH32(sanity[0..14], seed=PRIME32) == 0x72d25b29', () => {
  assert.equal(hex32(XXH32({ buf: SANITY, off: 0 }, 14, PRIME32)), '0x72d25b29');
});

check('XXH32(sanity[0..222], seed=0) == 0xa6b90b3c', () => {
  assert.equal(hex32(XXH32({ buf: SANITY, off: 0 }, 222, 0)), '0xa6b90b3c');
});

check('XXH32(sanity[0..222], seed=PRIME32) == 0xdfc60cee', () => {
  assert.equal(hex32(XXH32({ buf: SANITY, off: 0 }, 222, PRIME32)), '0xdfc60cee');
});

// ---------- XXH64 one-shot reference vectors ----------
check('XXH64(seed=0, "") == 0xef46db3751d8e999', () => {
  const e = enc.encode('');
  assert.equal(hex64(XXH64({ buf: e, off: 0 }, 0, 0n)), '0xef46db3751d8e999');
});

check('XXH64(seed=0, "a") == 0xd24ec4f1a98c6e5b', () => {
  const a = enc.encode('a');
  assert.equal(hex64(XXH64({ buf: a, off: 0 }, 1, 0n)), '0xd24ec4f1a98c6e5b');
});

check('XXH64(sanity[0..1], seed=0) == 0x4fce394cc88952d8', () => {
  assert.equal(hex64(XXH64({ buf: SANITY, off: 0 }, 1, 0n)), '0x4fce394cc88952d8');
});

check('XXH64(sanity[0..14], seed=0) == 0x0f909c9c182c230c', () => {
  assert.equal(hex64(XXH64({ buf: SANITY, off: 0 }, 14, 0n)), '0x0f909c9c182c230c');
});

check('XXH64(sanity[0..14], seed=PRIME64) == 0xa47e2ad46c75757b', () => {
  assert.equal(
    hex64(XXH64({ buf: SANITY, off: 0 }, 14, PRIME64)),
    '0xa47e2ad46c75757b',
  );
});

check('XXH64(sanity[0..222], seed=0) == 0x8fbec33a27e63b74', () => {
  assert.equal(hex64(XXH64({ buf: SANITY, off: 0 }, 222, 0n)), '0x8fbec33a27e63b74');
});

// ---------- Streaming consistency ----------
// Streaming digest must equal one-shot for the same input. The streaming
// finalize path reads state->mem32 / state->mem64 (the partial-block
// staging buffer) cast to a byte pointer; the translator's
// integer-array-byte-view lowering (C17 §6.5 p7 + §6.3.2.1) materialises
// a memoized CPtr that shares storage with the JS Array, so writes via
// XXH_memcpy / cptr_offset survive across the update→digest call chain.
check('XXH32 streaming 14B == one-shot 14B', () => {
  const expected = XXH32({ buf: SANITY, off: 0 }, 14, 0);
  const s = XXH32_createState();
  XXH32_reset(s, 0);
  XXH32_update(s, { buf: SANITY, off: 0 }, 14);
  const got = XXH32_digest(s);
  assert.equal(hex32(got), hex32(expected));
});

check('XXH64 streaming 14B == one-shot 14B', () => {
  const expected = XXH64({ buf: SANITY, off: 0 }, 14, 0n);
  const s = XXH64_createState();
  XXH64_reset(s, 0n);
  XXH64_update(s, { buf: SANITY, off: 0 }, 14);
  const got = XXH64_digest(s);
  assert.equal(hex64(got), hex64(expected));
});

// ---------- XXH3 secret generation ----------
// XXH3_generateSecret_fromSeed populates a 192-byte secret from a seed by
// XOR-ing seeds into the default secret. The portable XXH_VECTOR=XXH_SCALAR
// build (selected via the fixture's `-DXXH_VECTOR=0` flag) keeps the
// translator out of the SSE2 path; the scalar fallback runs cleanly.
// Spot-check: same seed must produce the same secret deterministically.
check('XXH3_generateSecret_fromSeed deterministic', () => {
  const a = new Uint8Array(192);
  const b = new Uint8Array(192);
  XXH3_generateSecret_fromSeed({ buf: a, off: 0 }, 64n);
  XXH3_generateSecret_fromSeed({ buf: b, off: 0 }, 64n);
  for (let i = 0; i < 192; i++) assert.equal(a[i], b[i]);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
