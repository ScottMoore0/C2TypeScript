/* fnptr abs(0). */
#include <stdio.h>
int f(int x) { return x < 0 ? -x : x; }
int main(void) {
  int (*fp)(int x) = f;
  printf("%d\n", fp(0));
  return 0;
}
