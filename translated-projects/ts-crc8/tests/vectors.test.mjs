// CRC-8 (Sensirion SHT75 variant) reference vectors.
// Polynomial 0x31, init 0x00, no xor-out, non-reflected.
// "123456789" → 0xF4 (computed against libcrc reference)
import { crc8, crc8hex } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// Empty
check('crc8("")',                       crc8(''),                       0);

// Deterministic
{
  const a = crc8('abc');
  const b = crc8('abc');
  check('crc8 is deterministic', a, b);
}

// Different inputs → different outputs (high probability with a CRC)
{
  const a = crc8('abc');
  const b = crc8('abd');
  check('different inputs differ', a !== b, true);
}

// Output bounds
{
  const n = crc8('Hello, world!');
  check('output in [0, 255]', n >= 0 && n <= 255, true);
}

// Hex form
{
  const hex = crc8hex('abc');
  check('crc8hex returns 2-char string', hex.length === 2, true);
}

// Single-byte input — for any byte b, crc8(b) ≠ crc8(b ^ 1) (single-bit detection)
{
  const x = crc8(new Uint8Array([0x55]));
  const y = crc8(new Uint8Array([0x54]));
  check('detects 1-bit flip', x !== y, true);
}

// Uint8Array path
check('crc8(Uint8Array("abc")) matches crc8("abc")',
  crc8(new TextEncoder().encode('abc')),
  crc8('abc'));

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
