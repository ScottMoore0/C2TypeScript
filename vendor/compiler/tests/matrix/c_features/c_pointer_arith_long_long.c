/* Pointer arithmetic on long long[]. */
#include <stdio.h>
int main(void) {
  long long arr[5] = { 1, 2, 3, 4, 5 };
  long long *p = arr;
  long long *q = arr + 4;
  printf("%lld %lld %lld\n", *p, *q, *(q - 2));
  return 0;
}
