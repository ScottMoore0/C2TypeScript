# ts-tiny-regex-c

A direct TypeScript translation of the small portable regex matcher inspired by Rob Pike.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [tiny-regex-c](https://github.com/kokke/tiny-regex-c), the original C library by kokke. The translation tracks the upstream's `master` branch as of publication.

License terms are inherited from the upstream — see `## License` below.

## License

Public domain (Unlicense)

> tiny-regex-c (original C version) - released into the public domain by kokke and tiny-regex-c contributors
>
> ts-tiny-regex-c (direct TypeScript translation) - Copyright (c) 2026 Scott Moore, released into the public domain under the same Unlicense terms as the upstream
>
> This is free and unencumbered software released into the public domain.
>
> Anyone is free to copy, modify, publish, use, compile, sell, or distribute
> this software, either in source code form or as a compiled binary, for any
> purpose, commercial or non-commercial, and by any means.
>
> In jurisdictions that recognize copyright laws, the author or authors of
> this software dedicate any and all copyright interest in the software to
> the public domain. We make this dedication for the benefit of the public
> at large and to the detriment of our heirs and successors. We intend this
> dedication to be an overt act of relinquishment in perpetuity of all
> present and future rights to this software under copyright law.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
> ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
> WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
>
> For more information, please refer to <https://unlicense.org>

## Usage

This is a direct translation of tiny-regex-c from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible.

To read more about tiny-regex-c, please see the [original tiny-regex-c repository](https://github.com/kokke/tiny-regex-c).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, string handling, formatted I/O) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`. The original tiny-regex-c already avoids dynamic allocation entirely; the port preserves that property.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Match length as out-parameter object** - the C `int* matchlength` becomes a `{ value: number }` box, mirroring the C out-parameter idiom.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-tiny-regex-c
```

Or install with your preferred package manager:

```bash
yarn add ts-tiny-regex-c
pnpm add ts-tiny-regex-c
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp re.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-tiny-regex-c.git
```

## Importing

When installed from npm:

```typescript
import { re_match, re_matchp, re_compile } from 'ts-tiny-regex-c';
```

When using the source file directly:

```typescript
import { re_match, re_matchp, re_compile } from './re.js';
```

### Quick example

```typescript
import { re_match } from 'ts-tiny-regex-c';

const len = { value: 0 };
const idx = re_match('a+', 'aaab', len);
console.log(idx, len.value); // 0 3
```

For repeated matching of the same pattern, compile once and reuse:

```typescript
import { re_compile, re_matchp } from 'ts-tiny-regex-c';

const len = { value: 0 };
const pat = re_compile('\\d+');
console.log(re_matchp(pat, 'hello 42 world', len), len.value); // 6 2
```

## Building

Unlike the original C version, ts-tiny-regex-c requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx re.ts
```

Or with Deno:

```bash
deno run --allow-all re.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild re.ts --bundle --platform=node --outfile=dist/re.js
```

## Supported syntax

| Pattern   | Meaning                                                  |
|-----------|----------------------------------------------------------|
| `.`       | Any single character                                     |
| `^`       | Start-of-string anchor                                   |
| `$`       | End-of-string anchor                                     |
| `*`       | Zero or more of the previous atom (greedy)               |
| `+`       | One or more of the previous atom (greedy)                |
| `?`       | Zero or one of the previous atom (non-greedy)            |
| `[abc]`   | Character class: one of a, b, c                          |
| `[a-z]`   | Character range                                          |
| `\d` `\D` | Digit / non-digit                                        |
| `\w` `\W` | Word character / non-word character                      |
| `\s` `\S` | Whitespace / non-whitespace                              |

## Tests

The repository includes the upstream tiny-regex-c fixtures and the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - pattern / text / expected-index fixtures covering anchors, quantifiers, and character classes.

## Caveats

The following limitations from the original C version still apply:

- **Inverted character classes (`[^abc]`) are buggy** - documented as broken in the upstream and inherited by this port. See the upstream test harness for concrete examples.
- **No alternation (`|`)** - the upstream lists this on its TODO and it is not implemented here either.
- **No capturing groups** - constructs like `(...)`, `(?P<name>...)`, and back-references are not supported.
- **Greedy by default** - `*` and `+` are greedy; `?` is non-greedy. There are no other quantifier modifiers.
- **ASCII-oriented** - character classes (`\w`, `\d`, etc.) match the ASCII subset described in the upstream README; multi-byte / Unicode handling is the caller's responsibility.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).
- **Call-stack exhaustion** - the upstream offers a recursive build mode and prefers iteration to avoid stack blow-ups; the translated port already runs in JS engines with their own stack-management strategy.

## Acknowledgements

- [kokke](https://github.com/kokke) - original author of tiny-regex-c
- [tiny-regex-c contributors](https://github.com/kokke/tiny-regex-c/graphs/contributors) - ongoing maintenance of the C library
- Rob Pike - whose regex code from *Beautiful Code* inspired the upstream design
