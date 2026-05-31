/* C17 §6.3.1.4 — int-to-float conversion is exact for small ints. */
#include <stdio.h>
int main(void) {
  int a = 12345;
  double b = (double)a;
  printf("%.1f\n", b);
  return 0;
}
