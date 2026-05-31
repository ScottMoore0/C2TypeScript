/* Reduce alternating with sum. */
#include <stdio.h>
#include <limits.h>
int main(void) {
  int a[] = {1, -1, 2, -2, 3, -3};
  int n = 6;
  int acc = 0;
  for (int i = 0; i < n; i++) acc += a[i];
  printf("%d\n", acc);
  return 0;
}
