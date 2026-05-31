/* Function: void f(arity=5). */
#include <stdio.h>
void f(int a0, int a1, int a2, int a3, int a4) { printf("sum=%d\n", a0 + a1 + a2 + a3 + a4); }
int main(void) {
  f(1, 2, 3, 4, 5);
  return 0;
}
