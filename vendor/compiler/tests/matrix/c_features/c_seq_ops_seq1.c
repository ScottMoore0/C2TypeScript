/* Sequence of operations: seq1. */
#include <stdio.h>
int main(void) {
  int x = 10;
  x++; x *= 2; x--; x = -x;
  printf("%d\n", x);
  return 0;
}
