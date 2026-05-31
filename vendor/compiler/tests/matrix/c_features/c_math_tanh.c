/* C17 §7.12 — tanh(1.0). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.4f\n", tanh(1.0));
  return 0;
}
