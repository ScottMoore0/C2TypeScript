/* Init int[10] with idx_alt = i % 2 ? i : -i. */
#include <stdio.h>
int main(void) {
  int a[10];
  for (int i = 0; i < 10; i++) a[i] = i % 2 ? i : -i;
  long s = 0;
  for (int i = 0; i < 10; i++) s += a[i];
  printf("%ld\n", s);
  return 0;
}
