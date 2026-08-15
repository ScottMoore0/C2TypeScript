// AES test vectors from FIPS 197 (Rijndael spec) Appendix C.
import { Aes } from '../dist/index.js';

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

// FIPS 197 §C.1 — AES-128 test vector
{
  const key  = fromHex('000102030405060708090a0b0c0d0e0f');
  const pt   = fromHex('00112233445566778899aabbccddeeff');
  const want = '69c4e0d86a7b0430d8cdb78070b4c55a';
  const a = new Aes(key);
  check('AES-128 FIPS 197 §C.1 encrypt', toHex(a.encryptBlock(pt)), want);
  check('AES-128 decrypt round-trip', toHex(a.decryptBlock(fromHex(want))), toHex(pt));
}

// FIPS 197 §C.2 — AES-192 test vector
{
  const key  = fromHex('000102030405060708090a0b0c0d0e0f1011121314151617');
  const pt   = fromHex('00112233445566778899aabbccddeeff');
  const want = 'dda97ca4864cdfe06eaf70a0ec0d7191';
  const a = new Aes(key);
  check('AES-192 FIPS 197 §C.2 encrypt', toHex(a.encryptBlock(pt)), want);
  check('AES-192 decrypt round-trip', toHex(a.decryptBlock(fromHex(want))), toHex(pt));
}

// FIPS 197 §C.3 — AES-256 test vector
{
  const key  = fromHex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
  const pt   = fromHex('00112233445566778899aabbccddeeff');
  const want = '8ea2b7ca516745bfeafc49904b496089';
  const a = new Aes(key);
  check('AES-256 FIPS 197 §C.3 encrypt', toHex(a.encryptBlock(pt)), want);
  check('AES-256 decrypt round-trip', toHex(a.decryptBlock(fromHex(want))), toHex(pt));
}

// In-place encrypt + decrypt round-trip
{
  const key = fromHex('000102030405060708090a0b0c0d0e0f');
  const a = new Aes(key);
  const block = new Uint8Array(16);
  for (let i = 0; i < 16; i++) block[i] = i * 17;
  const orig = new Uint8Array(block);
  a.encryptInPlace(block);
  check('encryptInPlace mutates block', toHex(block) !== toHex(orig), true);
  a.decryptInPlace(block);
  check('decryptInPlace restores original', toHex(block), toHex(orig));
}

// Key-size validation
{
  let threw = false;
  try { new Aes(new Uint8Array(8)); } catch { threw = true; }
  check('rejects 8-byte key', threw, true);
}
{
  let threw = false;
  try { new Aes(new Uint8Array(20)); } catch { threw = true; }
  check('rejects 20-byte key', threw, true);
}

// Block size validation
{
  let threw = false;
  const a = new Aes(new Uint8Array(16));
  try { a.encryptBlock(new Uint8Array(8)); } catch { threw = true; }
  check('rejects 8-byte block', threw, true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
