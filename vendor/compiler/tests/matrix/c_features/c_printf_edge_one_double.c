/* printf edge case: one_double = 1.0 via %f. */
#include <stdio.h>
int main(void) {
  printf("%f\n", 1.0);
  return 0;
}
