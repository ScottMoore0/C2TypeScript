// Pearson hash test vectors.
// The 256-byte permutation table is fixed (matches the upstream); these
// outputs are deterministic given that table.
import { pearson8, pearson16, pearson32, pearson64,
         pearson8hex, pearson16hex, pearson32hex, pearson64hex } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = (typeof want === 'bigint' || typeof got === 'bigint')
    ? BigInt(got) === BigInt(want)
    : got === want;
  if (ok) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// Pearson-8 outputs from the upstream table
check('pearson8("")',        pearson8hex(''),        '1d');
check('pearson8("a")',       pearson8hex('a'),       '79');
check('pearson8("abc")',     pearson8hex('abc'),     'dc');
check('pearson8("hello")',   pearson8hex('hello'),   '8c');
check('pearson8("123456789")', pearson8hex('123456789'), '58');

// Pearson-16: first byte equals Pearson-8 of the same input (it's how it's constructed)
check('pearson16("abc")',     pearson16hex('abc'),     'dcc9');
check('pearson16 high byte equals pearson8',
       pearson16('abc') >>> 8, pearson8('abc'));

// Pearson-32
check('pearson32("")',        pearson32hex(''),         '1dbab4a2');
check('pearson32("abc")',     pearson32hex('abc'),      'dcc9e473');
check('pearson32("hello")',   pearson32hex('hello'),    '8cf2dcaf');

// Pearson-64
check('pearson64("abc")',     pearson64hex('abc'),      'dcc9e47317547e51');
check('pearson64("hello")',   pearson64hex('hello'),    '8cf2dcaf95db8f38');

// Deterministic
{
  const a = pearson32('hello');
  const b = pearson32('hello');
  check('pearson32 is deterministic', a, b);
}

// Different inputs differ
{
  const a = pearson8('abc');
  const b = pearson8('abd');
  check('pearson8 distinguishes 1-bit-different inputs', a !== b, true);
}

// pearson64 returns a BigInt
{
  const v = pearson64('hello');
  check('pearson64 returns bigint', typeof v === 'bigint', true);
}

// Uint8Array input
check('pearson32(Uint8Array)',
  pearson32hex(new TextEncoder().encode('hello')),
  pearson32hex('hello'));

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
