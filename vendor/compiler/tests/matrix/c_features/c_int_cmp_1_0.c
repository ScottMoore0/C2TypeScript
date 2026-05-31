/* Comparison: a=1, b=0. */
#include <stdio.h>
int main(void) {
  int a = 1, b = 0;
  printf("%d %d %d %d %d %d\n",
    (a == b) ? 1 : 0, (a != b) ? 1 : 0,
    (a < b) ? 1 : 0, (a <= b) ? 1 : 0,
    (a > b) ? 1 : 0, (a >= b) ? 1 : 0);
  return 0;
}
