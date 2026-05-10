# ts-picohttpparser

A direct TypeScript translation of [picohttpparser](https://github.com/h2o/picohttpparser), the tiny HTTP/1.x request, response, and header parser written in C by Kazuho Oku and used by the h2o HTTP server, HTTP::Parser::XS, and many other production HTTP stacks.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [picohttpparser](https://github.com/h2o/picohttpparser), the original C library by Kazuho Oku and contributors. The translation tracks the upstream's `master` branch as of publication.

License terms are inherited from the upstream — see `## License` below.

## License

MIT License

> picohttpparser (original C version) - Copyright (c) 2009-2014 Kazuho Oku, Tokuhiro Matsuno, Daisuke Murase, Shigeo Mitsunari
>
> ts-picohttpparser (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
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
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

The upstream picohttpparser is dual-licensed under MIT or the Perl License. This translation is distributed under the MIT License only.

## Usage

picohttpparser parses HTTP/1.x messages by scanning a byte buffer in place. The TypeScript translation preserves this model: input is a `CPtr` of the shape `{ buf: Uint8Array, off: number }`, and the parser writes header pointers + lengths back into caller-supplied out-parameters.

C-style out-parameters become `{ value: T }` boxes in TypeScript. For example, the C signature

```c
int phr_parse_request(const char *buf, size_t len, const char **method,
                      size_t *method_len, ...);
```

translates to

```typescript
function phr_parse_request(
  buf: CPtr, len: number,
  method: { value: CPtr | null },
  method_len: { value: number },
  ...
): number
```

The caller allocates the boxes; the parser writes through `.value`. This pattern preserves byte-for-byte parity with the C parser at the cost of a more C-shaped API; see "API and refactoring notes" below for guidance on wrapping it in idiomatic TypeScript on the consumer side.

Key differences from the original C version:

- Input buffers are `Uint8Array`s wrapped in `CPtr`, not `char *`. No manual memory management.
- Garbage collection replaces `free`; no leak risk from forgetting to deallocate parsed structures.
- The parser does not own its input. `headers[i].name` etc. are pointers into the input buffer; if you mutate the buffer after parsing, the parsed views become stale (same as in C).

## Installation

Install from npm:

```bash
npm install ts-picohttpparser
```

Or with your preferred package manager:

```bash
yarn add ts-picohttpparser
pnpm add ts-picohttpparser
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-picohttpparser.git
```

## Importing

When installed from npm:

```typescript
import {
  phr_parse_request,
  phr_parse_response,
  phr_parse_headers,
  phr_decode_chunked,
  phr_decode_chunked_is_in_data,
  phr_header,
  phr_chunked_decoder,
} from 'ts-picohttpparser';
```

### Quick example

```typescript
import { phr_parse_request } from 'ts-picohttpparser';

function cptr(s: string) {
  const buf = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
  return { buf, off: 0 };
}
function readN(c: any, n: number) {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(c.buf[c.off + i]);
  return String.fromCharCode(...out);
}

const req = "GET /path HTTP/1.1\r\nHost: example.com\r\n\r\n";
const buf = cptr(req);

const method = { value: null };
const method_len = { value: 0 };
const path = { value: null };
const path_len = { value: 0 };
const minor_version = { value: 0 };
const headers = Array.from({ length: 8 }, () => ({
  name: null, name_len: 0, value: null, value_len: 0,
}));
const num_headers = { value: 8 };

const consumed = phr_parse_request(
  buf, req.length,
  method, method_len, path, path_len,
  minor_version, headers, num_headers, 0,
);

if (consumed > 0) {
  console.log(readN(method.value, method_len.value));   // GET
  console.log(readN(path.value, path_len.value));       // /path
  console.log(`HTTP/1.${minor_version.value}`);          // HTTP/1.1
  for (let i = 0; i < num_headers.value; i++) {
    console.log(`${readN(headers[i].name, headers[i].name_len)}: ${readN(headers[i].value, headers[i].value_len)}`);
  }
} else if (consumed === -2) {
  // Need more bytes; read more from the socket and call again.
} else {
  // -1: malformed.
}
```

## Building

The published package ships pre-built JavaScript and `.d.ts` files in `dist/`. The TypeScript sources are kept in the repository for reference and can be compiled locally:

```bash
npm install
npm run build
```

## TypeScript Compiler

If your project uses TypeScript, use a typical ES module configuration in `tsconfig.json`:

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

> **Important:** the translated source uses patterns that emulate C pointer arithmetic and unsafe casts. It is intentionally **not** `strict`-compliant. The published package ships compiled `.js` and `.d.ts` files in `dist/`, so consumers do not need to type-check the translation. If you import the `.ts` source directly (rather than the package), isolate it in its own module and wrap it in a strictly-typed API surface.

## Node.js / tsx

ts-picohttpparser runs as a plain ES module:

```bash
node -e "import('ts-picohttpparser').then(m => console.log(Object.keys(m).length, 'exports'))"
```

Or with Deno (use the `npm:` specifier):

```typescript
import { phr_parse_request } from 'npm:ts-picohttpparser';
```

## Bundling

ts-picohttpparser has zero npm dependencies, so it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild --bundle --platform=neutral --outfile=out.js my-app.ts
```

## API

The exports mirror the C API of picohttpparser. The header struct `phr_header` has fields `{ name, name_len, value, value_len }`; the chunked-decoder state struct `phr_chunked_decoder` is constructed with `new phr_chunked_decoder()` and is zero-initialised.

### Request and response parsing

- `phr_parse_request(buf, len, method, method_len, path, path_len, minor_version, headers, num_headers, last_len)` - parse a request line and headers.
- `phr_parse_response(buf, len, minor_version, status, msg, msg_len, headers, num_headers, last_len)` - parse a status line and headers.
- `phr_parse_headers(buf, len, headers, num_headers, last_len)` - parse just headers (no request/status line).

All three return the number of bytes consumed on success, `-2` if the input is incomplete, or `-1` if the input is malformed. The `last_len` argument is the length of the buffer at the previous incomplete call (pass `0` if calling fresh) and lets the parser skip already-scanned bytes; it is purely an optimisation.

### Chunked transfer-encoding

- `phr_decode_chunked(decoder, buf, bufsz)` - decode a chunked-encoded body in place. Updates `bufsz.value` to the decoded length. Returns the number of trailing octets after the end-of-chunked marker on success, `-2` if more input is needed, or `-1` on error.
- `phr_decode_chunked_is_in_data(decoder)` - returns truthy if the decoder is currently inside chunk data (versus reading a chunk-size line or trailer).

### Types

- `phr_header` - struct with `{ name, name_len, value, value_len }`.
- `phr_chunked_decoder` - chunked-decoder state struct. Construct with `new phr_chunked_decoder()` and reuse across multiple `phr_decode_chunked` calls during incremental decode.

## Tests

The repository includes a reference-vector test suite covering request and response parsing, partial / malformed inputs, header-only parsing, single- and multi-chunk decoding, and incremental parse:

```bash
npm test
```

## Caveats

The following limitations from the upstream C version still apply:

- **Request size cap is the caller's responsibility** - picohttpparser will happily parse arbitrarily large headers / arbitrary numbers of headers up to the slot count provided. Cap header size and slot count at the call boundary to defeat resource exhaustion attacks.
- **Pointers into the input buffer** - parsed `name` and `value` fields point into the original buffer. If you reuse the buffer for the next request before consuming the parsed views, the parsed pointers become stale. This is the same contract as in C.
- **Out-parameter calling convention** - the parser writes back through `{ value: T }` box objects rather than returning a structured result. See the Quick example for the boilerplate. A wrapper that hides the boxes is straightforward to write on top.
- **Truthiness rather than strict 0/1** - `phr_decode_chunked_is_in_data` returns a truthy / falsy value rather than strictly `0` / `1`. Use it with `if (phr_decode_chunked_is_in_data(d))` rather than `=== 0` / `=== 1`.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector reclaims unreferenced parsed structures automatically.
- **Buffer-overflow risk** - bounds checks ride along through the `Uint8Array` access; out-of-range reads throw rather than corrupt memory.
- **C standard compliance** - the code runs wherever modern TypeScript / JavaScript runs (Node.js, Deno, Bun, browsers).

## API and refactoring notes

The C-style out-parameter API (`{ value: T }` boxes) is faithful to picohttpparser's source but is not idiomatic TypeScript. A typical refactoring on top of the package is to wrap each entry point in a function that returns a structured result:

```typescript
import { phr_parse_request } from 'ts-picohttpparser';

interface ParsedRequest {
  method: string;
  path: string;
  minorVersion: number;
  headers: Array<{ name: string; value: string }>;
}

function parseRequest(input: Uint8Array): ParsedRequest | "partial" | "malformed" {
  const buf = { buf: input, off: 0 };
  const method = { value: null }, method_len = { value: 0 };
  const path = { value: null }, path_len = { value: 0 };
  const minor_version = { value: 0 };
  const slots = Array.from({ length: 64 }, () => ({
    name: null, name_len: 0, value: null, value_len: 0,
  }));
  const num_headers = { value: 64 };

  const r = phr_parse_request(
    buf, input.length,
    method, method_len, path, path_len,
    minor_version, slots, num_headers, 0,
  );
  if (r === -2) return "partial";
  if (r === -1) return "malformed";

  const td = new TextDecoder("utf-8");
  return {
    method: td.decode(input.subarray(method.value!.off, method.value!.off + method_len.value)),
    path:   td.decode(input.subarray(path.value!.off,   path.value!.off   + path_len.value)),
    minorVersion: minor_version.value,
    headers: slots.slice(0, num_headers.value).map((h: any) => ({
      name:  td.decode(input.subarray(h.name.off,  h.name.off  + h.name_len)),
      value: td.decode(input.subarray(h.value.off, h.value.off + h.value_len)),
    })),
  };
}
```

The translation deliberately preserves the C calling convention so the underlying byte-for-byte behaviour stays observable; the wrapper above is the recommended consumer-side ergonomics layer.

## Acknowledgements

- [Kazuho Oku](https://github.com/kazuho) - author of [picohttpparser](https://github.com/h2o/picohttpparser) and the [h2o HTTP server](https://github.com/h2o/h2o).
- Tokuhiro Matsuno, Daisuke Murase, Shigeo Mitsunari - original picohttpparser contributors.
