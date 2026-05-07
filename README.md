# ts-rxi-vec

TypeScript port of [rxi/vec](https://github.com/rxi/vec), a type-safe
dynamic-array library originally written in C as a small set of
preprocessor macros over a few helper functions.

This port pre-instantiates the rxi/vec macro API across six concrete
element types: `int`, `unsigned int`, `float`, `double`, `char*`, and
`void*`. Each element type gets a typed wrapper module that exposes
`init`, `push`, `pop`, `length`, `get`/`set`, `find`, `sort`,
`reverse`, `splice`, `swap`, `clear`, `extend`, and the rest of the
public vec API as ordinary TypeScript functions.

## Installation

```
npm install ts-rxi-vec
```

## Usage

### Integer vector

```typescript
import {
  vec_int_t,
  rxi_vec_int_init,
  rxi_vec_int_push,
  rxi_vec_int_get,
  rxi_vec_int_length,
  rxi_vec_int_sum,
  rxi_vec_int_deinit,
} from "ts-rxi-vec";

const v = new vec_int_t();
rxi_vec_int_init(v);
rxi_vec_int_push(v, 10);
rxi_vec_int_push(v, 20);
rxi_vec_int_push(v, 30);

console.log(rxi_vec_int_length(v)); // 3
console.log(rxi_vec_int_get(v, 1)); // 20
console.log(rxi_vec_int_sum(v));    // 60

rxi_vec_int_deinit(v);
```

### Double vector

```typescript
import {
  vec_double_t,
  rxi_vec_double_init,
  rxi_vec_double_push,
  rxi_vec_double_first,
  rxi_vec_double_last,
  rxi_vec_double_deinit,
} from "ts-rxi-vec";

const v = new vec_double_t();
rxi_vec_double_init(v);
rxi_vec_double_push(v, 1.5);
rxi_vec_double_push(v, 2.5);
rxi_vec_double_push(v, 3.5);

console.log(rxi_vec_double_first(v)); // 1.5
console.log(rxi_vec_double_last(v));  // 3.5

rxi_vec_double_deinit(v);
```

## Public API

### Vector struct types

These mirror the `vec_t(T)` instantiations in upstream `vec.h`:

- `vec_int_t`    - `T = int`
- `vec_uint_t`   - `T = unsigned int`
- `vec_double_t` - `T = double`
- `vec_float_t`  - `T = float`
- `vec_str_t`    - `T = char *`
- `vec_void_t`   - `T = void *`
- `vec_char_t`   - `T = char` (declared by upstream, not wrapped here)

Each is a class with `data`, `length`, and `capacity` fields.

### Per-type wrappers

For each element type the package exports a parallel wrapper API. The
table below lists the int variant; the same shape applies to `uint`,
`double`, `float`, `str`, and `void` (with the value/element type
substituted appropriately).

| Function                            | Description                                 |
|-------------------------------------|---------------------------------------------|
| `rxi_vec_int_init(v)`               | Zero the vector struct                      |
| `rxi_vec_int_deinit(v)`             | Free backing storage and zero the struct    |
| `rxi_vec_int_push(v, x)`            | Append element                              |
| `rxi_vec_int_pop(v)`                | Remove and return last element              |
| `rxi_vec_int_length(v)`             | Current logical size                        |
| `rxi_vec_int_capacity(v)`           | Current allocated capacity                  |
| `rxi_vec_int_get(v, i)`             | Read element at index `i`                   |
| `rxi_vec_int_set(v, i, x)`          | Write element at index `i`                  |
| `rxi_vec_int_first(v)`              | Return element 0                            |
| `rxi_vec_int_last(v)`               | Return element `length - 1`                 |
| `rxi_vec_int_insert(v, idx, x)`     | Insert at index, shifting tail right        |
| `rxi_vec_int_splice(v, start, n)`   | Remove `n` elements at `start`              |
| `rxi_vec_int_swapsplice(v, start, n)` | Swap-remove (`O(1)`-style) `n` elements   |
| `rxi_vec_int_swap(v, i, j)`         | Swap two elements                           |
| `rxi_vec_int_truncate(v, len)`      | Shrink length to `len`                      |
| `rxi_vec_int_clear(v)`              | Set length to 0 (keeps capacity)            |
| `rxi_vec_int_reserve(v, n)`         | Ensure capacity >= n                        |
| `rxi_vec_int_compact(v)`            | Shrink capacity to length                   |
| `rxi_vec_int_pusharr(v, arr, n)`    | Append `n` elements from a raw array        |
| `rxi_vec_int_extend(v, v2)`         | Append all of `v2` to `v`                   |
| `rxi_vec_int_find(v, x)`            | Index of first match (or -1)                |
| `rxi_vec_int_remove(v, x)`          | Remove first occurrence of `x`              |
| `rxi_vec_int_reverse(v)`            | Reverse elements in place                   |
| `rxi_vec_int_sort(v)`               | Sort with the per-type comparator           |
| `rxi_vec_int_sum(v)`                | Sum (also exists for double); demonstrates `vec_foreach` |
| `rxi_vec_int_sum_rev(v)`            | Sum in reverse; demonstrates `vec_foreach_rev` |

`vec_void_t` does not get a `sort` wrapper because there is no canonical
comparator for opaque pointers - upstream rxi/vec requires the caller
to supply one.

`vec_str_t` element strings are owned by the caller; the wrappers do
not strdup or free them.

`rxi_vec_smoke()` is a small end-to-end exercise across multiple typed
vectors (kept for parity with the upstream driver TU).

## Note on the translation shape

This is a "fixed-instantiation" port. The original rxi/vec library is
implemented as preprocessor macros that generate per-type code at each
call site. Macros do not survive automated C-to-TypeScript translation
as callable functions, so the package exposes a fixed set of element
types instead. If you need a vector for an element type that is not in
the list above, fork the project, add the corresponding `vec_t(T)`
typedef and `rxi_vec_<T>_*` wrappers in
`compiler/tests/real-world/rxi-vec-full/src/driver.c`, and re-run the
translator.

For the original macro API, see https://github.com/rxi/vec.

## License

MIT. Original C version copyright (c) 2014 rxi. TypeScript translation
copyright (c) 2026 Scott Moore. See `LICENSE` for the full text.
