// Reference vector tests for ts-md5.
//
// Source of truth: RFC 1321, "The MD5 Message-Digest Algorithm",
//   Appendix A.5 ("Test suite").
//
// The package exposes the streaming md5Init / md5Update / md5Finalize
// surface; the digest is written into a 16-byte CPtr (ctx.digest).

import assert from 'node:assert/strict';
import {
  MD5Context,
  md5Init,
  md5Update,
  md5Finalize,
  md5String,
} from '../dist/index.js';

const enc = new TextEncoder();

function md5hex(input) {
  const ctx = new MD5Context();
  md5Init(ctx);
  const bytes = enc.encode(input);
  md5Update(ctx, { buf: bytes, off: 0 }, bytes.length);
  md5Finalize(ctx);
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += ('00' + ctx.digest.buf[ctx.digest.off + i].toString(16)).slice(-2);
  }
  return hex;
}

// md5String takes a NUL-terminated CPtr input. Build it explicitly.
function md5StringHex(input) {
  const bytes = enc.encode(input);
  // Trailing NUL so that the strlen() inside md5String terminates.
  const padded = new Uint8Array(bytes.length + 1);
  padded.set(bytes);
  padded[bytes.length] = 0;
  const result = { buf: new Uint8Array(16), off: 0 };
  md5String({ buf: padded, off: 0 }, result);
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += ('00' + result.buf[result.off + i].toString(16)).slice(-2);
  }
  return hex;
}

let passed = 0;
let failed = 0;
const fail = (name, e) => { failed++; console.error('FAIL', name, e?.message || e); };
const ok = (name) => { passed++; console.log('ok', name); };
function check(name, fn) { try { fn(); ok(name); } catch (e) { fail(name, e); } }

// RFC 1321 §A.5 test suite
check('RFC 1321 md5("") = d41d8cd98f00b204e9800998ecf8427e', () => {
  assert.equal(md5hex(''), 'd41d8cd98f00b204e9800998ecf8427e');
});

check('RFC 1321 md5("a") = 0cc175b9c0f1b6a831c399e269772661', () => {
  assert.equal(md5hex('a'), '0cc175b9c0f1b6a831c399e269772661');
});

check('RFC 1321 md5("abc") = 900150983cd24fb0d6963f7d28e17f72', () => {
  assert.equal(md5hex('abc'), '900150983cd24fb0d6963f7d28e17f72');
});

check('RFC 1321 md5("message digest") = f96b697d7cb7938d525a2f31aaf161d0', () => {
  assert.equal(md5hex('message digest'), 'f96b697d7cb7938d525a2f31aaf161d0');
});

check('RFC 1321 md5("abcdefghijklmnopqrstuvwxyz") = c3fcd3d76192e4007dfb496cca67e13b', () => {
  assert.equal(
    md5hex('abcdefghijklmnopqrstuvwxyz'),
    'c3fcd3d76192e4007dfb496cca67e13b',
  );
});

// Cover the convenience md5String helper, too.
check('md5String("abc") = 900150983cd24fb0d6963f7d28e17f72', () => {
  assert.equal(md5StringHex('abc'), '900150983cd24fb0d6963f7d28e17f72');
});

// Streaming: split "abc" into "a" + "bc" and confirm equality.
check('streaming md5 split "a"+"bc" matches md5("abc")', () => {
  const ctx = new MD5Context();
  md5Init(ctx);
  const a = enc.encode('a');
  md5Update(ctx, { buf: a, off: 0 }, a.length);
  const bc = enc.encode('bc');
  md5Update(ctx, { buf: bc, off: 0 }, bc.length);
  md5Finalize(ctx);
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += ('00' + ctx.digest.buf[ctx.digest.off + i].toString(16)).slice(-2);
  }
  assert.equal(hex, '900150983cd24fb0d6963f7d28e17f72');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
