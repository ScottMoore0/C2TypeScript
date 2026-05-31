/* Print 999999 in dec/hex/oct. */
#include <stdio.h>
int main(void) {
  unsigned int v = 999999;
  printf("%u %x %o\n", v, v, v);
  return 0;
}
