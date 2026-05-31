/* Init int[20] with idx_neg = -i. */
#include <stdio.h>
int main(void) {
  int a[20];
  for (int i = 0; i < 20; i++) a[i] = -i;
  long s = 0;
  for (int i = 0; i < 20; i++) s += a[i];
  printf("%ld\n", s);
  return 0;
}
