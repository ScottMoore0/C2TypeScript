/* Find index of min/max. */
#include <stdio.h>
int main(void) {
  int a[] = { 4, 9, 1, 7, 3, 8, 2 };
  int n = 7, mn_i = 0, mx_i = 0;
  for (int i = 1; i < n; i++) {
    if (a[i] < a[mn_i]) mn_i = i;
    if (a[i] > a[mx_i]) mx_i = i;
  }
  printf("%d %d\n", mn_i, mx_i);
  return 0;
}
