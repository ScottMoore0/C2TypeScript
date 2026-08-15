// CRC-32 (IEEE 802.3) reference test vectors.
import { crc32sum, crc32hex } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// Canonical CRC-32 reference values, matching zlib/gzip/Python binascii.crc32.
check('CRC32("")',                     crc32hex(''),                   '00000000');
check('CRC32("a")',                    crc32hex('a'),                  'e8b7be43');
check('CRC32("abc")',                  crc32hex('abc'),                '352441c2');
check('CRC32("message digest")',       crc32hex('message digest'),     '20159d7f');
check('CRC32("abcdefghijklmnopqrstuvwxyz")',
                                       crc32hex('abcdefghijklmnopqrstuvwxyz'),
                                       '4c2750bd');
check('CRC32(string of 0-9 80x)',
      crc32hex('123456789012345678901234567890123456789012345678901234567890' +
               '12345678901234567890'),
      '7ca94a72');
check('CRC32("123456789") — canonical CRC-32 check value',
      crc32hex('123456789'), 'cbf43926');
check('CRC32("The quick brown fox jumps over the lazy dog")',
      crc32hex('The quick brown fox jumps over the lazy dog'), '414fa339');

// Test that crc32sum returns a uint32 number
{
  const n = crc32sum('abc');
  check('crc32sum returns uint32', Number.isInteger(n) && n >= 0 && n <= 0xffffffff, true);
  check('crc32sum("abc") === 0x352441c2', n, 0x352441c2);
}

// Uint8Array input path
{
  const bytes = new TextEncoder().encode('123456789');
  check('crc32hex(Uint8Array)', crc32hex(bytes), 'cbf43926');
}

// Roundtrip: bytes vs string of same content match
{
  check('bytes and string of same content produce same CRC',
    crc32hex('Hello, World!') === crc32hex(new TextEncoder().encode('Hello, World!')),
    true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
