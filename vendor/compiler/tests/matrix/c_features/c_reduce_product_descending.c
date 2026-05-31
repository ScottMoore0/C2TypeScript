/* Reduce descending with product. */
#include <stdio.h>
#include <limits.h>
int main(void) {
  int a[] = {10, 9, 8, 7, 6, 5, 4, 3, 2, 1};
  int n = 10;
  int acc = 1;
  for (int i = 0; i < n; i++) acc *= a[i];
  printf("%d\n", acc);
  return 0;
}
