/* Pointer pattern: through_arr. */
#include <stdio.h>
int main(void) {
  int a[3] = {1,2,3}; int *p = a; p++; printf("%d\n", *p);
  return 0;
}
