/* Init int[15] with idx = i. */
#include <stdio.h>
int main(void) {
  int a[15];
  for (int i = 0; i < 15; i++) a[i] = i;
  long s = 0;
  for (int i = 0; i < 15; i++) s += a[i];
  printf("%ld\n", s);
  return 0;
}
