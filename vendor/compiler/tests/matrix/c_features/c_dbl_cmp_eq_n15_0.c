/* -1.5 == 0.0. */
#include <stdio.h>
int main(void) {
  double a = -1.5, b = 0.0;
  printf("%d\n", (a == b) ? 1 : 0);
  return 0;
}
