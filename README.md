# ts-fnv-hash

A zero-dependency TypeScript port of the Fowler-Noll-Vo (FNV) hash by
Landon Curt Noll. Provides FNV-1 32-bit and 64-bit hashing for byte
buffers and strings.

## Installation

```
npm install ts-fnv-hash
```

## Usage

```typescript
import {
  fnv_32_str,
  fnv_32_buf,
  fnv_64_str,
  fnv_64_buf,
  FNV1_32_INIT,
  fnv1_64_init,
} from 'ts-fnv-hash';

// 32-bit FNV-1 of a string
const h32 = fnv_32_str('hello', FNV1_32_INIT);
console.log(h32.toString(16)); // "4f9f2cab"

// 32-bit FNV-1 of a byte buffer
const bytes = new TextEncoder().encode('hello');
const h32b = fnv_32_buf({ buf: bytes, off: 0 }, bytes.length, FNV1_32_INIT);

// 64-bit FNV-1 of a string. The 64-bit hash is carried in a Fnv64_t
// struct of two 32-bit words; clone the seed before each call so the
// initial state is not mutated.
const seed = Object.assign(Object.create(Object.getPrototypeOf(fnv1_64_init)), {
  w32: [...fnv1_64_init.w32],
});
const h64 = fnv_64_str('hello', seed);
const hex64 =
  h64.w32[1].toString(16).padStart(8, '0') +
  h64.w32[0].toString(16).padStart(8, '0');
console.log(hex64); // "7b495389bdbdd4c7"
```

## API

### 32-bit

- `fnv_32_str(str: string, hval: number): number`

  FNV-1 32-bit hash of a NUL-terminated string. Pass `FNV1_32_INIT`
  (`0x811c9dc5`) as the initial hash value.

- `fnv_32_buf(buf: { buf: Uint8Array; off: number }, len: number, hval: number): number`

  FNV-1 32-bit hash of an arbitrary byte buffer. The buffer is wrapped
  as a `CPtr`-shaped object `{ buf, off }` to mirror the original C
  pointer semantics.

### 64-bit

- `fnv_64_str(str: string, hval: Fnv64_t): Fnv64_t`
- `fnv_64_buf(buf: { buf: Uint8Array; off: number }, len: number, hval: Fnv64_t): Fnv64_t`

  Both functions return the running hash in a `Fnv64_t` carrying two
  32-bit words `w32[0]` (low) and `w32[1]` (high). The 64-bit value in
  conventional big-end-first hex is `w32[1] << 32 | w32[0]`.

### Constants

- `FNV1_32_INIT` `= 0x811c9dc5`
- `FNV_32_PRIME` `= 0x01000193`
- `fnv0_64_init` `= Fnv64_t { w32: [0, 0] }`
- `fnv1_64_init` `= Fnv64_t { w32: [0x84222325, 0xcbf29ce4] }`

## Reference

Fowler-Noll-Vo hash function:
http://www.isthe.com/chongo/tech/comp/fnv/

Upstream C reference implementation:
https://github.com/lcn2/fnv

## License

Public domain (Unlicense). Original C by Landon Curt Noll. TypeScript
translation copyright (c) 2026 Scott Moore, released under the same
public-domain terms. See `LICENSE`.
