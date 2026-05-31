/* Function: int f(arity=5). */
#include <stdio.h>
int f(int a0, int a1, int a2, int a3, int a4) { int v = (int)(a0 + a1 + a2 + a3 + a4); return v; }
int main(void) {
  printf("%d\n", f(1, 2, 3, 4, 5));
  return 0;
}
