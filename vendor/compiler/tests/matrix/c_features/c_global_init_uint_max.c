/* Global init: uint_max. */
#include <stdio.h>
unsigned int g = 0xFFFFFFFFu;
int main(void) {
  printf("%lld\n", (long long)g);
  return 0;
}
