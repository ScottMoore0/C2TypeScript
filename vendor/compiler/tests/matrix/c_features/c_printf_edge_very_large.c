/* printf edge case: very_large = 1e100 via %g. */
#include <stdio.h>
int main(void) {
  printf("%g\n", 1e100);
  return 0;
}
