/* C17 §6.7.6.3 — higher-order: function taking a function-pointer
 * argument that itself takes a function-pointer argument.
 *
 * Functional-style C (foreach, map, reduce, transducers) composes
 * indirect calls multiple levels deep. Each layer must thread the
 * fnptr through and call it correctly.
 */
#include <stdio.h>

int twice(int x) { return x * 2; }
int succ(int x) { return x + 1; }

int compose_apply(int (*outer)(int), int (*inner)(int), int v) {
  return outer(inner(v));
}

int run_with(int (*combiner)(int(*)(int), int(*)(int), int), int v) {
  return combiner(twice, succ, v);
}

int main(void) {
  int r1 = compose_apply(twice, succ, 3);  /* twice(succ(3)) = 8 */
  int r2 = run_with(compose_apply, 5);      /* compose_apply(twice, succ, 5) = 12 */
  printf("r1=%d r2=%d\n", r1, r2);
  return 0;
}
