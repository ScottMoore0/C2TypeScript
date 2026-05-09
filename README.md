# ts-rxi-log

A direct TypeScript translation of a simple printf-style logging library with six severity levels.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## License

MIT License

> log.c (original C version) - Copyright (c) 2020 rxi
>
> ts-rxi-log (direct TypeScript translation) - Copyright (c) 2026 Scott Moore
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Usage

This is a direct translation of rxi/log.c from C to TypeScript. The public API, data structures, and behaviour are preserved as faithfully as possible.

To read more about log.c, please see the [original log.c repository](https://github.com/rxi/log.c).

The key differences from the C version are:

- **Zero dependencies** - all C standard library shims (formatted I/O, time, string handling) are contained in the source itself.
- **No manual memory management** - JavaScript's garbage collector replaces `malloc`/`free`.
- **ES modules** - files are linked with standard `import`/`export` statements.
- **Macros do not survive translation** - the C convenience macros `log_trace` / `log_debug` / `log_info` / `log_warn` / `log_error` / `log_fatal` were preprocessor wrappers around `log_log(level, file, line, fmt, ...)`. Call `log_log` directly with the exported `LOG_*` level constants.
- **Single-threaded** - JavaScript's event loop model means thread-safety concerns from the C version do not apply; `log_set_lock` is preserved as a no-op-friendly hook.

## Installation

Install from npm:

```bash
npm install ts-rxi-log
```

Or install with your preferred package manager:

```bash
yarn add ts-rxi-log
pnpm add ts-rxi-log
```

Alternatively, because the core library is contained in a single self-contained file, you can copy it directly into your project:

```bash
cp log.ts /path/to/your/project/src/
```

Or clone the repository:

```bash
git clone https://github.com/ScottMoore0/ts-rxi-log.git
```

## Importing

When installed from npm:

```typescript
import { log_log, log_set_level, LOG_INFO, LOG_WARN, LOG_ERROR } from 'ts-rxi-log';
```

When using the source file directly:

```typescript
import { log_log, log_set_level, LOG_INFO, LOG_WARN, LOG_ERROR } from './log.js';
```

### Quick example

```typescript
import {
  log_log, log_set_level,
  LOG_TRACE, LOG_DEBUG, LOG_INFO, LOG_WARN, LOG_ERROR,
} from 'ts-rxi-log';

// Without filtering, all six levels reach stderr.
log_log(LOG_TRACE, "app.ts", 1, "boot phase 1");
log_log(LOG_INFO,  "app.ts", 2, "listening on port %d", 8080);
log_log(LOG_WARN,  "app.ts", 3, "retrying request");
log_log(LOG_ERROR, "app.ts", 4, "failed after %d attempts", 3);

// Suppress TRACE and DEBUG records.
log_set_level(LOG_INFO);
log_log(LOG_DEBUG, "app.ts", 5, "this line is filtered out");
log_log(LOG_INFO,  "app.ts", 6, "this line still prints");
// stderr: 12:34:56 INFO  app.ts:2: listening on port 8080
//         12:34:56 WARN  app.ts:3: retrying request
//         12:34:56 ERROR app.ts:4: failed after 3 attempts
//         12:34:56 INFO  app.ts:6: this line still prints
```

## Building

Unlike the original C version, ts-rxi-log requires no compilation step. It is valid TypeScript (and JavaScript) source code that runs directly in Node.js, Deno, Bun, or modern browsers.

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
npx tsx log.ts
```

Or with Deno:

```bash
deno run --allow-all log.ts
```

## Bundling

Because the library is self-contained with zero `npm` dependencies, it bundles cleanly with esbuild, Rollup, or Vite:

```bash
npx esbuild log.ts --bundle --platform=node --outfile=dist/log.js
```

## Data Structure

The C `struct log_Event` has been translated to a TypeScript class with identical field names. Every registered callback receives one per emitted record:

```typescript
class log_Event {
  fmt:   any;     // CPtr to the printf format string
  file:  any;     // CPtr to the source file name
  time:  any;     // CPtr to a tm-shaped struct (timestamp)
  udata: any;     // user data passed to log_add_callback
  line:  number;
  level: number;  // one of LOG_TRACE..LOG_FATAL
}
```

The level constants `LOG_TRACE`, `LOG_DEBUG`, `LOG_INFO`, `LOG_WARN`, `LOG_ERROR`, `LOG_FATAL` correspond to integers 0..5.

## API

| Symbol | Description |
| --- | --- |
| `LOG_TRACE`, `LOG_DEBUG`, `LOG_INFO`, `LOG_WARN`, `LOG_ERROR`, `LOG_FATAL` | Level constants 0..5 |
| `log_log(level, file, line, fmt, ...args)` | Primary log entry point |
| `log_set_level(level)` | Drop records below this level |
| `log_set_quiet(enable)` | Suppress stderr output (callbacks still fire) |
| `log_set_lock(fn, udata)` | Install a thread lock callback (no-op equivalent under JS) |
| `log_add_callback(fn, udata, level)` | Register a sink that receives a `log_Event` |
| `log_add_fp(fp, level)` | Register a file-handle sink |
| `log_level_string(level)` | Returns the level name as a CPtr |
| `log_Event` | Record passed to callbacks |

## Tests

The repository includes the translated test framework. To run the tests:

```bash
npm test
```

Test data is located in:
- `tests/` - emission, level filtering, callback registration, and quiet-mode coverage.

## Caveats

The following limitations from the original C version still apply:

- **Macro entry points absent** - `log_trace`/`log_debug`/`.../log_fatal` were C preprocessor macros that captured `__FILE__` and `__LINE__` at the call site. In TypeScript you must pass file and line explicitly to `log_log`.
- **Single global state** - the upstream library maintains a single global registry of callbacks, lock, and level; this is preserved. There is no per-instance logger.
- **Maximum of 32 callbacks** - the upstream cap on registered callbacks (matching `MAX_CALLBACKS`) carries over.
- **stderr-targeted formatting** - default output goes to `process.stderr` mirroring the upstream `fprintf(stderr, ...)` shape, including the `HH:MM:SS LEVEL file:line: message` template.

The following C-specific caveats **do not apply** to the TypeScript version:

- **Memory leaks** - JavaScript's garbage collector eliminates manual `malloc`/`free` concerns.
- **Thread safety** - JavaScript is single-threaded; no special thread-safety measures are needed (the lock hook still exists for API compatibility).
- **ANSI colour escape codes** - the upstream `LOG_USE_COLOR` compile flag is resolved at translation time; whichever value the source was generated with is fixed.
- **C standard compliance** - The code runs wherever TypeScript/JavaScript runs (Node.js, Deno, Bun, browsers).

## Acknowledgements

- [rxi](https://github.com/rxi) - original author of log.c
- [log.c contributors](https://github.com/rxi/log.c/graphs/contributors) - ongoing maintenance of the C library
