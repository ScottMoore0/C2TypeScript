/* Init int[15] with ones = 1. */
#include <stdio.h>
int main(void) {
  int a[15];
  for (int i = 0; i < 15; i++) a[i] = 1;
  long s = 0;
  for (int i = 0; i < 15; i++) s += a[i];
  printf("%ld\n", s);
  return 0;
}
