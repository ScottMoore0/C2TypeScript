/* Array of size 4, sum-and-printf. */
#include <stdio.h>
int main(void) {
  int a[4] = { 1, 4, 9, 16 };
  int s = 0;
  for (int i = 0; i < 4; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
