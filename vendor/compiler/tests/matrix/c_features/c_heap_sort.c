/* Heap sort. */
#include <stdio.h>
void sift(int *a, int n, int root) {
  while (1) {
    int big = root, l = 2 * root + 1, r = 2 * root + 2;
    if (l < n && a[l] > a[big]) big = l;
    if (r < n && a[r] > a[big]) big = r;
    if (big == root) return;
    int t = a[root]; a[root] = a[big]; a[big] = t;
    root = big;
  }
}
int main(void) {
  int a[] = { 4, 10, 3, 5, 1, 7, 9, 2, 8, 6 };
  int n = 10;
  for (int i = n / 2 - 1; i >= 0; i--) sift(a, n, i);
  for (int i = n - 1; i > 0; i--) {
    int t = a[0]; a[0] = a[i]; a[i] = t;
    sift(a, i, 0);
  }
  for (int i = 0; i < n; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
