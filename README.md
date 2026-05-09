# ts-fastlz

A direct TypeScript translation of the lightning-fast lossless compression library.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

MIT License

> FastLZ (original C version) - Copyright (c) 2005-2020 Ariya Hidayat and FastLZ contributors
>
> ts-fastlz (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.

## Usage

This is a direct translation of FastLZ from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible.

To read more about FastLZ, please see the [original FastLZ repository](https://github.com/ariya/FastLZ).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, string handling, formatted I/O) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Native byte-array I/O** - input/output buffers are `Uint8Array`-backed CPtr objects (`{ buf: Uint8Array, off: number }`) rather than C `uint8_t*` pointers.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-fastlz
```

Or install with your preferred package manager:

```bash
yarn add ts-fastlz
pnpm add ts-fastlz
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp fastlz.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-fastlz.git
```

## Importing

When installed from npm:

```typescript
import { fastlz_compress, fastlz_compress_level, fastlz_decompress } from 'ts-fastlz';
```

When using the source file directly:

```typescript
import { fastlz_compress, fastlz_compress_level, fastlz_decompress } from './fastlz.js';
```

### Quick example

```typescript
import { fastlz_compress, fastlz_decompress } from 'ts-fastlz';

const ptr = (data: Uint8Array) => ({ buf: data, off: 0 });

const input = new TextEncoder().encode('FastLZ roundtrip: '.repeat(20));
const compressed = new Uint8Array(Math.max(66, input.length * 2 + 16));
const cLen = fastlz_compress(ptr(input), input.length, ptr(compressed));

const output = new Uint8Array(input.length + 16);
const oLen = fastlz_decompress(ptr(compressed), cLen, ptr(output), output.length);

console.log(new TextDecoder().decode(output.subarray(0, oLen)) === new TextDecoder().decode(input));
// true
```

## Building

Unlike the original C version, ts-fastlz requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx fastlz.ts
```

Or with Deno:

```bash
deno run --allow-all fastlz.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild fastlz.ts --bundle --platform=node --outfile=dist/fastlz.js
```

## Pointer convention

All `input` and `output` parameters are CPtr objects of the shape `{ buf: Uint8Array, off: number }`, mirroring C pointer semantics. Use `off` to point past a buffer prefix without copying. Allocate output buffers conservatively: FastLZ requires the destination to be at least `max(66, ceil(1.05 * input_length))` bytes.

## Tests

The repository includes the upstream FastLZ reference vectors and the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - round-trip compression/decompression vectors over text and binary inputs.

## Caveats

The following limitations from the original C version still apply:

- **Not for already-compressed data** - FastLZ targets data with repetition (text, raw pixels). Compressing images, video, or already-compressed payloads typically yields no size reduction.
- **Compression ratio trade-off** - FastLZ optimises for speed over ratio. zlib/zstd will compress the same input more aggressively at the cost of throughput.
- **Output buffer sizing** - the destination buffer for compression must be at least `max(66, ceil(1.05 * input_length))` bytes; the caller is responsible for allocating it.
- **Block format compatibility** - bytes produced by `fastlz_compress` are interchangeable with the upstream C library; mixing levels 1 and 2 within a stream is unsupported.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Ariya Hidayat](https://github.com/ariya) - original author of FastLZ
- [FastLZ contributors](https://github.com/ariya/FastLZ/graphs/contributors) - ongoing maintenance of the C library
