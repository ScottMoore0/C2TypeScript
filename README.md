# ts-crc32

A direct TypeScript port of a tiny CRC-32 (IEEE 802.3) reference implementation.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [aeldidi/crc32](https://github.com/aeldidi/crc32) (`crc32.c`, `crc32.h`) by Ayman El Didi, released under CC0 1.0 (public domain dedication).

The translated output is validated against canonical CRC-32 reference values, including the well-known check value `CRC32("123456789") == 0xCBF43926`.

## Why this exists

CRC-32 with polynomial `0xEDB88320` is the most-deployed integrity checksum in the world — used inside zlib/gzip, PNG, ZIP archives, Ethernet frames, SCTP, MPEG-2 Transport Stream, JPEG, and the `crc32` built-ins of Python (`binascii.crc32`), Go (`hash/crc32` IEEE table), Java (`java.util.zip.CRC32`), Ruby (`Zlib.crc32`), Rust (`crc32fast`), and many others.

`ts-crc32` is a direct mechanical translation from a tiny CC0 C reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the algorithm is inspectable.

## Install

```bash
npm install ts-crc32
```

## Usage

```typescript
import { crc32sum, crc32hex } from 'ts-crc32';

// Numeric (uint32)
crc32sum('123456789');             // 3421780262 (= 0xCBF43926)

// Hex string
crc32hex('123456789');             // 'cbf43926'

// Raw bytes
crc32hex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
```

Strings are encoded as UTF-8 before hashing.

## API surface

- `crc32sum(input: Uint8Array | string): number` — returns an unsigned 32-bit integer.
- `crc32hex(input: Uint8Array | string): string` — returns an 8-character lowercase hex string.

## Reference values

The test suite asserts against:

| Input | CRC-32 |
|---|---|
| `""` | `00000000` |
| `"a"` | `e8b7be43` |
| `"abc"` | `352441c2` |
| `"message digest"` | `20159d7f` |
| `"abcdefghijklmnopqrstuvwxyz"` | `4c2750bd` |
| `"123456789"` (canonical check value) | `cbf43926` |
| `"The quick brown fox jumps over the lazy dog"` | `414fa339` |

Run:
```bash
npm test
```

## Caveats

- **Not cryptographic.** CRC-32 is a non-cryptographic integrity check, easily forgeable. Use SHA-256 (`ts-sha2`) when adversaries are in the threat model.
- **Algorithm variant.** This is the standard "IEEE 802.3" reflected CRC-32 with polynomial `0xEDB88320`. If you need CRC-32C (Castagnoli, polynomial `0x82F63B78`, used in iSCSI/SCTP/Btrfs/Ceph), this is the wrong package.
- **Performance.** Direct port of a byte-at-a-time reference. For high-throughput needs prefer Node's built-in `crypto.createHash('sha256')` for integrity or a slice-by-16 native implementation for raw CRC.

## License

CC0 1.0 (public domain). Original C by Ayman El Didi.

## See also

- [ts-sha2](https://github.com/ScottMoore0/ts-sha2) — SHA-256 for cryptographic integrity
- [ts-xxhash](https://github.com/ScottMoore0/ts-xxhash) — much faster non-cryptographic hash
- [ts-fnv-hash](https://github.com/ScottMoore0/ts-fnv-hash) — alternative non-cryptographic hash
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
