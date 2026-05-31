/* Bit flip: ~0x55555555. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x55555555u;
  printf("%08X\n", ~v);
  return 0;
}
