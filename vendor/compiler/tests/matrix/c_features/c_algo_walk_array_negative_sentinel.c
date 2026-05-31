/* Algorithm: walk_array_negative_sentinel. */
#include <stdio.h>
int main(void) {
  int a[] = { 1, 2, 3, -1, 99, 100 };
  int n = 0;
  for (int i = 0; a[i] >= 0; i++) n++;
  printf("%d\n", n);
  return 0;
}
