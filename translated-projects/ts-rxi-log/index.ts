/**
 * ts-rxi-log - TypeScript port of rxi/log.c
 *
 * The upstream rxi/log.c is a tiny printf-style logger in ANSI C with six
 * severity levels, multiple registered callbacks, and an optional thread
 * lock. This package is the verbatim output of an automated
 * C-to-TypeScript translator applied to that source. The public surface
 * mirrors the original C API: the six level constants, the level helper,
 * the configuration setters, the callback registry, and the underlying
 * log_log entry point.
 *
 * The convenience macros log_trace / log_debug / log_info / log_warn /
 * log_error / log_fatal in the C header are preprocessor wrappers around
 * log_log and do not survive translation as separate symbols. Call
 * log_log(level, file, line, fmt, ...args) directly, or use the level
 * constants exported here.
 *
 * Original C version copyright (c) 2020 rxi.
 * TypeScript translation copyright (c) 2026 Scott Moore.
 * Licensed under the MIT License.
 */

// Level constants (LOG_TRACE..LOG_FATAL).
export {
  LOG_TRACE,
  LOG_DEBUG,
  LOG_INFO,
  LOG_WARN,
  LOG_ERROR,
  LOG_FATAL,
} from "./log.js";

// Public functions.
export {
  log_level_string,
  log_set_lock,
  log_set_level,
  log_set_quiet,
  log_add_callback,
  log_add_fp,
  log_log,
} from "./log.js";

// Event struct (passed to log_LogFn callbacks).
export { log_Event } from "./log.js";
