/* Sequence of operations: seq4. */
#include <stdio.h>
int main(void) {
  int x = 10;
  x = x | (x >> 1); x = x | (x >> 2);
  printf("%d\n", x);
  return 0;
}
