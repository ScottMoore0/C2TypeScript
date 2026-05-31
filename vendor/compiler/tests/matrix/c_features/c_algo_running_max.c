/* Algorithm: running_max. */
#include <stdio.h>
int main(void) {
  int a[] = { 3, 1, 4, 1, 5, 9, 2, 6, 5 };
  int n = 9;
  int best[9];
  best[0] = a[0];
  for (int i = 1; i < n; i++) best[i] = a[i] > best[i-1] ? a[i] : best[i-1];
  for (int i = 0; i < n; i++) printf("%d ", best[i]);
  printf("\n");
  return 0;
}
