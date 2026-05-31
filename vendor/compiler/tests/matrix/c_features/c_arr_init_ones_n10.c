/* Init int[10] with ones = 1. */
#include <stdio.h>
int main(void) {
  int a[10];
  for (int i = 0; i < 10; i++) a[i] = 1;
  long s = 0;
  for (int i = 0; i < 10; i++) s += a[i];
  printf("%ld\n", s);
  return 0;
}
