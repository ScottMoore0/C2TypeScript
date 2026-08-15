# ts-fletcher

A direct TypeScript port of [lenniea/fletcher](https://github.com/lenniea/fletcher) — Fletcher's checksum (16-bit and 32-bit variants).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

Direct port of `fletcher.c` / `fletcher.h` by lenniea, MIT License.

The translated output is validated against canonical Fletcher-16 reference vectors from Wikipedia and the original 1982 paper.

## Why this exists

Fletcher's checksum (John G. Fletcher, 1982) is a position-aware checksum that catches all single-bit and most two-bit errors, like a CRC, but is faster to compute and simpler to implement. It is used in:

- **SCTP** (RFC 4960 — Adler-32 replaced it but legacy stacks use it)
- **OSPFv2** packet checksum (RFC 2328 §D.4)
- **UDP-Lite** (RFC 3828)
- **ZFS** L1 metadata checksums
- **IPX** (Novell)
- Many embedded protocols where simplicity matters more than CRC's collision strength

## Install

```bash
npm install ts-fletcher
```

## Usage

```typescript
import { fletcher16sum, fletcher16hex, fletcher32sum } from 'ts-fletcher';

fletcher16sum('abcde');             // 51440 (= 0xC8F0)
fletcher16hex('abcde');             // 'c8f0'

fletcher32sum('hello world');       // 32-bit checksum
```

## API surface

- `fletcher16sum(input: Uint8Array | string): number` — uint16 in `[0, 65535]`.
- `fletcher16hex(input): string` — 4-char lowercase hex.
- `fletcher32sum(input: Uint8Array | string): number` — uint32.
- `fletcher32hex(input): string` — 8-char hex.

`fletcher32` operates on 16-bit words; odd-length inputs are padded with a trailing zero internally.

## Reference values

| Input | Fletcher-16 |
|---|---|
| `""` | `0000` |
| `"abcde"` | `c8f0` |
| `"abcdef"` | `2057` |
| `"abcdefgh"` | `0627` |

Run:
```bash
npm test
```

## Caveats

- **Not cryptographic.** Easily forgeable. Use SHA-256 (`ts-sha2`) for adversarial integrity.
- **Variants exist.** Fletcher-16 with mod-255 (RFC 1146) vs mod-256 (faster, weaker) vs Wikipedia's "two-byte" form. This package uses the **mod-255** variant — the same as RFC 1146 — matching the upstream's reference behaviour.
- **Adler-32 is a Fletcher variant.** If you want zlib-compatible checksumming, use [ts-adler32](https://github.com/ScottMoore0/ts-adler32) instead.

## License

MIT. Original C by lenniea under MIT.

## See also

- [ts-adler32](https://github.com/ScottMoore0/ts-adler32) — Adler-32 (RFC 1950, zlib's chosen variant)
- [ts-crc16](https://github.com/ScottMoore0/ts-crc16), [ts-crc32](https://github.com/ScottMoore0/ts-crc32), [ts-crc32c](https://github.com/ScottMoore0/ts-crc32c) — CRC variants
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
