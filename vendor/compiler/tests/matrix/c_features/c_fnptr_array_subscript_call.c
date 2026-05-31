/* C17 §6.5.2.1 (array subscripting) + §6.5.2.2 (function calls)
 * + §6.7.6.2 (array declarators) + §6.7.6.1 (pointer declarators):
 * an array of function pointers, called via `fns[i](arg)` for
 * varying i. By §6.5.2.1, `fns[i]` is `*((fns)+(i))` — the indexed
 * element is itself a function pointer; §6.5.2.2 then performs the
 * indirect call.
 *
 * Companion to c_fnptr_sub1_arg0.c (single-name fnptr call). The
 * subscript-and-call composition is the OOP-in-C jump-table pattern
 * (Lua's lvm.c, Python's ceval.c, GCC's gimple-iterator dispatchers).
 */
#include <stdio.h>

static int op_neg(int x)  { return -x; }
static int op_inc(int x)  { return x + 1; }
static int op_sq(int x)   { return x * x; }
static int op_zero(int x) { (void)x; return 0; }

int main(void) {
  /* §6.7.6.2 + §6.7.6.1: array of N function pointers each
   * `int (*)(int)`. Brace-initialised at declaration. */
  int (*fns[4])(int) = { op_neg, op_inc, op_sq, op_zero };

  /* §6.5.2.1: subscript at literal indices. */
  int r0 = fns[0](7);   /* op_neg(7)  = -7 */
  int r1 = fns[1](7);   /* op_inc(7)  =  8 */
  int r2 = fns[2](7);   /* op_sq(7)   = 49 */
  int r3 = fns[3](7);   /* op_zero(7) =  0 */

  /* §6.5.2.1: subscript via runtime-computed index. The index
   * expression must be evaluated, then the pointer loaded, then
   * the call performed — translator must not collapse to a static
   * dispatch. */
  int sum = 0;
  for (int i = 0; i < 4; i++) {
    sum += fns[i](2);   /* -2 + 3 + 4 + 0 = 5 */
  }

  /* Subscript via expression with side-effecting computation. */
  int idx = (3 + 2) % 4;  /* = 1 */
  int r4 = fns[idx](10);  /* op_inc(10) = 11 */

  printf("%d %d %d %d %d %d\n", r0, r1, r2, r3, sum, r4);
  return 0;
}
