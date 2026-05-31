/* int pair operations: a=5, b=5. */
#include <stdio.h>
int main(void) {
  int a = 5, b = 5;
  printf("%d %d %d %d %d %d\n",
    a + b, a - b, a * b, a / b, a %% b, a ^ b);
  return 0;
}
