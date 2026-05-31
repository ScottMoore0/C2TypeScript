/* Cast double → float. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  double src = 1.5;
  float dst = (float)src;
  printf("%.4f\n", dst);
  return 0;
}
