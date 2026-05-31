/* Array of size 6, sum-and-printf. */
#include <stdio.h>
int main(void) {
  int a[6] = { 1, 2, 4, 8, 16, 32 };
  int s = 0;
  for (int i = 0; i < 6; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
