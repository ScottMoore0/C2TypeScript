/* C17 §7.12 — expm1(1.0). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.4f\n", expm1(1.0));
  return 0;
}
