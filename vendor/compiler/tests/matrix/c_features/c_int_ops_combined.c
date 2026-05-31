/* Mix of int operators to exercise precedence. */
#include <stdio.h>
int main(void) {
  int r = 1 + 2 * 3 - 4 / 2 + (5 << 1) - (6 >> 1);
  printf("%d\n", r);
  return 0;
}
