/* Init int[100] with zeros = 0. */
#include <stdio.h>
int main(void) {
  int a[100];
  for (int i = 0; i < 100; i++) a[i] = 0;
  long s = 0;
  for (int i = 0; i < 100; i++) s += a[i];
  printf("%ld\n", s);
  return 0;
}
