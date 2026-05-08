# ts-mtwister

A zero-dependency TypeScript port of [ESultanik/mtwister](https://github.com/ESultanik/mtwister), Evan Sultanik's C implementation of the Mersenne Twister pseudo-random number generator (based on the algorithm by Makoto Matsumoto and Takuji Nishimura, 1997).

> **Important: this is NOT canonical MT19937.**
>
> ESultanik's `mtwister` uses Knuth's older linear-congruential seeding constant `*6069` instead of the canonical MT19937 recurrence `*1812433253`. As a result, the output sequence produced by this package differs from what textbook MT19937 implementations and the published MT19937 test vectors produce, even for the same seed.
>
> If you need canonical MT19937 sequences (matching the reference implementation by Matsumoto and Nishimura, and matching most other MT19937 libraries), use the [`ts-mt19937`](https://www.npmjs.com/package/ts-mt19937) package instead.
>
> Use `ts-mtwister` only when you specifically want bit-for-bit compatibility with ESultanik's `mtwister` C library.

## Installation

```
npm install ts-mtwister
```

## Usage

```typescript
import { seedRand, genRandLong, genRand } from 'ts-mtwister';

// Seed the generator. Same seed produces the same sequence every time.
const state = seedRand(5489);

// Five random unsigned 32-bit integers.
for (let i = 0; i < 5; i++) {
  console.log(genRandLong(state));
}

// Five random floats in [0, 1).
for (let i = 0; i < 5; i++) {
  console.log(genRand(state));
}
```

## API

### `seedRand(seed: number): MTRand`

Initializes a new Mersenne Twister state from a 32-bit unsigned seed and returns it. Pass the returned state to `genRandLong` or `genRand` to draw values.

### `genRandLong(state: MTRand): number`

Returns the next pseudo-random unsigned 32-bit integer in the sequence (a JavaScript `number` in the range `[0, 4294967295]`). Mutates the state.

### `genRand(state: MTRand): number`

Returns the next pseudo-random floating-point value in the range `[0, 1)`. Mutates the state. Equivalent to `genRandLong(state) / 0xFFFFFFFF`.

### `tagMTRand`

The state class. You normally do not construct this directly (call `seedRand` instead) but it is exported as the state type.

## Determinism

The Mersenne Twister is deterministic: seeding two independent states with the same seed and drawing values from each will produce identical sequences. This makes the library suitable for reproducible simulations, procedural content generation, and test fixtures, but it is NOT cryptographically secure. Do not use it for keys, tokens, or any security-sensitive purpose.

The first five `genRandLong` outputs for seed `5489` are:

```
1725666986
691302046
828496344
2086677430
3038362414
```

These match the original ESultanik `mtwister` C reference (verified via gcc) and can be used as a sanity check after install. As noted above, this implementation uses Knuth's linear-congruential `*6069` seeding rather than the canonical MT19937 `*1812433253` recurrence, so the sequence differs from the textbook MT19937 published vectors and from `ts-mt19937`.

## Related packages

- [`ts-mt19937`](https://www.npmjs.com/package/ts-mt19937): canonical MT19937 (uses the `*1812433253` seeding constant). Use this if you want output that matches reference MT19937 vectors and most other MT19937 implementations.
- `ts-mtwister` (this package): bit-for-bit port of ESultanik's `mtwister` C code (uses `*6069`).

## License

BSD-3-Clause. See `LICENSE` for the full text. The original C implementation and the underlying algorithm are credited to Evan Sultanik and to Matsumoto and Nishimura respectively; the TypeScript translation layer is copyright (c) 2026 Scott Moore.
