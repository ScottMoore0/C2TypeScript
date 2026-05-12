# ts-crc8

A direct TypeScript port of libcrc's CRC-8 (Sensirion SHT75 variant, polynomial 0x31).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [lammertb/libcrc](https://github.com/lammertb/libcrc) `src/crc8.c` by Lammert Bies, MIT License.

## Why this exists

CRC-8 with polynomial 0x31 is used by Sensirion temperature/humidity sensors (SHT family), several 1-Wire device CRCs, and industrial sensor protocols. It is *not* the same as the Dallas/Maxim 1-Wire CRC-8 (which uses reflected polynomial 0x8C). When working with hardware that specifies "SHT75 CRC" or "Sensirion CRC", use this package.

## Install

```bash
npm install ts-crc8
```

## Usage

```typescript
import { crc8, crc8hex } from 'ts-crc8';

crc8('hello');             // uint8 in [0, 255]
crc8hex('hello');          // 2-char lowercase hex
crc8(new Uint8Array([0xde, 0xad]));   // raw bytes
```

## API surface

- `crc8(input: Uint8Array | string): number` — uint8 in `[0, 255]`.
- `crc8hex(input): string` — 2-character lowercase hex.
- `update_crc_8(crc, byte): number` — incremental byte-at-a-time update.

## Caveats

- **Not cryptographic.** 8-bit CRC is trivially forgeable. Use only for transport-layer integrity.
- **CRC-8 has many variants.** This is the Sensirion SHT (poly 0x31, init 0x00) variant. If your protocol specifies a different polynomial or init value, this is the wrong package.

## License

MIT. Original C by Lammert Bies under MIT.

## See also

- [ts-crc16](https://github.com/ScottMoore0/ts-crc16) — five CRC-16 variants
- [ts-crc32](https://github.com/ScottMoore0/ts-crc32) — CRC-32 (IEEE 802.3)
- [ts-crc32c](https://github.com/ScottMoore0/ts-crc32c) — CRC-32C (Castagnoli)
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
