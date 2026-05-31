/* Rotate array left by k. */
#include <stdio.h>
int main(void) {
  int a[7] = { 1, 2, 3, 4, 5, 6, 7 };
  int n = 7, k = 3;
  int t[7];
  for (int i = 0; i < n; i++) t[i] = a[(i + k) % n];
  for (int i = 0; i < n; i++) printf("%d ", t[i]);
  printf("\n");
  return 0;
}
