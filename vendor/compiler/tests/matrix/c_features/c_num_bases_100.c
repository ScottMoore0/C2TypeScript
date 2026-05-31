/* Print 100 in dec/hex/oct. */
#include <stdio.h>
int main(void) {
  unsigned int v = 100;
  printf("%u %x %o\n", v, v, v);
  return 0;
}
