/* Global init: long_p. */
#include <stdio.h>
long g = 1000000L;
int main(void) {
  printf("%lld\n", (long long)g);
  return 0;
}
