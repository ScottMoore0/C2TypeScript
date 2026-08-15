# ts-aes-cbc

A direct TypeScript port of WjCryptLib's AES-CBC implementation. AES-128/192/256 in CBC mode of operation.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

Direct port of [WaterJuice/WjCryptLib](https://github.com/WaterJuice/WjCryptLib) (`WjCryptLib_Aes.c` core + `WjCryptLib_AesCbc.c` mode wrapper), Unlicense / public domain.

The translated output is validated against NIST SP 800-38A §F.2.1, §F.2.3, §F.2.5 test vectors covering all three AES key sizes.

## Why this exists

AES-CBC is the most widely deployed authenticated-encryption-prerequisite mode of operation: TLS 1.0/1.1, IPsec ESP, SSH, OpenPGP, LUKS, plus countless application protocols. CBC chains each block's encryption against the previous ciphertext block via XOR, providing diffusion across the entire message at the cost of being inherently sequential.

This package exposes a clean Uint8Array API on top of the WjCryptLib reference implementation.

## Install

```bash
npm install ts-aes-cbc
```

## Usage

```typescript
import { aesCbcEncrypt, aesCbcDecrypt, AesCbcEncryptor } from 'ts-aes-cbc';

// One-shot
const key = new Uint8Array(16);   // 16, 24, or 32 bytes
const iv  = new Uint8Array(16);   // 16-byte IV
const pt  = new Uint8Array(32);   // multiple of 16 bytes (no padding applied)
const ct  = aesCbcEncrypt(key, iv, pt);
const out = aesCbcDecrypt(key, iv, ct);

// Streaming
const enc = new AesCbcEncryptor(key, iv);
const part1 = enc.encrypt(pt.slice(0, 16));
const part2 = enc.encrypt(pt.slice(16));
```

## API surface

- `aesCbcEncrypt(key, iv, plaintext): Uint8Array` — one-shot. Lengths must be multiples of 16.
- `aesCbcDecrypt(key, iv, ciphertext): Uint8Array` — one-shot.
- `class AesCbcEncryptor` — streaming API with `.encrypt(chunk)` / `.decrypt(chunk)` (each chunk must be a multiple of 16 bytes).
- `AES_BLOCK_SIZE = 16` — exported constant.

## Reference vectors

The test suite asserts against:

| Spec | Key | Pass |
|---|---|---|
| NIST SP 800-38A §F.2.1 | AES-128 | ✓ |
| NIST SP 800-38A §F.2.3 | AES-192 | ✓ |
| NIST SP 800-38A §F.2.5 | AES-256 | ✓ |

Plus CBC-mode invariants (identical plaintext blocks produce distinct ciphertext blocks) and streaming-matches-one-shot.

Run:
```bash
npm test
```

## Caveats

- **No padding.** Plaintext/ciphertext lengths must be multiples of 16 bytes. Pad with PKCS#7 yourself (or use a higher-level construction that includes padding).
- **No authentication.** CBC alone is malleable — bit-flips in the ciphertext predictably flip bits in the next block of plaintext. For real-world use, pair with HMAC (encrypt-then-MAC) or use an AEAD construction (AES-GCM, ChaCha20-Poly1305).
- **IV must be unpredictable.** Reusing IVs reveals plaintext patterns. Generate a fresh random IV per encryption with `crypto.getRandomValues(new Uint8Array(16))`.
- **Padding-oracle attacks.** If you accept ciphertext from untrusted sources and react differently to padding errors, you're vulnerable. Use AEAD (AES-GCM) for new code.
- **Not constant-time.** Direct reference translation; JS runtime adds further timing variability.

## License

Unlicense / public domain. Original C by WaterJuice under Unlicense.

## See also

- [ts-wjcryptlib-aes](https://github.com/ScottMoore0/ts-wjcryptlib-aes) — the AES core this CBC builds on
- [ts-tiny-aes](https://github.com/ScottMoore0/ts-tiny-aes) — alternative AES port (smaller, compile-time variant)
- [ts-xtea](https://github.com/ScottMoore0/ts-xtea) — XTEA block cipher with built-in CBC
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
