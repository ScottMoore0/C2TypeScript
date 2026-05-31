/* Global init: int_p. */
#include <stdio.h>
int g = 42;
int main(void) {
  printf("%lld\n", (long long)g);
  return 0;
}
