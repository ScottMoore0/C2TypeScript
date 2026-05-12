# ts-wjcryptlib-aes

A direct TypeScript port of WjCryptLib's AES implementation (FIPS 197 Rijndael, full AES-128/192/256 support).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

Direct port of [WaterJuice/WjCryptLib](https://github.com/WaterJuice/WjCryptLib) (`WjCryptLib_Aes.c`, `WjCryptLib_Aes.h`), Unlicense / public domain.

The translated output is validated against all three FIPS 197 Appendix C test vectors (§C.1, §C.2, §C.3 — AES-128/192/256).

## Why this exists

The TypeScript ecosystem already has [ts-tiny-aes](https://github.com/ScottMoore0/ts-tiny-aes) for AES, but that's based on Tiny-AES-C which is optimised for memory-constrained microcontrollers. WjCryptLib's AES is a different reference: full-table AES with no compile-time variant selection, supports all three key sizes (128/192/256) at runtime, and serves as the foundation for WjCryptLib's CBC/CTR/OFB mode wrappers.

This port translates cleanly thanks to a C99 `uint_fast32_t` typedef mapping fix in the translator (the upstream uses fast-int types extensively).

## Install

```bash
npm install ts-wjcryptlib-aes
```

## Usage

```typescript
import { Aes } from 'ts-wjcryptlib-aes';

const key = new Uint8Array(16);  // 16, 24, or 32 bytes (AES-128/192/256)
const cipher = new Aes(key);

// ECB block primitive
const plaintext = new Uint8Array(16);
const ct = cipher.encryptBlock(plaintext);
const pt = cipher.decryptBlock(ct);

// In-place
const block = new Uint8Array(16);
cipher.encryptInPlace(block);
cipher.decryptInPlace(block);
```

## API surface

- `class Aes`
  - `new Aes(key: Uint8Array)` — key must be 16, 24, or 32 bytes.
  - `.encryptBlock(plaintext: Uint8Array): Uint8Array` — 16 → 16 bytes (ECB primitive).
  - `.decryptBlock(ciphertext: Uint8Array): Uint8Array` — 16 → 16 bytes.
  - `.encryptInPlace(block: Uint8Array): void` — mutates `block`.
  - `.decryptInPlace(block: Uint8Array): void`
- `AES_BLOCK_SIZE = 16`, `AES_KEY_SIZE_128 = 16`, `AES_KEY_SIZE_192 = 24`, `AES_KEY_SIZE_256 = 32` — exported constants.

## Reference vectors

The test suite asserts against all three FIPS 197 Appendix C test vectors:

| Spec | Key | Plaintext | Ciphertext |
|---|---|---|---|
| §C.1 (AES-128) | `000102…0f` | `001122…ff` | `69c4e0d8…b4c55a` |
| §C.2 (AES-192) | `000102…17` | `001122…ff` | `dda97ca4…0d7191` |
| §C.3 (AES-256) | `000102…1f` | `001122…ff` | `8ea2b7ca…496089` |

Plus round-trip decryption and in-place block-mutation tests.

Run:
```bash
npm test
```

## Caveats

- **ECB primitive only.** This package exposes the AES block cipher itself; for real encryption use a mode of operation (CBC, CTR, GCM, etc.) that introduces an IV and prevents pattern leakage. ECB is **not safe** for messages longer than one block.
- **Not constant-time.** This is a direct reference translation; the JS runtime adds further timing variability. Don't use for high-assurance applications where AES-NI or constant-time implementations matter.
- **No padding.** Inputs must be exactly 16 bytes per call. Pad with PKCS#7 or whatever your protocol specifies; don't roll your own.

## License

Unlicense / public domain. Original C by WaterJuice under Unlicense.

## See also

- [ts-tiny-aes](https://github.com/ScottMoore0/ts-tiny-aes) — alternative AES port (Tiny-AES-C upstream, smaller surface, compile-time variant)
- [ts-xtea](https://github.com/ScottMoore0/ts-xtea) — XTEA block cipher (legacy / embedded)
- [ts-arcfour](https://github.com/ScottMoore0/ts-arcfour) — RC4 stream cipher (legacy)
- [ts-sha512](https://github.com/ScottMoore0/ts-sha512) — SHA-512 from the same WjCryptLib upstream
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
