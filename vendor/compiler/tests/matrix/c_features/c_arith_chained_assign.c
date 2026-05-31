/* Chained simple assignment. */
#include <stdio.h>
int main(void) {
  int a, b, c, d;
  a = b = c = d = 7;
  printf("%d %d %d %d\n", a, b, c, d);
  return 0;
}
