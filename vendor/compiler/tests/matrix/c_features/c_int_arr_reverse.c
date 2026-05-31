/* Reverse int array in place. */
#include <stdio.h>
int main(void) {
  int a[7] = { 1, 2, 3, 4, 5, 6, 7 };
  int n = 7;
  for (int i = 0; i < n / 2; i++) {
    int t = a[i]; a[i] = a[n - 1 - i]; a[n - 1 - i] = t;
  }
  for (int i = 0; i < n; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
