/* Pointer arithmetic on double[]. */
#include <stdio.h>
int main(void) {
  double arr[5] = { 1, 2, 3, 4, 5 };
  double *p = arr;
  double *q = arr + 4;
  printf("%.2f %.2f %.2f\n", *p, *q, *(q - 2));
  return 0;
}
