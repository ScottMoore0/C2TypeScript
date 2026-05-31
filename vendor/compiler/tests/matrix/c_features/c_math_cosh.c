/* C17 §7.12 — cosh(0.0). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.4f\n", cosh(0.0));
  return 0;
}
