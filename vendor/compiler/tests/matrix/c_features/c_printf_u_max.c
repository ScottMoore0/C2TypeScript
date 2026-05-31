/* printf format: u_max. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  unsigned int v = 4294967295u;
  printf("%u" "\n", v);
  return 0;
}
