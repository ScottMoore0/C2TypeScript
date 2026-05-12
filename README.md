# ts-arcfour

A direct TypeScript port of Brad Conte's ARCFOUR (RC4) reference implementation.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [B-Con/crypto-algorithms](https://github.com/B-Con/crypto-algorithms) (`arcfour.c`, `arcfour.h`) by Brad Conte. The upstream source is in the public domain.

The translated output is validated against RFC 6229 §2 reference test vectors plus the well-known Wikipedia RC4 vectors.

## Why this exists

ARCFOUR (commonly known as RC4) is a synchronous stream cipher that was the backbone of WEP, WPA-TKIP, SSL/TLS, BitTorrent's MSE, Kerberos, and many other protocols throughout the 1990s-2010s. It is **cryptographically broken** and has been forbidden in TLS since RFC 7465 (2015) — but it still appears in legacy interop scenarios (older Kerberos services, certain SAML/SOAP profiles, archived data formats, password vault migrations) where a working implementation is needed precisely to decrypt material produced by older systems.

`ts-arcfour` is a direct mechanical translation from Brad Conte's well-known C reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the algorithm is inspectable.

## Install

```bash
npm install ts-arcfour
```

## Usage

```typescript
import { Arcfour, arcfourKeystream, arcfourProcess } from 'ts-arcfour';

// Stateful API — one Arcfour instance maintains keystream state
const rc4 = new Arcfour('Key');
rc4.process('Plaintext');           // Uint8Array of ciphertext bytes

// One-shot helpers (a fresh keystream per call)
arcfourKeystream('Key', 16);                  // 16 bytes of keystream
arcfourProcess('Key', 'Plaintext');           // encrypt or decrypt

// Decryption is the same operation — XOR with the same keystream
const ct = arcfourProcess('Key', 'Plaintext');
const pt = arcfourProcess('Key', ct);         // round-trips
```

Strings are encoded as UTF-8 before being processed. Pass `Uint8Array` for raw bytes.

## API surface

- `class Arcfour`
  - `new Arcfour(key: Uint8Array | string)` — initialise the keystream (key must be 1..256 bytes).
  - `.generate(len: number): Uint8Array` — emit `len` bytes of keystream and advance state.
  - `.process(data: Uint8Array | string): Uint8Array` — XOR `data` with the next keystream bytes.
- `arcfourKeystream(key, len): Uint8Array` — one-shot: a fresh `Arcfour(key)` and `generate(len)`.
- `arcfourProcess(key, data): Uint8Array` — one-shot encrypt-or-decrypt.

## Reference vectors

The package's test suite asserts against:

| Source | Key | First 16 keystream bytes |
|---|---|---|
| RFC 6229 §2 | `0102030405` | `b2396305f03dc027ccc3524a0a1118a8` |
| RFC 6229 §2 | `0102…0f10` (128-bit) | `9ac7cc9a609d1ef7b2932899cde41b97` |
| RFC 6229 §2 | `0102…1e1f20` (256-bit) | `eaa6bd25880bf93d3f5d1e4ca2611d91` |
| Wikipedia | `"Key"` × `"Plaintext"` | ciphertext `bbf316e8d940af0ad3` |
| Wikipedia | `"Wiki"` × `"pedia"` | ciphertext `1021bf0420` |
| Wikipedia | `"Secret"` × `"Attack at dawn"` | ciphertext `45a01f645fc35b383552544b9bf5` |

Run:
```bash
npm test
```

## Caveats

- **DO NOT use this for new cryptographic designs.** RC4 has multiple practical attacks: biased early keystream bytes, plaintext-recovery attacks (Bar-On et al., RC4 NOMORE), broken WEP, and broken WPA-TKIP. Use ChaCha20, AES-GCM, or AES-CBC for any new application.
- **Drop the early keystream if you must use it.** Common RC4 deployments discard the first 256 or 768 bytes of keystream to reduce the well-known initial-state bias. This library does NOT drop them by default — the keystream is emitted from byte 0 of the canonical PRGA, matching the reference. Drop the prefix yourself if your protocol requires it.
- **Not constant-time.** This is a direct reference translation; the JavaScript runtime adds further timing variability. Side-channel resistance is not a goal of this package.
- **Same operation for encrypt and decrypt.** Because RC4 is a stream cipher, calling `process()` on ciphertext with the same key produces the plaintext. Don't confuse the two directions when integrating with a protocol.

## License

Unlicense / public domain. Original C by Brad Conte. TypeScript translation also released into the public domain. See the `LICENSE` file for the upstream acknowledgement.

## See also

- [ts-sha2](https://github.com/ScottMoore0/ts-sha2) — modern cryptographic hashing (SHA-256, prefer this for new code)
- [ts-sha1](https://github.com/ScottMoore0/ts-sha1) — SHA-1 for legacy interop
- [ts-tiny-aes](https://github.com/ScottMoore0/ts-tiny-aes) — AES, the recommended modern symmetric cipher
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
