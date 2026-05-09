# ts-mtwister

A direct TypeScript translation of the Mersenne Twister with the *6069 LCG seeding constant.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

BSD-3-Clause License

> mtwister (original C version) - Copyright (c) Evan Sultanik (mtwister), based on the Mersenne Twister algorithm by Makoto Matsumoto and Takuji Nishimura (1997).
>
> ts-mtwister (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> All rights reserved.
>
> Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
>
> 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
>
> 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
>
> 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
>
> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Usage

This is a direct translation of [ESultanik/mtwister](https://github.com/ESultanik/mtwister) from C to TypeScript. The public API, state struct, and per-call output are preserved as faithfully as possible.

To read more about mtwister, please see the [original mtwister repository](https://github.com/ESultanik/mtwister).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, integer arithmetic helpers) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Per-call state object** - `seedRand` returns a state instance you pass into `genRand`/`genRandLong`, mirroring the upstream `MTRand r = seedRand(...)` idiom.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-mtwister
```

Or install with your preferred package manager:

```bash
yarn add ts-mtwister
pnpm add ts-mtwister
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp mtwister.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-mtwister.git
```

## Importing

When installed from npm:

```typescript
import { seedRand, genRand, genRandLong } from 'ts-mtwister';
```

When using the source file directly:

```typescript
import { seedRand, genRand, genRandLong } from './mtwister.js';
```

### Quick example

```typescript
import { seedRand, genRand } from 'ts-mtwister';

const state = seedRand(5489);
console.log(genRand(state));
// 0.40178815517616184
```

## Building

Unlike the original C version, ts-mtwister requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

## TypeScript Compiler

If your project uses TypeScript, add the file to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": false,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"]
}
```

> **Important:** The translated code uses patterns that emulate C pointer arithmetic and unsafe type casts. It is intentionally **not** `strict`-compliant. You should isolate it in its own module (as shown above) and wrap it in a strictly-typed API surface for the rest of your application.

## Node.js / tsx

Run directly without pre-compilation:

```bash
npx tsx mtwister.ts
```

Or with Deno:

```bash
deno run --allow-all mtwister.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild mtwister.ts --bundle --platform=node --outfile=dist/mtwister.js
```

## Data Structure

The C `struct MTRand` has been translated to a TypeScript class with identical fields:

```typescript
class tagMTRand {
  mt: number[] = [];   // 624-word state vector
  index: number = 0;   // next-output index (0..624)
}
```

`seedRand(seed)` returns a fresh `tagMTRand` instance; `genRand(state)` and `genRandLong(state)` mutate it on each call.

## Tests

The repository includes the upstream mtwister reference vectors and the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - per-call output vectors for seed `5489`, validated against the original ESultanik C build.

## Caveats

The following limitations from the original C version still apply:

- **Not canonical MT19937.** ESultanik's `mtwister` uses Knuth's older `*6069` linear-congruential seeding constant rather than MT19937's `*1812433253` recurrence. The output sequence therefore differs from textbook MT19937 implementations and from `mt19937ar.out`. If you need canonical MT19937 outputs use [`ts-mt19937`](https://www.npmjs.com/package/ts-mt19937) instead.
- **Not cryptographically secure.** As the upstream README explicitly notes, "this code has not been tested to a sufficient extent to be confidently used for cryptography." Do not use for keys, tokens, or any security-sensitive purpose.
- **Deterministic.** Same seed produces the same sequence on every run, which is useful for reproducible simulations but not for unpredictability.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Evan Sultanik](https://github.com/ESultanik) - original author of the [mtwister](https://github.com/ESultanik/mtwister) C library.
- [Makoto Matsumoto and Takuji Nishimura](http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html) - authors of the underlying Mersenne Twister algorithm (1997).
- [mtwister contributors](https://github.com/ESultanik/mtwister/graphs/contributors) - ongoing maintenance of the C library.
