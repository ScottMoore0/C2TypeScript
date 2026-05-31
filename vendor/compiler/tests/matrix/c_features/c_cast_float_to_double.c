/* Cast float → double. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  float src = 1.5f;
  double dst = (double)src;
  printf("%.4f\n", dst);
  return 0;
}
