/* Function: int f(arity=3). */
#include <stdio.h>
int f(int a0, int a1, int a2) { int v = (int)(a0 + a1 + a2); return v; }
int main(void) {
  printf("%d\n", f(1, 2, 3));
  return 0;
}
