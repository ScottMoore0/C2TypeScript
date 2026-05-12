// AES-OFB test vectors from NIST SP 800-38A §F.4.
import { aesOfb, AesOfb } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

function fromHex(s) {
  s = s.replace(/\s+/g, '');
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16);
  return out;
}
function toHex(b) {
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

// NIST SP 800-38A §F.4.1 — AES-128-OFB
{
  const key  = fromHex('2b7e151628aed2a6abf7158809cf4f3c');
  const iv   = fromHex('000102030405060708090a0b0c0d0e0f');
  const pt   = fromHex('6bc1bee22e409f96e93d7e117393172a' +
                       'ae2d8a571e03ac9c9eb76fac45af8e51' +
                       '30c81c46a35ce411e5fbc1191a0a52ef' +
                       'f69f2445df4f9b17ad2b417be66c3710');
  const want = '3b3fd92eb72dad20333449f8e83cfb4a' +
               '7789508d16918f03f53c52dac54ed825' +
               '9740051e9c5fecf64344f7a82260edcc' +
               '304c6528f659c77866a510d9c1d6ae5e';
  check('AES-128-OFB NIST §F.4.1 encrypt', toHex(aesOfb(key, iv, pt)), want);
  check('AES-128-OFB decrypt round-trip', toHex(aesOfb(key, iv, fromHex(want))), toHex(pt));
}

// NIST SP 800-38A §F.4.3 — AES-192-OFB
{
  const key  = fromHex('8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b');
  const iv   = fromHex('000102030405060708090a0b0c0d0e0f');
  const pt   = fromHex('6bc1bee22e409f96e93d7e117393172a');
  const want = 'cdc80d6fddf18cab34c25909c99a4174';
  check('AES-192-OFB NIST §F.4.3 encrypt', toHex(aesOfb(key, iv, pt)), want);
}

// NIST SP 800-38A §F.4.5 — AES-256-OFB
{
  const key  = fromHex('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4');
  const iv   = fromHex('000102030405060708090a0b0c0d0e0f');
  const pt   = fromHex('6bc1bee22e409f96e93d7e117393172a');
  const want = 'dc7e84bfda79164b7ecd8486985d3860';
  check('AES-256-OFB NIST §F.4.5 encrypt', toHex(aesOfb(key, iv, pt)), want);
}

// OFB is a stream cipher — symmetric encrypt/decrypt
{
  const key = new Uint8Array(16);
  const iv  = fromHex('0102030405060708090a0b0c0d0e0f10');
  const pt  = new TextEncoder().encode('Hello, OFB!');
  const ct  = aesOfb(key, iv, pt);
  const pt2 = aesOfb(key, iv, ct);
  check('AES-OFB symmetric encrypt/decrypt on string', toHex(pt2), toHex(pt));
}

// Arbitrary length supported (no block-multiple constraint)
{
  const key = new Uint8Array(16);
  const iv  = new Uint8Array(16);
  const pt = new Uint8Array(37);  // not a multiple of 16
  const ct = aesOfb(key, iv, pt);
  check('AES-OFB accepts 37-byte (non-block-multiple) input', ct.length, 37);
  const pt2 = aesOfb(key, iv, ct);
  check('roundtrip on 37-byte input', toHex(pt2), toHex(pt));
}

// Streaming matches one-shot
{
  const key = fromHex('2b7e151628aed2a6abf7158809cf4f3c');
  const iv  = fromHex('000102030405060708090a0b0c0d0e0f');
  const pt  = new Uint8Array(64);
  for (let i = 0; i < 64; i++) pt[i] = i;
  const oneShot = aesOfb(key, iv, pt);
  const streamer = new AesOfb(key, iv);
  const a = streamer.process(pt.slice(0, 17));
  const b = streamer.process(pt.slice(17));
  const combined = new Uint8Array(64);
  combined.set(a); combined.set(b, a.length);
  check('streaming AES-OFB matches one-shot (split at 17)', toHex(combined), toHex(oneShot));
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
