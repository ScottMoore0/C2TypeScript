# ts-sha1

A direct TypeScript port of Brad Conte's SHA-1 reference implementation.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [B-Con/crypto-algorithms](https://github.com/B-Con/crypto-algorithms) (`sha1.c`, `sha1.h`) by Brad Conte. The upstream source is in the public domain.

The translated output is validated against RFC 3174 §7.3 reference vectors, including the canonical 1-million-`'a'` vector.

## Why this exists

SHA-1 is deprecated for cryptographic use but is still pervasive in real-world systems: git object hashing, legacy TLS certificate fingerprints, PGP signatures, Subversion, JWS `RS1`, HMAC-SHA1 in HTTP authentication, OAuth 1.0a, and many checksumming workflows. `ts-sha1` is a direct mechanical translation from Brad Conte's well-known C reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the spec is inspectable.

## Install

```bash
npm install ts-sha1
```

## Usage

```typescript
import { sha1, sha1Hex, Sha1 } from 'ts-sha1';

// One-shot, returns Uint8Array(20)
sha1('abc');                   // Uint8Array(20)
sha1Hex('abc');                // 'a9993e364706816aba3e25717850c26c9cd0d89d'

// Raw bytes also accepted
sha1Hex(new Uint8Array([0x61, 0x62, 0x63]));  // SHA-1 of bytes "abc"

// Streaming, useful for large messages
const h = new Sha1();
h.update('The quick brown fox ');
h.update('jumps over the lazy dog');
h.hexDigest();   // '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12'
```

Strings are encoded as UTF-8 before hashing.

## API surface

- `sha1(input: Uint8Array | string): Uint8Array` — one-shot SHA-1, returns a 20-byte digest.
- `sha1Hex(input: Uint8Array | string): string` — same, returns 40-character lowercase hex.
- `class Sha1` — incremental API:
  - `new Sha1()` — initialise a fresh hashing state.
  - `.update(chunk: Uint8Array | string): this` — feed a message chunk.
  - `.digest(): Uint8Array` — finalise and return the 20-byte digest.
  - `.hexDigest(): string` — same, as a hex string.
- `SHA1_DIGEST_SIZE = 20` — exported constant.

A `Sha1` instance is single-use: once `digest()` / `hexDigest()` has been called, further `update()`s throw.

## Reference vectors

The package's test suite asserts against these RFC 3174 / FIPS 180-4 vectors:

| Input | SHA-1 |
|---|---|
| `""` | `da39a3ee5e6b4b0d3255bfef95601890afd80709` |
| `"abc"` | `a9993e364706816aba3e25717850c26c9cd0d89d` |
| 448-bit `"abcdbcde..."` | `84983e441c3bd26ebaae4aa1f95129e5e54670f1` |
| `"The quick brown fox..."` | `2fd4e1c67a2d28fced849ee1bb76e7391b93eb12` |
| `"a"` × 1 000 000 | `34aa973cd4c4daa4f61eeb2bdbad27316534016f` |

Run:
```bash
npm test
```

## Caveats

- **SHA-1 is cryptographically broken.** Practical chosen-prefix collisions (SHA-1 SHAttered 2017, SHA-1 SHAmbles 2020) have been demonstrated. Do not use SHA-1 for new signatures, digital identity, code-signing, or password hashing. For new code that needs a cryptographic hash, use `ts-sha2` (SHA-256) instead.
- **Legitimate uses remain.** SHA-1 is still the right answer when you need to interoperate with an existing protocol that mandates it (git, legacy PGP, HMAC-SHA1, etc.) or when you need a fast non-cryptographic checksum where its collision resistance is irrelevant.
- **Not constant-time.** This is a direct reference translation; the JavaScript runtime adds further timing variability. Don't use it where side channels matter.

## License

Unlicense / public domain. Original C by Brad Conte. TypeScript translation also released into the public domain. See the `LICENSE` file for the upstream acknowledgement.

## See also

- [ts-sha2](https://github.com/ScottMoore0/ts-sha2) — SHA-256 (FIPS 180-4), use instead of SHA-1 for new code
- [ts-md5](https://github.com/ScottMoore0/ts-md5) — MD5 (RFC 1321), legacy compatibility
- [ts-siphash](https://github.com/ScottMoore0/ts-siphash) — keyed PRF for DoS-resistant hashtables
- [ts-murmur3](https://github.com/ScottMoore0/ts-murmur3), [ts-xxhash](https://github.com/ScottMoore0/ts-xxhash), [ts-fnv-hash](https://github.com/ScottMoore0/ts-fnv-hash) — non-cryptographic hashes
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
