# ts-xoshiro128pp

A direct TypeScript port of **xoshiro128++** by David Blackman and Sebastiano Vigna.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [xoshiro128++ 1.0](https://prng.di.unimi.it/xoshiro128plusplus.c) by David Blackman and Sebastiano Vigna, dedicated to the public domain (CC0).

The translated output is validated against an independently-written pure-JavaScript reference implementation of the same algorithm — 5×1024 = 5120 outputs match byte-for-byte across a range of seeds.

## Why this exists

xoshiro128++ is the modern recommended **32-bit all-purpose** PRNG. It is faster than Mersenne Twister, statistically excellent (passes the entire BigCrush battery), has a 128-bit state, and a period of 2⁻¹²⁸ − 1. xoshiro / xoroshiro family PRNGs are the default RNGs in NumPy (`PCG64` for 64-bit, xoshiro variants for embedded), Apple's Swift standard library, and many game engines.

`ts-xoshiro128pp` is a direct mechanical translation from Vigna's reference C source via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the algorithm is inspectable.

## Install

```bash
npm install ts-xoshiro128pp
```

## Usage

```typescript
import { Xoshiro128pp, generate } from 'ts-xoshiro128pp';

// Stateful: create a generator, pull values
const rng = new Xoshiro128pp([1, 2, 3, 4]);
rng.next();                    // uint32 in [0, 2^32)
rng.nextFloat();               // float in [0, 1) with 32 bits of precision
rng.nextInt(100);              // int in [0, 100)

// One-shot: pull a batch
const buf = generate([1, 2, 3, 4], 1000);  // Uint32Array(1000)

// Jump 2^64 steps ahead — handy for parallel streams
const stream1 = new Xoshiro128pp([1, 2, 3, 4]);
const stream2 = new Xoshiro128pp(stream1.getState()).jump();
const stream3 = new Xoshiro128pp(stream1.getState()).jump().jump();
```

The seed is four 32-bit unsigned integers. The all-zero state is a fixed point of the algorithm and is rejected.

## API surface

- `class Xoshiro128pp`
  - `new Xoshiro128pp(seed?: [number, number, number, number])` — default seed `[1, 2, 3, 4]`.
  - `.next(): number` — next 32-bit unsigned random integer.
  - `.nextFloat(): number` — float in `[0, 1)`.
  - `.nextInt(bound: number): number` — integer in `[0, bound)`.
  - `.jump(): this` — advance the state by 2⁶⁴ calls (returns `this` for chaining).
  - `.longJump(): this` — advance the state by 2⁹⁶ calls.
  - `.getState(): [number, number, number, number]` — snapshot of the internal state.
- `generate(seed, count): Uint32Array` — one-shot batch.

## Validation

The package's test suite asserts:
- **Byte-for-byte equivalence** with an independent pure-JS reference implementation of xoshiro128++, across 1024 outputs for each of five seeds (5120 outputs total).
- Deterministic seeding: same seed → identical sequence.
- Different seeds produce different first outputs.
- All outputs are 32-bit unsigned integers.
- `nextFloat()` ∈ [0, 1), `nextInt(N)` ∈ [0, N).
- All-zero seed is rejected.
- Two `Xoshiro128pp` instances do not interfere with each other.
- `jump()` produces a different stream from continued `next()`.

Run:
```bash
npm test
```

## Caveats

- **Not cryptographic.** This is a non-cryptographic PRNG. Do not use it for keys, tokens, nonces, or anything else where an adversary observing outputs must not be able to predict future or recover past outputs. Use `node:crypto` `randomBytes` for that.
- **All-zero state is a fixed point.** The algorithm is undefined for state `[0,0,0,0]`. The constructor rejects this and you should avoid degenerate seeds in general. If you're seeding from low-entropy input, run it through SplitMix32 (or similar mixer) first.
- **32-bit state, 128-bit total period.** Despite the name, internal arithmetic uses 32-bit words; only the *state vector* is 128 bits. For 64-bit outputs see xoshiro256++/256\*\*.

## License

Unlicense / public domain. Original C by David Blackman and Sebastiano Vigna (CC0). TypeScript translation also released into the public domain. See the `LICENSE` file for both notices.

## See also

- [ts-mt19937](https://github.com/ScottMoore0/ts-mt19937), [ts-mtwister](https://github.com/ScottMoore0/ts-mtwister) — Mersenne Twister (older, larger state, slower)
- [ts-pcg-basic](https://github.com/ScottMoore0/ts-pcg-basic) — PCG family (different design, also recommended)
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
