/* C17 §7.12 — log10(1000.0). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.4f\n", log10(1000.0));
  return 0;
}
