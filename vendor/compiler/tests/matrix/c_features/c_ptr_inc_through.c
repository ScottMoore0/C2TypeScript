/* Pointer pattern: inc_through. */
#include <stdio.h>
int main(void) {
  int x = 10; int *p = &x; (*p)++; printf("%d\n", x);
  return 0;
}
