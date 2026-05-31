/* Pointer arithmetic on short[]. */
#include <stdio.h>
int main(void) {
  short arr[5] = { 1, 2, 3, 4, 5 };
  short *p = arr;
  short *q = arr + 4;
  printf("%d %d %d\n", (int)*p, (int)*q, (int)*(q - 2));
  return 0;
}
