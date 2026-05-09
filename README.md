# ts-md5

A direct TypeScript translation of the RFC 1321 reference MD5 hash.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

The Unlicense (public domain dedication).

> md5-c (original C version) - Copyright (c) Bryce Wilson and md5-c contributors
>
> ts-md5 (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> This is free and unencumbered software released into the public domain.
>
> Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.
>
> In jurisdictions that recognize copyright laws, the author or authors of this software dedicate any and all copyright interest in the software to the public domain. We make this dedication for the benefit of the public at large and to the detriment of our heirs and successors. We intend this dedication to be an overt act of relinquishment in perpetuity of all present and future rights to this software under copyright law.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
>
> For more information, please refer to <https://unlicense.org/>.

## Usage

This is a direct translation of md5-c from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible.

To read more about md5-c, please see the [original md5-c repository](https://github.com/Zunawe/md5-c).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, string handling) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.
- **CPtr buffer convention** - C `uint8_t *` parameters become `{ buf: Uint8Array; off: number }` objects so the original pointer-arithmetic semantics remain visible at the call site.

## Installation

Install from npm:

```bash
npm install ts-md5
```

Or install with your preferred package manager:

```bash
yarn add ts-md5
pnpm add ts-md5
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp md5.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-md5.git
```

## Importing

When installed from npm:

```typescript
import { MD5Context, md5Init, md5Update, md5Finalize, md5String } from 'ts-md5';
```

When using the source file directly:

```typescript
import { MD5Context, md5Init, md5Update, md5Finalize, md5String } from './md5.js';
```

### Quick example

```typescript
import { MD5Context, md5Init, md5Update, md5Finalize, md5String } from 'ts-md5';

// Convenience: one-shot string hashing.
const out = { buf: new Uint8Array(16), off: 0 };
md5String({ buf: new TextEncoder().encode('abc'), off: 0 }, out);
console.log(Buffer.from(out.buf).toString('hex'));
// 900150983cd24fb0d6963f7d28e17f72

// Streaming: feed the message in chunks.
const ctx = new MD5Context();
md5Init(ctx);
md5Update(ctx, { buf: new TextEncoder().encode('hello '), off: 0 }, 6);
md5Update(ctx, { buf: new TextEncoder().encode('world'),  off: 0 }, 5);
md5Finalize(ctx);
console.log(Buffer.from(ctx.digest.buf).toString('hex'));
// 5eb63bbbe01eeed093cb22bb8f5acdc3
```

Reference RFC 1321 vectors:

```
md5("")                = d41d8cd98f00b204e9800998ecf8427e
md5("a")               = 0cc175b9c0f1b6a831c399e269772661
md5("abc")             = 900150983cd24fb0d6963f7d28e17f72
md5("message digest")  = f96b697d7cb7938d525a2f31aaf161d0
```

## Building

Unlike the original C version, ts-md5 requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx md5.ts
```

Or with Deno:

```bash
deno run --allow-all md5.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild md5.ts --bundle --platform=node --outfile=dist/md5.js
```

## Data Structure

The C `struct MD5Context` has been translated to a TypeScript class with identical field names:

```typescript
class MD5Context {
  size: number;
  buffer: number[];                          // 4 x uint32 state
  input: { buf: Uint8Array; off: number };   // 64-byte block buffer
  digest: { buf: Uint8Array; off: number };  // 16-byte output digest
}
```

`md5Init`, `md5Update`, and `md5Finalize` operate on an `MD5Context` exactly as the C versions do; after `md5Finalize` returns, `ctx.digest.buf` holds the 16-byte MD5 digest. `md5String` is the convenience one-shot helper that mirrors the upstream C signature.

## Tests

The repository includes the RFC 1321 reference test vectors. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/vectors.test.mjs` - RFC 1321 vectors plus streaming-API regression tests.

## Caveats

The following limitations from the original C version still apply:

- **MD5 is cryptographically broken.** Practical collision attacks have been public since 2004 and chosen-prefix collisions since 2007. Do not use MD5 for digital signatures, certificate fingerprints, password hashing, or any integrity check that must withstand an active adversary. For new cryptographic work prefer SHA-256 (FIPS 180-4) or BLAKE3.
- **Reference quality, not hardened.** The upstream is described by its author as a teaching reference rather than production-hardened code; edge cases beyond the RFC 1321 vectors have not been exhaustively explored.
- **NUL-terminated string input** for `md5String` mirrors the C signature; when hashing arbitrary bytes use the streaming `md5Update` path.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).
- **File-pointer I/O** - the upstream `md5File(FILE *)` entry point is not part of this package's public API; feed file contents via `md5Update` instead.

## Acknowledgements

- [Bryce Wilson (Zunawe)](https://github.com/Zunawe) - original author of md5-c
- [md5-c contributors](https://github.com/Zunawe/md5-c/graphs/contributors) - ongoing maintenance of the C library
