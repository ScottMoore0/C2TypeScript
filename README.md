# ts-inih

A direct TypeScript translation of a simple INI file parser.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

BSD 3-Clause License

> inih (original C version) - Copyright (c) 2009 Ben Hoyt and inih contributors. All rights reserved.
>
> ts-inih (direct TypeScript translation) - Copyright (c) 2026 Scott Moore. All rights reserved.
>
> Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
>
> * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
> * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
> * Neither the name of Ben Hoyt nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
>
> THIS SOFTWARE IS PROVIDED BY BEN HOYT ''AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL BEN HOYT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Usage

This is a direct translation of inih from C to TypeScript. The public API, data structures, and behaviour are preserved as faithfully as possible.

To read more about inih, please see the [original inih repository](https://github.com/benhoyt/inih).

The key differences from the C version are:

- **Zero dependencies** - all C standard library shims (string handling, file I/O surface) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Pointer-style argument passing** - the handler callback receives `section`, `name`, and `value` as `{ buf: Uint8Array, off: number }` C-string pointers; decode with the helper shown below or with `TextDecoder`.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-inih
```

Or install with your preferred package manager:

```bash
yarn add ts-inih
pnpm add ts-inih
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp ini.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-inih.git
```

## Importing

When installed from npm:

```typescript
import { ini_parse_string } from 'ts-inih';
```

When using the source file directly:

```typescript
import { ini_parse_string } from './ini.js';
```

### Quick example

```typescript
import { ini_parse_string } from 'ts-inih';

const enc = new TextEncoder();
const cstr = (s: string) => {
  const data = enc.encode(s);
  const buf = new Uint8Array(data.length + 1);
  buf.set(data);
  return { buf, off: 0 };
};
const read = (p: any) => {
  if (p == null) return '';
  let end = p.off;
  while (end < p.buf.length && p.buf[end] !== 0) end++;
  return String.fromCharCode(...p.buf.slice(p.off, end));
};

const handler = (_u: any, section: any, name: any, value: any) => {
  console.log(`[${read(section)}] ${read(name)}=${read(value)}`);
  return 1;
};

ini_parse_string(cstr("[owner]\nname = Alice\nemail: alice@example.com\n"), handler, null);
// [owner] name=Alice
// [owner] email=alice@example.com
```

## Building

Unlike the original C version, ts-inih requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx ini.ts
```

Or with Deno:

```bash
deno run --allow-all ini.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild ini.ts --bundle --platform=node --outfile=dist/ini.js
```

## API

The package exports the inih public surface:

- `ini_parse_string(string, handler, user)` - parse an INI string. Returns 0 on success, the line number of the first error otherwise.
- `ini_parse_string_length(string, length, handler, user)` - parse a length-bounded INI string.
- `ini_parse_stream(reader, stream, handler, user)` - parse via a custom reader callback that mimics `fgets`.
- `ini_parse_file(file, handler, user)` - parse from an open file handle.
- `ini_parse(filename, handler, user)` - parse from a filename (opens the file internally).
- `ini_parse_string_ctx` - context class used by the string-stream reader.

The handler signature is `(user, section, name, value) => number`. Return non-zero to continue parsing, zero to stop with an error.

## Tests

The repository includes the translated test framework and the upstream reference fixtures. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - parser conformance vectors covering sections, comments, multi-line values, and inline comment handling.

## Caveats

The following limitations from the original C version still apply:

- **SAX-style streaming** - the parser invokes a handler for each `name=value` pair; it does not build an in-memory tree. Build your own object incrementally inside the handler.
- **Single-pass error recovery** - returning zero from the handler aborts parsing immediately and reports the current line number.
- **Compile-time options not applicable** - upstream behaviour switches like `INI_ALLOW_MULTILINE`, `INI_ALLOW_BOM`, and `INI_ALLOW_INLINE_COMMENTS` were resolved at translation time. The defaults match the upstream C defaults; to change them, regenerate the translation with different `cppFlags`.
- **No section reset notification** - by default the handler is only invoked for `name=value` pairs, not for section headers themselves.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Stack vs heap line buffer** - the upstream `INI_USE_STACK` toggle has no equivalent under JavaScript's runtime.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Ben Hoyt](https://github.com/benhoyt) - original author of inih
- [inih contributors](https://github.com/benhoyt/inih/graphs/contributors) - ongoing maintenance of the C library
