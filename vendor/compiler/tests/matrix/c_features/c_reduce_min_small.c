/* Reduce small with min. */
#include <stdio.h>
#include <limits.h>
#define min_op(a, b) ((a) < (b) ? (a) : (b))
int main(void) {
  int a[] = {1, 2, 3, 4, 5};
  int n = 5;
  int acc = INT_MAX;
  for (int i = 0; i < n; i++) acc = min_op(acc, a[i]);
  printf("%d\n", acc);
  return 0;
}
