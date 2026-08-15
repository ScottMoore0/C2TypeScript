# ts-chibi-base64

A direct TypeScript translation of a fast base64 encoder/decoder, taken from [chibi-scheme's `lib/chibi/base64.c`](https://github.com/ashinn/chibi-scheme/blob/master/lib/chibi/base64.c) by Alex Shinn.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [NibbleAndAHalf base64](https://github.com/superwills/NibbleAndAHalf), the original C library by William Sherif. The translation tracks the upstream's `master` branch as of publication.

License terms are inherited from the upstream — see `## License` below.

## License

BSD 3-Clause License

> base64 (chibi-scheme original C version) - Copyright (c) 2009-2021 Alex Shinn
>
> ts-chibi-base64 (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> All rights reserved.
>
> Redistribution and use in source and binary forms, with or without
> modification, are permitted provided that the following conditions
> are met:
>
> 1. Redistributions of source code must retain the above copyright
>    notice, this list of conditions and the following disclaimer.
>
> 2. Redistributions in binary form must reproduce the above copyright
>    notice, this list of conditions and the following disclaimer in the
>    documentation and/or other materials provided with the distribution.
>
> 3. The name of the author may not be used to endorse or promote products
>    derived from this software without specific prior written permission.
>
> THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
> IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
> OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
> IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
> INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
> NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
> DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
> THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
> (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
> THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Usage

This is a direct translation of a base64 codec from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible.

To read more about the upstream chibi-scheme base64 implementation, please see [chibi-scheme on GitHub](https://github.com/ashinn/chibi-scheme).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, string handling, formatted I/O) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`. Output buffers are still caller-allocated `Uint8Array`s, sized via `b64e_size` / `b64d_size`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **CPtr-style I/O** - input and output buffers are `{ buf: Uint8Array, off: number }` views rather than C `unsigned char *` pointers.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-chibi-base64
```

Or install with your preferred package manager:

```bash
yarn add ts-chibi-base64
pnpm add ts-chibi-base64
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp base64.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-chibi-base64.git
```

## Importing

When installed from npm:

```typescript
import { b64_encode, b64_decode, b64e_size, b64d_size } from 'ts-chibi-base64';
```

When using the source file directly:

```typescript
import { b64_encode, b64_decode, b64e_size, b64d_size } from './base64.js';
```

### Quick example

```typescript
import { b64_encode, b64e_size } from 'ts-chibi-base64';

const input = new TextEncoder().encode('Hello');           // 5 bytes
const output = new Uint8Array(b64e_size(input.length));
const written = b64_encode({ buf: input, off: 0 }, input.length, { buf: output, off: 0 });

console.log(new TextDecoder().decode(output.subarray(0, written))); // SGVsbG8=
```

Decode round-trip:

```typescript
import { b64_decode, b64d_size } from 'ts-chibi-base64';

const enc = new TextEncoder().encode('SGVsbG8=');
const dec = new Uint8Array(b64d_size(enc.length));
const n = b64_decode({ buf: enc, off: 0 }, enc.length, { buf: dec, off: 0 });
console.log(new TextDecoder().decode(dec.subarray(0, n))); // Hello
```

## Building

Unlike the original C version, ts-chibi-base64 requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx base64.ts
```

Or with Deno:

```bash
deno run --allow-all base64.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild base64.ts --bundle --platform=node --outfile=dist/base64.js
```

## API

| Function | Description |
|----------|-------------|
| `b64_encode(in, in_len, out)` | Encodes `in_len` bytes from `in` (CPtr) as base64 into `out` (CPtr). Returns the number of bytes written. |
| `b64_decode(in, in_len, out)` | Decodes `in_len` bytes of base64 from `in` (CPtr) into `out` (CPtr). Returns the number of bytes written. |
| `b64e_size(in_size)` | Returns the maximum encoded length for `in_size` raw bytes. |
| `b64d_size(in_size)` | Returns the maximum decoded length for `in_size` base64 bytes. |
| `b64_int(ch)` | Maps an ASCII byte to its base64 alphabet index (0..63), or a sentinel for non-alphabet bytes. |
| `b64_encodef`, `b64_decodef` | File-stream variants from the upstream. |
| `b64_chr` | The 64-byte base64 alphabet table as a CPtr. |

All buffer parameters are CPtr objects: `{ buf: Uint8Array, off: number }`.

## Tests

The repository includes the chibi-base64 reference vectors and the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - encode / decode round-trip vectors and edge cases (empty input, padding, alphabet boundary).

## Caveats

The following limitations from the upstream C version still apply:

- **Caller-allocated output** - `b64_encode` / `b64_decode` write into a buffer the caller has sized via `b64e_size` / `b64d_size`. Under-sizing the destination corrupts memory in C; in this port it produces a `RangeError`.
- **No streaming API for arbitrary input** - the buffered functions consume an entire input in one call. The `b64_encodef` / `b64_decodef` variants drive a stream-style loop but still expect the underlying source to be readable end-to-end.
- **Standard alphabet only** - the upstream uses RFC 4648 base64 (`A-Z`, `a-z`, `0-9`, `+`, `/`, `=` padding). URL-safe base64 (`-`, `_`) and base64url-without-padding are not built in.
- **No integrity check helper** - there is no `base64integrity`-style validator in the chibi-scheme upstream. Validate base64 well-formedness on your own (regex, length-mod-4, etc.) if needed.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Alex Shinn](https://github.com/ashinn) - author of chibi-scheme, whose `lib/chibi/base64.c` is the upstream this package translates.
- [chibi-scheme contributors](https://github.com/ashinn/chibi-scheme/graphs/contributors) - ongoing maintenance of the C library.
