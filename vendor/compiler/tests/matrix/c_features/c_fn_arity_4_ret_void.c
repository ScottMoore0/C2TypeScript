/* Function: void f(arity=4). */
#include <stdio.h>
void f(int a0, int a1, int a2, int a3) { printf("sum=%d\n", a0 + a1 + a2 + a3); }
int main(void) {
  f(1, 2, 3, 4);
  return 0;
}
