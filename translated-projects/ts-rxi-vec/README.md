# ts-rxi-vec

A direct TypeScript translation of a type-safe dynamic-array C library.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

MIT License

> vec (original C version) - Copyright (c) 2014 rxi
>
> ts-rxi-vec (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Usage

This is a direct translation of [rxi/vec](https://github.com/rxi/vec) from C to TypeScript. The public API, struct layout, and per-call behaviour are preserved as faithfully as possible.

To read more about rxi/vec, please see the [original rxi/vec repository](https://github.com/rxi/vec).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, comparator helpers) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`. `rxi_vec_*_deinit` is still provided for parity with the C API, but is optional.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Pre-instantiated macros** - the upstream library is implemented as preprocessor macros that generate per-type code at every call site. Macros do not survive automated C-to-TypeScript translation, so this port exposes a fixed set of element types (`int`, `unsigned int`, `float`, `double`, `char *`, `void *`) with parallel wrapper APIs (`rxi_vec_int_*`, `rxi_vec_double_*`, etc.).
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-rxi-vec
```

Or install with your preferred package manager:

```bash
yarn add ts-rxi-vec
pnpm add ts-rxi-vec
```

Alternatively, because the core library is contained in a small set of files, you can copy them directly into your project:

```bash
cp driver.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-rxi-vec.git
```

## Importing

When installed from npm:

```typescript
import { vec_int_t, rxi_vec_int_init, rxi_vec_int_push, rxi_vec_int_get } from 'ts-rxi-vec';
```

When using the source file directly:

```typescript
import { vec_int_t, rxi_vec_int_init, rxi_vec_int_push, rxi_vec_int_get } from './driver.js';
```

### Quick example

```typescript
import { vec_int_t, rxi_vec_int_init, rxi_vec_int_push, rxi_vec_int_get } from 'ts-rxi-vec';

const v = new vec_int_t();
rxi_vec_int_init(v);
rxi_vec_int_push(v, 1);
rxi_vec_int_push(v, 2);
console.log(rxi_vec_int_get(v, 0), rxi_vec_int_get(v, 1));
// 1 2
```

## Building

Unlike the original C version, ts-rxi-vec requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx esbuild driver.ts --bundle --platform=node --outfile=dist/rxi-vec.js
```

## Data Structure

Each upstream `vec_t(T)` typedef is translated to a TypeScript class with the same three fields as the C struct:

```typescript
class vec_int_t {
  data: number[] | null = null;   // backing storage
  length: number = 0;             // logical size
  capacity: number = 0;           // allocated capacity
}
```

The published instantiations are `vec_int_t`, `vec_uint_t`, `vec_float_t`, `vec_double_t`, `vec_str_t` (T = `char *`), `vec_void_t` (T = `void *`), and `vec_char_t`. Each has a parallel `rxi_vec_<T>_*` wrapper API (`init`, `deinit`, `push`, `pop`, `length`, `capacity`, `get`, `set`, `first`, `last`, `insert`, `splice`, `swapsplice`, `swap`, `truncate`, `clear`, `reserve`, `compact`, `pusharr`, `extend`, `find`, `remove`, `reverse`, `sort`, `sum`, `sum_rev`).

## Tests

The repository includes the upstream rxi/vec semantics-preserving fixtures and the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - per-element-type push/pop/get/set/sort/find vectors covering each of the six instantiated types.

## Caveats

The following limitations from the original C version still apply:

- **Element types are fixed at translation time.** The published package supports `int`, `unsigned int`, `float`, `double`, `char *`, and `void *`. To add a new element type, fork the project, add the corresponding `vec_t(T)` typedef and `rxi_vec_<T>_*` wrappers in the upstream driver TU, and re-run the translator.
- **`vec_void_t` has no `sort` wrapper.** Upstream rxi/vec requires the caller to supply a comparator for opaque pointers; there is no canonical default.
- **`vec_str_t` element strings are caller-owned.** The wrappers do not `strdup` or `free` element strings, exactly as in the upstream C.
- **`push` returns `0` on success / `-1` on alloc failure**, matching the C contract. In practice the JavaScript port effectively never returns `-1` because `Array.push` does not fail.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns; `rxi_vec_*_deinit` is optional.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [rxi](https://github.com/rxi) - original author of the [vec](https://github.com/rxi/vec) C library.
- [vec contributors](https://github.com/rxi/vec/graphs/contributors) - ongoing maintenance of the C library.
