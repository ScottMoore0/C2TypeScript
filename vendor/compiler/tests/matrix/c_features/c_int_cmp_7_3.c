/* Comparison: a=7, b=3. */
#include <stdio.h>
int main(void) {
  int a = 7, b = 3;
  printf("%d %d %d %d %d %d\n",
    (a == b) ? 1 : 0, (a != b) ? 1 : 0,
    (a < b) ? 1 : 0, (a <= b) ? 1 : 0,
    (a > b) ? 1 : 0, (a >= b) ? 1 : 0);
  return 0;
}
