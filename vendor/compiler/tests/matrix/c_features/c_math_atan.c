/* C17 §7.12 — atan(1.0). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.4f\n", atan(1.0));
  return 0;
}
