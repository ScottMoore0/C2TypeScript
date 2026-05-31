/* Function: int f(arity=1). */
#include <stdio.h>
int f(int a0) { int v = (int)(a0); return v; }
int main(void) {
  printf("%d\n", f(1));
  return 0;
}
