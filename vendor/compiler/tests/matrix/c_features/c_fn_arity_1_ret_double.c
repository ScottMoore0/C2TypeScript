/* Function: double f(arity=1). */
#include <stdio.h>
double f(int a0) { double v = (double)(a0); return v; }
int main(void) {
  printf("%.2f\n", f(1));
  return 0;
}
