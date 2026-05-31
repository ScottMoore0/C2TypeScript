/* int pair operations: a=4, b=5. */
#include <stdio.h>
int main(void) {
  int a = 4, b = 5;
  printf("%d %d %d %d %d %d\n",
    a + b, a - b, a * b, a / b, a %% b, a ^ b);
  return 0;
}
