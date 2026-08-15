/**
 * Reference-vector tests for ts-rxi-vec.
 *
 * Source: rxi/vec — header-only C macro library that instantiates a
 * typed dynamic array per element type. The upstream API is purely
 * preprocessor; macros do not survive C-to-TS translation, so this
 * package ships a fixed driver that pre-instantiates six element
 * types (int, unsigned int, float, double, char*, void*) and exposes
 * each as `rxi_vec_<T>_<op>` plus the underlying `vec_<T>_t` struct.
 *
 * These tests cover the rxi_vec_int_* surface; the surface for the
 * other element types is generated from the same macro and behaves
 * identically modulo storage type.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  vec_int_t,
  rxi_vec_int_init,
  rxi_vec_int_deinit,
  rxi_vec_int_push,
  rxi_vec_int_pop,
  rxi_vec_int_length,
  rxi_vec_int_capacity,
  rxi_vec_int_get,
  rxi_vec_int_set,
  rxi_vec_int_first,
  rxi_vec_int_last,
  rxi_vec_int_extend,
  rxi_vec_int_pusharr,
  rxi_vec_int_clear,
  rxi_vec_int_truncate,
  rxi_vec_int_reverse,
  rxi_vec_int_sort,
  rxi_vec_int_find,
  rxi_vec_int_remove,
  rxi_vec_int_insert,
  rxi_vec_int_swap,
  rxi_vec_int_sum,
  rxi_vec_int_reserve,
} from '../dist/index.js';

function makeIntVec(initial: number[] = []): any {
  const v: any = new vec_int_t();
  rxi_vec_int_init(v);
  for (const x of initial) rxi_vec_int_push(v, x);
  return v;
}

function toJsArray(v: any): number[] {
  const n = rxi_vec_int_length(v);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(rxi_vec_int_get(v, i));
  return out;
}

test('rxi_vec_int_init produces an empty vector', () => {
  const v = makeIntVec();
  assert.equal(rxi_vec_int_length(v), 0);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_push grows length and preserves order', () => {
  const v = makeIntVec();
  rxi_vec_int_push(v, 10);
  rxi_vec_int_push(v, 20);
  rxi_vec_int_push(v, 30);
  assert.equal(rxi_vec_int_length(v), 3);
  assert.deepEqual(toJsArray(v), [10, 20, 30]);
  assert.equal(rxi_vec_int_first(v), 10);
  assert.equal(rxi_vec_int_last(v), 30);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_pop returns the last element and shrinks length', () => {
  const v = makeIntVec([10, 20, 30]);
  const popped = rxi_vec_int_pop(v);
  assert.equal(popped, 30);
  assert.equal(rxi_vec_int_length(v), 2);
  assert.deepEqual(toJsArray(v), [10, 20]);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_extend appends another vector', () => {
  const a = makeIntVec([1, 2]);
  const b = makeIntVec([3, 4, 5]);
  rxi_vec_int_extend(a, b);
  assert.equal(rxi_vec_int_length(a), 5);
  assert.deepEqual(toJsArray(a), [1, 2, 3, 4, 5]);
  rxi_vec_int_deinit(a);
  rxi_vec_int_deinit(b);
});

test('rxi_vec_int_set replaces an element in-place', () => {
  const v = makeIntVec([1, 2, 3]);
  rxi_vec_int_set(v, 1, 99);
  assert.equal(rxi_vec_int_get(v, 1), 99);
  assert.deepEqual(toJsArray(v), [1, 99, 3]);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_clear empties the vector but leaves capacity intact', () => {
  const v = makeIntVec([1, 2, 3, 4]);
  const capBefore = rxi_vec_int_capacity(v);
  rxi_vec_int_clear(v);
  assert.equal(rxi_vec_int_length(v), 0);
  // capacity should not have shrunk.
  assert.ok(rxi_vec_int_capacity(v) >= capBefore);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_truncate shrinks length to the requested size', () => {
  const v = makeIntVec([1, 2, 3, 4, 5]);
  rxi_vec_int_truncate(v, 2);
  assert.equal(rxi_vec_int_length(v), 2);
  assert.deepEqual(toJsArray(v), [1, 2]);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_reverse reverses the elements in-place', () => {
  const v = makeIntVec([1, 2, 3, 4]);
  rxi_vec_int_reverse(v);
  assert.deepEqual(toJsArray(v), [4, 3, 2, 1]);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_find returns the index of the first matching element', () => {
  const v = makeIntVec([10, 20, 30, 20]);
  // The driver shape returns the index directly (mirroring vec_find's macro
  // behaviour, which assigns the index by side-effect; the wrapper hoists
  // it to a return value).
  const idxOut = { buf: new Int32Array(1), off: 0 } as any;
  const idx = rxi_vec_int_find(v, 20, idxOut);
  assert.equal(idx, 1);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_remove removes the first matching element', () => {
  const v = makeIntVec([1, 2, 3, 2]);
  rxi_vec_int_remove(v, 2);
  assert.deepEqual(toJsArray(v), [1, 3, 2]);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_insert inserts at the given index, shifting later elements', () => {
  const v = makeIntVec([1, 2, 4, 5]);
  rxi_vec_int_insert(v, 2, 3);
  assert.deepEqual(toJsArray(v), [1, 2, 3, 4, 5]);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_swap swaps the elements at two indices', () => {
  const v = makeIntVec([10, 20, 30, 40]);
  rxi_vec_int_swap(v, 0, 3);
  assert.deepEqual(toJsArray(v), [40, 20, 30, 10]);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_pusharr appends an array of elements', () => {
  const v = makeIntVec([1, 2]);
  const arr = new Int32Array([3, 4, 5]);
  rxi_vec_int_pusharr(v, { buf: arr, off: 0 } as any, 3);
  assert.deepEqual(toJsArray(v), [1, 2, 3, 4, 5]);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_sum returns the arithmetic sum (driver helper)', () => {
  const v = makeIntVec([1, 2, 3, 4, 5]);
  assert.equal(rxi_vec_int_sum(v), 15);
  rxi_vec_int_deinit(v);
});

test('rxi_vec_int_reserve grows the capacity without changing length', () => {
  const v = makeIntVec([1, 2, 3]);
  rxi_vec_int_reserve(v, 32);
  assert.ok(rxi_vec_int_capacity(v) >= 32);
  assert.equal(rxi_vec_int_length(v), 3);
  rxi_vec_int_deinit(v);
});
