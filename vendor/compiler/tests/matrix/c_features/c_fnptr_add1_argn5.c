/* fnptr add1(-5). */
#include <stdio.h>
int f(int x) { return x + 1; }
int main(void) {
  int (*fp)(int x) = f;
  printf("%d\n", fp(-5));
  return 0;
}
