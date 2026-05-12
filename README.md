# ts-aes-ofb

A direct TypeScript port of WjCryptLib's AES-OFB. AES-128/192/256 in OFB mode of operation.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

Direct port of [WaterJuice/WjCryptLib](https://github.com/WaterJuice/WjCryptLib) (`WjCryptLib_Aes.c` core + `WjCryptLib_AesOfb.c` mode wrapper), Unlicense / public domain.

The translated output is validated against NIST SP 800-38A §F.4.1, §F.4.3, §F.4.5 test vectors covering all three AES key sizes.

## Why this exists

AES-OFB (Output Feedback) turns the AES block cipher into a synchronous stream cipher by feeding the encryption output back as the next input. Encryption and decryption are the same XOR-with-keystream operation. Unlike CBC, OFB:

- Does NOT require block-aligned input (arbitrary length).
- Is malleable — bit-flips in ciphertext become bit-flips in plaintext.
- Cannot recover from bit errors (no error propagation).

Common uses: legacy serial-link encryption, some satellite protocols, voice encryption, historic VPN profiles.

## Install

```bash
npm install ts-aes-ofb
```

## Usage

```typescript
import { aesOfb, AesOfb } from 'ts-aes-ofb';

// One-shot — symmetric (same function encrypts and decrypts)
const key = new Uint8Array(16);  // 16, 24, or 32 bytes
const iv  = new Uint8Array(16);
const ct = aesOfb(key, iv, plaintext);
const pt = aesOfb(key, iv, ct);

// Streaming
const stream = new AesOfb(key, iv);
const part1 = stream.process(plaintext.slice(0, 17));   // any length
const part2 = stream.process(plaintext.slice(17));
```

## API surface

- `aesOfb(key, iv, data): Uint8Array` — one-shot (symmetric).
- `class AesOfb` — streaming with `.process(chunk)` (chunks may be any length).
- `AES_BLOCK_SIZE = 16` — exported constant.

## Reference vectors

The test suite asserts against:

| Spec | Key | Status |
|---|---|---|
| NIST SP 800-38A §F.4.1 | AES-128 | ✓ (4-block vector) |
| NIST SP 800-38A §F.4.3 | AES-192 | ✓ |
| NIST SP 800-38A §F.4.5 | AES-256 | ✓ |

Plus stream-cipher symmetry, non-block-aligned length support, and streaming-matches-one-shot.

Run:
```bash
npm test
```

## Caveats

- **No authentication.** OFB is malleable. For real-world use, pair with HMAC (encrypt-then-MAC) or use AEAD (AES-GCM, ChaCha20-Poly1305).
- **IV must NEVER be reused with the same key.** OFB with reused IV reveals plaintext XOR difference of any two messages. Use a fresh random 16-byte IV per encryption.
- **Stream-cipher: bit-flips translate.** Single-bit flip in ciphertext causes single-bit flip in plaintext at the same position. Authenticate the ciphertext.
- **Cannot parallelise.** OFB's keystream generation is inherently sequential. For parallel encryption use CTR mode (but note: WjCryptLib's CTR uses a non-NIST counter convention).
- **Not constant-time.** Direct reference translation; JS runtime adds further timing variability.

## License

Unlicense / public domain. Original C by WaterJuice under Unlicense.

## See also

- [ts-wjcryptlib-aes](https://github.com/ScottMoore0/ts-wjcryptlib-aes) — the AES core
- [ts-aes-cbc](https://github.com/ScottMoore0/ts-aes-cbc) — CBC mode
- [ts-tiny-aes](https://github.com/ScottMoore0/ts-tiny-aes) — alternative AES port
- [ts-arcfour](https://github.com/ScottMoore0/ts-arcfour) — RC4 stream cipher
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
