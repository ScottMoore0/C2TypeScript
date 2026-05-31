/* fnptr dbl(-5). */
#include <stdio.h>
int f(int x) { return x * 2; }
int main(void) {
  int (*fp)(int x) = f;
  printf("%d\n", fp(-5));
  return 0;
}
