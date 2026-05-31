/* Function-pointer handler inc. */
#include <stdio.h>
int handler(int x) { return x + 1; }
int main(void) {
  int (*fp)(int) = handler;
  printf("%d %d %d %d\n", fp(0), fp(5), fp(-3), fp(100));
  return 0;
}
