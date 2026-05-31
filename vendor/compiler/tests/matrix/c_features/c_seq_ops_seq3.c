/* Sequence of operations: seq3. */
#include <stdio.h>
int main(void) {
  int x = 10;
  x ^= 0xFF; x <<= 2; x &= 0x3FF;
  printf("%d\n", x);
  return 0;
}
