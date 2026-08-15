# ts-parson

A direct TypeScript translation of the lightweight JSON parser in C.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

MIT License

> parson (original C version) - Copyright (c) 2012-2023 Krzysztof Gabis and parson contributors
>
> ts-parson (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.

## Usage

This is a direct translation of parson from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible.

To read more about parson, please see the [original parson repository](https://github.com/kgabis/parson).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, string handling, formatted I/O) are contained in the source itself.
- **No manual memory management for callers of accessors** - JavaScript's garbage collector replaces `malloc`/`free` for transient objects, but parson's own value-tree lifetime contract is preserved (see "Manual lifetime" below).
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Strings as CPtr views** - parson hands back a `{ buf, off }` view into the parsed bytes for string fields, mirroring C's `const char *`. JS callers convert to `string` with a small helper.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-parson
```

Or install with your preferred package manager:

```bash
yarn add ts-parson
pnpm add ts-parson
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp parson.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-parson.git
```

## Importing

When installed from npm:

```typescript
import { json_parse_string, json_value_get_object, json_object_get_string, json_value_free } from 'ts-parson';
```

When using the source file directly:

```typescript
import { json_parse_string, json_value_get_object, json_object_get_string, json_value_free } from './parson.js';
```

### Quick example

```typescript
import { json_parse_string, json_value_get_object, json_object_get_string, json_value_free } from 'ts-parson';

const root = json_parse_string('{"k":"v"}');
const obj = json_value_get_object(root);
const valPtr: any = json_object_get_string(obj, 'k');

const bytes: number[] = [];
for (let i = valPtr.off; i < valPtr.buf.length && valPtr.buf[i] !== 0; i++) bytes.push(valPtr.buf[i]);
console.log(String.fromCharCode(...bytes)); // v

json_value_free(root);
```

## Building

Unlike the original C version, ts-parson requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx parson.ts
```

Or with Deno:

```bash
deno run --allow-all parson.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild parson.ts --bundle --platform=node --outfile=dist/parson.js
```

## Data Structure

The C `JSON_Value` / `JSON_Object` / `JSON_Array` opaque types are preserved as TypeScript classes with identical field semantics. Value types are exposed as constants:

```typescript
const JSONError = -1, JSONNull = 1, JSONString = 2, JSONNumber = 3,
      JSONObject = 4, JSONArray = 5, JSONBoolean = 6;
```

Status codes (`JSONSuccess` = 0, `JSONFailure` = -1) are also exported. Helpers (`json_object_dotget_*`, `json_object_has_value`, `json_object_has_value_of_type`, etc.) work identically to the C originals.

## Tests

The repository includes the upstream parson fixtures and the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - parsing, serialization, and dotted-accessor scenarios from the upstream test suite.

## Caveats

The following limitations from the original C version still apply:

- **Strings as CPtr views** - `json_object_get_string` and friends return a `{ buf, off }` byte view (mirroring `const char *`), not a JS `string`. Convert with a NUL-scanning helper.
- **Booleans as 0/1** - parson's C API returns `int`, not `bool`. The translation preserves that.
- **Manual lifetime** - parson allocates its value tree on its own heap and frees it in `json_value_free`. Even though JavaScript has a garbage collector, the contract is preserved: call `json_value_free(root)` when you are done with a parsed tree to release any internally-tracked resources.
- **Numbers are `double`** - parson uses C `double` for all JSON numbers. JS numbers behave the same way; integers above 2^53 lose precision in both implementations.
- **Schema validation is structural only** - `json_validate` checks shape, not values; it is not a full JSON Schema validator.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns for transient objects.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Krzysztof Gabis](https://github.com/kgabis) - original author of parson
- [parson contributors](https://github.com/kgabis/parson/graphs/contributors) - ongoing maintenance of the C library
