/* Sequence of operations: seq7. */
#include <stdio.h>
int main(void) {
  int x = 10;
  for (int i = 0; i < 5; i++) x = (x * 3 + 1) % 100;
  printf("%d\n", x);
  return 0;
}
