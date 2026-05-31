/* Function: long f(arity=1). */
#include <stdio.h>
long f(int a0) { long v = (long)(a0); return v; }
int main(void) {
  printf("%ld\n", f(1));
  return 0;
}
