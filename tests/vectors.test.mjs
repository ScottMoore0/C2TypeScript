// Reference vector tests for ts-siphash.
//
// Source of truth: SipHash reference C distribution by Jean-Philippe
// Aumasson and Daniel J. Bernstein,
//   https://github.com/veorq/SipHash/blob/master/vectors.h
//
// Vectors are computed for SipHash-2-4 with the canonical reference key
//   k[i] = i, i = 0..15
// and input
//   in[i] = i, i = 0..len-1
// for len = 0..63. The expected outputs are the entries of the
// `vectors_sip64` and `vectors_sip128` arrays in vectors.h.

import assert from 'node:assert/strict';
import { siphash } from '../dist/index.js';

const KEY = new Uint8Array(16);
for (let i = 0; i < 16; i++) KEY[i] = i;

function inputOfLen(len) {
  const a = new Uint8Array(len);
  for (let i = 0; i < len; i++) a[i] = i;
  return a;
}

function siphash64Hex(len) {
  const inp = inputOfLen(len);
  const out = new Uint8Array(8);
  siphash({ buf: inp, off: 0 }, len, { buf: KEY, off: 0 }, { buf: out, off: 0 }, 8);
  // SipHash output is little-endian; render as conventional 64-bit hex
  // (most significant byte first).
  let hex = '';
  for (let i = 7; i >= 0; i--) hex += ('00' + out[i].toString(16)).slice(-2);
  return hex;
}

function siphash128Hex(len) {
  const inp = inputOfLen(len);
  const out = new Uint8Array(16);
  siphash({ buf: inp, off: 0 }, len, { buf: KEY, off: 0 }, { buf: out, off: 0 }, 16);
  let hex = '';
  for (let i = 0; i < 16; i++) hex += ('00' + out[i].toString(16)).slice(-2);
  return hex;
}

let passed = 0;
let failed = 0;
const fail = (name, e) => { failed++; console.error('FAIL', name, e?.message || e); };
const ok = (name) => { passed++; console.log('ok', name); };
function check(name, fn) { try { fn(); ok(name); } catch (e) { fail(name, e); } }

// First 8 entries of vectors_sip64 (SipHash-2-4, 64-bit output).
const sip64 = [
  '726fdb47dd0e0e31',
  '74f839c593dc67fd',
  '0d6c8009d9a94f5a',
  '85676696d7fb7e2d',
  'cf2794e0277187b7',
  '18765564cd99a68d',
  'cbc9466e58fee3ce',
  'ab0200f58b01d137',
];
for (let i = 0; i < sip64.length; i++) {
  check(`SipHash-2-4 64-bit len=${i} == 0x${sip64[i]}`, () => {
    assert.equal(siphash64Hex(i), sip64[i]);
  });
}

// First 4 entries of vectors_sip128 (SipHash-2-4, 128-bit output, byte
// order as emitted by the reference siphash() with outlen=16).
const sip128 = [
  'a3817f04ba25a8e66df67214c7550293',
  'da87c1d86b99af44347659119b22fc45',
  '8177228da4a45dc7fca38bdef60affe4',
  '9c70b60c5267a94e5f33b6b02985ed51',
];
for (let i = 0; i < sip128.length; i++) {
  check(`SipHash-2-4 128-bit len=${i} == 0x${sip128[i]}`, () => {
    assert.equal(siphash128Hex(i), sip128[i]);
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
