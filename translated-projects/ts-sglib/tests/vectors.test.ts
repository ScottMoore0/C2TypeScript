/**
 * Reference-vector tests for ts-sglib.
 *
 * Source: SGLIB (Simple Generic Library) by Marian Vittek
 * (https://sglib.sourceforge.net/, mirror at
 * https://github.com/stefanct/sglib).
 *
 * SGLIB's C source uses preprocessor macros to instantiate generic data
 * structures over arbitrary element types. Macros do not survive
 * C-to-TS translation, so this package ships a fixed set of
 * pre-instantiated element types and the operations generated for
 * each (LIST, DL_LIST, SORTED_LIST, RBTREE, HASHED_CONTAINER).
 *
 * The translator preserves SGLIB's "head-pointer-by-pointer" calling
 * convention: list mutators take a `{ value: <node|null> }` cell as
 * their first argument so the head pointer can be rewritten in place.
 * The driver also exposes a `sglib_full_smoke` end-to-end exerciser
 * and per-structure probe helpers; the probes give us deterministic
 * reference vectors without re-implementing SGLIB itself in JS.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  int_node,
  // LIST<int_node>
  sglib_int_node_add,
  sglib_int_node_len,
  sglib_int_node_reverse,
  sglib_int_node_it_init,
  sglib_int_node_it_next,
  // smoke helpers
  sglib_full_smoke,
  sglib_full_probe_int_list_len,
  sglib_full_probe_int_list_reverse_first,
  sglib_full_probe_str_list_len,
  sglib_full_probe_dl_len,
  sglib_full_probe_dl_first_last,
  sglib_full_probe_rbtree_find,
  sglib_full_probe_hash_find,
  sglib_full_probe_sorted_head,
} from '../dist/index.js';

test('LIST<int_node>: add three elements then iterate (LIFO order)', () => {
  const head: any = { value: null };
  for (const v of [10, 20, 30]) {
    const n: any = new int_node();
    n.v = v;
    sglib_int_node_add(head, n);
  }
  // SGLIB list_add prepends, so iteration sees 30, 20, 10.
  const itc: any = { value: null };
  const seen: number[] = [];
  let cur = sglib_int_node_it_init(itc, head.value);
  while (cur) {
    seen.push((cur as any).v);
    cur = sglib_int_node_it_next(itc);
  }
  assert.deepEqual(seen, [30, 20, 10]);
  assert.equal(sglib_int_node_len(head.value), 3);
});

test('LIST<int_node>: reversing the head reverses the iteration order', () => {
  const head: any = { value: null };
  for (const v of [1, 2, 3, 4]) {
    const n: any = new int_node();
    n.v = v;
    sglib_int_node_add(head, n);
  }
  // After add: head -> 4 -> 3 -> 2 -> 1.
  sglib_int_node_reverse(head);
  // After reverse: head -> 1 -> 2 -> 3 -> 4.
  const itc: any = { value: null };
  const seen: number[] = [];
  let cur = sglib_int_node_it_init(itc, head.value);
  while (cur) {
    seen.push((cur as any).v);
    cur = sglib_int_node_it_next(itc);
  }
  assert.deepEqual(seen, [1, 2, 3, 4]);
});

test('LIST<int_node>: empty list reports length 0', () => {
  assert.equal(sglib_int_node_len(null), 0);
});

// ---------------------------------------------------------------------------
// Driver smoke probes — deterministic reference values across every
// instantiated container in the package.
// ---------------------------------------------------------------------------

test('sglib_full_smoke returns the deterministic aggregate value (261)', () => {
  // The aggregate is sum of per-probe results from the upstream
  // C-to-TS validator harness; any divergence indicates a regression
  // in any of the instantiated containers.
  assert.equal(sglib_full_smoke(), 261);
});

test('LIST<int_node> driver probe: list length is 2', () => {
  assert.equal(sglib_full_probe_int_list_len(), 2);
});

test('LIST<int_node> driver probe: first element after reverse is 1', () => {
  assert.equal(sglib_full_probe_int_list_reverse_first(), 1);
});

test('LIST<str_node_list> driver probe: list length is 3', () => {
  assert.equal(sglib_full_probe_str_list_len(), 3);
});

test('DL_LIST<int_node_dl> driver probe: length is 4', () => {
  assert.equal(sglib_full_probe_dl_len(), 4);
});

test('DL_LIST<int_node_dl> driver probe: first*1000 + last is 3010', () => {
  // Probe encodes head and tail values to distinguish "list reversed"
  // from "list correct" without exposing nodes across the FFI boundary.
  assert.equal(sglib_full_probe_dl_first_last(), 3010);
});

test('RBTREE<int_node_rb> driver probe: find returns 4', () => {
  assert.equal(sglib_full_probe_rbtree_find(), 4);
});

test('HASHED_CONTAINER<intkv_node> driver probe: find returns 200', () => {
  assert.equal(sglib_full_probe_hash_find(), 200);
});

test('SORTED_LIST<int_node_sl> driver probe: head value is 10', () => {
  assert.equal(sglib_full_probe_sorted_head(), 10);
});
