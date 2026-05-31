/* Function returning pointer into static storage. */
#include <stdio.h>
int *first_negative(int *a, int n) {
  for (int i = 0; i < n; i++) if (a[i] < 0) return &a[i];
  return NULL;
}
int main(void) {
  int arr[6] = { 1, 2, -3, 4, -5, 6 };
  int *p = first_negative(arr, 6);
  printf("%d offset=%d\n", *p, (int)(p - arr));
  return 0;
}
