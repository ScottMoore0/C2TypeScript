/* Double each element of array of size 3. */
#include <stdio.h>
int main(void) {
  int a[3];
  for (int i = 0; i < 3; i++) a[i] = i + 1;
  for (int i = 0; i < 3; i++) a[i] *= 2;
  int s = 0;
  for (int i = 0; i < 3; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
