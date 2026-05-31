/* Function: long f(arity=5). */
#include <stdio.h>
long f(int a0, int a1, int a2, int a3, int a4) { long v = (long)(a0 + a1 + a2 + a3 + a4); return v; }
int main(void) {
  printf("%ld\n", f(1, 2, 3, 4, 5));
  return 0;
}
