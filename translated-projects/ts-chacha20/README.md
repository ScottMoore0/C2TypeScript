# ts-chacha20

A pure-TypeScript port of D.J. Bernstein's **ChaCha20** stream cipher,
following [RFC 8439](https://datatracker.ietf.org/doc/html/rfc8439).

- 32-byte key, 12-byte nonce, 32-bit block counter.
- Symmetric: `process()` both encrypts and decrypts.
- No native dependencies. Browser- and Node-compatible.
- Tested against RFC 8439 §2.4.2 and §A.2 vectors.

For an authenticated cipher use ChaCha20-Poly1305 from a vetted source — this
package implements **only** ChaCha20 (the keystream + XOR layer).

## Install

```sh
npm install @scott/chacha20
```

## Usage

```ts
import { chacha20, ChaCha20 } from '@scott/chacha20';

// One-shot
const key = new Uint8Array(32);           // your 32-byte key
const nonce = new Uint8Array(12);          // your 12-byte nonce (unique per message)
const plaintext = new TextEncoder().encode('hello world');
const ciphertext = chacha20(key, nonce, plaintext);
const recovered = chacha20(key, nonce, ciphertext); // symmetric

// Streaming
const cipher = new ChaCha20(key, nonce);
const part1 = cipher.process(plaintext.slice(0, 16));
const part2 = cipher.process(plaintext.slice(16));
```

## API

- `chacha20(key, nonce, data, counter?)` — one-shot encrypt or decrypt.
- `new ChaCha20(key, nonce, counter?)` — streaming cipher.
  - `.process(data)` — XOR `data` with keystream; advance state.
- `CHACHA20_KEY_SIZE = 32`, `CHACHA20_NONCE_SIZE = 12`.

## Test vectors

This port matches the canonical RFC 8439 test vectors:

- §2.4.2 — "Ladies and Gentlemen of the class of '99…" with the example key,
  nonce, and initial counter = 1.
- §A.2 — two-block all-zero-key/nonce test and the long IETF-text test.

Run them with:

```sh
npm test
```

## Upstream

Originally from [Ginurx/chacha20-c](https://github.com/Ginurx/chacha20-c)
(public domain).

## License

MIT — see [LICENSE](LICENSE).
