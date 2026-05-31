/* Function: long f(arity=3). */
#include <stdio.h>
long f(int a0, int a1, int a2) { long v = (long)(a0 + a1 + a2); return v; }
int main(void) {
  printf("%ld\n", f(1, 2, 3));
  return 0;
}
