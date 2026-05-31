/* Double each element of array of size 40. */
#include <stdio.h>
int main(void) {
  int a[40];
  for (int i = 0; i < 40; i++) a[i] = i + 1;
  for (int i = 0; i < 40; i++) a[i] *= 2;
  int s = 0;
  for (int i = 0; i < 40; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
