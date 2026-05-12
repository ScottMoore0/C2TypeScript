// BLAKE2s reference test vectors from RFC 7693 Appendix E and project test
// vectors.
import { blake2s, blake2sHex, Blake2s } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

function fromHex(s) {
  s = s.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16);
  return out;
}

// RFC 7693 §B — BLAKE2s-256 of "abc"
check('BLAKE2s-256 of "abc"',
  blake2sHex('abc'),
  '508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982');

// Project reference: BLAKE2s-256 of empty input
// Verified against https://en.wikipedia.org/wiki/BLAKE_(hash_function)#Example_digests
check('BLAKE2s-256 of empty input',
  blake2sHex(''),
  '69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9');

// BLAKE2s-256 of "The quick brown fox jumps over the lazy dog" — Wikipedia
check('BLAKE2s-256 of pangram',
  blake2sHex('The quick brown fox jumps over the lazy dog'),
  '606beeec743ccbeff6cbcdf5d5302aa855c256c29b88c8ed331ea1a6bf3c8812');

// Truncated digest output
check('BLAKE2s-128 of "abc"',
  blake2sHex('abc', 16),
  'aa4938119b1dc7b87cbad0ffd200d0ae');

// BLAKE2s with MAC key (RFC 7693 reference test data — official kat)
// Source: https://github.com/BLAKE2/BLAKE2/blob/master/testvectors/blake2-kat.json
// key = 00..1f (32 bytes); input = 00 (1 byte) gives:
{
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) key[i] = i;
  const input = new Uint8Array([0x00]);
  check('BLAKE2s keyed (key=00..1f, input=00)',
    blake2sHex(input, 32, key),
    '40d15fee7c328830166ac3f918650f807e7e01e177258cdc0a39b11f598066f1');
}

// Streaming produces same result as one-shot
{
  const data = new Uint8Array(1024);
  for (let i = 0; i < 1024; i++) data[i] = i & 0xff;
  const oneShot = blake2sHex(data);
  const h = new Blake2s();
  h.update(data.slice(0, 100));
  h.update(data.slice(100, 500));
  h.update(data.slice(500));
  check('streaming digest matches one-shot', h.hexDigest(), oneShot);
}

// Long-input determinism
{
  const data = new Uint8Array(10_000).fill(0x41);  // 10k 'A's
  const a = blake2sHex(data);
  const b = blake2sHex(data);
  check('long-input determinism', a, b);
}

// Validation
{
  let threw = false;
  try { blake2s('x', 0); } catch { threw = true; }
  check('rejects outlen=0', threw, true);
}
{
  let threw = false;
  try { blake2s('x', 33); } catch { threw = true; }
  check('rejects outlen=33', threw, true);
}
{
  let threw = false;
  try { blake2s('x', 32, new Uint8Array(33)); } catch { threw = true; }
  check('rejects keylen=33', threw, true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
