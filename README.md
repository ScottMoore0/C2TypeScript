# ts-pearson

A direct TypeScript port of [glapa-grossklag/pearson-c](https://github.com/glapa-grossklag/pearson-c) — Pearson hashing in 8, 16, 32, and 64-bit variants.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

Direct port of `pearson.c` / `pearson.h` by Miles Glapa-Grossklag, BSD 3-Clause License.

The fixed 256-byte permutation table is preserved verbatim from the upstream — outputs are deterministic given that table.

## Why this exists

Pearson hashing (Peter K. Pearson, CACM 33(6), 1990) is one of the simplest non-cryptographic hash functions: a single permutation table and one XOR-and-lookup per input byte. The implementation fits in ~20 lines of code. Useful for tiny embedded systems, lookup tables in tight loops, and educational contexts where you need a hash function whose every step is auditable. The wider variants (16/32/64-bit) work by running the algorithm multiple times with different starting "salt" bytes.

## Install

```bash
npm install ts-pearson
```

## Usage

```typescript
import { pearson8, pearson16, pearson32, pearson64, pearson32hex } from 'ts-pearson';

pearson8('hello');          // 140 (= 0x8C)
pearson16('hello');         // 36082 (= 0x8CF2)
pearson32('hello');         // 2364906159 (= 0x8CF2DCAF)
pearson64('hello');         // 10157395466037878072n (= 0x8CF2DCAF95DB8F38n, BigInt)

pearson32hex('hello');      // '8cf2dcaf'
```

## API surface

- `pearson8(input): number` — uint8 in `[0, 255]`.
- `pearson16(input): number` — uint16 in `[0, 65535]`.
- `pearson32(input): number` — uint32 in `[0, 2^32)`.
- `pearson64(input): bigint` — non-negative BigInt in `[0, 2^64)`.
- `pearson{8,16,32,64}hex(input): string` — corresponding hex helpers.

All accept `Uint8Array | string`. Strings are encoded UTF-8.

## Reference values

| Input | P-8 | P-16 | P-32 | P-64 |
|---|---|---|---|---|
| `""` | `1d` | — | `1dbab4a2` | — |
| `"a"` | `79` | — | — | — |
| `"abc"` | `dc` | `dcc9` | `dcc9e473` | `dcc9e47317547e51` |
| `"hello"` | `8c` | — | `8cf2dcaf` | `8cf2dcaf95db8f38` |
| `"123456789"` | `58` | — | — | — |

Pearson-16 high byte = Pearson-8 of the same input; widths are constructed by running the hash multiple times with successive starting salts.

Run:
```bash
npm test
```

## Caveats

- **Not cryptographic.** Pearson is a non-cryptographic hash. Easily forgeable. Use SHA-2 (`ts-sha2`) for adversarial integrity.
- **Table-dependent.** Outputs depend on the specific 256-byte permutation table embedded in the source. Different Pearson implementations using different tables produce different hashes; this port's outputs match this specific upstream.
- **Limited collision resistance** for short inputs in the 8-bit variant. Use 32 or 64-bit variants for hashtables with >256 entries.

## License

BSD 3-Clause. Original C by Miles Glapa-Grossklag under BSD 3-Clause.

## See also

- [ts-fnv-hash](https://github.com/ScottMoore0/ts-fnv-hash) — FNV non-cryptographic hash
- [ts-murmur3](https://github.com/ScottMoore0/ts-murmur3) — MurmurHash3 non-cryptographic hash
- [ts-xxhash](https://github.com/ScottMoore0/ts-xxhash) — xxHash, faster modern non-cryptographic hash
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
