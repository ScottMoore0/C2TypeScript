/* Function-pointer handler invsign. */
#include <stdio.h>
int handler(int x) { return x ^ 0x80000000; }
int main(void) {
  int (*fp)(int) = handler;
  printf("%d %d %d %d\n", fp(0), fp(5), fp(-3), fp(100));
  return 0;
}
