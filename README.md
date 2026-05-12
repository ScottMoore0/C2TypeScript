# ts-md2

A direct TypeScript port of Brad Conte's MD2 reference implementation (RFC 1319).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [B-Con/crypto-algorithms](https://github.com/B-Con/crypto-algorithms) (`md2.c`, `md2.h`) by Brad Conte. The upstream source is in the public domain.

The translated output is validated against all RFC 1319 §A.5 reference test vectors.

## Why this exists

MD2 is **obsolete and cryptographically broken** — RFC 6149 deprecated it in 2011. But it still appears in archived data formats, old PKCS#1 v1.5 signatures, the original X.509 certificate hash, very old PGP keys, and other legacy material that occasionally needs to be read or verified. `ts-md2` is a direct mechanical translation from Brad Conte's well-known C reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the spec is inspectable.

## Install

```bash
npm install ts-md2
```

## Usage

```typescript
import { md2, md2Hex, Md2 } from 'ts-md2';

md2('abc');                         // Uint8Array(16)
md2Hex('abc');                      // 'da853b0d3f88d99b30283a69e6ded6bb'

// Streaming
const h = new Md2();
h.update('mess'); h.update('age '); h.update('digest');
h.hexDigest();                      // 'ab4f496bfb2a530b219ff33031fe06b0'
```

Strings are encoded as UTF-8 before hashing.

## API surface

- `md2(input: Uint8Array | string): Uint8Array` — one-shot MD2, returns a 16-byte digest.
- `md2Hex(input): string` — hex form, 32 lowercase characters.
- `class Md2` — incremental hashing:
  - `.update(chunk: Uint8Array | string): this`
  - `.digest(): Uint8Array`
  - `.hexDigest(): string`
- `MD2_DIGEST_SIZE = 16` — exported constant.

## Reference vectors

The package's test suite asserts against all seven RFC 1319 §A.5 vectors:

| Input | MD2 |
|---|---|
| `""` | `8350e5a3e24c153df2275c9f80692773` |
| `"a"` | `32ec01ec4a6dac72c0ab96fb34c0b5d1` |
| `"abc"` | `da853b0d3f88d99b30283a69e6ded6bb` |
| `"message digest"` | `ab4f496bfb2a530b219ff33031fe06b0` |
| `"abc…xyz"` | `4e8ddff3650292ab5a4108c3aa47940b` |
| `"ABC…XYZabc…xyz0…9"` | `da33def2a42df13975352846c30338cd` |
| 80 digits | `d5976f79d83d3a0dc9806c3c66f3efd8` |

Run:
```bash
npm test
```

## Caveats

- **MD2 is obsolete and cryptographically broken.** Practical preimage attacks have been published. Never use it for new signatures, integrity protection, or content addressing. For new code that needs a cryptographic hash, use `ts-sha2` (SHA-256) instead.
- **Use case is narrow.** The only good reasons to reach for MD2 today: verifying signatures on archived data from a system that used MD2, decoding very-old PKCS#1 v1.5 SignerInfo blocks, or interoperating with a legacy embedded protocol you can't change.

## License

Unlicense / public domain. Original C by Brad Conte. TypeScript translation also released into the public domain. See the `LICENSE` file for the upstream acknowledgement.

## See also

- [ts-sha2](https://github.com/ScottMoore0/ts-sha2) — SHA-256, the recommended modern cryptographic hash
- [ts-sha1](https://github.com/ScottMoore0/ts-sha1) — SHA-1 for git / legacy interop
- [ts-md5](https://github.com/ScottMoore0/ts-md5) — MD5 (less broken than MD2 but still cryptographically dead)
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
