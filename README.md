# ts-pcg-basic

A direct TypeScript translation of the PCG random number generator basic C implementation.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

Apache License, Version 2.0

> pcg-c-basic (original C version) - Copyright (c) 2014-2017 Melissa O'Neill <oneill@pcg-random.org>
>
> ts-pcg-basic (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
>
>     http://www.apache.org/licenses/LICENSE-2.0
>
> Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

See the included [LICENSE](./LICENSE) file for the full Apache 2.0 text and the upstream NOTICE.

## Usage

This is a direct translation of [pcg-c-basic](https://github.com/imneme/pcg-c-basic) from C to TypeScript. The public API, state struct, and per-call output are preserved as faithfully as possible.

To read more about pcg-c-basic, please see the [original pcg-c-basic repository](https://github.com/imneme/pcg-c-basic) and the [PCG-Random website](https://www.pcg-random.org).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, 64-bit arithmetic helpers) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **64-bit math via BigInt** - the C `uint64_t` state and increment fields are modelled with `BigInt` arithmetic so the output stream is bit-for-bit identical to the C reference.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-pcg-basic
```

Or install with your preferred package manager:

```bash
yarn add ts-pcg-basic
pnpm add ts-pcg-basic
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp pcg_basic.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-pcg-basic.git
```

## Importing

When installed from npm:

```typescript
import { pcg_state_setseq_64, pcg32_srandom_r, pcg32_random_r } from 'ts-pcg-basic';
```

When using the source file directly:

```typescript
import { pcg_state_setseq_64, pcg32_srandom_r, pcg32_random_r } from './pcg_basic.js';
```

### Quick example

```typescript
import { pcg_state_setseq_64, pcg32_srandom_r, pcg32_random_r } from 'ts-pcg-basic';

const rng = new pcg_state_setseq_64();
pcg32_srandom_r(rng, 42n, 54n);
for (let i = 0; i < 5; i++) {
  console.log('0x' + (pcg32_random_r(rng) >>> 0).toString(16));
}
// 0xa15c02b7
// 0x7b47f409
// 0xba1d3330
// 0x83d2f293
// 0xbfa4784b
```

## Building

Unlike the original C version, ts-pcg-basic requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx pcg_basic.ts
```

Or with Deno:

```bash
deno run --allow-all pcg_basic.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild pcg_basic.ts --bundle --platform=node --outfile=dist/pcg_basic.js
```

## Data Structure

The C `struct pcg_state_setseq_64` has been translated to a TypeScript class with identical field names:

```typescript
class pcg_state_setseq_64 {
  state: bigint = 0n;   // RNG state, all values are possible
  inc: bigint = 0n;     // controls which RNG sequence (stream) is selected (must always be odd)
}
```

Construct with `new pcg_state_setseq_64()` then seed with `pcg32_srandom_r(rng, initstate, initseq)`. Both seed arguments are 64-bit values (pass as `BigInt`).

## Tests

The repository includes the original pcg-c-basic reference vectors and the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - reference output vectors for seed `(42, 54)` against the upstream `pcg32-demo` output.

## Caveats

The following limitations from the original C version still apply:

- **Single family member.** This is the basic edition; jump-ahead/jump-back and other advanced PCG features are not present. For the full feature set use the [main pcg-c library](https://github.com/imneme/pcg-c).
- **Not cryptographically secure.** PCG is statistically excellent but not designed for cryptographic use. Do not use for keys, tokens, or any security-sensitive purpose.
- **Stream selection requires an odd `inc`.** Per the upstream API contract, `pcg32_srandom_r`'s `initseq` must produce an odd increment after the `(initseq << 1) | 1` shift; the helper ensures this automatically when called via the public API.
- **First five `pcg32_random_r` outputs after `pcg32_srandom_r(rng, 42n, 54n)` are `0xa15c02b7, 0x7b47f409, 0xba1d3330, 0x83d2f293, 0xbfa4784b`.** These match the upstream `pcg32-demo` reference fixture and serve as the canonical sanity check.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Melissa O'Neill](https://www.cs.hmc.edu/~oneill/) - original author of PCG and the pcg-c-basic C reference implementation.
- [pcg-c-basic contributors](https://github.com/imneme/pcg-c-basic/graphs/contributors) - ongoing maintenance of the C library.
- [pcg-random.org](https://www.pcg-random.org) - upstream documentation, papers, and the full PCG family.
