/* Bit flip: ~0xFFFFFFFF. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%08X\n", ~v);
  return 0;
}
