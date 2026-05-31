/* printf edge case: very_small = 1e-100 via %g. */
#include <stdio.h>
int main(void) {
  printf("%g\n", 1e-100);
  return 0;
}
