/* Function pointer with 1 arguments. */
#include <stdio.h>
int sum_1(int a0) { return a0; }
int main(void) {
  int (*fp)(int a0) = sum_1;
  printf("%d\n", fp(1));
  return 0;
}
