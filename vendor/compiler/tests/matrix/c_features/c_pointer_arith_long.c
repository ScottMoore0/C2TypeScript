/* Pointer arithmetic on long[]. */
#include <stdio.h>
int main(void) {
  long arr[5] = { 1, 2, 3, 4, 5 };
  long *p = arr;
  long *q = arr + 4;
  printf("%ld %ld %ld\n", *p, *q, *(q - 2));
  return 0;
}
