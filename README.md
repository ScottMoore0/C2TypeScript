# ts-blake2s

A pure-TypeScript port of **BLAKE2s** — a cryptographic hash function optimised
for 32-bit platforms, defined in [RFC 7693](https://datatracker.ietf.org/doc/html/rfc7693).

- 1–32 byte digest, optional 0–32 byte secret key (MAC mode).
- Faster than SHA-2 on most platforms; collision-resistant.
- No native dependencies. Browser- and Node-compatible.
- Tested against RFC 7693 §B, the canonical BLAKE2 KAT vectors, and node's
  `crypto.createHash('blake2s256')`.

For 64-bit platforms or longer outputs, use BLAKE2b.

## Install

```sh
npm install @scott/blake2s
```

## Usage

```ts
import { blake2s, blake2sHex, Blake2s } from '@scott/blake2s';

// One-shot
const digest = blake2sHex('abc');
// => '508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982'

// Truncated digest
const short = blake2sHex('abc', 16);   // 128-bit output

// Keyed (MAC mode)
const key = new Uint8Array(32);
const mac = blake2s(input, 32, key);

// Streaming
const h = new Blake2s();
h.update(chunkA);
h.update(chunkB);
const out = h.hexDigest();
```

## API

- `blake2s(input, outlen?, key?)` — one-shot, returns `Uint8Array`.
- `blake2sHex(input, outlen?, key?)` — one-shot, returns lowercase hex.
- `new Blake2s(outlen?, key?)` — streaming.
  - `.update(data)` — feed bytes (or a UTF-8 string).
  - `.digest()` — finalise, returns `Uint8Array`.
  - `.hexDigest()` — finalise, returns hex string.

Constraints: `1 <= outlen <= 32`, `0 <= keylen <= 32`.

## Test vectors

This port matches:

- RFC 7693 §B test vector — BLAKE2s-256 of `"abc"`.
- The canonical empty-input digest (verified against
  `node:crypto.createHash('blake2s256')`).
- The official BLAKE2-KAT keyed-mode vector
  (key = `00..1f`, input = `00` → `40d15fee…`).
- Streaming-equivalence and validation cases.

Run them with:

```sh
npm test
```

## Upstream

Originally from
[mjosaarinen/blake2_mjosref](https://github.com/mjosaarinen/blake2_mjosref)
(CC0 1.0 Universal — public domain).

## License

CC0-1.0 — see [LICENSE](LICENSE).
