# ts-pcg-basic

A zero-dependency TypeScript port of [pcg-c-basic](https://github.com/imneme/pcg-c-basic), the basic C implementation of the PCG (Permuted Congruential Generator) family of random number generators by Melissa O'Neill.

For background on the PCG family, see [https://www.pcg-random.org](https://www.pcg-random.org).

## Installation

```
npm install ts-pcg-basic
```

## Usage

```typescript
import {
  pcg_state_setseq_64,
  pcg32_srandom_r,
  pcg32_random_r,
  pcg32_boundedrand_r,
} from 'ts-pcg-basic';

// Create a generator state and seed it.
const rng = new pcg_state_setseq_64();
pcg32_srandom_r(rng, 42, 54);

// Generate full 32-bit unsigned random values.
for (let i = 0; i < 5; i++) {
  console.log(pcg32_random_r(rng));
}

// Generate uniformly distributed random integers in [0, bound).
const bounded = pcg32_boundedrand_r(rng, 100);
console.log(bounded);
```

The same seed always produces the same sequence, so generators are fully deterministic and reproducible across runs.

## API

- `class pcg_state_setseq_64` - generator state with two 64-bit fields, `state` and `inc`. Construct with `new` and seed before use.
- `pcg32_srandom_r(rng, initstate, initseq)` - seed a state object with the given starting state and stream-selection sequence. Both arguments are 64-bit values.
- `pcg32_srandom(initstate, initseq)` - seed the global generator state.
- `pcg32_random_r(rng)` - return the next 32-bit unsigned random value from the given state. The output spans the full 32-bit unsigned range.
- `pcg32_random()` - return the next 32-bit unsigned random value from the global state.
- `pcg32_boundedrand_r(rng, bound)` - return a uniformly distributed random integer in `[0, bound)`. Uses rejection sampling so the result is unbiased, unlike a plain modulo of the unbounded output.
- `pcg32_boundedrand(bound)` - bounded variant using the global state.

## License

Licensed under the Apache License, Version 2.0. The original C implementation is copyright (c) 2014-2017 Melissa O'Neill; the TypeScript translation is copyright (c) 2026 Scott Moore. See the LICENSE file for full terms.
