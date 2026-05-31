/* Bit flip: ~0xF. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFu;
  printf("%08X\n", ~v);
  return 0;
}
