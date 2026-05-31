/* Left shift 1234 by 1. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1234u;
  printf("%X %X\n", v << 1, v >> 1);
  return 0;
}
