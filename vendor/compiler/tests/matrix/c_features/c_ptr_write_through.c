/* Pointer pattern: write_through. */
#include <stdio.h>
int main(void) {
  int x = 0; int *p = &x; *p = 99; printf("%d\n", x);
  return 0;
}
