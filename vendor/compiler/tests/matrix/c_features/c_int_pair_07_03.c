/* int pair operations: a=7, b=3. */
#include <stdio.h>
int main(void) {
  int a = 7, b = 3;
  printf("%d %d %d %d %d %d\n",
    a + b, a - b, a * b, a / b, a %% b, a ^ b);
  return 0;
}
