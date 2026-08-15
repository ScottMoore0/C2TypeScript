// SHA-1 reference test vectors.
// Sources:
//   NIST FIPS 180-4 / RFC 3174 — standard test vectors
//   The "a million 'a's" vector is RFC 3174 §7.3 test vector 4
import { sha1, sha1Hex, Sha1 } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// Empty string: SHA-1 of "" = da39a3ee5e6b4b0d3255bfef95601890afd80709
check('SHA-1("")',
  sha1Hex(''),
  'da39a3ee5e6b4b0d3255bfef95601890afd80709');

// RFC 3174 §7.3 vector 1: "abc"
check('SHA-1("abc")',
  sha1Hex('abc'),
  'a9993e364706816aba3e25717850c26c9cd0d89d');

// RFC 3174 §7.3 vector 2: 448-bit message
check('SHA-1("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")',
  sha1Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
  '84983e441c3bd26ebaae4aa1f95129e5e54670f1');

// "The quick brown fox jumps over the lazy dog"
check('SHA-1(quick brown fox)',
  sha1Hex('The quick brown fox jumps over the lazy dog'),
  '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12');

// 1 million 'a's — RFC 3174 §7.3 vector 4
{
  const million = 'a'.repeat(1000000);
  check('SHA-1(1 million "a")',
    sha1Hex(million),
    '34aa973cd4c4daa4f61eeb2bdbad27316534016f');
}

// Streaming API should match one-shot
{
  const sh = new Sha1();
  sh.update('The quick brown fox ');
  sh.update('jumps over the lazy dog');
  check('streaming SHA-1 matches one-shot',
    sh.hexDigest(),
    '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12');
}

// Many small updates equal one big update
{
  const sh = new Sha1();
  for (const c of 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq') sh.update(c);
  check('streaming SHA-1 byte-by-byte',
    sh.hexDigest(),
    '84983e441c3bd26ebaae4aa1f95129e5e54670f1');
}

// Raw bytes input
{
  const bytes = new TextEncoder().encode('abc');
  check('SHA-1(Uint8Array bytes("abc"))',
    sha1Hex(bytes),
    'a9993e364706816aba3e25717850c26c9cd0d89d');
}

// Returns Uint8Array of length 20
{
  const out = sha1('abc');
  check('sha1() returns 20-byte Uint8Array', out instanceof Uint8Array && out.length === 20, true);
}

// Repeated calls do not poison state
{
  const a = sha1Hex('hello');
  const b = sha1Hex('hello');
  check('sha1Hex is deterministic', a, b);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
