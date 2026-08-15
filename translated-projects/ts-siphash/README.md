# ts-siphash

A direct TypeScript translation of the SipHash-2-4 keyed pseudorandom function.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

CC0 1.0 Universal (Public Domain Dedication). The upstream is also available under MIT and Apache 2.0; this package follows the upstream CC0 dedication.

> SipHash (original C version) - Copyright (c) 2012-2022 Jean-Philippe Aumasson and Copyright (c) 2012-2014 Daniel J. Bernstein, dedicated to the public domain via CC0 1.0
>
> ts-siphash (direct TypeScript translation) - Copyright (c) 2026 Scott Moore, also released under CC0 1.0
>
> The person who associated a work with this deed has dedicated the work to the public domain by waiving all of his or her rights to the work worldwide under copyright law, including all related and neighboring rights, to the extent allowed by law.
>
> You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission. See the full text at https://creativecommons.org/publicdomain/zero/1.0/legalcode.

## Usage

This is a direct translation of SipHash from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible.

To read more about SipHash, please see the [original SipHash repository](https://github.com/veorq/SipHash).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, byte-level I/O) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.
- **CPtr buffer convention** - C `const void *` / `uint8_t *` parameters become `{ buf: Uint8Array; off: number }` objects, preserving the original pointer-arithmetic semantics at the call site.

## Installation

Install from npm:

```bash
npm install ts-siphash
```

Or install with your preferred package manager:

```bash
yarn add ts-siphash
pnpm add ts-siphash
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp siphash.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-siphash.git
```

## Importing

When installed from npm:

```typescript
import { siphash } from 'ts-siphash';
```

When using the source file directly:

```typescript
import { siphash } from './siphash.js';
```

### Quick example

```typescript
import { siphash } from 'ts-siphash';

// 16-byte key (must be exactly 16 bytes for SipHash-2-4)
const key = new Uint8Array(16);
for (let i = 0; i < 16; i++) key[i] = i;

// Message bytes
const msg = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

// Output buffer: 8 bytes for SipHash-64, 16 bytes for SipHash-128.
const out = new Uint8Array(8);

siphash(
  { buf: msg, off: 0 },          // input
  msg.length,                    // input length
  { buf: key, off: 0 },          // 16-byte key
  { buf: out, off: 0 },          // output buffer
  8                              // outlen: 8 (64-bit) or 16 (128-bit)
);

console.log(Buffer.from(out).toString('hex'));
// 93f5f5799a932462 (SipHash-2-4 of bytes 0..7 under key 0..15)
```

`siphash` returns `0` on success.

## Building

Unlike the original C version, ts-siphash requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx siphash.ts
```

Or with Deno:

```bash
deno run --allow-all siphash.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild siphash.ts --bundle --platform=node --outfile=dist/siphash.js
```

## API

```typescript
function siphash(
  input: { buf: Uint8Array; off: number },
  inlen: number,
  key: { buf: Uint8Array; off: number },
  output: { buf: Uint8Array; off: number },
  outlen: number
): number;
```

`outlen` must be `8` (SipHash-64) or `16` (SipHash-128). The key must be exactly 16 bytes. SipHash uses 64-bit arithmetic internally; the translation uses `BigInt`-shaped intermediates to preserve bit-exact results across all message lengths.

## Tests

The repository includes the upstream `vectors.h` test data plus the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/vectors.test.mjs` - 64 reference SipHash-2-4 vectors (64-bit and 128-bit) from the upstream.

## Caveats

The following limitations from the original C version still apply:

- **Always use a secret key.** SipHash is a *keyed* PRF, not a general-purpose hash; without a secret key it offers no security. Do not use it as a substitute for SHA-256 or BLAKE3 in unkeyed contexts.
- **Key size is fixed at 128 bits.** Security is bounded by the 128-bit key (so an attacker searching `2^s` keys has chance `2^(s-128)` of success) and by the output size (an attacker blindly trying `2^s` tags wins with probability `2^(s-t)` for `t`-bit tags).
- **SipHash is not a hash in the keyless sense.** It is unsuitable as a content-address fingerprint or a general-purpose digest.
- **Output size must be 8 or 16.** Other `outlen` values are rejected by the reference; this constraint is preserved in the port.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).
- **Endianness** - the upstream's portable byte-load helpers run identically on every JavaScript engine, regardless of host endianness.

## Acknowledgements

- [Jean-Philippe Aumasson](https://github.com/veorq) - co-designer and original C author of SipHash
- [Daniel J. Bernstein](https://cr.yp.to) - co-designer of SipHash
- [SipHash contributors](https://github.com/veorq/SipHash/graphs/contributors) - ongoing maintenance of the C library
