# ts-rxi-log

TypeScript port of [rxi/log.c](https://github.com/rxi/log.c), a simple printf-style logging library originally written in ANSI C by rxi. The translation was produced by an automated C-to-TypeScript translator and ships verbatim, with a small facade module pinning the public API.

## Installation

```
npm install ts-rxi-log
```

## Usage

The C macros `log_trace` / `log_debug` / `log_info` / `log_warn` / `log_error` / `log_fatal` are preprocessor wrappers around `log_log(level, file, line, fmt, ...)`. They do not survive translation as separate symbols, so the supported entry points are `log_log` plus the `LOG_*` level constants.

```typescript
import {
  log_log,
  log_set_level,
  log_set_quiet,
  log_level_string,
  LOG_INFO,
  LOG_WARN,
  LOG_ERROR,
} from "ts-rxi-log";

// Suppress lower severities and stderr output if desired.
log_set_level(LOG_INFO);
// log_set_quiet(true); // disable stderr writes; callbacks still fire

log_log(LOG_INFO,  "app.ts", 1, "starting up, pid=%d", process.pid);
log_log(LOG_WARN,  "app.ts", 2, "retrying request");
log_log(LOG_ERROR, "app.ts", 3, "failed after %d attempts", 3);
```

### Custom callbacks

`log_add_callback` registers a sink that receives a `log_Event` for every emitted record at or above the given threshold. `log_add_fp` is a shortcut for streaming records to a Node `FILE*`-style file handle.

```typescript
import { log_add_callback, log_Event, LOG_TRACE } from "ts-rxi-log";

log_add_callback((ev: log_Event) => {
  // ev.level, ev.fmt, ev.file, ev.line, ev.time are populated
}, null, LOG_TRACE);
```

### Level helper

```typescript
log_level_string(LOG_INFO); // "INFO" (returned as a CPtr; readable via the runtime)
```

## API

| Symbol | Description |
| --- | --- |
| `LOG_TRACE`, `LOG_DEBUG`, `LOG_INFO`, `LOG_WARN`, `LOG_ERROR`, `LOG_FATAL` | Level constants 0..5 |
| `log_log(level, file, line, fmt, ...args)` | Primary log entry point |
| `log_set_level(level)` | Drop records below this level |
| `log_set_quiet(enable)` | Suppress stderr output (callbacks still fire) |
| `log_set_lock(fn, udata)` | Install a thread lock callback |
| `log_add_callback(fn, udata, level)` | Register a sink |
| `log_add_fp(fp, level)` | Register a file-handle sink |
| `log_level_string(level)` | Returns the level name |
| `log_Event` | Record passed to callbacks |

## License

MIT. The original C version is copyright (c) 2020 rxi. The TypeScript translation is copyright (c) 2026 Scott Moore.
