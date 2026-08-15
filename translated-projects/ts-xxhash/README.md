# ts-xxhash

A direct TypeScript translation of the fast non-cryptographic hash algorithm xxHash.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [xxHash](https://github.com/Cyan4973/xxHash), the original C library by Yann Collet. The translation tracks `v0.8.2`.

License terms are inherited from the upstream — see `## License` below.

## License

BSD 2-Clause License.

> xxHash (original C version) - Copyright (c) 2012-2021 Yann Collet and xxHash contributors
>
> ts-xxhash (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> All rights reserved.
>
> Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
>
> 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
>
> 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
>
> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Usage

This is a direct translation of xxHash from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible.

To read more about xxHash, please see the [original xxHash repository](https://github.com/Cyan4973/xxHash).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, byte-level I/O) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.
- **64-bit arithmetic via `bigint`** - XXH64, XXH3 64-bit and XXH3 128-bit results and seeds are JavaScript `bigint` values; XXH32 results remain `number`.
- **Portable build only** - the upstream's vectorised paths (SSE2/AVX2/AVX512/NEON/VSX) are bypassed; the package was translated as if compiled with `-DXXH_VECTOR=0`. Output is bit-exact with the upstream scalar build.

## Installation

Install from npm:

```bash
npm install ts-xxhash
```

Or install with your preferred package manager:

```bash
yarn add ts-xxhash
pnpm add ts-xxhash
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp xxhash.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-xxhash.git
```

## Importing

When installed from npm:

```typescript
import { XXH32, XXH64, XXH3_64bits, XXH3_128bits } from 'ts-xxhash';
```

When using the source file directly:

```typescript
import { XXH32, XXH64, XXH3_64bits, XXH3_128bits } from './xxhash.js';
```

### Quick example

```typescript
import { XXH32, XXH64, XXH3_64bits } from 'ts-xxhash';

const bytes = new TextEncoder().encode('Nobody inspects the spammish repetition');
const buf = { buf: bytes, off: 0 };

// XXH32 one-shot, seed = 0
const h32 = XXH32(buf, bytes.length, 0);
console.log(h32.toString(16));
// e2293b2f

// XXH64 one-shot, seed = 0n (bigint!)
const h64 = XXH64(buf, bytes.length, 0n);
console.log(h64.toString(16));
// 1865dc89b15c0c7c

// XXH3 64-bit one-shot, default secret + seed = 0
const h3 = XXH3_64bits(buf, bytes.length);
console.log(h3.toString(16));
// e8c2b94071e35cf2
```

Streaming use of the state-based API:

```typescript
import {
  XXH64_createState, XXH64_reset, XXH64_update, XXH64_digest, XXH64_freeState,
} from 'ts-xxhash';

const state = XXH64_createState();
XXH64_reset(state, 0n);

const part1 = new TextEncoder().encode('hello ');
const part2 = new TextEncoder().encode('world');
XXH64_update(state, { buf: part1, off: 0 }, part1.length);
XXH64_update(state, { buf: part2, off: 0 }, part2.length);

console.log(XXH64_digest(state).toString(16));
XXH64_freeState(state);
```

## Building

Unlike the original C version, ts-xxhash requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx xxhash.ts
```

Or with Deno:

```bash
deno run --allow-all xxhash.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild xxhash.ts --bundle --platform=node --outfile=dist/xxhash.js
```

## API summary

One-shot:

- `XXH32(input, len, seed: number): number`
- `XXH64(input, len, seed: bigint): bigint`
- `XXH3_64bits(input, len): bigint`
- `XXH3_64bits_withSeed(input, len, seed: bigint): bigint`
- `XXH3_64bits_withSecret(input, len, secret, secretSize): bigint`
- `XXH3_128bits(input, len): XXH128_hash_t`
- `XXH3_128bits_withSeed(input, len, seed: bigint): XXH128_hash_t`
- `XXH128(input, len, seed: bigint): XXH128_hash_t`

Streaming (paired with `*_createState` / `*_freeState` / `*_copyState`):

- `XXH32_reset / update / digest`
- `XXH64_reset / update / digest`
- `XXH3_64bits_reset[*] / update / digest`
- `XXH3_128bits_reset[*] / update / digest`

Canonical (big-endian) byte-array conversions:

- `XXH32_canonicalFromHash / XXH32_hashFromCanonical`
- `XXH64_canonicalFromHash / XXH64_hashFromCanonical`
- `XXH128_canonicalFromHash / XXH128_hashFromCanonical`

## Tests

The repository includes vectors derived from the upstream `xxhsum` reference. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/vectors.test.mjs` - reference vectors for XXH32, XXH64, XXH3-64, and XXH3-128 across boundary input sizes.

## Caveats

The following limitations from the original C version still apply:

- **xxHash is non-cryptographic.** It is a fast hash for content fingerprinting, hash-tables, and bulk-data deduplication, not for security. Do not use it for digital signatures, MACs, password hashing, or any integrity check that must withstand an active adversary.
- **Seed/secret semantics are unchanged.** XXH64/XXH3 seeds are 64-bit (passed as `bigint`); the default 192-byte XXH3 secret is identical to the upstream constant; user-supplied secrets must satisfy the upstream's `XXH3_SECRET_SIZE_MIN` lower bound.
- **`XXH3_generateSecret_fromSeed` portable path only.** The upstream's SSE2 acceleration of `XXH3_generateSecret_fromSeed` is not available in this port; the translation follows the scalar / `-DXXH_VECTOR=0` build, which produces the same bytes but at scalar speed.
- **No file or stdin helper** - the upstream's `xxhsum` CLI utilities are not part of this package's public API; feed file contents via the streaming `*_update` path.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns; `*_freeState` is a no-op kept for API parity.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).
- **Endianness** - the upstream's portable byte-load helpers run identically on every JavaScript engine, regardless of host endianness.
- **Vector ISA selection** - `XXH_VECTOR` and friends do not apply; there is one portable scalar build.

## Acknowledgements

- [Yann Collet (Cyan4973)](https://github.com/Cyan4973) - original author of xxHash
- [xxHash contributors](https://github.com/Cyan4973/xxHash/graphs/contributors) - ongoing maintenance of the C library
