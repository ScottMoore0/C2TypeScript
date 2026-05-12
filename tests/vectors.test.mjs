// CRC-32C (Castagnoli) reference test vectors.
// Validated against canonical RFC 3720 / iSCSI Appendix A reference values.
import { crc32c, crc32cHex } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// Canonical CRC-32C check values (matches Python crcmod, RocksDB, etc.)
check('CRC32C("")',         crc32cHex(''),                                  '00000000');
check('CRC32C("a")',        crc32cHex('a'),                                 'c1d04330');
check('CRC32C("abc")',      crc32cHex('abc'),                               '364b3fb7');
check('CRC32C("123456789") canonical check value',
                            crc32cHex('123456789'),                         'e3069283');
check('CRC32C("The quick brown fox jumps over the lazy dog")',
                            crc32cHex('The quick brown fox jumps over the lazy dog'), '22620404');

// RFC 3720 §A.4 examples
// 32 bytes of zeros → 0x8a9136aa
{
  const z = new Uint8Array(32);
  check('CRC32C(32 zero bytes) — RFC 3720 §A.4',
    crc32cHex(z), '8a9136aa');
}
// 32 bytes of 0xff → 0x62a8ab43
{
  const f = new Uint8Array(32).fill(0xff);
  check('CRC32C(32 0xff bytes) — RFC 3720 §A.4',
    crc32cHex(f), '62a8ab43');
}
// 32 bytes 0..31 → 0x46dd794e
{
  const seq = new Uint8Array(32);
  for (let i = 0; i < 32; i++) seq[i] = i;
  check('CRC32C(0..31 sequence) — RFC 3720 §A.4',
    crc32cHex(seq), '46dd794e');
}

// Returns uint32
{
  const n = crc32c('abc');
  check('crc32c returns uint32', Number.isInteger(n) && n >= 0 && n <= 0xffffffff, true);
}

// Uint8Array path
check('crc32c(Uint8Array)',
  crc32cHex(new TextEncoder().encode('123456789')),
  'e3069283');

// Should differ from CRC-32 (different polynomial)
{
  // CRC-32 of "123456789" is 0xCBF43926
  // CRC-32C of "123456789" is 0xE3069283
  check('CRC-32C differs from CRC-32 for "123456789"',
    crc32cHex('123456789') !== 'cbf43926', true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
