/* Pointer arithmetic on int[]. */
#include <stdio.h>
int main(void) {
  int arr[5] = { 1, 2, 3, 4, 5 };
  int *p = arr;
  int *q = arr + 4;
  printf("%d %d %d\n", *p, *q, *(q - 2));
  return 0;
}
