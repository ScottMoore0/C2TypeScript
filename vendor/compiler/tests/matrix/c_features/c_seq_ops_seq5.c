/* Sequence of operations: seq5. */
#include <stdio.h>
int main(void) {
  int x = 10;
  x = x & ~3; x += 4; x = x % 100;
  printf("%d\n", x);
  return 0;
}
