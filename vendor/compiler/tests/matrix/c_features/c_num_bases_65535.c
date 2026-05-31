/* Print 65535 in dec/hex/oct. */
#include <stdio.h>
int main(void) {
  unsigned int v = 65535;
  printf("%u %x %o\n", v, v, v);
  return 0;
}
