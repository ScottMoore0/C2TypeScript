# ts-crc16

A direct TypeScript port of the CRC-16 family from libcrc (5 variants: IBM/ARC, MODBUS, XMODEM, CCITT-FALSE, CCITT-1D0F).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [lammertb/libcrc](https://github.com/lammertb/libcrc) (`src/crc16.c`, `src/crcccitt.c`) by Lammert Bies, MIT License.

The translated output is validated against the canonical `"123456789"` check value for each of the five CRC-16 variants (`0xBB3D`, `0x4B37`, `0x31C3`, `0x29B1`, `0xE5CC`).

## Why this exists

CRC-16 is the most-deployed 16-bit checksum family. Different variants are required by different protocols:

- **IBM (ARC)** — USB, Bisync, original IBM SDLC. The "plain" CRC-16.
- **MODBUS** — Modbus RTU over serial. Same polynomial as IBM, init `0xFFFF`.
- **XMODEM** — the XMODEM/YMODEM file-transfer protocols (1977).
- **CCITT-FALSE** — most-used "CRC-CCITT". Bluetooth, SD card command layer, HDLC, KISS framing.
- **CCITT-1D0F** — older modem standards.

You almost certainly need to pick exactly the right variant: same polynomial families produce wildly different results based on the init value.

`ts-crc16` is a direct mechanical translation from libcrc via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the algorithms is inspectable.

## Install

```bash
npm install ts-crc16
```

## Usage

```typescript
import { crc16ibm, crc16modbus, crc16xmodem, crc16ccitt, crc16ccitt1d0f, toHex } from 'ts-crc16';

crc16ibm('123456789');         // 47933 (= 0xBB3D)
crc16modbus('123456789');      // 19255 (= 0x4B37)
crc16xmodem('123456789');      // 12739 (= 0x31C3)
crc16ccitt('123456789');       // 10673 (= 0x29B1) ← CCITT-FALSE, the common one
crc16ccitt1d0f('123456789');   // 58828 (= 0xE5CC)

toHex(crc16ccitt('123456789'));// '29b1'

// Raw bytes also accepted
crc16ibm(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
```

## API surface

- `crc16ibm(input): number` — CRC-16/IBM (a.k.a. ARC, ANSI, USB). poly 0xA001 reflected, init 0x0000.
- `crc16modbus(input): number` — CRC-16/MODBUS. poly 0xA001 reflected, init 0xFFFF.
- `crc16xmodem(input): number` — CRC-16/XMODEM. poly 0x1021, init 0x0000.
- `crc16ccitt(input): number` — CRC-16/CCITT-FALSE. poly 0x1021, init 0xFFFF.
- `crc16ccitt1d0f(input): number` — CRC-16/CCITT-1D0F. poly 0x1021, init 0x1D0F.
- `toHex(n: number): string` — 4-char lowercase hex.
- `update_crc_16(crc, byte)`, `update_crc_ccitt(crc, byte)` — incremental byte-at-a-time updates.

All functions return a uint16 in `[0, 65535]`. Strings are encoded UTF-8 before hashing.

## Reference values (CRC catalogue)

| Variant | "123456789" check value |
|---|---|
| CRC-16/IBM (ARC) | `0xBB3D` |
| CRC-16/MODBUS | `0x4B37` |
| CRC-16/XMODEM | `0x31C3` |
| CRC-16/CCITT-FALSE | `0x29B1` |
| CRC-16/CCITT-1D0F | `0xE5CC` |

Run:
```bash
npm test
```

## Caveats

- **Not cryptographic.** All CRC variants are easily forgeable. For adversarial integrity use SHA-256 (`ts-sha2`).
- **Pick the right variant.** CRC-16 has dozens of catalogued variants. This package covers the five most common; if your protocol specifies "Modbus CRC" use `crc16modbus`, if it says "CRC-CCITT" almost always use `crc16ccitt` (FALSE variant), etc. The [CRC RevEng catalogue](http://reveng.sourceforge.net/crc-catalogue/16.htm) is the authoritative reference.

## License

MIT. Original C by Lammert Bies under MIT.

## See also

- [ts-crc32](https://github.com/ScottMoore0/ts-crc32) — CRC-32 (IEEE 802.3)
- [ts-adler32](https://github.com/ScottMoore0/ts-adler32) — Adler-32 (zlib/PNG/deflate)
- [ts-sha2](https://github.com/ScottMoore0/ts-sha2) — SHA-256 for cryptographic integrity
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
