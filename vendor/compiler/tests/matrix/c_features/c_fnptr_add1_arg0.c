/* fnptr add1(0). */
#include <stdio.h>
int f(int x) { return x + 1; }
int main(void) {
  int (*fp)(int x) = f;
  printf("%d\n", fp(0));
  return 0;
}
