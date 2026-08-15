# ts-adler32

A direct TypeScript port of an Adler-32 reference implementation (RFC 1950).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [shixiongfei/adler32](https://github.com/shixiongfei/adler32) (`adler32.c`, `adler32.h`) by Xiongfei Shi, Apache License 2.0.

The translated output is validated against canonical Adler-32 reference values from RFC 1950 §9 plus the Wikipedia reference (`"Wikipedia"` → `0x11E60398`).

## Why this exists

Adler-32 is the integrity checksum used by **zlib / deflate / PNG** at the protocol level. Wherever a zlib stream appears (gzip, HTTP `Content-Encoding: deflate`, PNG `IDAT`, Git pack objects, ZIP entries with deflate), there's an Adler-32 at the end of the compressed stream. It is slightly faster than CRC-32 to compute in software (no table) and has a known weakness on very short inputs (use CRC-32 for short messages where every bit matters).

`ts-adler32` is a direct mechanical translation from a small reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the algorithm is inspectable.

## Install

```bash
npm install ts-adler32
```

## Usage

```typescript
import { adler32sum, adler32hex, adler32combine } from 'ts-adler32';

// Numeric
adler32sum('abc');                  // 38600999 (= 0x024D0127)

// Hex
adler32hex('abc');                  // '024d0127'

// Custom seed (continue from a previous Adler-32)
const a = adler32sum('Hello, ');
const b = adler32sum('World!', a);  // = adler32sum('Hello, World!')

// Combine two checksums of concatenated streams (zlib trick)
const fullByCombine = adler32combine(a, adler32sum('World!'), 'World!'.length);
```

## API surface

- `adler32sum(input: Uint8Array | string, seed?: number): number` — Adler-32, returns uint32. `seed` defaults to 1 per RFC 1950.
- `adler32hex(input, seed?): string` — 8-character lowercase hex.
- `adler32combine(adlerA: number, adlerB: number, lenB: number): number` — combine two checksums of concatenated buffers.
- `adler32roll(currentAdler, inByte, outByte, windowSize): number` — sliding-window rolling update.
- `ADLER32_INIT = 1` — exported constant.

## Reference values

The test suite asserts against these canonical Adler-32 values (matching zlib's `adler32()`):

| Input | Adler-32 |
|---|---|
| `""` | `00000001` |
| `"a"` | `00620062` |
| `"abc"` | `024d0127` |
| `"message digest"` | `29750586` |
| `"abcdefghijklmnopqrstuvwxyz"` | `90860b20` |
| `"The quick brown fox jumps over the lazy dog"` | `5bdc0fda` |
| `"Wikipedia"` (Wikipedia article example) | `11e60398` |

Run:
```bash
npm test
```

## Caveats

- **Not cryptographic.** Adler-32 is easily forged. Use SHA-256 (`ts-sha2`) when adversaries matter.
- **Weak on short inputs.** For inputs shorter than a few hundred bytes, prefer CRC-32 (`ts-crc32`) — Adler-32's error-detection guarantees are reduced for very short strings.
- **Used by zlib/PNG/Git.** If you're decoding/encoding a zlib stream, the trailer Adler-32 must match the original-data Adler-32 (not the compressed-data Adler-32).

## License

Apache 2.0. Original C by Xiongfei Shi under Apache 2.0.

## See also

- [ts-crc32](https://github.com/ScottMoore0/ts-crc32) — CRC-32 (IEEE 802.3), stronger for short inputs
- [ts-xxhash](https://github.com/ScottMoore0/ts-xxhash) — much faster non-cryptographic hash
- [ts-sha2](https://github.com/ScottMoore0/ts-sha2) — SHA-256 for cryptographic integrity
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
