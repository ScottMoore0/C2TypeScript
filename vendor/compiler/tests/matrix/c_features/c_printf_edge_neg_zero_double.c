/* printf edge case: neg_zero_double = -0.0 via %f. */
#include <stdio.h>
int main(void) {
  printf("%f\n", -0.0);
  return 0;
}
