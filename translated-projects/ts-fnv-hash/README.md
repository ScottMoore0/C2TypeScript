# ts-fnv-hash

A direct TypeScript translation of the Fowler-Noll-Vo non-cryptographic hash.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

The Unlicense (public domain dedication).

> fnv (original C version) - Copyright (c) Landon Curt Noll and FNV contributors, released into the public domain
>
> ts-fnv-hash (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> This is free and unencumbered software released into the public domain.
>
> Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.
>
> In jurisdictions that recognize copyright laws, the author or authors of this software dedicate any and all copyright interest in the software to the public domain. We make this dedication for the benefit of the public at large and to the detriment of our heirs and successors. We intend this dedication to be an overt act of relinquishment in perpetuity of all present and future rights to this software under copyright law.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
>
> For more information, please refer to <https://unlicense.org>.

## Usage

This is a direct translation of the Landon Curt Noll FNV reference from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible.

To read more about FNV, please see the [original FNV repository](https://github.com/lcn2/fnv) and the algorithm reference at [isthe.com/chongo/tech/comp/fnv/](http://www.isthe.com/chongo/tech/comp/fnv/) (now standardised as IETF RFC 9923).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, byte-level I/O) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.
- **64-bit arithmetic via paired 32-bit words** - the upstream's `Fnv64_t` (a struct of two 32-bit words to keep the implementation portable on 32-bit hosts) is preserved verbatim, so 64-bit results are returned as `Fnv64_t { w32: [low, high] }`.

## Installation

Install from npm:

```bash
npm install ts-fnv-hash
```

Or install with your preferred package manager:

```bash
yarn add ts-fnv-hash
pnpm add ts-fnv-hash
```

Alternatively, because the core library is contained in a small set of files, you can copy them directly into your project:

```bash
cp hash_32.ts hash_64.ts index.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-fnv-hash.git
```

## Importing

When installed from npm:

```typescript
import {
  fnv_32_str,
  fnv_32_buf,
  fnv_64_str,
  fnv_64_buf,
  FNV1_32_INIT,
  fnv1_64_init,
} from 'ts-fnv-hash';
```

When using the source files directly:

```typescript
import {
  fnv_32_str,
  fnv_32_buf,
  fnv_64_str,
  fnv_64_buf,
  FNV1_32_INIT,
  fnv1_64_init,
} from './index.js';
```

### Quick example

```typescript
import {
  fnv_32_str,
  fnv_32_buf,
  fnv_64_str,
  FNV1_32_INIT,
  fnv1_64_init,
} from 'ts-fnv-hash';

// 32-bit FNV-1 of a string
const h32 = fnv_32_str('hello', FNV1_32_INIT);
console.log(h32.toString(16));
// "4f9f2cab"

// 32-bit FNV-1 of a byte buffer
const bytes = new TextEncoder().encode('hello');
const h32b = fnv_32_buf({ buf: bytes, off: 0 }, bytes.length, FNV1_32_INIT);
console.log(h32b.toString(16));
// "4f9f2cab"

// 64-bit FNV-1 of a string. Clone the seed because Fnv64_t is mutated
// by the running hash.
const seed = Object.assign(Object.create(Object.getPrototypeOf(fnv1_64_init)), {
  w32: [...fnv1_64_init.w32],
});
const h64 = fnv_64_str('hello', seed);
const hex64 =
  h64.w32[1].toString(16).padStart(8, '0') +
  h64.w32[0].toString(16).padStart(8, '0');
console.log(hex64);
// "7b495389bdbdd4c7"
```

## Building

Unlike the original C version, ts-fnv-hash requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

## TypeScript Compiler

If your project uses TypeScript, add the files to your `tsconfig.json`:

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
npx tsx index.ts
```

Or with Deno:

```bash
deno run --allow-all index.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild index.ts --bundle --platform=node --outfile=dist/fnv-hash.js
```

## Data Structure

The C `Fnv64_t` (a tagged union of two 32-bit words used to keep 64-bit FNV portable on 32-bit hosts) is preserved as a TypeScript class with a single `w32` field:

```typescript
class Fnv64_t {
  w32: [number, number]; // [low, high]
}
```

A 64-bit FNV value can be reconstructed in conventional big-end-first hex as `w32[1] << 32 | w32[0]`. Pre-built seeds `fnv0_64_init` and `fnv1_64_init` mirror the upstream's seed constants; **clone them before each call** because the running hash mutates the seed in place.

## Tests

The repository includes the upstream FNV reference vectors. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/vectors.test.mjs` - FNV-1 reference vectors (32-bit and 64-bit) from the upstream.

## Caveats

The following limitations from the original C version still apply:

- **FNV is non-cryptographic.** It is a fast hash for hash-tables, content fingerprinting, and bloom-filter style indexing, not for security. Do not use it for digital signatures, MACs, password hashing, or any integrity check that must withstand an active adversary.
- **Hash-flooding sensitivity.** Because FNV is unkeyed, an adversary who chooses inputs can drive collisions; use SipHash-2-4 for keyed hashing in adversarial settings.
- **Seed mutation.** `Fnv64_t` seeds are mutated during a hash computation; clone the constant seed (`fnv0_64_init` / `fnv1_64_init`) before each call if you need to reuse it.
- **NUL-terminated string input** for the `*_str` variants mirrors the C signature; for arbitrary bytes use the `*_buf` variants.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).
- **32-bit vs 64-bit host integer arithmetic** - the paired-word `Fnv64_t` design exists so the C reference is portable across word sizes; in JavaScript the same shape is preserved for byte-exact compatibility, but no host-arithmetic concern remains.

## Acknowledgements

- [Landon Curt Noll](https://github.com/lcn2) - original C author of FNV
- [Phong Vo](http://www.research.att.com/info/kpv) and [Glenn Fowler](http://www.research.att.com/~gsf/) - original idea behind the algorithm
- [fnv contributors](https://github.com/lcn2/fnv/graphs/contributors) - ongoing maintenance of the C library
