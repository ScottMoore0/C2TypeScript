# ts-murmur3

A direct TypeScript translation of MurmurHash3 by Austin Appleby (public domain).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of the MurmurHash3 implementation in [aappleby/smhasher](https://github.com/aappleby/smhasher), Austin Appleby's reference suite. The upstream author placed the C source in the public domain.

The translated output is validated against well-known reference vectors for the `x86_32` variant from SMHasher's verification suite, plus standard reference vectors for the `x86_128` and `x64_128` variants.

## Why this exists

MurmurHash3 is a widely-used non-cryptographic hash, found in Cassandra, Redis modules, ScyllaDB, log aggregators, deduplication systems, and many bloom-filter / count-min-sketch implementations. The TypeScript ecosystem has a handful of MurmurHash3 ports of varying quality; `ts-murmur3` is a direct mechanical translation from Austin Appleby's C reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the spec is inspectable.

## Install

```bash
npm install ts-murmur3
```

## Usage

```typescript
import { murmur3_x86_32, murmur3_x86_128, murmur3_x64_128, toHex } from 'ts-murmur3';

// 32-bit hash, fast on 32-bit platforms
murmur3_x86_32('Hello, world!');                    // 0xc0363e43
murmur3_x86_32('Hello, world!', 0x9747b28c);        // 0x24884cba

// 128-bit hash, 32-bit-optimised internals
toHex(murmur3_x86_128('Hello, world!'));            // 32-char hex digest

// 128-bit hash, 64-bit-optimised internals (recommended on 64-bit)
toHex(murmur3_x64_128('Hello, world!'));            // 32-char hex digest

// Raw bytes also accepted
const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
murmur3_x86_32(bytes);                              // hash of the 4 bytes
```

Strings are encoded as UTF-8 before hashing. To hash arbitrary byte content, pass a `Uint8Array`.

## API surface

- `murmur3_x86_32(input, seed = 0): number` — 32-bit hash, returns a number in `[0, 2^32)`
- `murmur3_x86_128(input, seed = 0): Uint8Array` — 128-bit hash, returns 16 bytes (little-endian)
- `murmur3_x64_128(input, seed = 0): Uint8Array` — 128-bit hash, recommended on 64-bit platforms
- `toHex(bytes: Uint8Array): string` — lower-case hex string helper

`seed` is a 32-bit unsigned integer. Values are taken mod 2³².

## Variant choice

- **`x86_32`** — fastest, smallest output. Use for hashtable bucketing on 32-bit hash keys.
- **`x86_128`** — 128-bit output, mixed using 32-bit operations. Faster than `x64_128` on 32-bit-only platforms.
- **`x64_128`** — 128-bit output, mixed using 64-bit operations. **Recommended for new code** unless you have a specific reason to use one of the others. Produces *different* hash values from `x86_128` on the same input.

Each variant produces a different digest. Two different variants (e.g. `x86_32` vs. `x64_128`'s first 4 bytes) are not compatible.

## Reference vectors

The package's test suite asserts against these values:

| Variant | Input | Seed | Expected |
|---|---|---|---|
| x86_32 | `""` | 0 | `0x00000000` |
| x86_32 | `""` | 1 | `0x514e28b7` |
| x86_32 | `""` | 0xffffffff | `0x81f16f39` |
| x86_32 | `"\0\0\0\0"` | 0 | `0x2362f9de` |
| x86_32 | `"aaaa"` | 0x9747b28c | `0x5a97808a` |
| x86_32 | `"abcd"` | 0x9747b28c | `0xf0478627` |
| x86_32 | `"Hello, world!"` | 0x9747b28c | `0x24884cba` |
| x64_128 | `""` | 0 | all-zero |
| x64_128 | `"test"` | 0 | `9de1bd74cc287dac824dbdf93182129a` |
| x86_128 | `""` | 0 | all-zero |

Run:
```bash
npm test
```

## Caveats

- **Not cryptographic.** MurmurHash3 is a *non-cryptographic* hash. Do not use it for HMAC, password hashing, signatures, or any DoS-resistance use case. For DoS resistance see SipHash (`ts-siphash`); for cryptographic hashing see SHA-2 (`ts-sha2`).
- **Variant non-interchangeability.** Different variants (`x86_32`, `x86_128`, `x64_128`) produce different outputs for the same input. Pick one and stick with it for any persistent index.
- **Endianness.** Output bytes are emitted in little-endian order, matching the reference C implementation on x86 / x86-64.
- **Performance.** Direct port of a clear C reference, not an optimised TypeScript implementation. For latency-sensitive workloads consider the native `node:crypto` non-cryptographic hashes or a JIT-friendly hand-rewrite.

## License

MIT. Translated from Austin Appleby's public-domain MurmurHash3.
See the `LICENSE` file for details.

## See also

- [ts-sha2](https://github.com/ScottMoore0/ts-sha2) — cryptographic hashing (SHA-256)
- [ts-siphash](https://github.com/ScottMoore0/ts-siphash) — keyed PRF for DoS-resistant hashtables
- [ts-xxhash](https://github.com/ScottMoore0/ts-xxhash) — alternative fast non-cryptographic hash
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
