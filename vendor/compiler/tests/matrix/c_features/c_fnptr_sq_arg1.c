/* fnptr sq(1). */
#include <stdio.h>
int f(int x) { return x * x; }
int main(void) {
  int (*fp)(int x) = f;
  printf("%d\n", fp(1));
  return 0;
}
