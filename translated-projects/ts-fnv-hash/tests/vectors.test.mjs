// Reference vector tests for ts-fnv-hash.
//
// Source of truth: Landon Curt Noll's FNV reference page,
//   http://www.isthe.com/chongo/tech/comp/fnv/index.html
// and the upstream C reference implementation,
//   https://github.com/lcn2/fnv
//
// This package exposes the FNV-1 (multiply-then-xor) variant.
// FNV-1a is not exported; vectors below are FNV-1 only.

import assert from 'node:assert/strict';
import {
  fnv_32_buf,
  fnv_32_str,
  fnv_64_buf,
  fnv_64_str,
  FNV1_32_INIT,
  fnv1_64_init,
  Fnv64_t,
} from '../dist/index.js';

const enc = new TextEncoder();
const hex32 = (n) => ('00000000' + ((n >>> 0).toString(16))).slice(-8);
const hex64 = (h64) =>
  ('00000000' + (h64.w32[1] >>> 0).toString(16)).slice(-8) +
  ('00000000' + (h64.w32[0] >>> 0).toString(16)).slice(-8);

// Each call to fnv_64_* must receive a fresh seed clone, since the C
// pointer-shaped Fnv64_t is mutated through w32[].
function clone64(src) {
  return Object.assign(Object.create(Object.getPrototypeOf(src)), {
    w32: [src.w32[0], src.w32[1]],
  });
}

let passed = 0;
let failed = 0;
const fail = (name, e) => { failed++; console.error('FAIL', name, e?.message || e); };
const ok = (name) => { passed++; console.log('ok', name); };
function check(name, fn) { try { fn(); ok(name); } catch (e) { fail(name, e); } }

// FNV-1 32-bit reference vectors (LCN reference)
// fnv_32_buf is the multiply-then-xor variant.
check('FNV-1 32 of "" == 0x811c9dc5 (offset basis)', () => {
  const b = enc.encode('');
  const h = fnv_32_buf({ buf: b, off: 0 }, 0, FNV1_32_INIT);
  assert.equal(hex32(h), '811c9dc5');
});

check('FNV-1 32 of "a"', () => {
  const b = enc.encode('a');
  const h = fnv_32_buf({ buf: b, off: 0 }, b.length, FNV1_32_INIT);
  assert.equal(hex32(h), '050c5d7e');
});

check('FNV-1 32 of "foobar"', () => {
  const b = enc.encode('foobar');
  const h = fnv_32_buf({ buf: b, off: 0 }, b.length, FNV1_32_INIT);
  assert.equal(hex32(h), '31f0b262');
});

check('FNV-1 32 fnv_32_str "a"', () => {
  const h = fnv_32_str('a', FNV1_32_INIT);
  assert.equal(hex32(h), '050c5d7e');
});

check('FNV-1 32 fnv_32_str "foobar"', () => {
  const h = fnv_32_str('foobar', FNV1_32_INIT);
  assert.equal(hex32(h), '31f0b262');
});

check('FNV1_32_INIT constant equals 0x811c9dc5', () => {
  assert.equal(FNV1_32_INIT >>> 0, 0x811c9dc5);
});

// FNV-1 64-bit reference vectors (LCN reference)
// fnv1_64_init seed = 0xcbf29ce484222325
check('fnv1_64_init equals 0xcbf29ce484222325 (offset basis)', () => {
  assert.equal(fnv1_64_init.w32[1] >>> 0, 0xcbf29ce4);
  assert.equal(fnv1_64_init.w32[0] >>> 0, 0x84222325);
});

check('FNV-1 64 of "" == 0xcbf29ce484222325', () => {
  const b = enc.encode('');
  const h = fnv_64_buf({ buf: b, off: 0 }, 0, clone64(fnv1_64_init));
  assert.equal(hex64(h), 'cbf29ce484222325');
});

check('FNV-1 64 of "foobar" == 0x340d8765a4dda9c2', () => {
  const b = enc.encode('foobar');
  const h = fnv_64_buf({ buf: b, off: 0 }, b.length, clone64(fnv1_64_init));
  assert.equal(hex64(h), '340d8765a4dda9c2');
});

check('FNV-1 64 fnv_64_str "foobar"', () => {
  const h = fnv_64_str('foobar', clone64(fnv1_64_init));
  assert.equal(hex64(h), '340d8765a4dda9c2');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
