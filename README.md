# ts-crc32c

A direct TypeScript port of a CRC-32C (Castagnoli) reference. Used by iSCSI, SCTP, Btrfs, RocksDB, Ceph, and many modern protocols.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [eloj/crc32c](https://github.com/eloj/crc32c) (`crc32c.c`, `crc32c.h`) by Eddy L O Jansson, MIT License. The upstream provides both SSE4.2-hardware-accelerated and pure-software CRC-32C paths; this port keeps **only the software fallback** since browsers / Node have no portable access to the SSE4.2 CRC32C instruction.

The translated output is validated against canonical reference values including RFC 3720 §A.4 (iSCSI Appendix A) and the universal `"123456789" → 0xE3069283` check value.

## Why this exists

CRC-32C uses the **Castagnoli polynomial** (`0x82F63B78` reflected) — a different polynomial from the older CRC-32-IEEE (`0xEDB88320`, used by zlib/gzip/PNG). Castagnoli proved that this polynomial has better error-detection properties for typical message lengths, and Intel added a hardware CRC32C instruction in SSE4.2 (2008). It is now the integrity checksum of choice in:

- **iSCSI** (RFC 3720, mandatory)
- **SCTP** (RFC 4960)
- **Btrfs**, **Ceph**, **RocksDB**, **ZFS**, **Cassandra**, **FoundationDB**, **EROFS**
- **FCoE** (Fibre Channel over Ethernet)

`ts-crc32c` is a direct mechanical translation from a small reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the algorithm is inspectable.

## Install

```bash
npm install ts-crc32c
```

## Usage

```typescript
import { crc32c, crc32cHex } from 'ts-crc32c';

// Numeric (uint32)
crc32c('123456789');               // 3815547011 (= 0xE3069283)

// Hex
crc32cHex('123456789');            // 'e3069283'

// Raw bytes
crc32cHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
```

## API surface

- `crc32c(input: Uint8Array | string): number` — returns an unsigned 32-bit integer.
- `crc32cHex(input: Uint8Array | string): string` — returns an 8-character lowercase hex string.

Both apply the standard CRC-32C initial value (`0xFFFFFFFF`) and final XOR (`~result`) internally; callers pass a raw buffer or string.

## Reference values

| Source | Input | CRC-32C |
|---|---|---|
| Canonical check | `"123456789"` | `0xE3069283` |
| RFC 3720 §A.4 | 32 bytes of `0x00` | `0x8A9136AA` |
| RFC 3720 §A.4 | 32 bytes of `0xFF` | `0x62A8AB43` |
| RFC 3720 §A.4 | 32 bytes of `0..31` | `0x46DD794E` |

Run:
```bash
npm test
```

## Caveats

- **Distinct from CRC-32.** CRC-32C is **not** the same algorithm as CRC-32 (IEEE 802.3, used by zlib/PNG/Ethernet). They use different polynomials and produce different outputs for the same input. If your protocol says "CRC-32 of...", check whether it means CRC-32-IEEE (`ts-crc32`) or CRC-32C — they are not interchangeable.
- **Not cryptographic.** CRC-32C is easily forgeable. Use SHA-256 (`ts-sha2`) when adversaries matter.
- **Software path only.** This port omits the SSE4.2 hardware path from the upstream. If you need maximum throughput, prefer a native binding to a CRC32C-NI implementation. For most JS use cases the software path is fine.

## License

MIT. Original C by Eddy L O Jansson under MIT.

## See also

- [ts-crc32](https://github.com/ScottMoore0/ts-crc32) — CRC-32 (IEEE 802.3), the zlib/PNG/Ethernet variant
- [ts-crc16](https://github.com/ScottMoore0/ts-crc16) — 5 CRC-16 variants
- [ts-adler32](https://github.com/ScottMoore0/ts-adler32) — Adler-32 (zlib/deflate)
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
