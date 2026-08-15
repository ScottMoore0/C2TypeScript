# ts-tiny-aes

A direct TypeScript translation of the small portable tiny-AES-c implementation (AES-128/192/256 with ECB, CBC, and CTR modes).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [tiny-AES-c](https://github.com/kokke/tiny-AES-c), the original C library by kokke. The translation tracks the upstream's `master` branch as of publication.

License terms are inherited from the upstream — see `## License` below.

## License

The Unlicense (public domain dedication).

> tiny-AES-c (original C version) - Copyright (c) kokke and tiny-AES-c contributors, released into the public domain
>
> ts-tiny-aes (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
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

This is a direct translation of tiny-AES-c from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible.

To read more about tiny-AES-c, please see the [original tiny-AES-c repository](https://github.com/kokke/tiny-AES-c).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, byte-level I/O) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.
- **CPtr buffer convention** - C `uint8_t *` parameters become `{ buf: Uint8Array; off: number }` objects, mirroring the original pointer-arithmetic semantics; AES still operates strictly in place on the underlying `Uint8Array`.

## Installation

Install from npm:

```bash
npm install ts-tiny-aes
```

Or install with your preferred package manager:

```bash
yarn add ts-tiny-aes
pnpm add ts-tiny-aes
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp aes.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-tiny-aes.git
```

## Importing

When installed from npm:

```typescript
import {
  AES_ctx,
  AES_init_ctx, AES_init_ctx_iv, AES_ctx_set_iv,
  AES_ECB_encrypt, AES_ECB_decrypt,
  AES_CBC_encrypt_buffer, AES_CBC_decrypt_buffer,
  AES_CTR_xcrypt_buffer,
} from 'ts-tiny-aes';
```

When using the source file directly:

```typescript
import {
  AES_ctx,
  AES_init_ctx, AES_init_ctx_iv,
  AES_ECB_encrypt, AES_ECB_decrypt,
  AES_CBC_encrypt_buffer, AES_CBC_decrypt_buffer,
  AES_CTR_xcrypt_buffer,
} from './aes.js';
```

### Quick example

```typescript
import { AES_ctx, AES_init_ctx, AES_ECB_encrypt, AES_ECB_decrypt } from 'ts-tiny-aes';

const ptr = (data: Uint8Array) => ({ buf: data, off: 0 });

// NIST SP 800-38A AES-128 ECB test vector
const key = Uint8Array.of(
  0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
  0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c,
);
const block = Uint8Array.of(
  0x6b, 0xc1, 0xbe, 0xe2, 0x2e, 0x40, 0x9f, 0x96,
  0xe9, 0x3d, 0x7e, 0x11, 0x73, 0x93, 0x17, 0x2a,
);

const ctx = new AES_ctx();
AES_init_ctx(ctx, ptr(key));
AES_ECB_encrypt(ctx, ptr(block));
console.log(Buffer.from(block).toString('hex'));
// 3ad77bb40d7a3660a89ecaf32466ef97

AES_ECB_decrypt(ctx, ptr(block));
console.log(Buffer.from(block).toString('hex'));
// 6bc1bee22e409f96e93d7e117393172a (restored plaintext)
```

CBC and CTR mode examples follow the same shape; see the `tests/` directory for full NIST SP 800-38A vectors covering AES-128/192/256 with all three modes.

## Building

Unlike the original C version, ts-tiny-aes requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx aes.ts
```

Or with Deno:

```bash
deno run --allow-all aes.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild aes.ts --bundle --platform=node --outfile=dist/aes.js
```

## Data Structure

The C `struct AES_ctx` has been translated to a TypeScript class with identical field names:

```typescript
class AES_ctx {
  RoundKey: Uint8Array; // expanded round-key schedule
  Iv: Uint8Array;       // current IV (CBC advances this; CTR uses it as the counter base)
}
```

Construct with `new AES_ctx()`, then initialise via one of:

- `AES_init_ctx(ctx, key)` - expand `key` into `ctx.RoundKey`. No IV is set.
- `AES_init_ctx_iv(ctx, key, iv)` - same, plus copy the 16-byte `iv` into `ctx.Iv`.
- `AES_ctx_set_iv(ctx, iv)` - replace `ctx.Iv` without re-expanding the key.

Then call:

- `AES_ECB_encrypt(ctx, buf)` / `AES_ECB_decrypt(ctx, buf)` - single 16-byte block, in place. ECB does not use an IV.
- `AES_CBC_encrypt_buffer(ctx, buf, length)` / `AES_CBC_decrypt_buffer(ctx, buf, length)` - `length` must be a multiple of 16 bytes; encrypt advances `ctx.Iv` to the last cipher block, so re-initialise the context with the original IV before decrypting.
- `AES_CTR_xcrypt_buffer(ctx, buf, length)` - any length, in place; the same call performs both directions.

## Tests

The repository includes the NIST SP 800-38A reference vectors for AES-128/192/256 across ECB, CBC, and CTR modes. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/vectors.test.ts` - NIST SP 800-38A vectors plus regression tests for the IV-mutation contract.

## Caveats

The following limitations from the original C version still apply:

- **No padding.** For CBC and ECB all buffers must be a multiple of 16 bytes. Use [PKCS7](https://en.wikipedia.org/wiki/Padding_(cryptography)#PKCS7) padding at the application level if needed.
- **ECB is unsafe for most uses.** The upstream warns that ECB does not hide block-level patterns; do not use it as a confidentiality primitive on data wider than a single block.
- **No built-in error checking** or protection from out-of-bounds memory access on malicious input. The translation preserves this; validate sizes at the caller.
- **CBC encrypt mutates `ctx.Iv`.** After encrypting, `ctx.Iv` holds the last cipher block; re-initialise with the original IV before decrypting.
- **Never reuse an IV with the same key.** This is the standard AES-CBC / AES-CTR security requirement and is unchanged by the translation.
- **Key size is set at translation time.** This package was translated from the default AES-128 build of tiny-AES-c. AES-192 and AES-256 are reachable by editing the `AES192` / `AES256` flags in `aes.ts` (mirroring the `AES192` / `AES256` macros in the upstream `aes.h`).

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).
- **Code-size / ROM-budget tuning** - the upstream's emphasis on sub-1K ROM footprint targets embedded ARM/AVR; on a JavaScript runtime that constraint does not apply, but you can still tree-shake unused modes via `aes.ts` build flags.
- **C++ header (`aes.hpp`) variant** - the `extern "C"` wrapper from the C version is not needed; ES module imports work directly.

## Acknowledgements

- [kokke](https://github.com/kokke) - original C author of tiny-AES-c
- [tiny-AES-c contributors](https://github.com/kokke/tiny-AES-c/graphs/contributors) - ongoing maintenance of the C library
