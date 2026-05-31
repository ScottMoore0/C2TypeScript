/* Array of size 12, sum-and-printf. */
#include <stdio.h>
int main(void) {
  int a[12] = { 0, 11, 22, 33, 44, 55, 66, 77, 88, 99, 110, 121 };
  int s = 0;
  for (int i = 0; i < 12; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
