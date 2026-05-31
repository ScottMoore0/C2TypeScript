/* Bit flip: ~0xAAAAAAAA. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xAAAAAAAAu;
  printf("%08X\n", ~v);
  return 0;
}
