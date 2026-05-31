/* Global init: uint_lo. */
#include <stdio.h>
unsigned int g = 1u;
int main(void) {
  printf("%lld\n", (long long)g);
  return 0;
}
