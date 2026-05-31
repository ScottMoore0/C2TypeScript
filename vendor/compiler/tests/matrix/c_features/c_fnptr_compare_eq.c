/* C17 §6.5.9 — equality of two function pointers.
 *
 * Used in registry/handler tables to detect duplicate registration,
 * and in unit tests of dispatch logic. Both sides decay from
 * function designators to function pointers (§6.3.2.1).
 */
#include <stdio.h>

int alpha(int x) { return x + 1; }
int beta(int x) { return x + 2; }

int main(void) {
  int (*fp)(int) = alpha;
  int eq_self = (fp == alpha);
  int eq_other = (fp == beta);
  int neq_other = (fp != beta);
  printf("self=%d other=%d neq=%d\n", eq_self, eq_other, neq_other);
  return 0;
}
