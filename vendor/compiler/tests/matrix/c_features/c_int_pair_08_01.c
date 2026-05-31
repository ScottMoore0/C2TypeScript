/* int pair operations: a=8, b=1. */
#include <stdio.h>
int main(void) {
  int a = 8, b = 1;
  printf("%d %d %d %d %d %d\n",
    a + b, a - b, a * b, a / b, a %% b, a ^ b);
  return 0;
}
