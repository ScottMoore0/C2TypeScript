/* Print 255 in dec/hex/oct. */
#include <stdio.h>
int main(void) {
  unsigned int v = 255;
  printf("%u %x %o\n", v, v, v);
  return 0;
}
