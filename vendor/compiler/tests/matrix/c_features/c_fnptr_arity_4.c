/* Function pointer with 4 arguments. */
#include <stdio.h>
int sum_4(int a0, int a1, int a2, int a3) { return a0 + a1 + a2 + a3; }
int main(void) {
  int (*fp)(int a0, int a1, int a2, int a3) = sum_4;
  printf("%d\n", fp(1, 2, 3, 4));
  return 0;
}
