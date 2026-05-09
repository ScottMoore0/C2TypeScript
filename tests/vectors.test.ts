/**
 * Reference-vector tests for ts-clibs-list.
 *
 * Source: clibs/list — TJ Holowaychuk's doubly-linked list with
 * iterator support (https://github.com/clibs/list).
 *
 * Translated API surface (verified against the published dist/):
 *   list_new()                                        -> list_t
 *   list_destroy(list)
 *   list_node_new(value)                              -> list_node
 *   list_rpush(list, node)                            -> node (tail)
 *   list_lpush(list, node)                            -> node (head)
 *   list_rpop(list)                                   -> node | null
 *   list_lpop(list)                                   -> node | null
 *   list_at(list, index)                              -> node | null
 *   list_remove(list, node)
 *   list_iterator_new(list, LIST_HEAD | LIST_TAIL)    -> iterator
 *   list_iterator_new_from_node(node)                 -> iterator
 *   list_iterator_next(iter)                          -> node | null
 *   list_iterator_destroy(iter)
 *
 * The translator preserves the C struct layout 1:1: list_t exposes
 * { head, tail, len, free, match }, list_node exposes
 * { prev, next, val }, list_iterator_t exposes { next, direction }.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIST_HEAD,
  LIST_TAIL,
  list_new,
  list_destroy,
  list_node_new,
  list_rpush,
  list_lpush,
  list_rpop,
  list_lpop,
  list_at,
  list_remove,
  list_iterator_new,
  list_iterator_next,
  list_iterator_destroy,
} from '../dist/index.js';

// Walk a list head→tail and collect node values into a JS array.
function collect(list: any): any[] {
  const out: any[] = [];
  const it = list_iterator_new(list, LIST_HEAD);
  let n;
  while ((n = list_iterator_next(it))) out.push(n.val);
  list_iterator_destroy(it);
  return out;
}

test('list_new returns an empty doubly-linked list', () => {
  const l: any = list_new();
  assert.equal(l.len, 0);
  assert.equal(l.head, null);
  assert.equal(l.tail, null);
  list_destroy(l);
});

test('list_node_new wraps an arbitrary value', () => {
  const n: any = list_node_new(42);
  assert.equal(n.val, 42);
  assert.equal(n.prev, null);
  assert.equal(n.next, null);
});

test('list_rpush adds to tail and updates len + head/tail pointers', () => {
  const l: any = list_new();
  const a: any = list_rpush(l, list_node_new('a'));
  assert.equal(l.len, 1);
  assert.equal(l.head, a);
  assert.equal(l.tail, a);

  const b: any = list_rpush(l, list_node_new('b'));
  assert.equal(l.len, 2);
  assert.equal(l.head, a);
  assert.equal(l.tail, b);
  assert.equal(a.next, b);
  assert.equal(b.prev, a);

  list_destroy(l);
});

test('list_lpush adds to head and shifts the previous head', () => {
  const l: any = list_new();
  list_rpush(l, list_node_new(2));
  list_rpush(l, list_node_new(3));
  list_lpush(l, list_node_new(1));

  assert.equal(l.len, 3);
  assert.deepEqual(collect(l), [1, 2, 3]);

  list_destroy(l);
});

test('iteration head→tail visits every node in insertion order', () => {
  const l: any = list_new();
  for (let i = 0; i < 5; i++) list_rpush(l, list_node_new(i));
  assert.deepEqual(collect(l), [0, 1, 2, 3, 4]);
  list_destroy(l);
});

test('iteration tail→head walks the list in reverse', () => {
  const l: any = list_new();
  for (let i = 0; i < 4; i++) list_rpush(l, list_node_new(i));
  const it = list_iterator_new(l, LIST_TAIL);
  const seen: number[] = [];
  let n;
  while ((n = list_iterator_next(it))) seen.push(n.val);
  list_iterator_destroy(it);
  assert.deepEqual(seen, [3, 2, 1, 0]);
  list_destroy(l);
});

test('list_at returns the node at the requested index', () => {
  const l: any = list_new();
  list_rpush(l, list_node_new('x'));
  list_rpush(l, list_node_new('y'));
  list_rpush(l, list_node_new('z'));
  assert.equal((list_at(l, 0) as any).val, 'x');
  assert.equal((list_at(l, 1) as any).val, 'y');
  assert.equal((list_at(l, 2) as any).val, 'z');
  list_destroy(l);
});

test('list_rpop returns the tail node and shrinks the list', () => {
  const l: any = list_new();
  list_rpush(l, list_node_new(1));
  list_rpush(l, list_node_new(2));
  list_rpush(l, list_node_new(3));
  const popped: any = list_rpop(l);
  assert.equal(popped.val, 3);
  assert.equal(l.len, 2);
  assert.equal((l.tail as any).val, 2);
  list_destroy(l);
});

test('list_lpop returns the head node and shrinks the list', () => {
  const l: any = list_new();
  list_rpush(l, list_node_new(1));
  list_rpush(l, list_node_new(2));
  list_rpush(l, list_node_new(3));
  const popped: any = list_lpop(l);
  assert.equal(popped.val, 1);
  assert.equal(l.len, 2);
  assert.equal((l.head as any).val, 2);
  list_destroy(l);
});

test('list_remove unlinks a middle node and decrements len', () => {
  const l: any = list_new();
  const a = list_rpush(l, list_node_new('a'));
  const b = list_rpush(l, list_node_new('b'));
  const c = list_rpush(l, list_node_new('c'));
  list_remove(l, b);
  assert.equal(l.len, 2);
  assert.deepEqual(collect(l), ['a', 'c']);
  // a and c should now be neighbours.
  assert.equal((a as any).next, c);
  assert.equal((c as any).prev, a);
  list_destroy(l);
});

test('LIST_HEAD and LIST_TAIL are distinct iteration-direction constants', () => {
  assert.notStrictEqual(LIST_HEAD, LIST_TAIL);
  assert.equal(typeof LIST_HEAD, 'number');
  assert.equal(typeof LIST_TAIL, 'number');
});
