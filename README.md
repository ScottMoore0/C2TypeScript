# ts-xtea

A direct TypeScript port of XTEA (eXtended Tiny Encryption Algorithm).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [shixiongfei/xtea](https://github.com/shixiongfei/xtea) (`xtea.c`, `xtea.h`) by Xiongfei Shi, Apache License 2.0.

The translated output is validated against the standard XTEA-32 reference vector (key `0..0F` encrypting `"ABCDEFGH"` to `497df3d072612cb5`), plus round-trip and CBC behaviour tests.

## Why this exists

XTEA is the "eXtended" variant of TEA (Tiny Encryption Algorithm) by Roger Needham and David Wheeler, designed in 1997 to fix the related-key weaknesses of the original TEA. It is an 8-byte block cipher with a 128-bit key, ~30 lines of C, and is the smallest standardised block cipher in widespread use. Common deployments: legacy DRM and game-save formats, Microchip embedded SDK examples, several BLE protocols, and as a teaching cipher in cryptography courses.

`ts-xtea` is a direct mechanical translation from a well-known C reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the algorithm is inspectable.

## Install

```bash
npm install ts-xtea
```

## Usage

```typescript
import { Xtea } from 'ts-xtea';

const key = new Uint8Array(16);   // 128-bit key
const cipher = new Xtea(key);

// ECB: single 8-byte block
const ct = cipher.encryptBlock(new Uint8Array([0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48]));
const pt = cipher.decryptBlock(ct);

// CBC: multi-block (length must be a multiple of 8)
const iv = new Uint8Array(8);
const ciphertext = cipher.encryptCbc(new Uint8Array(24), iv.slice());
const plaintext = cipher.decryptCbc(ciphertext, iv.slice());
```

## API surface

- `class Xtea`
  - `new Xtea(key: Uint8Array)` — 16-byte key required.
  - `.encryptBlock(plaintext: Uint8Array): Uint8Array` — 8 → 8 bytes (ECB).
  - `.decryptBlock(ciphertext: Uint8Array): Uint8Array` — 8 → 8 bytes (ECB).
  - `.encryptCbc(data, iv): Uint8Array` — data must be a multiple of 8 bytes; IV is 8 bytes.
  - `.decryptCbc(data, iv): Uint8Array`
- `XTEA_BLOCK_SIZE = 8`, `XTEA_KEY_SIZE = 16`, `XTEA_IV_SIZE = 8` — exported constants.

## Reference vector

The test suite asserts against the canonical 32-round XTEA vector:

| Source | Key | Plaintext | Ciphertext |
|---|---|---|---|
| Wheeler/Needham 1997 (32 rounds) | `000102030405060708090a0b0c0d0e0f` | `4142434445464748` (`"ABCDEFGH"`) | `497df3d072612cb5` |

Plus round-trip checks on ECB, CBC, and IV-distinct-block-output verification.

Run:
```bash
npm test
```

## Caveats

- **Use AES for new code.** XTEA is small but not state-of-the-art. It has known related-key attacks beyond round 24 of 32, and a small 64-bit block size means it should not be used to encrypt more than ~32 GB of data per key. For new designs, prefer AES-128 or ChaCha20.
- **Not constant-time.** This is a direct reference translation; the JavaScript runtime adds further timing variability.
- **No padding.** ECB and CBC require the input to be a multiple of 8 bytes. Pad with PKCS#7 or your protocol's scheme; don't roll your own.

## License

Apache 2.0. Original C by Xiongfei Shi under Apache 2.0. See the `LICENSE` file for upstream attribution.

## See also

- [ts-tiny-aes](https://github.com/ScottMoore0/ts-tiny-aes) — AES, recommended for new symmetric encryption
- [ts-arcfour](https://github.com/ScottMoore0/ts-arcfour) — RC4 stream cipher (legacy)
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
