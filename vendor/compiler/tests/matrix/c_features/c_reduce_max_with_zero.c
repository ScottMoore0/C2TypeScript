/* Reduce with_zero with max. */
#include <stdio.h>
#include <limits.h>
#define max_op(a, b) ((a) > (b) ? (a) : (b))
int main(void) {
  int a[] = {1, 2, 0, 4, 5};
  int n = 5;
  int acc = INT_MIN;
  for (int i = 0; i < n; i++) acc = max_op(acc, a[i]);
  printf("%d\n", acc);
  return 0;
}
