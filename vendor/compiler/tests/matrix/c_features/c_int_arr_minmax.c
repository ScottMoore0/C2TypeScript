/* Find min and max in array. */
#include <stdio.h>
int main(void) {
  int a[] = { 3, 1, 4, 1, 5, 9, 2, 6, 5, 3 };
  int n = sizeof(a) / sizeof(a[0]);
  int mn = a[0], mx = a[0];
  for (int i = 1; i < n; i++) {
    if (a[i] < mn) mn = a[i];
    if (a[i] > mx) mx = a[i];
  }
  printf("%d %d\n", mn, mx);
  return 0;
}
