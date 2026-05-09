# ts-jsmn

A direct TypeScript translation of the minimal JSON tokenizer in ANSI C.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

MIT License

> jsmn (original C version) - Copyright (c) 2010 Serge Zaitsev and jsmn contributors
>
> ts-jsmn (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
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

This is a direct translation of jsmn from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible.

To read more about jsmn, please see the [original jsmn repository](https://github.com/zserge/jsmn).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, string handling, formatted I/O) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`. The original jsmn already avoids dynamic allocation entirely; the port preserves that property by accepting a caller-allocated `jsmntok[]`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Byte-buffer input** - the input string is passed as a `{ buf: Uint8Array, off: number }` CPtr rather than a C `const char*`.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-jsmn
```

Or install with your preferred package manager:

```bash
yarn add ts-jsmn
pnpm add ts-jsmn
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp jsmn.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-jsmn.git
```

## Importing

When installed from npm:

```typescript
import { jsmn_parser, jsmntok, jsmn_init, jsmn_parse, JSMN_OBJECT, JSMN_STRING, JSMN_PRIMITIVE } from 'ts-jsmn';
```

When using the source file directly:

```typescript
import { jsmn_parser, jsmntok, jsmn_init, jsmn_parse, JSMN_OBJECT, JSMN_STRING, JSMN_PRIMITIVE } from './jsmn.js';
```

### Quick example

```typescript
import { jsmn_parser, jsmntok, jsmn_init, jsmn_parse, JSMN_STRING } from 'ts-jsmn';

const json = '{"k":"v"}';
const bytes = new Uint8Array(json.length);
for (let i = 0; i < json.length; i++) bytes[i] = json.charCodeAt(i);

const tokens: jsmntok[] = Array.from({ length: 8 }, () => new jsmntok());
const parser = new jsmn_parser();
jsmn_init(parser);
const n = jsmn_parse(parser, { buf: bytes, off: 0 }, json.length, tokens, tokens.length);

const valTok = tokens[2]; // 0=object, 1=key "k", 2=value "v"
console.log(n, valTok.type === JSMN_STRING, json.slice(valTok.start, valTok.end));
// 3 true v
```

## Building

Unlike the original C version, ts-jsmn requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx jsmn.ts
```

Or with Deno:

```bash
deno run --allow-all jsmn.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild jsmn.ts --bundle --platform=node --outfile=dist/jsmn.js
```

## Data Structure

The C `struct jsmntok_t` has been translated to a TypeScript class with identical field names:

```typescript
class jsmntok {
  type: number = 0;   // JSMN_OBJECT | JSMN_ARRAY | JSMN_STRING | JSMN_PRIMITIVE
  start: number = 0;  // inclusive byte offset of first character
  end: number = 0;    // exclusive byte offset just past the last character
  size: number = 0;   // child count for objects/arrays/keys, 0 otherwise
}
```

The `size` field on object and array tokens is the count of immediate children. The `size` field on a string that is an object key is the number of value tokens it owns (always 1 for well-formed JSON). The `size` field on a primitive (number, true, false, null) or value-string is 0.

Token types are exposed as the constants `JSMN_UNDEFINED`, `JSMN_OBJECT`, `JSMN_ARRAY`, `JSMN_STRING`, `JSMN_PRIMITIVE`. Error codes are `JSMN_ERROR_NOMEM` (-1, not enough tokens), `JSMN_ERROR_INVAL` (-2, invalid character), `JSMN_ERROR_PART` (-3, partial input).

## Tests

The repository includes the upstream jsmn fixtures and the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - object, array, primitive, and partial-input parsing scenarios.

## Caveats

The following limitations from the original C version still apply:

- **Tokens, not a tree** - jsmn does not allocate value objects. It returns a flat array of `[start, end)` byte ranges; callers slice the input buffer themselves.
- **Pre-sized token array** - the caller must allocate `jsmntok[]` up front. Running out of room returns `JSMN_ERROR_NOMEM` and the caller may grow the array and re-parse.
- **No primitive type discrimination** - jsmn does not classify primitives as number / boolean / null. Inspect the first character of the matched range to tell them apart.
- **No string unescaping** - jsmn returns raw byte ranges. JSON escapes (`\n`, `\uXXXX`, etc.) are the caller's responsibility.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Serge Zaitsev](https://github.com/zserge) - original author of jsmn
- [jsmn contributors](https://github.com/zserge/jsmn/graphs/contributors) - ongoing maintenance of the C library
