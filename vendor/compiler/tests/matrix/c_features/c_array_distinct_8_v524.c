/* Array of size 8, sum-and-printf. */
#include <stdio.h>
int main(void) {
  int a[8] = { (-1), 1, (-2), 2, (-3), 3, (-4), 4 };
  int s = 0;
  for (int i = 0; i < 8; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
