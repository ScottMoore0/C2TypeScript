/* fnptr sq(5). */
#include <stdio.h>
int f(int x) { return x * x; }
int main(void) {
  int (*fp)(int x) = f;
  printf("%d\n", fp(5));
  return 0;
}
