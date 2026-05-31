/* Pointer pattern: simple. */
#include <stdio.h>
int main(void) {
  int x = 42; int *p = &x; printf("%d\n", *p);
  return 0;
}
