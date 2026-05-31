/* C17 §7.12 — log1p(0.0). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.4f\n", log1p(0.0));
  return 0;
}
