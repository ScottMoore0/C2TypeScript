/* Merge sort (top-down). */
#include <stdio.h>
#include <stdlib.h>
void merge(int *a, int lo, int mid, int hi, int *tmp) {
  int i = lo, j = mid, k = lo;
  while (i < mid && j < hi) tmp[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];
  while (i < mid) tmp[k++] = a[i++];
  while (j < hi)  tmp[k++] = a[j++];
  for (k = lo; k < hi; k++) a[k] = tmp[k];
}
void msort(int *a, int lo, int hi, int *tmp) {
  if (hi - lo <= 1) return;
  int mid = (lo + hi) / 2;
  msort(a, lo, mid, tmp);
  msort(a, mid, hi, tmp);
  merge(a, lo, mid, hi, tmp);
}
int main(void) {
  int data[] = { 5, 2, 8, 1, 9, 3, 7, 4, 6 };
  int tmp[9];
  msort(data, 0, 9, tmp);
  for (int i = 0; i < 9; i++) printf("%d ", data[i]);
  printf("\n");
  return 0;
}
