# ts-clibs-list

A direct TypeScript translation of a simple, generic doubly-linked list with iterator support.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

MIT License

> list (original C version) - Copyright (c) 2009-2010 TJ Holowaychuk and clibs contributors
>
> ts-clibs-list (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Usage

This is a direct translation of clibs/list from C to TypeScript. The public API, data structures, and behaviour are preserved as faithfully as possible.

To read more about clibs/list, please see the [original list repository](https://github.com/clibs/list).

The key differences from the C version are:

- **Zero dependencies** - all C standard library shims are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`. `list_destroy` and `list_iterator_destroy` are preserved for API parity but become essentially no-ops under GC.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Generic via `any` value field** - the C version stored `void*`; the TypeScript port stores `any` so any JavaScript value can serve as a node payload directly.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-clibs-list
```

Or install with your preferred package manager:

```bash
yarn add ts-clibs-list
pnpm add ts-clibs-list
```

Alternatively, because the core library is contained in a small set of files under `src/`, you can copy them directly into your project:

```bash
cp -r src /path/to/your/project/src/clibs-list
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-clibs-list.git
```

## Importing

When installed from npm:

```typescript
import { list_new, list_node_new, list_rpush, LIST_HEAD } from 'ts-clibs-list';
```

When using the source directly:

```typescript
import { list_new, list_rpush } from './src/list.js';
import { list_node_new } from './src/list_node.js';
import { list_iterator_new, list_iterator_next, list_iterator_destroy } from './src/list_iterator.js';
```

### Quick example

```typescript
import {
  list_new, list_node_new, list_rpush, list_at,
  list_iterator_new, list_iterator_next, list_iterator_destroy,
  LIST_HEAD,
} from 'ts-clibs-list';

const l = list_new()!;
list_rpush(l, list_node_new("one")!);
list_rpush(l, list_node_new("two")!);
list_rpush(l, list_node_new("three")!);

console.log(list_at(l, 0)?.val);   // one
console.log(list_at(l, -1)?.val);  // three  (negative indices count from tail)

const it = list_iterator_new(l, LIST_HEAD);
for (let n = list_iterator_next(it); n; n = list_iterator_next(it)) {
  console.log(n.val);              // one, two, three
}
list_iterator_destroy(it);
```

## Building

Unlike the original C version, ts-clibs-list requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

## TypeScript Compiler

If your project uses TypeScript, add the files to your `tsconfig.json`:

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
npx tsx src/list.ts
```

Or with Deno:

```bash
deno run --allow-all src/list.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild index.ts --bundle --platform=node --outfile=dist/list.js
```

## Data Structure

The C `list_t` and `list_node_t` types have been translated to TypeScript classes with identical field names:

```typescript
class list_t {
  head: list_node | null = null;
  tail: list_node | null = null;
  len: number = 0;
  free: ((val: any) => void) | null = null;
  match: ((a: any, b: any) => number) | null = null;
}

class list_node {
  prev: list_node | null = null;
  next: list_node | null = null;
  val: any = null;
}

class list_iterator_t {
  next: list_node | null = null;
  direction: number = 0;  // LIST_HEAD or LIST_TAIL
}
```

### API

- `LIST_HEAD`, `LIST_TAIL` - iteration direction constants.
- `list_new(): list_t | null` - create an empty list.
- `list_destroy(self)` - free a list and all its nodes (no-op effective under GC).
- `list_node_new(val): list_node | null` - create a node holding `val`.
- `list_rpush(self, node)` - append at the tail.
- `list_lpush(self, node)` - prepend at the head.
- `list_rpop(self)` - remove and return the tail node.
- `list_lpop(self)` - remove and return the head node.
- `list_at(self, index)` - return the node at `index` (negative counts from tail).
- `list_find(self, val)` - find a node by value, using `self.match` if set or strict equality otherwise.
- `list_remove(self, node)` - unlink a node from the list.
- `list_iterator_new(list, direction)` - create an iterator at the head or tail.
- `list_iterator_new_from_node(node, direction)` - create an iterator starting at `node`.
- `list_iterator_next(self)` - advance the iterator and return the current node.
- `list_iterator_destroy(self)` - free the iterator (no-op under GC).

## Tests

The repository includes the translated test framework and the upstream conformance fixtures. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - push/pop, indexing, iteration in both directions, and `list_find` with custom match callbacks.

## Caveats

The following limitations from the original C version still apply:

- **Generic via `void *`** - the upstream stores opaque pointers; the TypeScript port stores `any`. Type-safety on the payload is the caller's responsibility.
- **Optional `free`/`match` callbacks** - the upstream relies on the caller setting `self.free` and `self.match` to control deallocation and equality semantics. The defaults (`null`) preserve the upstream behaviour: no destructor is run, and `list_find` falls back to strict equality.
- **Iterator invalidation** - removing nodes during iteration follows the upstream's contract; mutating the list invalidates iterators positioned ahead of the removed node.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns; `list_destroy` and `list_iterator_destroy` are no-op-effective.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [TJ Holowaychuk](https://github.com/tj) - original author of clibs/list
- [clibs contributors](https://github.com/clibs/list/graphs/contributors) - ongoing maintenance of the C library
