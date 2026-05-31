/* fnptr abs(10). */
#include <stdio.h>
int f(int x) { return x < 0 ? -x : x; }
int main(void) {
  int (*fp)(int x) = f;
  printf("%d\n", fp(10));
  return 0;
}
