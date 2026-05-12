# ts-base58

A direct TypeScript port of [deemru/b58](https://github.com/deemru/b58) — Bitcoin-alphabet Base58 encoding.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of deemru/b58 (`b58.c`, `b58.h`) by Dmitrii Pichulin, MIT License.

The translated output is validated against canonical Bitcoin Base58 test vectors including the standard `"Hello World!" → "2NEpo7TZRRrLZSi2U"` reference plus encode-then-decode round-trips on arbitrary 32-byte inputs (simulates a private key).

## Why this exists

Base58 is the encoding used for **Bitcoin addresses**, IPFS CIDs (v0), Solana public keys, Monero addresses, Stellar account IDs, Ripple, and many cryptocurrency / decentralised-system identifiers. The 58-character alphabet excludes `0`, `O`, `I`, `l` to avoid visually-ambiguous characters when transcribing by hand. This is **not** base58check (which adds a 4-byte SHA-256-SHA-256 checksum) — for that, layer a SHA-256 (via `ts-sha2`) on top.

## Install

```bash
npm install ts-base58
```

## Usage

```typescript
import { base58Encode, base58Decode } from 'ts-base58';

base58Encode(new TextEncoder().encode('Hello World!'));
// '2NEpo7TZRRrLZSi2U'

const decoded = base58Decode('2NEpo7TZRRrLZSi2U');
new TextDecoder().decode(decoded);
// 'Hello World!'

// Encoding a Bitcoin-style 32-byte private key
const privkey = new Uint8Array(32);
crypto.getRandomValues(privkey);
const wif = base58Encode(privkey);
```

## API surface

- `base58Encode(input: Uint8Array | string): string` — encode to Base58.
- `base58Decode(input: string): Uint8Array` — decode from Base58.

Both empty-input and leading-zero (`0x00...` prefix) inputs are handled correctly — Base58 encodes leading zero bytes as leading `'1'` characters.

## Reference values

The test suite asserts against canonical Bitcoin Base58 vectors:

| Bytes | Base58 |
|---|---|
| `(empty)` | `(empty)` |
| `0x00` | `1` |
| `0x00 0x00` | `11` |
| `0x61` | `2g` |
| `0x62 0x62 0x62` | `a3gV` |
| `0x63 0x63 0x63` | `aPEr` |
| `"Hello World!"` | `2NEpo7TZRRrLZSi2U` |
| `"The quick brown fox jumps over the lazy dog."` | `USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z` |

Plus round-trip checks (32-byte simulated private key) and alphabet sanity (no `0`, `O`, `I`, `l` characters in output).

Run:
```bash
npm test
```

## Caveats

- **Not base58check.** This is plain Base58 — no checksum. For Bitcoin addresses use base58check by appending a 4-byte SHA-256-SHA-256 checksum before encoding (build it with [ts-sha2](https://github.com/ScottMoore0/ts-sha2)).
- **Not Flickr / Ripple alphabets.** This is the Bitcoin alphabet: `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`. Other Base58 variants (Flickr swaps letter case order; Ripple uses a different ordering) need a different package or post-processing.
- **Performance.** Base58 encoding is O(n²) in the input length due to the carrying-into-arbitrary-precision-arithmetic nature of the algorithm. Fine for keys/hashes (typically 32 bytes); slower for very long inputs.

## License

MIT. Original C by Dmitrii Pichulin under MIT.

## See also

- [ts-chibi-base64](https://github.com/ScottMoore0/ts-chibi-base64) — Base64 encoding (RFC 4648)
- [ts-sha2](https://github.com/ScottMoore0/ts-sha2) — SHA-256 (for building base58check)
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
