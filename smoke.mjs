// Smoke test: exercises all 5 SGLIB data structures end-to-end against
// the built dist/. Mirrors validate.ts in cpp-to-ts/compiler/tests/real-world/sglib-full/.
import {
  int_node, sglib_int_node_add, sglib_int_node_len, sglib_int_node_find_member,
  int_node_dl, sglib_int_node_dl_add, sglib_int_node_dl_get_first, sglib_int_node_dl_get_last, sglib_int_node_dl_len,
  int_node_sl, sglib_int_node_sl_add, sglib_int_node_sl_len,
  int_node_rb, sglib_int_node_rb_add, sglib_int_node_rb_find_member,
  intkv_node, sglib_hashed_intkv_node_init, sglib_hashed_intkv_node_add, sglib_hashed_intkv_node_find_member,
} from "./dist/index.js";

let pass = 0, fail = 0;
function expect(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { console.log(`  [OK]   ${name}`); pass++; }
  else { console.log(`  [FAIL] ${name} got=${JSON.stringify(got)} want=${JSON.stringify(want)}`); fail++; }
}

// ---- LIST<int_node>: add 3, len=3, find by comparator. ----
{
  const a = Object.assign(new int_node(), { v: 1, next: null, prev: null, left: null, right: null, color: 0 });
  const b = Object.assign(new int_node(), { v: 2, next: null, prev: null, left: null, right: null, color: 0 });
  const c = Object.assign(new int_node(), { v: 3, next: null, prev: null, left: null, right: null, color: 0 });
  const list = { value: null };
  sglib_int_node_add(list, a);
  sglib_int_node_add(list, b);
  sglib_int_node_add(list, c);
  expect("LIST<int_node> len after 3 adds", sglib_int_node_len(list.value), 3);
  const probe = Object.assign(new int_node(), { v: 2, next: null, prev: null, left: null, right: null, color: 0 });
  expect("LIST<int_node> find(v=2) returns node", sglib_int_node_find_member(list.value, probe)?.v, 2);
}

// ---- DL_LIST<int_node_dl>: add 3, get_first / get_last. ----
{
  const d1 = Object.assign(new int_node_dl(), { v: 10, next: null, prev: null });
  const d2 = Object.assign(new int_node_dl(), { v: 20, next: null, prev: null });
  const d3 = Object.assign(new int_node_dl(), { v: 30, next: null, prev: null });
  const dl = { value: null };
  sglib_int_node_dl_add(dl, d1);
  sglib_int_node_dl_add(dl, d2);
  sglib_int_node_dl_add(dl, d3);
  expect("DL_LIST<int_node_dl> len after 3 adds", sglib_int_node_dl_len(dl.value), 3);
  const first = sglib_int_node_dl_get_first(dl.value);
  const last  = sglib_int_node_dl_get_last(dl.value);
  expect("DL_LIST<int_node_dl> get_first not null", first != null, true);
  expect("DL_LIST<int_node_dl> get_last not null", last  != null, true);
}

// ---- SORTED_LIST<int_node_sl>: add 3 unsorted, head is min(=10). ----
{
  const s1 = Object.assign(new int_node_sl(), { v: 30, next: null });
  const s2 = Object.assign(new int_node_sl(), { v: 10, next: null });
  const s3 = Object.assign(new int_node_sl(), { v: 20, next: null });
  const sl = { value: null };
  sglib_int_node_sl_add(sl, s1);
  sglib_int_node_sl_add(sl, s2);
  sglib_int_node_sl_add(sl, s3);
  expect("SORTED_LIST<int_node_sl> len after 3 adds", sglib_int_node_sl_len(sl.value), 3);
  expect("SORTED_LIST<int_node_sl> head is min(=10)", sl.value?.v, 10);
}

// ---- RBTREE<int_node_rb>: add 5, find by comparator. ----
{
  function makeRb(v) { return Object.assign(new int_node_rb(), { v, left: null, right: null, color: 0 }); }
  const root = { value: null };
  for (const v of [3, 1, 4, 1, 5]) sglib_int_node_rb_add(root, makeRb(v));
  const probe = makeRb(4);
  const found = sglib_int_node_rb_find_member(root.value, probe);
  expect("RBTREE<int_node_rb> find(v=4) after 5 inserts", found?.v, 4);
}

// ---- HASHED_CONTAINER<intkv_node>: init + add 3 + find by key. ----
{
  function makeKv(k, v) { return Object.assign(new intkv_node(), { k, v, next_in_chain: null }); }
  const HASH_DIM = 16;
  const table = new Array(HASH_DIM).fill(null);
  sglib_hashed_intkv_node_init(table);
  sglib_hashed_intkv_node_add(table, makeKv(1, 100));
  sglib_hashed_intkv_node_add(table, makeKv(2, 200));
  sglib_hashed_intkv_node_add(table, makeKv(3, 300));
  const probe = makeKv(2, 0);
  expect("HASHED_CONTAINER<intkv_node> find(k=2) returns v=200", sglib_hashed_intkv_node_find_member(table, probe)?.v, 200);
}

console.log(`\nSmoke: ${pass}/${pass + fail}`);
if (fail > 0) process.exit(1);
