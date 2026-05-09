/**
 * Authoritative reference vectors for ts-jsmn (Phase 2).
 *
 * Hand-authored TypeScript vectors against the public ts-jsmn API.
 * jsmn does not build a tree; it returns a count of tokens and fills
 * a caller-allocated array with {type,start,end,size}.
 *
 * Source for vectors: https://github.com/zserge/jsmn/blob/master/test/test.h
 */

import {
  jsmn_init,
  jsmn_parse,
  jsmn_parser,
  jsmntok,
  JSMN_OBJECT,
  JSMN_ARRAY,
  JSMN_STRING,
  JSMN_PRIMITIVE,
  JSMN_ERROR_PART,
} from '../jsmn.js';

let pass = 0, fail = 0;
function expect(name: string, got: unknown, want: unknown): void {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { console.log(`  [OK]   ${name}`); pass++; }
  else    { console.log(`  [FAIL] ${name}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`); fail++; }
}

function cptr(s: string): { buf: Uint8Array; off: number } {
  const buf = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
  return { buf, off: 0 };
}

function makeTokens(n: number): any[] {
  const a: any[] = [];
  // @ts-ignore -- jsmntok is the constructor exported by jsmn.ts
  for (let i = 0; i < n; i++) a.push(new (jsmntok as any)());
  return a;
}

function parseAll(js: string, capacity: number): { count: number; tokens: any[] } {
  // @ts-ignore
  const p = new (jsmn_parser as any)();
  jsmn_init(p);
  const tokens = makeTokens(capacity);
  const count = jsmn_parse(p, cptr(js), js.length, tokens, capacity);
  return { count, tokens };
}

function tokenSlice(js: string, t: any): string {
  return js.substring(t.start, t.end);
}

console.log('ts-jsmn reference vectors\n');

// V1. simple object {"key":"value"}: object + key + value = 3 tokens
{
  const js = '{"key":"value"}';
  const { count, tokens } = parseAll(js, 10);
  expect('V1.count',          count, 3);
  expect('V1.t0.type=OBJECT', tokens[0].type, JSMN_OBJECT);
  expect('V1.t0.size=1',      tokens[0].size, 1);
  expect('V1.t1.type=STRING', tokens[1].type, JSMN_STRING);
  expect('V1.t1.slice=key',   tokenSlice(js, tokens[1]), 'key');
  expect('V1.t2.type=STRING', tokens[2].type, JSMN_STRING);
  expect('V1.t2.slice=value', tokenSlice(js, tokens[2]), 'value');
}

// V2. array [1,2,3]: array + 3 primitives = 4 tokens
{
  const js = '[1,2,3]';
  const { count, tokens } = parseAll(js, 10);
  expect('V2.count',             count, 4);
  expect('V2.t0.type=ARRAY',     tokens[0].type, JSMN_ARRAY);
  expect('V2.t0.size=3',         tokens[0].size, 3);
  expect('V2.t1.type=PRIMITIVE', tokens[1].type, JSMN_PRIMITIVE);
  expect('V2.t1.slice=1',        tokenSlice(js, tokens[1]), '1');
  expect('V2.t2.slice=2',        tokenSlice(js, tokens[2]), '2');
  expect('V2.t3.slice=3',        tokenSlice(js, tokens[3]), '3');
}

// V3. bare primitive `true`
{
  const js = 'true';
  const { count, tokens } = parseAll(js, 4);
  expect('V3.count',             count, 1);
  expect('V3.t0.type=PRIMITIVE', tokens[0].type, JSMN_PRIMITIVE);
  expect('V3.t0.slice=true',     tokenSlice(js, tokens[0]), 'true');
}

// V4. partial input -> JSMN_ERROR_PART
{
  const js = '{"key":';
  const { count } = parseAll(js, 10);
  expect('V4.count=ERROR_PART', count, JSMN_ERROR_PART);
}

// V5. nested object {"a":{"b":1}}
{
  const js = '{"a":{"b":1}}';
  const { count, tokens } = parseAll(js, 16);
  expect('V5.count',          count, 5);
  expect('V5.t0.type=OBJECT', tokens[0].type, JSMN_OBJECT);
  expect('V5.t0.size=1',      tokens[0].size, 1);
  expect('V5.t1.slice=a',     tokenSlice(js, tokens[1]), 'a');
  expect('V5.t2.type=OBJECT', tokens[2].type, JSMN_OBJECT);
  expect('V5.t3.slice=b',     tokenSlice(js, tokens[3]), 'b');
  expect('V5.t4.slice=1',     tokenSlice(js, tokens[4]), '1');
}

console.log(`\nTotal: ${pass}/${pass + fail}`);
if (fail > 0) process.exit(1);
