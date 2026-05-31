/* Function-pointer handler neg. */
#include <stdio.h>
int handler(int x) { return -x; }
int main(void) {
  int (*fp)(int) = handler;
  printf("%d %d %d %d\n", fp(0), fp(5), fp(-3), fp(100));
  return 0;
}
