# ts-sglib

A direct TypeScript translation of a generic data structures library (LIST, DL_LIST, SORTED_LIST, RBTREE, HASHED_CONTAINER).

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

MIT License

> SGLIB (original C version) - Copyright (c) 2003-2005 Marian Vittek; mirror maintained by Stefan Tauner (https://github.com/stefanct/sglib) and SGLIB contributors
>
> ts-sglib (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Usage

This is a direct translation of SGLIB from C to TypeScript. The public API, data structures, and behaviour are preserved as faithfully as possible.

To read more about SGLIB, please see the [original SGLIB site](https://sglib.sourceforge.net/) and the [GitHub mirror](https://github.com/stefanct/sglib).

The key differences from the C version are:

- **Zero dependencies** - all C standard library shims are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **No macro generics** - SGLIB derives its value from C preprocessor macros that instantiate generic data structures over arbitrary user-defined types. C macros do not survive C-to-TypeScript translation, so this package ships a fixed set of pre-instantiated element types and the operations generated for each. To instantiate over a different element type, fork the upstream `driver.c`, edit the typedefs and `SGLIB_DEFINE_*` macro invocations, re-run the translator, and use the resulting `driver.ts`.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

### Pre-instantiated element types

| Element type     | Used by                                                |
|------------------|--------------------------------------------------------|
| `int_node`       | `LIST` (singly-linked, integer payload)                |
| `str_node_list`  | `LIST` (singly-linked, string-keyed)                   |
| `intkv_node`     | `LIST` and `HASHED_CONTAINER` (int-keyed entries)      |
| `int_node_dl`    | `DL_LIST` (doubly-linked, integer payload)             |
| `int_node_sl`    | `SORTED_LIST` (sorted singly-linked, integer payload)  |
| `int_node_rb`    | `RBTREE` (red-black tree, integer payload)             |

All five SGLIB data-structure families (LIST, DL_LIST, SORTED_LIST, RBTREE, HASHED_CONTAINER) are runtime-functional in this build.

## Installation

Install from npm:

```bash
npm install ts-sglib
```

Or install with your preferred package manager:

```bash
yarn add ts-sglib
pnpm add ts-sglib
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp driver.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-sglib.git
```

## Importing

When installed from npm:

```typescript
import { int_node, sglib_int_node_add, sglib_int_node_len } from 'ts-sglib';
```

When using the source file directly:

```typescript
import { int_node, sglib_int_node_add, sglib_int_node_len } from './driver.js';
```

### Quick example

```typescript
import {
  int_node,
  sglib_int_node_add,
  sglib_int_node_len,
  sglib_int_node_find_member,
  sglib_int_node_reverse,
} from 'ts-sglib';

const make = (v: number) => Object.assign(new int_node(),
  { v, next: null, prev: null, left: null, right: null, color: 0 });

// SGLIB's C signatures take T** for the head; in TS that becomes a {value} ref-box.
const list: { value: int_node | null } = { value: null };
sglib_int_node_add(list, make(1));
sglib_int_node_add(list, make(2));
sglib_int_node_add(list, make(3));

console.log(sglib_int_node_len(list.value));                              // 3
console.log(sglib_int_node_find_member(list.value, make(2))?.v);          // 2

sglib_int_node_reverse(list);
console.log(list.value?.v);                                               // 1
```

## Building

Unlike the original C version, ts-sglib requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

## TypeScript Compiler

If your project uses TypeScript, add the file to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": false,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"]
}
```

> **Important:** The translated code uses patterns that emulate C pointer arithmetic and unsafe type casts. It is intentionally **not** `strict`-compliant. You should isolate it in its own module (as shown above) and wrap it in a strictly-typed API surface for the rest of your application.

## Node.js / tsx

Run directly without pre-compilation:

```bash
npx tsx driver.ts
```

Or with Deno:

```bash
deno run --allow-all driver.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild driver.ts --bundle --platform=node --outfile=dist/sglib.js
```

## Data Structures

Each pre-instantiated SGLIB element type is exported as a TypeScript class. Fields must be initialised explicitly because the runtime does not zero-fill C struct fields automatically.

```typescript
class int_node    { v = 0; next: int_node|null = null; prev: int_node|null = null;
                    left: int_node|null = null; right: int_node|null = null; color = 0; }
class int_node_rb { v = 0; left: int_node_rb|null = null; right: int_node_rb|null = null; color = 0; }
class intkv_node  { k = 0; v = 0; next_in_chain: intkv_node|null = null; }
// ... and int_node_dl, int_node_sl, str_node_list
```

### Public operations (grouped by data structure)

- **LIST** (`sglib_int_node_*`, `sglib_str_node_list_*`, `sglib_intkv_node_*`): `add`, `add_if_not_member`, `concat`, `delete`, `delete_if_member`, `is_member`, `find_member`, `sort`, `len`, `reverse`, plus `it_init`, `it_init_on_equal`, `it_current`, `it_next` walkers.
- **DL_LIST** (`sglib_int_node_dl_*`): all LIST operations plus `add_after`, `add_before`, `add_after_if_not_member`, `add_before_if_not_member`, `get_first`, `get_last`.
- **SORTED_LIST** (`sglib_int_node_sl_*`): `add`, `add_if_not_member`, `delete`, `delete_if_member`, `find_member`, `is_member`, `len`, `sort`, plus iterator.
- **RBTREE** (`sglib_int_node_rb_*`): `add`, `add_if_not_member`, `delete`, `delete_if_member`, `find_member`, `is_member`, `len`, plus pre-/in-/post-order iterators.
- **HASHED_CONTAINER** (`sglib_hashed_intkv_node_*`): `init`, `add`, `add_if_not_member`, `delete`, `delete_if_member`, `is_member`, `find_member`, plus iterator. Open-addressed; the table is a fixed-length JS array supplied by the caller.
- **Smoke / probe helpers**: `sglib_full_smoke` and `sglib_full_probe_*` are deterministic end-to-end exercises used by the upstream cpp-to-ts validator; they exercise all five data structures.

Internal CPtr / runtime shims (`cptr_*`, `__cpp_*`, `__safe_*`, `__struct_*`, `__field_ref_*`, `realloc`, etc.) are deliberately not re-exported.

## Tests

The repository includes the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - exercise of every operation across all five data-structure families against the upstream reference behaviour.

## Caveats

The following limitations from the original C version still apply:

- **Pre-instantiated element types only** - SGLIB's value is C macro generics; ts-sglib ships only the six element types listed above. Adding a new element type requires regenerating the translation from a modified `driver.c`.
- **Caller-managed head/root** - SGLIB rewrites the head/root pointer on insert and delete. Pass it as `{ value: head }` so the function can re-seat it.
- **Open-addressed hash table** - the `HASHED_CONTAINER` table is a caller-supplied fixed-length array; no automatic growth.
- **Explicit field initialisation** - SGLIB structs must have `next`/`prev`/`left`/`right`/`color` set on construction; the translator does not zero-fill struct fields automatically.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Marian Vittek](https://sglib.sourceforge.net/) - original author of SGLIB
- [Stefan Tauner](https://github.com/stefanct) - GitHub mirror maintainer
- [SGLIB contributors](https://github.com/stefanct/sglib/graphs/contributors) - ongoing maintenance of the C library
