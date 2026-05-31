/* int pair operations: a=13, b=1. */
#include <stdio.h>
int main(void) {
  int a = 13, b = 1;
  printf("%d %d %d %d %d %d\n",
    a + b, a - b, a * b, a / b, a %% b, a ^ b);
  return 0;
}
