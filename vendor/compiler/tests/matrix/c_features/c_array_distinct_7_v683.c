/* Array of size 7, sum-and-printf. */
#include <stdio.h>
int main(void) {
  int a[7] = { 1, 1, 2, 3, 5, 8, 13 };
  int s = 0;
  for (int i = 0; i < 7; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
