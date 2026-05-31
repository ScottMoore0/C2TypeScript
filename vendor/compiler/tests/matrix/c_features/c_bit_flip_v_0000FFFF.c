/* Bit flip: ~0xFFFF. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFu;
  printf("%08X\n", ~v);
  return 0;
}
