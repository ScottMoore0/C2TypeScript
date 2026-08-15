// ARCFOUR / RC4 reference test vectors.
// Source: RFC 6229 § 2 — "Test Vectors for the Stream Cipher RC4".
import { Arcfour, arcfourKeystream, arcfourProcess } from '../dist/index.js';

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

// RFC 6229 §2 — key length 40 bits (0102030405)
//   Offset 0:    b2 39 63 05  f0 3d c0 27  cc c3 52 4a  0a 11 18 a8
{
  const key = fromHex('0102030405');
  const ks = arcfourKeystream(key, 16);
  check('RFC 6229 key=0102030405, offset 0..15',
    toHex(ks),
    'b2396305f03dc027ccc3524a0a1118a8');
}

// RFC 6229 §2 — key length 128 bits (0102030405060708090a0b0c0d0e0f10)
//   Offset 0:    9a c7 cc 9a  60 9d 1e f7  b2 93 28 99  cd e4 1b 97
{
  const key = fromHex('0102030405060708090a0b0c0d0e0f10');
  const ks = arcfourKeystream(key, 16);
  check('RFC 6229 key=128-bit, offset 0..15',
    toHex(ks),
    '9ac7cc9a609d1ef7b2932899cde41b97');
}

// RFC 6229 §2 — key length 256 bits
{
  const key = fromHex('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20');
  const ks = arcfourKeystream(key, 16);
  check('RFC 6229 key=256-bit, offset 0..15',
    toHex(ks),
    'eaa6bd25880bf93d3f5d1e4ca2611d91');
}

// Wikipedia RC4 test: key="Key", plaintext="Plaintext", ciphertext=BBF316E8D940AF0AD3
{
  const ct = arcfourProcess('Key', 'Plaintext');
  check('RC4("Key", "Plaintext")', toHex(ct), 'bbf316e8d940af0ad3');
}

// Decryption identity: XORing the ciphertext with the same key yields plaintext
{
  const pt = new TextEncoder().encode('Plaintext');
  const ct = arcfourProcess('Key', pt);
  const dec = arcfourProcess('Key', ct);
  check('encrypt-then-decrypt round-trip',
    toHex(dec), toHex(pt));
}

// Wikipedia: key="Wiki", plaintext="pedia" → 1021BF0420
{
  const ct = arcfourProcess('Wiki', 'pedia');
  check('RC4("Wiki", "pedia")', toHex(ct), '1021bf0420');
}

// Wikipedia: key="Secret", plaintext="Attack at dawn" → 45A01F645FC35B383552544B9BF5
{
  const ct = arcfourProcess('Secret', 'Attack at dawn');
  check('RC4("Secret", "Attack at dawn")', toHex(ct), '45a01f645fc35b383552544b9bf5');
}

// State independence: two Arcfour instances with the same key produce the same stream
{
  const a = new Arcfour('Key').generate(16);
  const b = new Arcfour('Key').generate(16);
  check('two Arcfour(\'Key\') instances produce identical streams', toHex(a), toHex(b));
}

// Key length validation
{
  let threw = false;
  try { new Arcfour(new Uint8Array(0)); } catch { threw = true; }
  check('rejects empty key', threw, true);
}
{
  let threw = false;
  try { new Arcfour(new Uint8Array(257)); } catch { threw = true; }
  check('rejects key longer than 256 bytes', threw, true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
