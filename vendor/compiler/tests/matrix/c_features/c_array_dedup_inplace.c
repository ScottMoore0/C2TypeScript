/* Dedup sorted array in place. */
#include <stdio.h>
int main(void) {
  int a[] = { 1, 1, 2, 3, 3, 4, 4, 4, 5 };
  int n = 9, j = 0;
  for (int i = 0; i < n; i++) if (i == 0 || a[i] != a[i-1]) a[j++] = a[i];
  for (int i = 0; i < j; i++) printf("%d ", a[i]);
  printf("(len=%d)\n", j);
  return 0;
}
