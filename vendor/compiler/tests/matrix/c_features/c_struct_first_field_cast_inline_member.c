/* C17 §6.7.2.1 + §6.3.2.3 p7 — inline cast-then-member.
 *
 * Gap 13's matrix test (`c_struct_first_field_cast_back`) covers the case
 * where the cast result is bound to a variable: `Outer *back = (Outer *)p;
 * back->extra`. This is the inline form: `((Outer *)p)->extra`. The AST
 * shape is different (MemberExpr's base is CStyleCastExpr directly, not a
 * DeclRefExpr) and the emitter must still apply the first-field unwrap.
 *
 * Lua's `nodefromval(o) = (Node *)(o)` macro followed by `->u.key_val` is
 * the canonical user. With Gap 13 only handling the bound form, the inline
 * form silently drops the cast and reads the wrong fields off the source.
 *
 * EXPECT: 9999 (outer.extra read through inline cast-back).
 */
#include <stdio.h>

typedef struct {
  int x;
  int y;
} Inner;

typedef struct {
  Inner first;
  long  extra;
} Outer;

int main(void) {
  Outer o = { { 100, 200 }, 9999 };
  /* &o.first has type Inner *; cast back inline and read .extra in one
   * expression. The MemberExpr's base is the CStyleCastExpr directly. */
  printf("outer.extra=%ld\n", ((Outer *)&o.first)->extra);
  return 0;
}
