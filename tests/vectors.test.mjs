// SplitMix64 reference vectors.
// Sebastiano Vigna's splitmix64 with seed=0 yields a known sequence.
// These outputs are also produced by Java 8's SplittableRandom and many
// other implementations.
import { Splitmix64, generate } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = (typeof got === 'bigint' || typeof want === 'bigint')
    ? BigInt(got) === BigInt(want)
    : got === want;
  if (ok) { console.log(`ok ${name}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// Seed 0 — canonical reference outputs
{
  const r = new Splitmix64(0n);
  const expected = [
    0xe220a8397b1dcdafn,
    0x6e789e6aa1b965f4n,
    0x06c45d188009454fn,
    0xf88bb8a8724c81ecn,
    0x1b39896a51a8749bn,
  ];
  for (let i = 0; i < expected.length; i++) {
    check(`splitmix64(seed=0)[${i}]`, r.next(), expected[i]);
  }
}

// Deterministic: same seed yields same sequence
{
  const a = generate(42n, 16);
  const b = generate(42n, 16);
  let same = a.length === b.length;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { same = false; break; }
  check('same seed produces identical sequence', same, true);
}

// Different seeds produce different first values
{
  check('different seeds differ', new Splitmix64(1n).next() !== new Splitmix64(2n).next(), true);
}

// Output type and range
{
  const v = new Splitmix64(99n).next();
  check('output is BigInt', typeof v === 'bigint', true);
  check('output is in [0, 2^64)', v >= 0n && v < (1n << 64n), true);
}

// nextUint32 in [0, 2^32)
{
  const r = new Splitmix64(7n);
  let inRange = true;
  for (let i = 0; i < 100; i++) {
    const v = r.nextUint32();
    if (v < 0 || v >= 0x1_0000_0000) { inRange = false; break; }
  }
  check('nextUint32 stays in [0, 2^32)', inRange, true);
}

// nextFloat in [0, 1)
{
  const r = new Splitmix64(13n);
  let inRange = true;
  for (let i = 0; i < 1000; i++) {
    const v = r.nextFloat();
    if (v < 0 || v >= 1) { inRange = false; break; }
  }
  check('nextFloat stays in [0, 1)', inRange, true);
}

// Independence of instances
{
  const a = new Splitmix64(5n);
  const b = new Splitmix64(5n);
  a.next();
  // Pulling from `a` should not advance `b`
  const aRef = new Splitmix64(5n);
  check('two instances with same seed yield same sequence',
    b.next(), aRef.next());
}

// Number-valued seed input (gets coerced to BigInt)
{
  const a = new Splitmix64(42).next();
  const b = new Splitmix64(42n).next();
  check('number and bigint seed inputs are equivalent', a, b);
}

// generate() returns expected count
{
  const arr = generate(99n, 10);
  check('generate(seed, 10) returns 10 values', arr.length, 10);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
