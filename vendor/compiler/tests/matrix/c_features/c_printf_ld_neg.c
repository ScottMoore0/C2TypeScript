/* printf format: ld_neg. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  long v = -1234567890L;
  printf("%ld" "\n", v);
  return 0;
}
