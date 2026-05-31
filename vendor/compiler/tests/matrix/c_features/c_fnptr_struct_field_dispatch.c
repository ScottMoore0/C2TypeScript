/* C17 §6.7.6.1 (pointer declarators) + §6.5.2.3 p4 (member access)
 * + §6.5.2.2 (function calls): a function-pointer FIELD inside a
 * struct, called both via `s.fn(x)` (member-of-object) and via
 * `p->fn(x)` (member-of-pointer). The field designator names the
 * function-pointer; the call expression evaluates the designator as
 * an lvalue and then performs the indirect call. The translator must
 * keep the field name and dispatch shape consistent across both
 * access syntaxes.
 *
 * Companion to c_fnptr_struct_param.c (parameter-side struct-by-value).
 */
#include <stdio.h>

struct Op {
  int (*fn)(int);          /* §6.7.6.1: pointer declarator with parameter list */
  int bias;
};

static int inc(int x) { return x + 1; }
static int dbl(int x) { return x * 2; }

int main(void) {
  struct Op a = { inc, 10 };
  struct Op b = { dbl, 100 };
  struct Op *pa = &a;
  struct Op *pb = &b;

  /* §6.5.2.3 p3: `s.fn` — member-of-object access producing the
   * function pointer. */
  int r1 = a.fn(5) + a.bias;        /* inc(5) + 10 = 16 */
  int r2 = b.fn(5) + b.bias;        /* dbl(5) + 100 = 110 */

  /* §6.5.2.3 p4: `p->fn` — member-of-pointer access. Must be
   * lowered to (*p).fn semantics, then called. */
  int r3 = pa->fn(7) + pa->bias;    /* inc(7) + 10 = 18 */
  int r4 = pb->fn(7) + pb->bias;    /* dbl(7) + 100 = 114 */

  printf("%d %d %d %d\n", r1, r2, r3, r4);
  return 0;
}
