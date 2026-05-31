/* C17 §7.12 — rint(3.5). */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.1f\n", rint(3.5));
  return 0;
}
