# ts-mt19937

A direct TypeScript translation of the canonical Matsumoto/Nishimura MT19937 Mersenne Twister.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

BSD-3-Clause License

> MT19937 (original C version) - Copyright (C) 1997-2002, Makoto Matsumoto and Takuji Nishimura, All rights reserved.
>
> ts-mt19937 (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
>
>   1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
>
>   2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
>
>   3. The names of its contributors may not be used to endorse or promote products derived from this software without specific prior written permission.
>
> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Usage

This is a direct translation of MT19937 from C to TypeScript. The public API, internal state layout, and output sequence are preserved as faithfully as possible.

To read more about MT19937, please see the [original Matsumoto/Nishimura reference C source](http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/MT2002/CODES/mt19937ar.c) and the [MT home page](http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, integer arithmetic helpers) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Module-global state** - the `mt[624]` state vector and the `mti` counter are file-scope `static` in the C source and translate to module-private bindings; the eight public functions are the only re-exports.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-mt19937
```

Or install with your preferred package manager:

```bash
yarn add ts-mt19937
pnpm add ts-mt19937
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp mt19937ar.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-mt19937.git
```

## Importing

When installed from npm:

```typescript
import { init_genrand, genrand_int32, genrand_real2 } from 'ts-mt19937';
```

When using the source file directly:

```typescript
import { init_genrand, genrand_int32, genrand_real2 } from './mt19937ar.js';
```

### Quick example

```typescript
import { init_genrand, genrand_int32 } from 'ts-mt19937';

init_genrand(5489);
for (let i = 0; i < 5; i++) {
  console.log(genrand_int32());
}
// 3499211612
//  581869302
// 3890346734
// 3586334585
//  545404204
```

## Building

Unlike the original C version, ts-mt19937 requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx mt19937ar.ts
```

Or with Deno:

```bash
deno run --allow-all mt19937ar.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild mt19937ar.ts --bundle --platform=node --outfile=dist/mt19937ar.js
```

## Data Structure

MT19937's state is a 624-word vector plus an index counter. In the C source this is a pair of file-scope `static` variables; the TypeScript port preserves that exact shape as module-private bindings (i.e. there is no exported state class - state is implicit, just like in the canonical C). The eight public functions all read and write the same shared state.

`init_by_array` takes an `unsigned long init_key[]` in C. The TypeScript port models that argument with the translator's CPtr shape `{ buf: Uint8Array, off: number }` whose `buf` holds `key_length` little-endian uint32s.

## Tests

The repository includes the original MT19937 reference vectors and a translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - reference vector tests for `init_genrand(5489)` and `init_by_array`, matching Matsumoto/Nishimura's `mt19937ar.out` fixture.

## Caveats

The following limitations from the original C version still apply:

- **Not cryptographically secure.** MT19937 is a deterministic PRNG; given enough output an attacker can recover internal state. Do not use for keys, tokens, or any security-sensitive purpose.
- **Module-global state.** All eight public functions share one `mt[624]` vector. Two callers in the same module cannot draw from independent streams without re-seeding.
- **The first five `genrand_int32()` outputs after `init_genrand(5489)` are `3499211612, 581869302, 3890346734, 3586334585, 545404204`.** These match Matsumoto/Nishimura's `mt19937ar.out` reference fixture and serve as the canonical sanity check.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Makoto Matsumoto and Takuji Nishimura](http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html) - original authors of the MT19937 algorithm and the canonical C reference implementation.
- The [Hiroshima University MT page](http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/MT2002/CODES/mt19937ar.c) - upstream source for `mt19937ar.c`.
