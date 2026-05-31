/* Function: void f(arity=3). */
#include <stdio.h>
void f(int a0, int a1, int a2) { printf("sum=%d\n", a0 + a1 + a2); }
int main(void) {
  f(1, 2, 3);
  return 0;
}
