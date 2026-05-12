# ts-ripemd160

A direct TypeScript port of [DaveCTurner/tiny-ripemd160](https://github.com/DaveCTurner/tiny-ripemd160) — RIPEMD-160 cryptographic hash.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

Direct port of `ripemd160.c` / `ripemd160.h` by David Turner, MIT License.

The translated output is validated against all 6 reference vectors from Dobbertin, Bosselaers, and Preneel's original 1996 paper, plus the 56-char mix vector.

## Why this exists

RIPEMD-160 is the hash function inside **Bitcoin addresses** (`HASH160 = RIPEMD160(SHA256(pubkey))`), used by GnuPG / OpenPGP for v4 key fingerprints, and is a standard hash option in TLS 1.0/1.1 and SSH. It produces a 160-bit (20-byte) digest, designed in 1996 by the European RIPE consortium as an open alternative to SHA-1.

`ts-ripemd160` is a direct mechanical translation from a tiny C reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the algorithm is inspectable.

## Install

```bash
npm install ts-ripemd160
```

## Usage

```typescript
import { ripemd160, ripemd160Hex } from 'ts-ripemd160';

ripemd160Hex('abc');
// '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc'

ripemd160Hex('');
// '9c1185a5c5e9fc54612808977ee8f548b2258d31'

// Raw 20-byte Uint8Array
const digest = ripemd160('abc');

// HASH160 (Bitcoin) pattern: combine with ts-sha2
// import { sha256 } from 'ts-sha2';
// const hash160 = ripemd160(sha256(pubkeyBytes));
```

## API surface

- `ripemd160(input: Uint8Array | string): Uint8Array` — one-shot RIPEMD-160. Returns a 20-byte digest.
- `ripemd160Hex(input): string` — same, returns 40-character lowercase hex.
- `RIPEMD160_DIGEST_SIZE = 20` — exported constant.

## Reference values

The test suite asserts against the Dobbertin/Bosselaers/Preneel paper §A.5 test vectors:

| Input | RIPEMD-160 |
|---|---|
| `""` | `9c1185a5c5e9fc54612808977ee8f548b2258d31` |
| `"a"` | `0bdc9d2d256b3ee9daae347be6f4dc835a467ffe` |
| `"abc"` | `8eb208f7e05d987a9b044a8e98c6b087f15a0bfc` |
| `"message digest"` | `5d0689ef49d2fae572b881b123a85ffa21595f36` |
| `"abc…xyz"` | `f71c27109c692c1b56bbdceb5b9d2865b3708dbc` |
| `"The quick brown fox..."` | `37f332f68db77bd9d7edd4969571ad671cf9dd3b` |
| `"abcdbcde..."` (56 chars) | `12a053384a9c0c88e405a06c27dcf49ada62eb2b` |

Run:
```bash
npm test
```

## Caveats

- **No published collision yet, but cryptographic confidence is moderate.** RIPEMD-160 has held up better than SHA-1, but it's an older 160-bit hash. For new designs prefer SHA-256 (`ts-sha2`). RIPEMD-160 in legacy code (Bitcoin, PGP, TLS 1.0/1.1) is fine.
- **No HMAC included.** For HMAC-RIPEMD160, wrap this in the standard HMAC construction.
- **Not constant-time.** Direct reference translation; JS runtime adds timing variability.

## License

MIT. Original C by David Turner under MIT.

## See also

- [ts-sha2](https://github.com/ScottMoore0/ts-sha2) — SHA-256, the modern cryptographic hash recommendation
- [ts-sha1](https://github.com/ScottMoore0/ts-sha1) — SHA-1 for legacy git/TLS interop
- [ts-md5](https://github.com/ScottMoore0/ts-md5), [ts-md2](https://github.com/ScottMoore0/ts-md2) — older hashes for legacy compatibility
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
