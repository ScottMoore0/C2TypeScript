/* Array of size 10, sum-and-printf. */
#include <stdio.h>
int main(void) {
  int a[10] = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
  int s = 0;
  for (int i = 0; i < 10; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
