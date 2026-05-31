/* Pointer pattern: through_arr_back. */
#include <stdio.h>
int main(void) {
  int a[3] = {1,2,3}; int *p = a + 2; p--; printf("%d\n", *p);
  return 0;
}
