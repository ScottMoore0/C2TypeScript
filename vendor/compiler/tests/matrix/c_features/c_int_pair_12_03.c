/* int pair operations: a=12, b=3. */
#include <stdio.h>
int main(void) {
  int a = 12, b = 3;
  printf("%d %d %d %d %d %d\n",
    a + b, a - b, a * b, a / b, a %% b, a ^ b);
  return 0;
}
