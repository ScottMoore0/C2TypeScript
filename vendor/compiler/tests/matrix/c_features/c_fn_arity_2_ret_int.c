/* Function: int f(arity=2). */
#include <stdio.h>
int f(int a0, int a1) { int v = (int)(a0 + a1); return v; }
int main(void) {
  printf("%d\n", f(1, 2));
  return 0;
}
