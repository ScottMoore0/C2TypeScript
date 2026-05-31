/* Pointer pattern: twice. */
#include <stdio.h>
int main(void) {
  int x = 5; int *p = &x; *p = *p + 1; printf("%d\n", x);
  return 0;
}
