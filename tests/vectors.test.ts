/**
 * Authoritative reference vectors for ts-tiny-regex-c (Phase 2).
 *
 * Hand-authored TypeScript vectors against the public re_match API.
 * Source for vectors: https://github.com/kokke/tiny-regex-c README and tests.
 */

import { re_match } from '../index.js';

let pass = 0, fail = 0;
function expect(name: string, got: unknown, want: unknown): void {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { console.log(`  [OK]   ${name}`); pass++; }
  else    { console.log(`  [FAIL] ${name}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`); fail++; }
}

console.log('ts-tiny-regex-c reference vectors\n');

// re_match(pattern, text, &match_len) returns match index or -1 if no match,
// and writes the match length into the out-param.

// V1. one-or-more 'a'
{
  const len = { value: 0 };
  const idx = re_match('a+', 'aaab', len);
  expect('V1.idx', idx, 0);
  expect('V1.len', len.value, 3);
}

// V2. \d+ digit run
{
  const len = { value: 0 };
  const idx = re_match('\\d+', 'abc123def', len);
  expect('V2.idx', idx, 3);
  expect('V2.len', len.value, 3);
}

// V3. character class [a-z]+
{
  const len = { value: 0 };
  const idx = re_match('[a-z]+', '  HELLO world', len);
  expect('V3.idx', idx, 8);
  expect('V3.len', len.value, 5);
}

// V4. anchored end '$'
{
  const len = { value: 0 };
  const idx = re_match('end$', 'the end', len);
  expect('V4.idx', idx, 4);
  expect('V4.len', len.value, 3);
}

// V5. literal substring match
{
  const len = { value: 0 };
  const idx = re_match('foo', 'barfoo', len);
  expect('V5.idx', idx, 3);
  expect('V5.len', len.value, 3);
}

// V6. no match -> idx = -1 (per re_match contract)
{
  const len = { value: 0 };
  const idx = re_match('xyz', 'abc', len);
  expect('V6.idx', idx, -1);
}

// V7. anchored start '^'
{
  const len = { value: 0 };
  const idx = re_match('^abc', 'abcdef', len);
  expect('V7.idx', idx, 0);
  expect('V7.len', len.value, 3);
}

// V8. dot wildcard
{
  const len = { value: 0 };
  const idx = re_match('a.c', 'xxabcxx', len);
  expect('V8.idx', idx, 2);
  expect('V8.len', len.value, 3);
}

// V9. star quantifier (zero or more) -- 'ab*c' against 'xxac' should match
//      at idx=2 with length=2 (the b can repeat zero times).
// FAILING: port atom -- matchpattern() reads past the end of the
// CPtr buffer when matchstar's inner loop exhausts input. Symptom:
// "TypeError: Cannot read properties of undefined (reading '0')" thrown
// from re.ts inside matchpattern's do/while bounds check. The C source
// guards via post-increment + 0-byte sentinel; the translated code
// indexes buf[off] before testing the off bound.
{
  let idx = -999, lenVal = -999, threw: string | null = null;
  try {
    const len = { value: 0 };
    idx = re_match('ab*c', 'xxac', len);
    lenVal = len.value;
  } catch (e: any) {
    threw = e?.message ?? String(e);
  }
  expect('V9.idx (known limitation)', idx, 2);
  expect('V9.len (known limitation)', lenVal, 2);
  expect('V9.no throw (known limitation)', threw, null);
}

console.log(`\nTotal: ${pass}/${pass + fail}`);
if (fail > 0) process.exit(1);
