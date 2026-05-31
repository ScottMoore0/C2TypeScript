/* Left shift 1 by 8. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1u;
  printf("%X %X\n", v << 8, v >> 8);
  return 0;
}
