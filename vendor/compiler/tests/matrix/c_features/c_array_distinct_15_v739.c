/* Array of size 15, sum-and-printf. */
#include <stdio.h>
int main(void) {
  int a[15] = { 0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196 };
  int s = 0;
  for (int i = 0; i < 15; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
