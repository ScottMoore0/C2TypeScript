# ts-md5

A zero-dependency TypeScript port of the RFC 1321 MD5 reference implementation.

This package wraps the public-domain C implementation by Bryce Wilson, hosted at [Zunawe/md5-c](https://github.com/Zunawe/md5-c). It exposes the streaming `MD5Context` interface (`md5Init` / `md5Update` / `md5Finalize`) plus the convenience helper `md5String`.

## Security notice

**MD5 is cryptographically broken.** Practical collision attacks have been public since 2004 and chosen-prefix collisions since 2007. Do not use MD5 for:

- Digital signatures or certificate fingerprints
- Password hashing (use Argon2id, scrypt, or bcrypt)
- Integrity checking against an active adversary
- Any new security-sensitive design

MD5 remains usable for non-cryptographic checksums, legacy interop with systems that already speak MD5, and content fingerprinting where collision resistance is not a security requirement. For new cryptographic work prefer SHA-256 (FIPS 180-4) or BLAKE3.

## Installation

```
npm install ts-md5
```

## Usage

```ts
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

The `{ buf, off }` shape mirrors the C side's `const uint8_t *` / `uint8_t *` semantics. `buf` is a `Uint8Array` and `off` is the starting byte offset (use `0` unless you want to start mid-buffer). The output buffer must be at least 16 bytes.

## Test vectors (RFC 1321)

```
md5("")                 = d41d8cd98f00b204e9800998ecf8427e
md5("a")                = 0cc175b9c0f1b6a831c399e269772661
md5("abc")              = 900150983cd24fb0d6963f7d28e17f72
md5("message digest")   = f96b697d7cb7938d525a2f31aaf161d0
```

## API

```ts
class MD5Context {
  size: number;
  buffer: number[];                          // 4 x uint32 state
  input: { buf: Uint8Array; off: number };   // 64-byte block buffer
  digest: { buf: Uint8Array; off: number };  // 16-byte output digest
}

function md5Init(ctx: MD5Context): void;
function md5Update(
  ctx: MD5Context,
  input: { buf: Uint8Array; off: number },
  inputLen: number
): void;
function md5Finalize(ctx: MD5Context): void;
function md5Step(buffer: any, input: any): void;
function md5String(
  input: { buf: Uint8Array; off: number },
  result: { buf: Uint8Array; off: number }
): void;
function rotateLeft(x: number, n: number): number;
```

After `md5Finalize` returns, `ctx.digest.buf` holds the 16-byte MD5 digest.

`md5String` reads a NUL-terminated input (matching the upstream C signature) and writes the 16-byte digest to `result.buf`.

## License

[The Unlicense](./LICENSE) (public domain dedication).

This is a mechanical translation of the upstream C reference. Bridge markers (`// BRIDGE: ...`) in the source mark places where C-specific concepts (pointers, sized integers, struct layout) are modeled in TypeScript.

## Source

- Upstream C: [Zunawe/md5-c](https://github.com/Zunawe/md5-c) (Public Domain, by Bryce Wilson)
- This port: TypeScript translation, copyright (c) 2026 Scott Moore (Unlicense)
