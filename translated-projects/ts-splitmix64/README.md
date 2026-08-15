# ts-splitmix64

A direct TypeScript port of Sebastiano Vigna's SplitMix64 — the canonical 64-bit PRNG seeder.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

Direct port of [jj1bdx/xorshiftplus-c/blob/master/splitmix64.c](https://github.com/jj1bdx/xorshiftplus-c/blob/master/splitmix64.c) by Sebastiano Vigna, CC0 / public domain.

The translated output is validated byte-for-byte against Vigna's reference sequence: SplitMix64 seeded with `0` yields `0xE220A8397B1DCDAF`, `0x6E789E6AA1B965F4`, `0x06C45D188009454F`, `0xF88BB8A8724C81EC`, `0x1B39896A51A8749B`, …

## Why this exists

SplitMix64 is the *de facto* standard seeder for modern 64-bit PRNGs: it stretches a single 64-bit seed into independent random words to initialise xoshiro256, xoroshiro128, MT19937-64, and other generators with much larger state. It is also the algorithm behind **Java 8's `SplittableRandom`** and **JDK 17's `java.util.SplittableRandom`**. Passes BigCrush.

Two reasons you want SplitMix64 specifically:

1. **Seeding other PRNGs.** When you have one 64-bit seed but a generator needs (say) 32 bytes of independent state, run SplitMix64 four times to fill it. xoshiro/xoroshiro literature explicitly recommends this.
2. **A simple high-quality 64-bit generator.** Single 64-bit state, statistically excellent, ~3 instructions per output.

## Install

```bash
npm install ts-splitmix64
```

## Usage

```typescript
import { Splitmix64, generate } from 'ts-splitmix64';

const r = new Splitmix64(0n);
r.next();              // 0xE220A8397B1DCDAFn (BigInt)
r.nextUint32();        // 32-bit unsigned, low 32 bits of next output
r.nextFloat();         // float in [0, 1) with 53 bits of precision

// One-shot batch seeding:
const seedWords = generate(0n, 8);   // 8 BigInts to feed into another PRNG
```

## API surface

- `class Splitmix64`
  - `new Splitmix64(seed?: bigint | number)` — default seed `0n`.
  - `.next(): bigint` — next 64-bit unsigned. Returns BigInt.
  - `.nextUint32(): number` — low 32 bits of next output, as a JS number.
  - `.nextFloat(): number` — float in `[0, 1)` with 53 bits of precision.
  - `.getState(): bigint`, `.setState(s)` — read/write internal state.
- `generate(seed, count): bigint[]` — one-shot batch.

## Reference vectors

The test suite asserts SplitMix64 with `seed=0` against Vigna's published sequence:

| Iteration | Output |
|---|---|
| 0 | `E220A8397B1DCDAF` |
| 1 | `6E789E6AA1B965F4` |
| 2 | `06C45D188009454F` |
| 3 | `F88BB8A8724C81EC` |
| 4 | `1B39896A51A8749B` |

Run:
```bash
npm test
```

## Caveats

- **Not cryptographic.** SplitMix64 is non-cryptographic. Use `node:crypto` `randomBytes` for keys/nonces/tokens.
- **State is 64-bit.** Period is 2^64, which is small for parallel computations. If you need to spawn many independent streams, use SplitMix64 to *seed* a xoshiro256 family member rather than running SplitMix64 in parallel.
- **BigInt return.** JS numbers can't represent 64-bit unsigned integers above 2^53. `.next()` returns BigInt; use `.nextUint32()` or `.nextFloat()` for JS-number outputs.

## License

Unlicense / public domain. Original C by Sebastiano Vigna under CC0.

## See also

- [ts-xoshiro128pp](https://github.com/ScottMoore0/ts-xoshiro128pp) — xoshiro128++ (32-bit), can be seeded from SplitMix64
- [ts-pcg-basic](https://github.com/ScottMoore0/ts-pcg-basic) — PCG family
- [ts-mt19937](https://github.com/ScottMoore0/ts-mt19937), [ts-mtwister](https://github.com/ScottMoore0/ts-mtwister) — Mersenne Twister
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
