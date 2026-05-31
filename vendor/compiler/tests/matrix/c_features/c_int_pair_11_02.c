/* int pair operations: a=11, b=2. */
#include <stdio.h>
int main(void) {
  int a = 11, b = 2;
  printf("%d %d %d %d %d %d\n",
    a + b, a - b, a * b, a / b, a %% b, a ^ b);
  return 0;
}
