/* Print 1000 in dec/hex/oct. */
#include <stdio.h>
int main(void) {
  unsigned int v = 1000;
  printf("%u %x %o\n", v, v, v);
  return 0;
}
