/* Function pointer with 2 arguments. */
#include <stdio.h>
int sum_2(int a0, int a1) { return a0 + a1; }
int main(void) {
  int (*fp)(int a0, int a1) = sum_2;
  printf("%d\n", fp(1, 2));
  return 0;
}
