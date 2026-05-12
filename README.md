# ts-sha512

A direct TypeScript port of WjCryptLib's SHA-512 reference implementation (FIPS 180-4).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [WaterJuice/WjCryptLib](https://github.com/WaterJuice/WjCryptLib) (`WjCryptLib_Sha512.c`, `WjCryptLib_Sha512.h`). The upstream library is in the public domain under the Unlicense.

The translated output is validated against the NIST FIPS 180-4 / RFC 6234 reference vectors, including the canonical 1-million-`'a'` long test.

## Why this exists

SHA-512 is the recommended cryptographic hash function for new code that needs a digest wider than 256 bits, and is widely used in TLS (HMAC-SHA384), JWT (`HS512`, `RS512`, `PS512`), PGP key fingerprinting, signatures (Ed25519ph), passphrase-derived keys, and modern protocol design. Despite being slower than SHA-256 on 32-bit JavaScript, on 64-bit native it's faster (8-byte words throughput). `ts-sha512` is a direct mechanical translation from WjCryptLib's well-known C reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the spec is inspectable.

## Install

```bash
npm install ts-sha512
```

## Usage

```typescript
import { sha512, sha512Hex, Sha512 } from 'ts-sha512';

// One-shot, returns Uint8Array(64)
sha512('abc');
sha512Hex('abc');  // 'ddaf35a193617aba...54ca49f'

// Streaming
const h = new Sha512();
h.update('The quick brown fox ');
h.update('jumps over the lazy dog');
h.hexDigest();
```

## API surface

- `sha512(input: Uint8Array | string): Uint8Array` — one-shot SHA-512, returns a 64-byte digest.
- `sha512Hex(input): string` — same, returns 128-character lowercase hex.
- `class Sha512` — incremental API (`.update()`, `.digest()`, `.hexDigest()`).
- `SHA512_DIGEST_SIZE = 64` — exported constant.

A `Sha512` instance is single-use: after `digest()`/`hexDigest()`, further `update()`s throw.

## Reference vectors

The package's test suite asserts against:

| Source | Input | Status |
|---|---|---|
| FIPS 180-4 / RFC 6234 | `""` | ✓ |
| FIPS 180-4 §C.1 | `"abc"` | ✓ |
| FIPS 180-4 §C.2 | 112-char "abcdefgh..." | ✓ |
| Common reference | "The quick brown fox..." | ✓ |
| FIPS 180-4 §C.3 (long) | `"a"` × 1 000 000 | ✓ |

Run:
```bash
npm test
```

## Caveats

- **Not constant-time.** This is a direct reference translation; the JavaScript runtime adds further timing variability. Don't use it where side channels matter.
- **No HMAC included.** For HMAC-SHA512, wrap this in the standard HMAC construction (or use Node's built-in `crypto.createHmac('sha512', key)`).
- **Performance.** SHA-512's 64-bit word arithmetic is handled via BigInt-aware operations in TypeScript; if you need maximum speed and you're on a recent Node, prefer `crypto.createHash('sha512')` which uses native OpenSSL.

## License

Unlicense / public domain. Original C by WaterJuice. TypeScript translation also released into the public domain.

## See also

- [ts-sha2](https://github.com/ScottMoore0/ts-sha2) — SHA-256 (32-bit cousin, faster on 32-bit JS)
- [ts-sha1](https://github.com/ScottMoore0/ts-sha1) — SHA-1, deprecated but still needed for git/legacy
- [ts-md5](https://github.com/ScottMoore0/ts-md5) — MD5, cryptographically dead but useful for legacy interop
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
