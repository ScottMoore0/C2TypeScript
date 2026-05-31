/* 100.0 < 0.0. */
#include <stdio.h>
int main(void) {
  double a = 100.0, b = 0.0;
  printf("%d\n", (a < b) ? 1 : 0);
  return 0;
}
