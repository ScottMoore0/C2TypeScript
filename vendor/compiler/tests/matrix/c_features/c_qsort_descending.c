/* qsort with descending comparator. */
#include <stdio.h>
#include <stdlib.h>
int desc(const void *a, const void *b) { return *(int*)b - *(int*)a; }
int main(void) {
  int arr[] = { 4, 2, 7, 1, 9, 3 };
  qsort(arr, 6, sizeof(int), desc);
  for (int i = 0; i < 6; i++) printf("%d ", arr[i]);
  printf("\n");
  return 0;
}
