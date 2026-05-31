/* Bit flip: ~0x0. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x0u;
  printf("%08X\n", ~v);
  return 0;
}
