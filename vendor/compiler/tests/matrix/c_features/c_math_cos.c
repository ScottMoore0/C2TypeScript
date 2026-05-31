/* C17 §7.12 — cos(0.0). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.4f\n", cos(0.0));
  return 0;
}
