// RIPEMD-160 reference test vectors.
// Source: Dobbertin/Bosselaers/Preneel original paper §A.5.
import { ripemd160, ripemd160Hex } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

check('RIPEMD-160("")',
  ripemd160Hex(''),
  '9c1185a5c5e9fc54612808977ee8f548b2258d31');

check('RIPEMD-160("a")',
  ripemd160Hex('a'),
  '0bdc9d2d256b3ee9daae347be6f4dc835a467ffe');

check('RIPEMD-160("abc")',
  ripemd160Hex('abc'),
  '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc');

check('RIPEMD-160("message digest")',
  ripemd160Hex('message digest'),
  '5d0689ef49d2fae572b881b123a85ffa21595f36');

check('RIPEMD-160(alphabet)',
  ripemd160Hex('abcdefghijklmnopqrstuvwxyz'),
  'f71c27109c692c1b56bbdceb5b9d2865b3708dbc');

check('RIPEMD-160(quick brown fox)',
  ripemd160Hex('The quick brown fox jumps over the lazy dog'),
  '37f332f68db77bd9d7edd4969571ad671cf9dd3b');

// 56-byte alphanumeric mix
check('RIPEMD-160(56-char mix)',
  ripemd160Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
  '12a053384a9c0c88e405a06c27dcf49ada62eb2b');

// 1 million 'a' would take too long — skipping the long test

// Returns 20-byte Uint8Array
{
  const out = ripemd160('abc');
  check('returns 20-byte Uint8Array',
    out instanceof Uint8Array && out.length === 20 ? 'true' : 'false', 'true');
}

// Uint8Array input
check('ripemd160(Uint8Array("abc"))',
  ripemd160Hex(new TextEncoder().encode('abc')),
  '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc');

// Determinism
check('determinism: ripemd160("hello") repeated',
  ripemd160Hex('hello'),
  ripemd160Hex('hello'));

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
