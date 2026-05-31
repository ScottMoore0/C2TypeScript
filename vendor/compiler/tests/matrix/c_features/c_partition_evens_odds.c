/* Partition array: evens before odds (stable). */
#include <stdio.h>
int main(void) {
  int a[] = { 1, 2, 3, 4, 5, 6, 7, 8, 9 };
  int n = 9;
  int b[9];
  int j = 0;
  for (int i = 0; i < n; i++) if (a[i] % 2 == 0) b[j++] = a[i];
  for (int i = 0; i < n; i++) if (a[i] % 2 != 0) b[j++] = a[i];
  for (int i = 0; i < n; i++) printf("%d ", b[i]);
  printf("\n");
  return 0;
}
