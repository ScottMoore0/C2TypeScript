/* Pointer pattern: partition_evens. */
#include <stdio.h>
int main(void) {
  int arr[10] = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
  int *l = arr, *r = arr + 9;
  while (l < r) {
    while (l < r && (*l & 1) == 0) l++;
    while (l < r && (*r & 1) != 0) r--;
    if (l < r) { int t = *l; *l = *r; *r = t; }
  }
  for (int i = 0; i < 10; i++) printf("%d ", arr[i]);
  printf("\n");
  return 0;
}
