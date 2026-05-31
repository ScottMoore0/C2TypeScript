/* Init int[50] with zeros = 0. */
#include <stdio.h>
int main(void) {
  int a[50];
  for (int i = 0; i < 50; i++) a[i] = 0;
  long s = 0;
  for (int i = 0; i < 50; i++) s += a[i];
  printf("%ld\n", s);
  return 0;
}
