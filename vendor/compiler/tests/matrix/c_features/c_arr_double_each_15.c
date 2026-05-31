/* Double each element of array of size 15. */
#include <stdio.h>
int main(void) {
  int a[15];
  for (int i = 0; i < 15; i++) a[i] = i + 1;
  for (int i = 0; i < 15; i++) a[i] *= 2;
  int s = 0;
  for (int i = 0; i < 15; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
