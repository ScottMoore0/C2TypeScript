# ts-cJSON

A direct TypeScript translation of the ultralightweight JSON parser in ANSI C.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [cJSON](https://github.com/DaveGamble/cJSON), the original C library by Dave Gamble. The translation tracks the upstream's `master` branch as of publication.

License terms are inherited from the upstream — see `## License` below.

## License

MIT License

> cJSON (original C version) - Copyright (c) 2009-2017 Dave Gamble and cJSON contributors
>
> ts-cJSON (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
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

This is a direct translation of cJSON from C to TypeScript. The public API, data structures, and behavior are preserved as faithfully as possible. 

To read more about cJSON, please see the [original cJSON repository](https://github.com/DaveGamble/cJSON).

The key differences from the C version are:
- **Zero dependencies** - all C standard library shims (memory management, string handling, formatted I/O) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply.

## Installation

Install from npm:

```bash
npm install ts-cjson
```

Or install with your preferred package manager:

```bash
yarn add ts-cjson
pnpm add ts-cjson
```

Alternatively, because the core library is contained in a single self-contained file (`cJSON.ts`), you can copy it directly into your project:

```bash
cp cJSON.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-cJSON.git
```

## Importing

When installed from npm:

```typescript
import { cJSON_Parse, cJSON_Print, cJSON_CreateObject, cJSON_AddStringToObject, cJSON_Delete } from 'ts-cjson';
```

When using the source file directly:

```typescript
import { cJSON_Parse, cJSON_Print, cJSON_CreateObject, cJSON_AddStringToObject, cJSON_Delete } from './cJSON.js';
```

### Quick example

```typescript
import { cJSON_Parse, cJSON_Print, cJSON_CreateObject, cJSON_AddStringToObject, cJSON_AddNumberToObject, cJSON_Delete } from 'ts-cjson';

// Parse JSON
const json = cJSON_Parse('{"name":"Awesome 4K","resolutions":[{"width":1280,"height":720}]}');

// Print JSON
const printed = cJSON_Print(json);
console.log(printed); // formatted JSON string

// Build JSON programmatically
const monitor = cJSON_CreateObject();
cJSON_AddStringToObject(monitor, "name", "Awesome 4K");
cJSON_AddNumberToObject(monitor, "width", 3840);
cJSON_AddNumberToObject(monitor, "height", 2160);

const output = cJSON_Print(monitor);
console.log(output);

// Cleanup
// Note: In the translated TypeScript, cJSON_Delete is still provided for API
// compatibility, but JavaScript's garbage collector handles most cleanup
// automatically. Use cJSON_Delete when you want to release internal buffers
// immediately or when porting existing C code verbatim.
cJSON_Delete(monitor);
```

## Building

Unlike the original C version, ts-cJSON requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx cJSON.ts
```

Or with Deno:

```bash
deno run --allow-all cJSON.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild cJSON.ts --bundle --platform=node --outfile=dist/cjson.js
```

## Data Structure

The C `struct cJSON` has been translated to a TypeScript class with identical field names:

```typescript
class cJSON {
  next: any = null;
  prev: any = null;
  child: any = null;
  type: number = 0;
  valuestring: string = "";
  valueint: number = 0;
  valuedouble: number = 0;
  string: string = "";
}
```

Type checking functions (`cJSON_IsString`, `cJSON_IsNumber`, etc.) behave exactly as in the C version.

## Tests

The repository includes the original cJSON test fixtures and the translated Unity test framework. To run the tests:

```bash
# If a test runner entry point is available
npx tsx tests/unity/test/tests/testunity.ts
```

Test data is located in:
- `tests/inputs/` - JSON parse/print round-trip fixtures
- `tests/json-patch-tests/` - JSON Patch / JSON Pointer test suites (for cJSON_Utils)
- `fuzzing/inputs/` - Fuzzing corpus

## Caveats

The following limitations from the original C version still apply:

- **Zero character in strings** - cJSON does not support strings containing `\u0000`.
- **UTF-8 only** - Input must be valid UTF-8.
- **Floating point** - IEEE-754 double precision is assumed.
- **Deep nesting limit** - Nesting is limited to 1000 levels by default.
- **Case sensitivity** - Object key lookups are case-sensitive.
- **Duplicate keys** - Objects with duplicate member names are supported in parsing/printing, but `cJSON_GetObjectItemCaseSensitive` returns only the first match.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Dave Gamble](https://github.com/DaveGamble) - original author of cJSON
- [cJSON contributors](https://github.com/DaveGamble/cJSON/blob/master/CONTRIBUTORS.md) - ongoing maintenance of the C library
