/* Bubble sort. */
#include <stdio.h>
void bsort(int *a, int n) {
  for (int i = 0; i < n - 1; i++)
    for (int j = 0; j < n - 1 - i; j++)
      if (a[j] > a[j + 1]) { int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }
}
int main(void) {
  int a[8] = { 5, 1, 4, 2, 8, 6, 3, 7 };
  bsort(a, 8);
  for (int i = 0; i < 8; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
