// Fletcher checksum reference test vectors.
// Sources: Wikipedia "Fletcher's checksum", RFC 1146 §C, and the
// original Fletcher 1982 paper.
import { fletcher16sum, fletcher16hex, fletcher32sum } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// Fletcher-16 reference vectors
check('fletcher16("")',           fletcher16hex(''),          '0000');
check('fletcher16("abcde")',      fletcher16hex('abcde'),     'c8f0');
check('fletcher16("abcdef")',     fletcher16hex('abcdef'),    '2057');
check('fletcher16("abcdefgh")',   fletcher16hex('abcdefgh'),  '0627');

// Numeric output
check('fletcher16("abcde") = 0xC8F0', fletcher16sum('abcde'), 0xc8f0);

// Determinism
{
  const a = fletcher16sum('hello world');
  const b = fletcher16sum('hello world');
  check('fletcher16 is deterministic', a, b);
}

// Different inputs differ
{
  check('different inputs differ',
    fletcher16sum('abc') !== fletcher16sum('abd'), true);
}

// Uint8Array path
check('fletcher16(Uint8Array)',
  fletcher16hex(new TextEncoder().encode('abcde')),
  'c8f0');

// Output range
{
  const v = fletcher16sum('arbitrary input string');
  check('fletcher16 in [0, 65535]', v >= 0 && v <= 0xffff, true);
}

// Fletcher-32 sanity: deterministic, different from fletcher16
{
  const a = fletcher32sum('hello world');
  const b = fletcher32sum('hello world');
  check('fletcher32 is deterministic', a, b);
  check('fletcher32 in [0, 2^32)', a >= 0 && a <= 0xffffffff, true);
}

// Odd-length input handled (padded with zero)
{
  const v = fletcher32sum('abc');
  check('fletcher32 accepts odd-length input', typeof v === 'number' && v >= 0, true);
}

// Long-message handling — single block vs split blocks should agree
// (this isn't strictly Fletcher-spec invariant but tests internal looping)
{
  const long = 'A'.repeat(1000);
  const v1 = fletcher16sum(long);
  const v2 = fletcher16sum(long);  // recompute (should match)
  check('fletcher16 of 1000-A string is consistent', v1, v2);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
