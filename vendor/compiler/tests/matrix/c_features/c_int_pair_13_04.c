/* int pair operations: a=13, b=4. */
#include <stdio.h>
int main(void) {
  int a = 13, b = 4;
  printf("%d %d %d %d %d %d\n",
    a + b, a - b, a * b, a / b, a %% b, a ^ b);
  return 0;
}
