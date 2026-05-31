/* C17 §7.12 — round(3.5). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.1f\n", round(3.5));
  return 0;
}
