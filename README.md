## ts-sglib

A TypeScript port of [SGLIB](https://github.com/stefanct/sglib) (Simple Generic Library) by Marian Vittek, automatically translated from the original C with [`cpp-to-ts`](https://github.com/ScottMoore0/cpp-to-ts).

### Scope

SGLIB derives its value from C preprocessor macros that let you instantiate generic data structures over arbitrary user-defined element types. C macros do not survive C-to-TypeScript translation, so this package ships a fixed set of pre-instantiated element types and the operations generated for each. If you need SGLIB instantiated for a different element type, fork the source `driver.c` (in the upstream `cpp-to-ts` repo, fixture `sglib-full`), edit the typedefs and `SGLIB_DEFINE_*` macro invocations, re-run the translator, and use the resulting `driver.ts`.

### Pre-instantiated element types

| Element type     | Used by                                                |
|------------------|--------------------------------------------------------|
| `int_node`       | `LIST` (singly-linked, integer payload)                |
| `str_node_list`  | `LIST` (singly-linked, string-keyed)                   |
| `intkv_node`     | `LIST` and `HASHED_CONTAINER` (int-keyed entries)      |
| `int_node_dl`    | `DL_LIST` (doubly-linked, integer payload)             |
| `int_node_sl`    | `SORTED_LIST` (sorted singly-linked, integer payload)  |
| `int_node_rb`    | `RBTREE` (red-black tree, integer payload)             |

All five SGLIB data-structure families (LIST, DL_LIST, SORTED_LIST, RBTREE, HASHED_CONTAINER) are runtime-functional in this build.

### Installation

```
npm install ts-sglib
```

### Usage

SGLIB's C signatures take a `T**` for the head/root because they re-seat the head on insert/delete. In the TypeScript port that becomes a `{value: head}` ref-box. Fields on element structs (`next`, `prev`, `left`, `right`, `color`, etc.) must be initialised explicitly because the runtime does not zero-fill C struct fields automatically.

#### LIST<int_node>

```typescript
import {
  int_node,
  sglib_int_node_add,
  sglib_int_node_len,
  sglib_int_node_find_member,
  sglib_int_node_reverse,
} from "ts-sglib";

const a = Object.assign(new int_node(), { v: 1, next: null, prev: null, left: null, right: null, color: 0 });
const b = Object.assign(new int_node(), { v: 2, next: null, prev: null, left: null, right: null, color: 0 });
const c = Object.assign(new int_node(), { v: 3, next: null, prev: null, left: null, right: null, color: 0 });

const list: { value: int_node | null } = { value: null };
sglib_int_node_add(list, a);
sglib_int_node_add(list, b);
sglib_int_node_add(list, c);

console.log(sglib_int_node_len(list.value));    // 3

const probe = Object.assign(new int_node(), { v: 2, next: null, prev: null, left: null, right: null, color: 0 });
console.log(sglib_int_node_find_member(list.value, probe)?.v);  // 2

sglib_int_node_reverse(list);
console.log(list.value?.v);                     // 1
```

#### RBTREE<int_node_rb>

```typescript
import {
  int_node_rb,
  sglib_int_node_rb_add,
  sglib_int_node_rb_find_member,
} from "ts-sglib";

function makeRb(v: number): int_node_rb {
  return Object.assign(new int_node_rb(), { v, left: null, right: null, color: 0 });
}

const root: { value: int_node_rb | null } = { value: null };
for (const v of [3, 1, 4, 1, 5, 9, 2, 6]) {
  sglib_int_node_rb_add(root, makeRb(v));
}

const probe = makeRb(4);
const found = sglib_int_node_rb_find_member(root.value, probe);
console.log(found?.v);                          // 4
```

#### HASHED_CONTAINER<intkv_node>

```typescript
import {
  intkv_node,
  sglib_hashed_intkv_node_init,
  sglib_hashed_intkv_node_add,
  sglib_hashed_intkv_node_find_member,
} from "ts-sglib";

function makeKv(k: number, v: number): intkv_node {
  return Object.assign(new intkv_node(), { k, v, next_in_chain: null });
}

// SGLIB's HASHED_CONTAINER is open-addressed; the table itself is a fixed
// array passed in by the caller. The translation models it as a JS array of
// length equal to the SGLIB hash dimension declared in driver.c.
const HASH_DIM = 16;
const table: (intkv_node | null)[] = new Array(HASH_DIM).fill(null);
sglib_hashed_intkv_node_init(table);

sglib_hashed_intkv_node_add(table, makeKv(1, 100));
sglib_hashed_intkv_node_add(table, makeKv(2, 200));
sglib_hashed_intkv_node_add(table, makeKv(3, 300));

const probe = makeKv(2, 0);
const got = sglib_hashed_intkv_node_find_member(table, probe);
console.log(got?.v);                            // 200
```

### Public API (grouped by data structure)

#### LIST<int_node>, LIST<str_node_list>, LIST<intkv_node>
`add`, `add_if_not_member`, `concat`, `delete`, `delete_if_member`, `is_member`, `find_member`, `sort`, `len`, `reverse`, plus an iterator class and `it_init`, `it_init_on_equal`, `it_current`, `it_next` walkers. Per-instantiation prefixes: `sglib_int_node_*`, `sglib_str_node_list_*`, `sglib_intkv_node_*`.

#### DL_LIST<int_node_dl>
LIST operations plus `add_after`, `add_before`, `add_after_if_not_member`, `add_before_if_not_member`, `get_first`, `get_last`. Prefix: `sglib_int_node_dl_*`.

#### SORTED_LIST<int_node_sl>
`add`, `add_if_not_member`, `delete`, `delete_if_member`, `find_member`, `is_member`, `len`, `sort`, plus iterator. Prefix: `sglib_int_node_sl_*`.

#### RBTREE<int_node_rb>
`add`, `add_if_not_member`, `delete`, `delete_if_member`, `find_member`, `is_member`, `len`, plus pre-/in-/post-order iterators. Prefix: `sglib_int_node_rb_*`.

#### HASHED_CONTAINER<intkv_node>
`init`, `add`, `add_if_not_member`, `delete`, `delete_if_member`, `is_member`, `find_member`, plus iterator. Prefix: `sglib_hashed_intkv_node_*`.

#### Smoke / probe helpers
`sglib_full_smoke` and `sglib_full_probe_*` are deterministic end-to-end exercises used by the upstream cpp-to-ts validator; they exercise all five data structures.

Internal CPtr / runtime shims (`cptr_*`, `__cpp_*`, `__safe_*`, `__struct_*`, `__field_ref_*`, `realloc`, etc.) are deliberately not re-exported.

### License

MIT. See [LICENSE](LICENSE). Original C copyright (c) 2003-2005 Marian Vittek; mirror maintained by Stefan Tauner; TypeScript translation copyright (c) 2026 Scott Moore.

### Upstream

- Upstream C source: https://github.com/stefanct/sglib
- Original author: Marian Vittek (~2003-2005)
- Translator: cpp-to-ts (https://github.com/ScottMoore0/cpp-to-ts)
