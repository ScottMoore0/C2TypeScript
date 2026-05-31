/* Init int[3] with ones = 1. */
#include <stdio.h>
int main(void) {
  int a[3];
  for (int i = 0; i < 3; i++) a[i] = 1;
  long s = 0;
  for (int i = 0; i < 3; i++) s += a[i];
  printf("%ld\n", s);
  return 0;
}
