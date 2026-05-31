/* C17 §7.12 — nearbyint(3.5). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.1f\n", nearbyint(3.5));
  return 0;
}
