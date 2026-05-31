/* Quicksort. */
#include <stdio.h>
void qs(int *a, int lo, int hi) {
  if (lo >= hi) return;
  int pivot = a[hi];
  int i = lo - 1;
  for (int j = lo; j < hi; j++) {
    if (a[j] < pivot) { i++; int t = a[i]; a[i] = a[j]; a[j] = t; }
  }
  i++;
  int t = a[i]; a[i] = a[hi]; a[hi] = t;
  qs(a, lo, i - 1);
  qs(a, i + 1, hi);
}
int main(void) {
  int data[] = { 9, 3, 7, 1, 8, 2, 5, 4, 6, 10 };
  qs(data, 0, 9);
  for (int i = 0; i < 10; i++) printf("%d ", data[i]);
  printf("\n");
  return 0;
}
