# ts-mt19937

Zero-dependency TypeScript port of the canonical Matsumoto/Nishimura **MT19937** Mersenne Twister reference C implementation, [mt19937ar.c](http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/MT2002/CODES/mt19937ar.c) (the "improved 2002/1/26" version that uses the `1812433253` seeding constant).

This package preserves the textbook reference vectors. After `init_genrand(5489)`, the first five `genrand_int32()` outputs are the canonical:

```
3499211612, 581869302, 3890346734, 3586334585, 545404204
```

If you are looking for the **Sultanik** flavor (different seeding constant `6069`, different output stream), see [`ts-mtwister`](https://www.npmjs.com/package/ts-mtwister) instead. The two packages implement related but non-identical algorithms.

## Installation

```bash
npm install ts-mt19937
```

## Usage

```typescript
import {
  init_genrand,
  init_by_array,
  genrand_int32,
  genrand_int31,
  genrand_real1,
  genrand_real2,
  genrand_real3,
  genrand_res53,
} from 'ts-mt19937';

// Seed by single 32-bit integer.
init_genrand(5489);
console.log(genrand_int32()); // 3499211612
console.log(genrand_int32()); //  581869302
console.log(genrand_int32()); // 3890346734

// Seed by an array of integers (matches the upstream demo vectors).
// `init_by_array` reads its first argument through the C-pointer model
// the translator uses, so wrap a Uint8Array-backed key buffer in a
// `{ buf, off }` CPtr-style record:
const keyWords = new Uint32Array([0x123, 0x234, 0x345, 0x456]);
const keyPtr = { buf: new Uint8Array(keyWords.buffer), off: 0 };
init_by_array(keyPtr, 4);
console.log(genrand_int32()); // 1067595299
console.log(genrand_int32()); //  955945823

// Real-valued draws.
init_genrand(5489);
console.log(genrand_real1()); // [0,1] inclusive, divided by 2^32 - 1
console.log(genrand_real2()); // [0,1) divided by 2^32
console.log(genrand_real3()); // (0,1) divided by 2^32 with +0.5 offset
console.log(genrand_res53()); // [0,1) with 53 bits of precision
```

State is module-global, exactly as in the original C source - the eight public functions all read and write a single shared `mt[624]` state vector.

## API

| Function | Returns | Notes |
|----------|---------|-------|
| `init_genrand(s)` | `void` | Seed with a single 32-bit integer. |
| `init_by_array(init_key, key_length)` | `void` | Seed by an array. `init_key` is the C `unsigned long init_key[]`; pass a CPtr-style record `{ buf: Uint8Array, off: 0 }` whose `buf` holds `key_length` little-endian uint32s. |
| `genrand_int32()` | `number` | Uniform 32-bit unsigned integer in `[0, 0xffffffff]`. |
| `genrand_int31()` | `number` | Uniform 31-bit unsigned integer in `[0, 0x7fffffff]`. |
| `genrand_real1()` | `number` | Uniform double in `[0, 1]` (divided by 2^32 - 1). |
| `genrand_real2()` | `number` | Uniform double in `[0, 1)` (divided by 2^32). |
| `genrand_real3()` | `number` | Uniform double in `(0, 1)`. |
| `genrand_res53()` | `number` | Uniform double in `[0, 1)` with 53 bits of precision. |

## Notes on the port

This is a mechanical C-to-TypeScript translation. The generated source preserves the original C structure and emits `// BRIDGE:` comments at every place where a C concept (CPtr pointer model, struct-as-class, pointer arithmetic, etc.) is modeled in TypeScript. The `mt[]` state and the `mti` counter are file-scope `static` in the C source and are translated as module-private bindings; the eight public functions in the API table above are the only re-exports.

The `index.ts` facade hides the runtime helpers (`cptr_*`, `__safe_*`, etc.) that ship in the compiled output but are not part of the package's public surface.

## License

BSD-3-Clause. See [LICENSE](./LICENSE). The upstream MT19937 C reference is BSD-3 licensed; this TypeScript port preserves those terms verbatim.

Original C version: Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura. TypeScript translation copyright (c) 2026 Scott Moore.
