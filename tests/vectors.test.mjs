// xoshiro128++ validation against an independent pure-JS implementation
// of the same algorithm.
//
// xoshiro128++ does not have NIST-style published test vectors, but the
// algorithm is fully specified by Blackman & Vigna's reference C source
// at https://prng.di.unimi.it/xoshiro128plusplus.c.  We re-implement it
// here in straightforward JS (10 lines, no dependencies) and assert that
// our translated package produces the same stream byte-for-byte across
// 1024 outputs for several seeds. Plus structural sanity tests.
import { Xoshiro128pp, generate } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { console.log(`ok ${name}` + (detail ? ` (${detail})` : '')); pass++; }
  else { console.log(`not ok ${name}` + (detail ? ` (${detail})` : '')); fail++; }
}

// Reference implementation — straight translation of the upstream C
function makeRef(seed) {
  const s = Uint32Array.from(seed);
  const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0;
  return function next() {
    const result = (rotl((s[0] + s[3]) >>> 0, 7) + s[0]) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 11);
    return result >>> 0;
  };
}

// 1) Equivalence with independent reference for several seeds, 1024 outputs each
for (const seed of [
  [1, 2, 3, 4],
  [0xdeadbeef, 0xcafebabe, 0x12345678, 0x9abcdef0],
  [1, 0, 0, 0],
  [0, 0, 0, 1],
  [0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff],
]) {
  const ref = makeRef(seed);
  const us  = new Xoshiro128pp(seed);
  let agree = 0, disagree = 0;
  for (let i = 0; i < 1024; i++) {
    const a = ref();
    const b = us.next();
    if (a === b) agree++;
    else { disagree++; if (disagree <= 2) console.log(`  i=${i}: ref=0x${a.toString(16)} us=0x${b.toString(16)}`); }
  }
  check(`1024 outputs match reference for seed=[${seed.map(s => '0x'+s.toString(16)).join(',')}]`,
    disagree === 0, `${agree}/1024 agree`);
}

// 2) Deterministic: same seed → same sequence
{
  const a = generate([5, 6, 7, 8], 64);
  const b = generate([5, 6, 7, 8], 64);
  let same = true;
  for (let i = 0; i < 64; i++) if (a[i] !== b[i]) { same = false; break; }
  check('same seed produces identical sequence', same, true);
}

// 3) Different seeds produce different first outputs
{
  const a = new Xoshiro128pp([1, 2, 3, 4]).next();
  const b = new Xoshiro128pp([1, 2, 3, 5]).next();
  check('different seeds produce different first outputs', a !== b, true);
}

// 4) Outputs are 32-bit unsigned integers
{
  const r = new Xoshiro128pp([42, 42, 42, 42]);
  let allU32 = true;
  for (let i = 0; i < 100; i++) {
    const v = r.next();
    if (!Number.isInteger(v) || v < 0 || v > 0xffffffff) { allU32 = false; break; }
  }
  check('all outputs are 32-bit unsigned', allU32, true);
}

// 5) nextFloat() in [0, 1)
{
  const r = new Xoshiro128pp([99, 100, 101, 102]);
  let inRange = true;
  for (let i = 0; i < 1000; i++) {
    const v = r.nextFloat();
    if (v < 0 || v >= 1) { inRange = false; break; }
  }
  check('nextFloat() stays in [0, 1)', inRange, true);
}

// 6) nextInt(N) in [0, N)
{
  const r = new Xoshiro128pp([13, 14, 15, 16]);
  let inRange = true;
  for (let i = 0; i < 1000; i++) {
    const v = r.nextInt(100);
    if (v < 0 || v >= 100) { inRange = false; break; }
  }
  check('nextInt(100) stays in [0, 100)', inRange, true);
}

// 7) All-zero seed is rejected
{
  let threw = false;
  try { new Xoshiro128pp([0, 0, 0, 0]); } catch { threw = true; }
  check('rejects all-zero seed', threw, true);
}

// 8) Two instances with independent state don't interfere
{
  const a = new Xoshiro128pp([1, 2, 3, 4]);
  const b = new Xoshiro128pp([5, 6, 7, 8]);
  const a0 = a.next();
  const b0 = b.next();
  const a1 = a.next();
  const b1 = b.next();
  // a's output sequence should not depend on whether b was advanced between calls
  const aRef = new Xoshiro128pp([1, 2, 3, 4]);
  const aRef0 = aRef.next();
  const aRef1 = aRef.next();
  check('two instances are independent', a0 === aRef0 && a1 === aRef1,
    `a=[${a0},${a1}] aRef=[${aRef0},${aRef1}]`);
}

// 9) jump() produces a different stream from continued next()
{
  const a = new Xoshiro128pp([1, 2, 3, 4]);
  a.next();
  const aNext = a.next();
  const b = new Xoshiro128pp([1, 2, 3, 4]);
  b.jump();
  const bAfterJump = b.next();
  check('jump() produces different output from successive next()',
    aNext !== bAfterJump, true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
