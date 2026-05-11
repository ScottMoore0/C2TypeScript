# ts-sha2

A direct TypeScript translation of SHA-256 (FIPS PUB 180-4).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of the SHA-256 implementation in [B-Con/crypto-algorithms](https://github.com/B-Con/crypto-algorithms), a public-domain C reference for common hashing and crypto primitives by Brad Conte. The translation tracks the original `sha256.c`.

The translated output is validated against the NIST FIPS 180-4 test vectors (empty string, "abc", 56-byte multi-block, and several commonly-published checks) plus a streaming-vs-one-shot equivalence test.

## Why this exists

The TypeScript ecosystem has fragmented SHA-256 options: `crypto.subtle` (browser-only, async, surprises on Node), `node:crypto` (Node-only, breaks on edge runtimes), `js-sha256` (works but its origins are less directly auditable), `noble-hashes` (excellent, but heavier than some projects need). `ts-sha2` is a small, pure-TS, zero-dependency port of a public-domain C reference. The translation goes via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so the relationship to the upstream C source is mechanical and inspectable.

## Install

```bash
npm install ts-sha2
```

## Usage

### One-shot

```typescript
import { sha256, sha256Hex } from 'ts-sha2';

sha256Hex('abc');
// 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

sha256('abc');
// Uint8Array(32) [186, 120, 22, 191, ...]

sha256(new Uint8Array([1, 2, 3]));
// Uint8Array(32) [3, ...]
```

### Streaming

```typescript
import { Sha256 } from 'ts-sha2';

const h = new Sha256();
h.update('chunk one ');
h.update('chunk two');
h.update(new Uint8Array([0xff, 0xfe]));
const digest = h.digest();      // Uint8Array(32)
// or
const digestHex = new Sha256().update('abc').digestHex();
```

After `.digest()`, the instance is finalised: further `.update()` or `.digest()` calls throw.

### Constants

```typescript
import { SHA256_DIGEST_SIZE } from 'ts-sha2';
SHA256_DIGEST_SIZE;  // 32
```

## API surface

- `sha256(input: string | Uint8Array): Uint8Array` — one-shot, returns 32 bytes
- `sha256Hex(input: string | Uint8Array): string` — one-shot, returns 64-char hex
- `Sha256` — streaming class with `update(chunk)`, `digest()`, `digestHex()`
- `SHA256_DIGEST_SIZE` — the constant `32`

Strings are encoded as UTF-8 before hashing. To hash arbitrary bytes, pass a `Uint8Array`.

## Test vectors

The package's test suite asserts against these NIST and commonly-cited vectors:

| Input | SHA-256 (hex) | Source |
|---|---|---|
| `""` (empty) | `e3b0c442...7852b855` | FIPS 180-4 Appendix B |
| `"abc"` | `ba7816bf...f20015ad` | FIPS 180-4 §B.1 |
| 56-byte multi-block | `248d6a61...19db06c1` | FIPS 180-4 §B.2 |
| `"The quick brown fox jumps over the lazy dog"` | `d7a8fbb3...37c9e592` | Wikipedia / public test set |
| `"... dog."` (with period) | `ef537f25...8635fb6c` | Wikipedia / public test set |

Run them locally:

```bash
npm test
```

## Caveats

- **Performance**: this is a direct port of a clear, public-domain C reference, not an optimised implementation. For latency-sensitive workloads on Node, the native `node:crypto` API will be faster. For everyday application use (signatures, integrity checks, deterministic IDs), the throughput here is fine.
- **Side-channel safety**: the implementation is straight-line and does not perform secret-dependent branching or table lookups, but no formal claim of constant-time behaviour against modern micro-architectural attacks is made. SHA-256 itself is a deterministic public function and does not handle secret keys; for HMAC/keyed-prefix use cases, evaluate carefully against your threat model.
- **Input type**: strings are interpreted as UTF-8. If your protocol specifies a different encoding (e.g. UTF-16, ASCII-strict), convert to `Uint8Array` first.
- **No streaming over the digest output**: the digest is materialised as a full 32-byte `Uint8Array`. No "digest into the caller's buffer" API.

## License

MIT. Translated from the public-domain SHA-256 implementation in B-Con/crypto-algorithms.
See the `LICENSE` file.

## See also

- [ts-xxhash](https://github.com/ScottMoore0/ts-xxhash) — fast non-cryptographic hashing in TypeScript
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
