// SHA-512 reference test vectors from RFC 6234 / FIPS 180-4.
import { sha512, sha512Hex, Sha512 } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// RFC 6234 / NIST FIPS 180-4 test vectors

// Empty string
check('SHA-512("")', sha512Hex(''),
  'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce' +
  '47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');

// "abc" — FIPS 180-4 §C.1
check('SHA-512("abc")', sha512Hex('abc'),
  'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
  '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f');

// FIPS 180-4 §C.2 — 896-bit message (112 chars)
check('SHA-512(abcdefgh... 112 chars)',
  sha512Hex('abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu'),
  '8e959b75dae313da8cf4f72814fc143f8f7779c6eb9f7fa17299aeadb6889018' +
  '501d289e4900f7e4331b99dec4b5433ac7d329eeb6dd26545e96e55b874be909');

// "The quick brown fox jumps over the lazy dog"
check('SHA-512(quick brown fox)',
  sha512Hex('The quick brown fox jumps over the lazy dog'),
  '07e547d9586f6a73f73fbac0435ed76951218fb7d0c8d788a309d785436bbb64' +
  '2e93a252a954f23912547d1e8a3b5ed6e1bfd7097821233fa0538f3db854fee6');

// "a" × 1 000 000 — FIPS 180-4 §C.3 (long test)
{
  const million = 'a'.repeat(1000000);
  check('SHA-512(1 million "a")', sha512Hex(million),
    'e718483d0ce769644e2e42c7bc15b4638e1f98b13b2044285632a803afa973eb' +
    'de0ff244877ea60a4cb0432ce577c31beb009c5c2c49aa2e4eadb217ad8cc09b');
}

// Streaming API matches one-shot
{
  const h = new Sha512();
  h.update('The quick brown fox ');
  h.update('jumps over the lazy dog');
  check('streaming SHA-512 matches one-shot', h.hexDigest(),
    '07e547d9586f6a73f73fbac0435ed76951218fb7d0c8d788a309d785436bbb64' +
    '2e93a252a954f23912547d1e8a3b5ed6e1bfd7097821233fa0538f3db854fee6');
}

// Byte-by-byte streaming
{
  const h = new Sha512();
  for (const c of 'abc') h.update(c);
  check('streaming SHA-512("abc") byte-by-byte', h.hexDigest(),
    'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
    '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f');
}

// sha512() returns 64-byte Uint8Array
{
  const out = sha512('abc');
  check('sha512() returns 64-byte Uint8Array', out instanceof Uint8Array && out.length === 64, true);
}

// Raw Uint8Array input
{
  const bytes = new TextEncoder().encode('abc');
  check('sha512(Uint8Array("abc"))', sha512Hex(bytes),
    'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
    '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f');
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
