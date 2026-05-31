/* Comparison: a=3, b=7. */
#include <stdio.h>
int main(void) {
  int a = 3, b = 7;
  printf("%d %d %d %d %d %d\n",
    (a == b) ? 1 : 0, (a != b) ? 1 : 0,
    (a < b) ? 1 : 0, (a <= b) ? 1 : 0,
    (a > b) ? 1 : 0, (a >= b) ? 1 : 0);
  return 0;
}
