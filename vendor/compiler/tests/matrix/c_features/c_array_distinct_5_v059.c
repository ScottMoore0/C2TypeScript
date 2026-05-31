/* Array of size 5, sum-and-printf. */
#include <stdio.h>
int main(void) {
  int a[5] = { 2, 4, 6, 8, 10 };
  int s = 0;
  for (int i = 0; i < 5; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
