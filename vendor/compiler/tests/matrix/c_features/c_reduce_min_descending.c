/* Reduce descending with min. */
#include <stdio.h>
#include <limits.h>
#define min_op(a, b) ((a) < (b) ? (a) : (b))
int main(void) {
  int a[] = {10, 9, 8, 7, 6, 5, 4, 3, 2, 1};
  int n = 10;
  int acc = INT_MAX;
  for (int i = 0; i < n; i++) acc = min_op(acc, a[i]);
  printf("%d\n", acc);
  return 0;
}
