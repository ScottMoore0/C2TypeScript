/* Pointer arithmetic across array boundary (one-past-end is legal). */
#include <stdio.h>
int main(void) {
  int arr[5] = { 1, 2, 3, 4, 5 };
  int *p = arr;
  int *e = arr + 5;       /* one past end — legal as bound */
  int n = 0, sum = 0;
  while (p < e) { sum += *p; p++; n++; }
  printf("n=%d sum=%d\n", n, sum);
  return 0;
}
