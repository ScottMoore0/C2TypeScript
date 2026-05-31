/* Pointer pattern: init_walk. */
#include <stdio.h>
int main(void) {
  int arr[5] = { 1, 2, 3, 4, 5 };
  int *p = arr;
  int sum = 0;
  while (p < arr + 5) sum += *p++;
  printf("%d\n", sum);
  return 0;
}
