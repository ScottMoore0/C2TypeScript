/* Init int[50] with idx_alt = i % 2 ? i : -i. */
#include <stdio.h>
int main(void) {
  int a[50];
  for (int i = 0; i < 50; i++) a[i] = i % 2 ? i : -i;
  long s = 0;
  for (int i = 0; i < 50; i++) s += a[i];
  printf("%ld\n", s);
  return 0;
}
