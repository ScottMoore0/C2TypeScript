/* Bit flip: ~0xFF. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFu;
  printf("%08X\n", ~v);
  return 0;
}
