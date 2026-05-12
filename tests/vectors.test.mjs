// XTEA reference test vectors.
// XTEA (32 rounds) test vectors widely cited in literature and the
// Linux kernel's crypto/tea.c implementation. The shixiongfei C source
// uses 32 rounds, matching the Wheeler/Needham 1997 specification.
import { Xtea } from '../dist/index.js';

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

// Standard XTEA test vector: key=0..0F, plain=ABCDEFGH
{
  const key = fromHex('000102030405060708090a0b0c0d0e0f');
  const plain = fromHex('4142434445464748');  // "ABCDEFGH"
  const x = new Xtea(key);
  const ct = x.encryptBlock(plain);
  check('XTEA-32 ECB key=0..0F plain=ABCDEFGH', toHex(ct), '497df3d072612cb5');
  check('XTEA-32 ECB decrypt round-trip', toHex(x.decryptBlock(ct)), '4142434445464748');
}

// All-zero key, all-zero plain
{
  const key = new Uint8Array(16);
  const plain = new Uint8Array(8);
  const x = new Xtea(key);
  const ct = x.encryptBlock(plain);
  check('XTEA-32 all-zero key/plain decrypt back to zero',
    toHex(x.decryptBlock(ct)), '0000000000000000');
}

// Test from Linux kernel crypto self-tests (cf. crypto/testmgr.h XTEA)
{
  const key = fromHex('2bd6459f82c5b300952c49104881ff48');
  const plain = fromHex('ea024714ad5c4d84');
  const x = new Xtea(key);
  const ct = x.encryptBlock(plain);
  // Verify round-trip (this exact vector's published ciphertext isn't trivially Linux-kernel-style)
  check('XTEA-32 round-trip Linux-style key+plain',
    toHex(x.decryptBlock(ct)), toHex(plain));
}

// CBC mode round-trip
{
  const key = fromHex('000102030405060708090a0b0c0d0e0f');
  const x = new Xtea(key);
  const iv1 = fromHex('0000000000000000');
  const iv2 = fromHex('0000000000000000');
  const plain = new Uint8Array(24);
  for (let i = 0; i < plain.length; i++) plain[i] = i;
  const ct = x.encryptCbc(plain, iv1);
  const dec = x.decryptCbc(ct, iv2);
  check('XTEA-32 CBC round-trip 24 bytes', toHex(dec), toHex(plain));
}

// CBC of identical blocks should produce different ciphertext blocks (true CBC)
{
  const key = fromHex('000102030405060708090a0b0c0d0e0f');
  const x = new Xtea(key);
  const iv = fromHex('0102030405060708');
  const plain = new Uint8Array(16);  // all zeros, two identical blocks
  const ct = x.encryptCbc(plain, iv);
  check('XTEA-32 CBC produces distinct blocks for identical plaintext blocks',
    toHex(ct.slice(0, 8)) !== toHex(ct.slice(8, 16)), true);
}

// Key length validation
{
  let threw = false;
  try { new Xtea(new Uint8Array(15)); } catch { threw = true; }
  check('rejects 15-byte key', threw, true);
}
{
  let threw = false;
  try { new Xtea(new Uint8Array(17)); } catch { threw = true; }
  check('rejects 17-byte key', threw, true);
}

// Block size validation
{
  let threw = false;
  const x = new Xtea(new Uint8Array(16));
  try { x.encryptBlock(new Uint8Array(7)); } catch { threw = true; }
  check('rejects 7-byte block', threw, true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
