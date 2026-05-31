/* Reduce small with sum. */
#include <stdio.h>
#include <limits.h>
int main(void) {
  int a[] = {1, 2, 3, 4, 5};
  int n = 5;
  int acc = 0;
  for (int i = 0; i < n; i++) acc += a[i];
  printf("%d\n", acc);
  return 0;
}
