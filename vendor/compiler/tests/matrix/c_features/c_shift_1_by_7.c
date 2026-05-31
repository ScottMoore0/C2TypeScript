/* Left shift 1 by 7. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1u;
  printf("%X %X\n", v << 7, v >> 7);
  return 0;
}
