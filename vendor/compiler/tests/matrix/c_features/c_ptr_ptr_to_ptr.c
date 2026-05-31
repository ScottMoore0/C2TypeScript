/* Pointer pattern: ptr_to_ptr. */
#include <stdio.h>
int main(void) {
  int x = 7; int *p = &x; int **pp = &p; printf("%d\n", **pp);
  return 0;
}
