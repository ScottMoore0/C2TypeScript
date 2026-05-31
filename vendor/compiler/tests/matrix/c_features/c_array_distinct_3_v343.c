/* Array of size 3, sum-and-printf. */
#include <stdio.h>
int main(void) {
  int a[3] = { 10, 20, 30 };
  int s = 0;
  for (int i = 0; i < 3; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
