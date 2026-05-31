/* Sequence of operations: seq6. */
#include <stdio.h>
int main(void) {
  int x = 10;
  x = (x + 5) * 7 - 3 / 2;
  printf("%d\n", x);
  return 0;
}
