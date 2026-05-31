/* Array of size 20, sum-and-printf. */
#include <stdio.h>
int main(void) {
  int a[20] = { 1, (-1), 1, (-1), 1, (-1), 1, (-1), 1, (-1), 1, (-1), 1, (-1), 1, (-1), 1, (-1), 1, (-1) };
  int s = 0;
  for (int i = 0; i < 20; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
