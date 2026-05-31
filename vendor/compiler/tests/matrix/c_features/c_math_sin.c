/* C17 §7.12 — sin(0.0). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.4f\n", sin(0.0));
  return 0;
}
