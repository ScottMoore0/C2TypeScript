/* C17 §7.12 — lgamma(5.0). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.4f\n", lgamma(5.0));
  return 0;
}
