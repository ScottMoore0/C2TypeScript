/* Function: void f(arity=2). */
#include <stdio.h>
void f(int a0, int a1) { printf("sum=%d\n", a0 + a1); }
int main(void) {
  f(1, 2);
  return 0;
}
