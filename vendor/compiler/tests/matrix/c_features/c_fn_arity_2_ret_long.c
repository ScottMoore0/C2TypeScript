/* Function: long f(arity=2). */
#include <stdio.h>
long f(int a0, int a1) { long v = (long)(a0 + a1); return v; }
int main(void) {
  printf("%ld\n", f(1, 2));
  return 0;
}
