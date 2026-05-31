/* C17 §6.7.2.1 + §6.3.2.3 p7 — inline cast-then-CHAINED-member.
 *
 * Reproduces Lua's exact failing pattern:
 *   typedef union Node { struct NodeKey { ...; Value key_val; } u; TValue i_val; };
 *   TValue *getval(...);   // returns &node->i_val
 *   ((Node *)getval(...))->u.key_val.gc
 *                  ↑       ↑   ↑       ↑
 *               cast    field field   field (deeper than 1 hop)
 *
 * The simpler matrix test `c_struct_first_field_cast_inline_union.c` only
 * exercises a single `.field` after the cast. If THIS chained-access
 * variant fails, the bug is in the multi-hop member access path
 * (`__struct_ptr_at` chain) where the inner cast falls off.
 *
 * EXPECT: 9999 (read through chained access).
 */
#include <stdio.h>

typedef struct {
  int  tt;
  long val;
} TValue;

typedef struct {
  TValue key_val;
  int    tag;
} NodeKey;

typedef union {
  NodeKey u;          /* first field, offset 0 */
  TValue  i_val;      /* second offset-0 field — like Lua's Node */
} Node;

static Node storage;

static TValue *getval(void) {
  return &storage.i_val;
}

int main(void) {
  storage.u.key_val.tt  = 7;
  storage.u.key_val.val = 9999;
  storage.u.tag         = 42;
  /* Chained access through inline cast: cast TValue* back to Node*, then
   * read .u.key_val.val. */
  printf("val=%ld\n", ((Node *)getval())->u.key_val.val);
  return 0;
}
