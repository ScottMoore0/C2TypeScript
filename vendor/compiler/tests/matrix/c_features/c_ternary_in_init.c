/* C17 §6.5.15 — ternary as initializer expression. */
#include <stdio.h>
int main(void) {
  int n = 5;
  int parity = (n % 2 == 0) ? 100 : -1;
  int sign = (n < 0) ? -1 : (n == 0) ? 0 : 1;
  printf("%d %d\n", parity, sign);
  return 0;
}
