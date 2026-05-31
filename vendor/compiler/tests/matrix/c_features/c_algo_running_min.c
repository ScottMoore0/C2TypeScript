/* Algorithm: running_min. */
#include <stdio.h>
int main(void) {
  int a[] = { 9, 7, 5, 6, 3, 4, 2, 1 };
  int n = 8;
  int best[8];
  best[0] = a[0];
  for (int i = 1; i < n; i++) best[i] = a[i] < best[i-1] ? a[i] : best[i-1];
  for (int i = 0; i < n; i++) printf("%d ", best[i]);
  printf("\n");
  return 0;
}
