/* Remove consecutive duplicates from sorted array. */
#include <stdio.h>
int main(void) {
  int a[] = { 1, 1, 2, 3, 3, 3, 4, 5, 5, 6 };
  int n = 10;
  int j = 0;
  for (int i = 0; i < n; i++) if (i == 0 || a[i] != a[i - 1]) a[j++] = a[i];
  for (int i = 0; i < j; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
