/* Function-pointer array dispatch. */
#include <stdio.h>
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }
int main(void) {
  int (*ops[3])(int, int) = { add, sub, mul };
  printf("%d %d %d\n", ops[0](10, 3), ops[1](10, 3), ops[2](10, 3));
  return 0;
}
