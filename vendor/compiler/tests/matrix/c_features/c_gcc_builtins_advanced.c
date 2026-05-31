/* Less-common __builtin_* family: constant_p, types_compatible_p,
 * choose_expr, alloca, memcpy/memmove. Each is used in macro libraries
 * for compile-time decisions, type-generic dispatch, or fast paths.
 */
#include <stdio.h>
#include <string.h>

int main(void) {
  /* __builtin_constant_p — compile-time constant detection. Used in
   * macros to pick fast paths for literal arguments. Returns 0 or 1. */
  int x = 42;
  int n_const = __builtin_constant_p(123);  /* 1 */
  int n_var = __builtin_constant_p(x);      /* 0 (or sometimes 1 — impl) */
  printf("const-p=%d var-p=%d\n", n_const, n_var ? 1 : 0);

  /* __builtin_choose_expr — like _Generic but for arbitrary const expr.
   * choose_expr(c, a, b) → a if c is true at compile time, else b. */
  int chosen = __builtin_choose_expr(1, 100, 200);
  printf("chosen=%d\n", chosen);

  /* __builtin_types_compatible_p — type equality for generic dispatch */
  int compat = __builtin_types_compatible_p(int, int);
  int incompat = __builtin_types_compatible_p(int, double);
  printf("compat=%d incompat=%d\n", compat, incompat);

  /* __builtin_memcpy — common direct call (gcc lowers ordinary memcpy
   * via this name in some headers) */
  char buf[8] = {0};
  __builtin_memcpy(buf, "hello", 5);
  printf("memcpy=%s\n", buf);

  return 0;
}
