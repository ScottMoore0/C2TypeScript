// AES-CBC test vectors from NIST SP 800-38A §F.2.
import { aesCbcEncrypt, aesCbcDecrypt, AesCbcEncryptor } from '../dist/index.js';

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

// NIST SP 800-38A §F.2.1 — AES-128-CBC
{
  const key = fromHex('2b7e151628aed2a6abf7158809cf4f3c');
  const iv  = fromHex('000102030405060708090a0b0c0d0e0f');
  const pt  = fromHex('6bc1bee22e409f96e93d7e117393172a' +
                      'ae2d8a571e03ac9c9eb76fac45af8e51' +
                      '30c81c46a35ce411e5fbc1191a0a52ef' +
                      'f69f2445df4f9b17ad2b417be66c3710');
  const want = '7649abac8119b246cee98e9b12e9197d' +
               '5086cb9b507219ee95db113a917678b2' +
               '73bed6b8e3c1743b7116e69e22229516' +
               '3ff1caa1681fac09120eca307586e1a7';
  check('AES-128-CBC NIST §F.2.1 encrypt', toHex(aesCbcEncrypt(key, iv, pt)), want);
  check('AES-128-CBC decrypt round-trip', toHex(aesCbcDecrypt(key, iv, fromHex(want))), toHex(pt));
}

// NIST SP 800-38A §F.2.3 — AES-192-CBC
{
  const key = fromHex('8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b');
  const iv  = fromHex('000102030405060708090a0b0c0d0e0f');
  const pt  = fromHex('6bc1bee22e409f96e93d7e117393172a' +
                      'ae2d8a571e03ac9c9eb76fac45af8e51');
  const want = '4f021db243bc633d7178183a9fa071e8' +
               'b4d9ada9ad7dedf4e5e738763f69145a';
  check('AES-192-CBC NIST §F.2.3 encrypt', toHex(aesCbcEncrypt(key, iv, pt)), want);
}

// NIST SP 800-38A §F.2.5 — AES-256-CBC
{
  const key = fromHex('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4');
  const iv  = fromHex('000102030405060708090a0b0c0d0e0f');
  const pt  = fromHex('6bc1bee22e409f96e93d7e117393172a' +
                      'ae2d8a571e03ac9c9eb76fac45af8e51');
  const want = 'f58c4c04d6e5f1ba779eabfb5f7bfbd6' +
               '9cfc4e967edb808d679f777bc6702c7d';
  check('AES-256-CBC NIST §F.2.5 encrypt', toHex(aesCbcEncrypt(key, iv, pt)), want);
}

// Identical-plaintext-blocks → distinct ciphertext blocks (CBC property)
{
  const key = new Uint8Array(16);
  const iv  = fromHex('0102030405060708090a0b0c0d0e0f10');
  const pt  = new Uint8Array(32);  // two zero blocks
  const ct  = aesCbcEncrypt(key, iv, pt);
  check('CBC: two zero plaintext blocks → distinct ciphertext blocks',
    toHex(ct.slice(0, 16)) !== toHex(ct.slice(16, 32)), true);
}

// Streaming matches one-shot
{
  const key = fromHex('2b7e151628aed2a6abf7158809cf4f3c');
  const iv  = fromHex('000102030405060708090a0b0c0d0e0f');
  const pt  = fromHex('6bc1bee22e409f96e93d7e117393172a' +
                      'ae2d8a571e03ac9c9eb76fac45af8e51' +
                      '30c81c46a35ce411e5fbc1191a0a52ef' +
                      'f69f2445df4f9b17ad2b417be66c3710');
  const oneShot = aesCbcEncrypt(key, iv, pt);
  const streamer = new AesCbcEncryptor(key, iv);
  const a = streamer.encrypt(pt.slice(0, 32));
  const b = streamer.encrypt(pt.slice(32));
  const combined = new Uint8Array(a.length + b.length);
  combined.set(a); combined.set(b, a.length);
  check('streaming encrypt matches one-shot', toHex(combined), toHex(oneShot));
}

// Validation
{
  let threw = false;
  try { aesCbcEncrypt(new Uint8Array(8), new Uint8Array(16), new Uint8Array(16)); } catch { threw = true; }
  check('rejects 8-byte key', threw, true);
}
{
  let threw = false;
  try { aesCbcEncrypt(new Uint8Array(16), new Uint8Array(15), new Uint8Array(16)); } catch { threw = true; }
  check('rejects 15-byte IV', threw, true);
}
{
  let threw = false;
  try { aesCbcEncrypt(new Uint8Array(16), new Uint8Array(16), new Uint8Array(17)); } catch { threw = true; }
  check('rejects non-16-multiple plaintext length', threw, true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
