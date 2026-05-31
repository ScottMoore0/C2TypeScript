/* Function: long f(arity=4). */
#include <stdio.h>
long f(int a0, int a1, int a2, int a3) { long v = (long)(a0 + a1 + a2 + a3); return v; }
int main(void) {
  printf("%ld\n", f(1, 2, 3, 4));
  return 0;
}
