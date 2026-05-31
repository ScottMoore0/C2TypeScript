/* Const-correct read-only function. */
#include <stdio.h>
int max_in(const int *a, int n) {
  int m = a[0];
  for (int i = 1; i < n; i++) if (a[i] > m) m = a[i];
  return m;
}
int main(void) {
  int data[] = { 3, 1, 4, 1, 5, 9, 2, 6 };
  printf("%d\n", max_in(data, 8));
  return 0;
}
