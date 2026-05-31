/* C17 §6.7.2.1 + §6.3.2.3 p7 — inline cast-then-member through a UNION
 * with the source being a function return value.
 *
 * Replicates Lua's exact pattern:
 *   typedef union Node { struct { ...; Value key_val; } u; TValue i_val; };
 *   TValue *get(...);  // returns &node->i_val
 *   ((Node *)get(...))->u.key_val.gc;
 *
 * The matrix test `c_struct_first_field_cast_inline_member.c` covers the
 * case where the cast source is `&o.first` (a field-ref proxy). Here the
 * cast source is a returned `Inner *` — a function return value — which
 * the emitter must still recognise as a typed pointer to the first field.
 *
 * EXPECT: 9999.
 */
#include <stdio.h>

typedef struct {
  int x;
  int y;
} Inner;

typedef union {
  Inner u;       /* first field, offset 0 */
  long  long_alias; /* same offset, different type — like Lua's i_val */
} Outer;

static Outer storage;

static Inner *get_first(void) {
  return &storage.u;
}

int main(void) {
  storage.u.x = 100;
  storage.u.y = 200;
  storage.long_alias = 9999;   /* overwrites the union storage */
  /* Inline cast of the function return value back to Outer*, then read
   * through the alias member. */
  printf("alias=%ld\n", ((Outer *)get_first())->long_alias);
  return 0;
}
