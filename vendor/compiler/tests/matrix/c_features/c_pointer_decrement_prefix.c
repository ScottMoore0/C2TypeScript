/* Prefix decrement + deref on pointer to array tail. */
#include <stdio.h>
int main(void) {
  int arr[5] = { 10, 20, 30, 40, 50 };
  int *p = arr + 5;
  printf("%d ", *--p);
  printf("%d ", *--p);
  printf("%d\n", *--p);
  return 0;
}
