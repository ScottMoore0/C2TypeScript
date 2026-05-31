/* Double each element of array of size 12. */
#include <stdio.h>
int main(void) {
  int a[12];
  for (int i = 0; i < 12; i++) a[i] = i + 1;
  for (int i = 0; i < 12; i++) a[i] *= 2;
  int s = 0;
  for (int i = 0; i < 12; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
