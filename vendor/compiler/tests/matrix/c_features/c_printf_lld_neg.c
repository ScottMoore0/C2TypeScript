/* printf format: lld_neg. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  long long v = -9999999999LL;
  printf("%lld" "\n", v);
  return 0;
}
