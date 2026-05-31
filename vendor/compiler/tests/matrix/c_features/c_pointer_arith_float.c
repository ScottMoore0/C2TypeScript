/* Pointer arithmetic on float[]. */
#include <stdio.h>
int main(void) {
  float arr[5] = { 1, 2, 3, 4, 5 };
  float *p = arr;
  float *q = arr + 4;
  printf("%.2f %.2f %.2f\n", *p, *q, *(q - 2));
  return 0;
}
