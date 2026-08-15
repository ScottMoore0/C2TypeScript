/**
 * Reference-vector tests for ts-rxi-log.
 *
 * Source: rxi/log.c — a tiny printf-style C logger with six severity
 * levels and an optional set of additional callbacks.
 *
 * The convenience macros log_trace/log_debug/log_info/log_warn/
 * log_error/log_fatal in the C header are preprocessor wrappers
 * around log_log() and do not survive translation as separate
 * symbols. Tests therefore call log_log() directly with the level
 * constants exported by the package.
 *
 * String pointers in the translated API are CPtr-shaped
 * `{ buf: Uint8Array, off: number }` values produced by the
 * translator; we construct them from plain strings via TextEncoder.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOG_TRACE,
  LOG_DEBUG,
  LOG_INFO,
  LOG_WARN,
  LOG_ERROR,
  LOG_FATAL,
  log_level_string,
  log_set_level,
  log_set_quiet,
  log_log,
  log_Event,
} from '../dist/index.js';

type CPtr = { buf: Uint8Array; off: number };
const cstr = (s: string): CPtr => ({
  buf: new TextEncoder().encode(s + '\0'),
  off: 0,
});

// Decode a CPtr-shaped C string up to its NUL terminator.
function readCStr(p: any): string {
  if (!p || !p.buf) return '';
  const { buf, off } = p;
  let end = off;
  while (end < buf.length && buf[end] !== 0) end++;
  return new TextDecoder().decode(buf.subarray(off, end));
}

// Capture stderr writes during fn() and return the captured text.
function captureStderr(fn: () => void): string {
  const orig = process.stderr.write.bind(process.stderr);
  let captured = '';
  (process.stderr as any).write = (chunk: any): boolean => {
    captured += typeof chunk === 'string'
      ? chunk
      : Buffer.from(chunk).toString('utf8');
    return true;
  };
  try {
    fn();
  } finally {
    (process.stderr as any).write = orig;
  }
  return captured;
}

test('LOG_* level constants are 0..5 in the upstream C order', () => {
  assert.equal(LOG_TRACE, 0);
  assert.equal(LOG_DEBUG, 1);
  assert.equal(LOG_INFO, 2);
  assert.equal(LOG_WARN, 3);
  assert.equal(LOG_ERROR, 4);
  assert.equal(LOG_FATAL, 5);
});

test('log_level_string returns the canonical upstream label for each level', () => {
  // upstream: const char *level_strings[] = {"TRACE","DEBUG","INFO","WARN","ERROR","FATAL"};
  assert.equal(readCStr(log_level_string(LOG_TRACE)), 'TRACE');
  assert.equal(readCStr(log_level_string(LOG_DEBUG)), 'DEBUG');
  assert.equal(readCStr(log_level_string(LOG_INFO)), 'INFO');
  assert.equal(readCStr(log_level_string(LOG_WARN)), 'WARN');
  assert.equal(readCStr(log_level_string(LOG_ERROR)), 'ERROR');
  assert.equal(readCStr(log_level_string(LOG_FATAL)), 'FATAL');
});

test('log_Event struct is constructible with the upstream field set', () => {
  const ev: any = new log_Event();
  for (const f of ['ap', 'fmt', 'file', 'time', 'udata', 'line', 'level']) {
    assert.ok(f in ev, `log_Event missing field ${f}`);
  }
});

test('log_log writes to stderr at default verbosity', () => {
  log_set_quiet(false);
  log_set_level(LOG_TRACE); // most verbose
  const out = captureStderr(() => {
    log_log(LOG_INFO, cstr('test.c'), 42, cstr('hello'));
  });
  assert.ok(out.length > 0, 'expected stderr output');
  assert.ok(out.includes('INFO'), `expected INFO in: ${JSON.stringify(out)}`);
  assert.ok(out.includes('test.c'), `expected file in: ${JSON.stringify(out)}`);
  assert.ok(out.includes('42'), `expected line in: ${JSON.stringify(out)}`);
});

test('log_set_quiet(true) suppresses all stderr output from log_log', () => {
  log_set_quiet(true);
  log_set_level(LOG_TRACE);
  const out = captureStderr(() => {
    log_log(LOG_INFO, cstr('test.c'), 1, cstr('should-not-appear'));
    log_log(LOG_FATAL, cstr('test.c'), 2, cstr('also-suppressed'));
  });
  assert.equal(out, '', `quiet mode must suppress stderr, got: ${JSON.stringify(out)}`);
  // Restore.
  log_set_quiet(false);
});

test('log_set_level filters out lower-severity messages', () => {
  log_set_quiet(false);
  log_set_level(LOG_WARN);
  const out = captureStderr(() => {
    log_log(LOG_TRACE, cstr('a.c'), 1, cstr('trace'));
    log_log(LOG_DEBUG, cstr('a.c'), 2, cstr('debug'));
    log_log(LOG_INFO,  cstr('a.c'), 3, cstr('info'));
  });
  assert.equal(out, '', `messages below LOG_WARN must be filtered, got: ${JSON.stringify(out)}`);
});

test('log_set_level admits messages at or above the configured level', () => {
  log_set_quiet(false);
  log_set_level(LOG_WARN);
  const out = captureStderr(() => {
    log_log(LOG_WARN,  cstr('a.c'), 1, cstr('warn'));
    log_log(LOG_ERROR, cstr('a.c'), 2, cstr('error'));
    log_log(LOG_FATAL, cstr('a.c'), 3, cstr('fatal'));
  });
  assert.ok(out.includes('WARN'),  `expected WARN in: ${JSON.stringify(out)}`);
  assert.ok(out.includes('ERROR'), `expected ERROR in: ${JSON.stringify(out)}`);
  assert.ok(out.includes('FATAL'), `expected FATAL in: ${JSON.stringify(out)}`);
});

test('log_log embeds the file name and line number in the output line', () => {
  log_set_quiet(false);
  log_set_level(LOG_TRACE);
  const out = captureStderr(() => {
    log_log(LOG_ERROR, cstr('src/widget.c'), 1234, cstr('uh oh'));
  });
  assert.ok(out.includes('src/widget.c'),
    `expected filename in: ${JSON.stringify(out)}`);
  assert.ok(out.includes('1234'),
    `expected line number in: ${JSON.stringify(out)}`);
  assert.ok(out.includes('ERROR'),
    `expected level label in: ${JSON.stringify(out)}`);
});
