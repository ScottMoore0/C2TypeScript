/**
 * Authoritative reference vectors for ts-cJSON (Phase 2).
 *
 * These are NOT translated C tests; they are hand-authored TypeScript
 * vectors that exercise the public ts-cJSON API at the JavaScript boundary.
 * They cover round-trip parse/print, object/array access, and the four
 * primitive types (null, true, false, number).
 *
 * Source of vectors: cJSON's own examples / unit tests
 *   https://github.com/DaveGamble/cJSON/tree/master/tests
 */

import {
  cJSON_Parse,
  cJSON_PrintUnformatted,
  cJSON_Delete,
  cJSON_GetObjectItem,
  cJSON_GetArrayItem,
  cJSON_GetArraySize,
  cJSON_GetStringValue,
  cJSON_GetNumberValue,
  cJSON_IsNull,
  cJSON_IsTrue,
  cJSON_IsFalse,
  cJSON_IsBool,
  cJSON_IsObject,
  cJSON_IsArray,
  cJSON_IsString,
  cJSON_IsNumber,
} from '../index.js';

let pass = 0, fail = 0;
function expect(name: string, got: unknown, want: unknown): void {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { console.log(`  [OK]   ${name}`); pass++; }
  else    { console.log(`  [FAIL] ${name}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`); fail++; }
}

// CPtr-or-string -> JS string (cJSON_PrintUnformatted / cJSON_GetStringValue
// return CPtr-shaped values from the port).
function cstr(c: any): string | null {
  if (c == null) return null;
  if (typeof c === 'string') return c;
  if (c.buf && typeof c.off === 'number') {
    let s = '';
    for (let i = c.off; i < c.buf.length && c.buf[i] !== 0; i++) {
      s += String.fromCharCode(c.buf[i]);
    }
    return s;
  }
  return String(c);
}

console.log('ts-cJSON reference vectors\n');

// V1. round-trip parse + PrintUnformatted
{
  const input = '{"name":"John","age":30}';
  const v = cJSON_Parse(input);
  expect('V1.parsed not null', v != null, true);
  const out = cstr(cJSON_PrintUnformatted(v));
  expect('V1.round-trip PrintUnformatted', out, input);
  cJSON_Delete(v);
}

// V2. object access
{
  const v = cJSON_Parse('{"name":"John","age":30}');
  expect('V2.IsObject', !!cJSON_IsObject(v), true);
  const name = cJSON_GetObjectItem(v, 'name');
  expect('V2.name IsString', !!cJSON_IsString(name), true);
  expect('V2.name value', cstr(cJSON_GetStringValue(name)), 'John');
  const age = cJSON_GetObjectItem(v, 'age');
  expect('V2.age IsNumber', !!cJSON_IsNumber(age), true);
  expect('V2.age value', cJSON_GetNumberValue(age), 30);
  cJSON_Delete(v);
}

// V3. array access
{
  const v = cJSON_Parse('{"a":[1,2,3]}');
  const arr = cJSON_GetObjectItem(v, 'a');
  expect('V3.arr IsArray', !!cJSON_IsArray(arr), true);
  expect('V3.arr length', cJSON_GetArraySize(arr), 3);
  expect('V3.arr[0]', cJSON_GetNumberValue(cJSON_GetArrayItem(arr, 0)), 1);
  expect('V3.arr[1]', cJSON_GetNumberValue(cJSON_GetArrayItem(arr, 1)), 2);
  expect('V3.arr[2]', cJSON_GetNumberValue(cJSON_GetArrayItem(arr, 2)), 3);
  cJSON_Delete(v);
}

// V4. null primitive
{
  const v = cJSON_Parse('null');
  expect('V4.null IsNull', !!cJSON_IsNull(v), true);
  cJSON_Delete(v);
}

// V5. true / false primitives
{
  const t = cJSON_Parse('true');
  expect('V5.true IsBool',  !!cJSON_IsBool(t),  true);
  expect('V5.true IsTrue',  !!cJSON_IsTrue(t),  true);
  expect('V5.true IsFalse', !!cJSON_IsFalse(t), false);
  cJSON_Delete(t);
  const f = cJSON_Parse('false');
  expect('V5.false IsBool',  !!cJSON_IsBool(f),  true);
  expect('V5.false IsTrue',  !!cJSON_IsTrue(f),  false);
  expect('V5.false IsFalse', !!cJSON_IsFalse(f), true);
  cJSON_Delete(f);
}

// V6. round-trip array-of-objects
{
  const input = '[{"x":1},{"x":2}]';
  const v = cJSON_Parse(input);
  expect('V6.IsArray', !!cJSON_IsArray(v), true);
  expect('V6.size', cJSON_GetArraySize(v), 2);
  const out = cstr(cJSON_PrintUnformatted(v));
  expect('V6.round-trip', out, input);
  cJSON_Delete(v);
}

console.log(`\nTotal: ${pass}/${pass + fail}`);
if (fail > 0) process.exit(1);
