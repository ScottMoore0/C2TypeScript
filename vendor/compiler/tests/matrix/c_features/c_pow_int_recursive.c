/* Integer power, recursive. */
#include <stdio.h>
long ipow(long base, int exp) {
  if (exp == 0) return 1;
  if (exp & 1) return base * ipow(base, exp - 1);
  long h = ipow(base, exp / 2);
  return h * h;
}
int main(void) {
  printf("%ld %ld %ld %ld\n", ipow(2, 10), ipow(3, 5), ipow(7, 0), ipow(5, 4));
  return 0;
}
