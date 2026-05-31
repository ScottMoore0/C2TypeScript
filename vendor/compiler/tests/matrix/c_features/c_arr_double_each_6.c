/* Double each element of array of size 6. */
#include <stdio.h>
int main(void) {
  int a[6];
  for (int i = 0; i < 6; i++) a[i] = i + 1;
  for (int i = 0; i < 6; i++) a[i] *= 2;
  int s = 0;
  for (int i = 0; i < 6; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
