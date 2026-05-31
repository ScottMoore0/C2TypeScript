/* Function pointer with 3 arguments. */
#include <stdio.h>
int sum_3(int a0, int a1, int a2) { return a0 + a1 + a2; }
int main(void) {
  int (*fp)(int a0, int a1, int a2) = sum_3;
  printf("%d\n", fp(1, 2, 3));
  return 0;
}
