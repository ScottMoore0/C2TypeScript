/* Function: double f(arity=4). */
#include <stdio.h>
double f(int a0, int a1, int a2, int a3) { double v = (double)(a0 + a1 + a2 + a3); return v; }
int main(void) {
  printf("%.2f\n", f(1, 2, 3, 4));
  return 0;
}
