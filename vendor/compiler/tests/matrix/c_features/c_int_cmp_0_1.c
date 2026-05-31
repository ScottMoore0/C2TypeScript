/* Comparison: a=0, b=1. */
#include <stdio.h>
int main(void) {
  int a = 0, b = 1;
  printf("%d %d %d %d %d %d\n",
    (a == b) ? 1 : 0, (a != b) ? 1 : 0,
    (a < b) ? 1 : 0, (a <= b) ? 1 : 0,
    (a > b) ? 1 : 0, (a >= b) ? 1 : 0);
  return 0;
}
