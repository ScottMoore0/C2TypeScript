/* Sequence of operations: seq2. */
#include <stdio.h>
int main(void) {
  int x = 10;
  x = x*x; x += 1; x /= 3;
  printf("%d\n", x);
  return 0;
}
