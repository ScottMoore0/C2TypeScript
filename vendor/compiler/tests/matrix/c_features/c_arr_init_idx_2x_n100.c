/* Init int[100] with idx_2x = 2 * i. */
#include <stdio.h>
int main(void) {
  int a[100];
  for (int i = 0; i < 100; i++) a[i] = 2 * i;
  long s = 0;
  for (int i = 0; i < 100; i++) s += a[i];
  printf("%ld\n", s);
  return 0;
}
