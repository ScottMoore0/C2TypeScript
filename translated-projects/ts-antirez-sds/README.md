# ts-antirez-sds

A direct TypeScript translation of [sds](https://github.com/antirez/sds) (Simple Dynamic Strings), the C string library written by Salvatore Sanfilippo for Redis.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [sds (Simple Dynamic Strings)](https://github.com/antirez/sds), the original C library by Salvatore Sanfilippo. The translation tracks the upstream's `master` branch as of publication.

License terms are inherited from the upstream — see `## License` below.

## License

BSD 2-Clause License

> sds (Simple Dynamic Strings, original C version) - Copyright (c) 2006-2015 Salvatore Sanfilippo
>
> ts-antirez-sds (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> All rights reserved.
>
> Redistribution and use in source and binary forms, with or without
> modification, are permitted provided that the following conditions
> are met:
>
> 1. Redistributions of source code must retain the above copyright
>    notice, this list of conditions and the following disclaimer.
>
> 2. Redistributions in binary form must reproduce the above copyright
>    notice, this list of conditions and the following disclaimer in the
>    documentation and/or other materials provided with the distribution.
>
> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
> AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
> IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
> ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
> LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
> CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
> SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
> INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
> CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
> ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
> POSSIBILITY OF SUCH DAMAGE.

## Usage

sds is a C string library that hands the caller a `char *` pointing at the payload, with a packed length/capacity header sitting in the bytes immediately before the pointer. The TypeScript translation preserves this model exactly: an sds value is a `CPtr` of the shape `{ buf: Uint8Array, off: number }` whose `off` indexes the first payload byte. C-string arguments (e.g. for `sdsnew`, `sdscat`) are also `CPtr` values, NUL-terminated.

Key differences from the original C version:

- All functions are reachable as named ES module exports - no header includes, no link step.
- Strings live in `Uint8Array` byte buffers rather than malloc'd `char *`. Garbage collection replaces the C-side `sdsfree` discipline; calling `sdsfree` is still safe but no longer required.
- The header types `sdshdr5`, `sdshdr8`, `sdshdr16`, `sdshdr32`, `sdshdr64` are exported for callers that need to read the per-sds header layout directly.

## Installation

Install from npm:

```bash
npm install ts-antirez-sds
```

Or with your preferred package manager:

```bash
yarn add ts-antirez-sds
pnpm add ts-antirez-sds
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-antirez-sds.git
```

## Importing

When installed from npm:

```typescript
import {
  sdsnew,
  sdsempty,
  sdscat,
  sdscpy,
  sdsfree,
  sdslen,
  sdsavail,
  sdsalloc,
} from 'ts-antirez-sds';
```

### Quick example

```typescript
import { sdsnew, sdscat, sdslen } from 'ts-antirez-sds';

function cstr(s: string) {
  const buf = new Uint8Array(s.length + 1);
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
  return { buf, off: 0 };
}

function sdsToString(s: any): string {
  const out: number[] = [];
  for (let i = s.off; i < s.buf.length && s.buf[i] !== 0; i++) out.push(s.buf[i]);
  return String.fromCharCode(...out);
}

let s = sdsnew(cstr('hello'));
s = sdscat(s, cstr(', world'));
console.log(sdsToString(s));   // "hello, world"
console.log(sdslen(s));        // 12
```

## Building

Unlike the original C version, ts-antirez-sds requires no compilation step at consumption time. The published package ships pre-built JavaScript and `.d.ts` files in `dist/`. The TypeScript sources are kept in the repository for reference and can be compiled locally:

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

> **Important:** the translated source uses patterns that emulate C pointer arithmetic and unsafe type casts. It is intentionally **not** `strict`-compliant. The published package ships compiled `.js` and `.d.ts` files in `dist/`, so consumers do not need to type-check the translation. If you import the `.ts` source directly (rather than the package), isolate it in its own module and wrap it in a strictly-typed API surface.

## Node.js / tsx

ts-antirez-sds runs as a plain ES module:

```bash
node -e "import('ts-antirez-sds').then(m => console.log(Object.keys(m).length, 'exports'))"
```

Or under `tsx` directly against source:

```bash
npx tsx -e "import { sdsnew, sdslen } from 'ts-antirez-sds'; const s = sdsnew({ buf: new TextEncoder().encode('hello\0'), off: 0 }); console.log(sdslen(s));"
```

Or with Deno (use the `npm:` specifier):

```typescript
import { sdsnew, sdslen } from 'npm:ts-antirez-sds';
```

## Bundling

ts-antirez-sds has zero npm dependencies, so it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild --bundle --platform=neutral --outfile=out.js my-app.ts
```

## API

The exports mirror the C API of sds. The most commonly used:

### Construction and lifecycle

- `sdsnewlen(init, len)` - new sds with explicit length (binary-safe).
- `sdsempty()` - new empty sds.
- `sdsnew(cstr)` - new sds from a NUL-terminated C string pointer.
- `sdsdup(s)` - duplicate.
- `sdsfree(s)` - release the underlying buffer (optional in JS).

### Length and capacity (header-inline helpers)

- `sdslen(s)` - logical length (bytes of payload, NUL not counted).
- `sdsavail(s)` - free bytes between length and capacity.
- `sdsalloc(s)` - capacity (bytes the header tracks as allocated).
- `sdssetlen(s, len)` / `sdsinclen(s, inc)` / `sdssetalloc(s, alloc)` - direct header writes for advanced uses.
- `sdsupdatelen(s)` - recompute length from the NUL terminator.
- `sdsclear(s)` - logical length to 0; capacity untouched.
- `sdsMakeRoomFor(s, addlen)` / `sdsRemoveFreeSpace(s)` - grow / shrink-to-fit.
- `sdsAllocSize(s)` / `sdsAllocPtr(s)` - inspect underlying allocation.
- `sdsIncrLen(s, incr)` - bump length after an external write.
- `sdsgrowzero(s, len)` - grow to length, NUL-fill the gap.

### Mutation

- `sdscatlen(s, t, len)` / `sdscat(s, t)` / `sdscatsds(s, t)` - append.
- `sdscpylen(s, t, len)` / `sdscpy(s, t)` - overwrite.
- `sdscatprintf(s, fmt, ...)` / `sdscatvprintf(s, fmt, ap)` / `sdscatfmt(s, fmt, ...)` - printf-style append.
- `sdstrim(s, cset)` - trim characters in `cset` from both ends.
- `sdsrange(s, start, end)` - keep `[start, end]` in place.
- `sdstolower(s)` / `sdstoupper(s)` - in-place ASCII case conversion.
- `sdsmapchars(s, from, to, setlen)` - byte-wise translation.

### Comparison and conversion

- `sdscmp(s1, s2)` - memcmp-like comparison.
- `sdsll2str(buf, value)` / `sdsull2str(buf, value)` - integer to string.
- `sdsfromlonglong(value)` - new sds from a long long.

### Splitting, joining, escaping

- `sdssplitlen(s, len, sep, seplen, count)` - split into an array of sds.
- `sdsfreesplitres(tokens, count)` - free the split result.
- `sdssplitargs(line, argc)` - shell-style argument split.
- `sdsjoin(argv, argc, sep)` / `sdsjoinsds(argv, argc, sep, seplen)` - reverse of split.
- `sdscatrepr(s, p, len)` - append a quoted, C-escaped representation.

### Allocator hooks

- `sds_malloc(size)` / `sds_realloc(ptr, size)` / `sds_free(ptr)` - the malloc/realloc/free wrappers used internally.

## Tests

The repository includes a small reference-vector test suite covering construction, length/capacity, concatenation, copy, trim, range, and case conversion:

```bash
npm test
```

## Caveats

The following limitations from the upstream C version still apply:

- **Caller-allocated growth** - `sdsMakeRoomFor` and `sdsgrowzero` reallocate the underlying buffer; functions that may grow return the (possibly new) sds value, and the caller MUST replace the old reference with the returned one (`s = sdscat(s, ...)`). This matches the C convention.
- **Binary-safe but NUL-terminated** - sds always writes a trailing NUL after the logical length, so existing C string consumers can read the payload, but the logical length is the source of truth, not `strlen`. Always prefer `sdslen(s)` over scanning for NUL.
- **Standard alphabet only for sdscatrepr** - the escape representation matches the upstream's choices (printable ASCII, hex escapes for non-printable bytes); it is not configurable.
- **printf-family conversion specifiers follow the C reference** - `sdscatprintf` and `sdscatfmt` accept the same format specifiers documented by the upstream sds.
- **`sdsalloc` is identical to `sdslen` for short strings** - sds picks the smallest header that fits the requested length. For `len < 32` the header is `sdshdr5`, which has no separate `alloc` field; the upstream `sdsalloc` is defined to return the length in this case (see sds.h `case SDS_TYPE_5: return SDS_TYPE_5_LEN(flags)`). For `len >= 32` the header is `sdshdr8/16/32/64`, which has a real `alloc` field. The translation preserves both behaviours exactly. If your code depends on `sdsalloc` reflecting a separate capacity, ensure the sds is constructed with `len >= 32` (e.g. via `sdsnewlen` with explicit length, or after `sdsMakeRoomFor`).

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks from forgotten sdsfree** - JavaScript's garbage collector reclaims unreferenced sds values automatically. Calling `sdsfree` remains safe but is no longer load-bearing.
- **Thread safety** - JavaScript is single-threaded; no special locking is needed when accessing an sds from one event-loop turn.
- **C standard compliance** - the code runs wherever modern TypeScript / JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [Salvatore Sanfilippo (antirez)](https://github.com/antirez) - author of [sds](https://github.com/antirez/sds), the original C library, and of Redis.
- [sds contributors](https://github.com/antirez/sds/graphs/contributors) - ongoing maintenance of the C library.
