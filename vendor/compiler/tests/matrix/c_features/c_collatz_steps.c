/* Collatz conjecture: number of steps to reach 1. */
#include <stdio.h>
int collatz(int n) {
  int s = 0;
  while (n != 1) { n = (n & 1) ? 3 * n + 1 : n / 2; s++; }
  return s;
}
int main(void) {
  printf("%d %d %d %d\n", collatz(1), collatz(7), collatz(27), collatz(100));
  return 0;
}
