/* Left shift 1 by 6. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1u;
  printf("%X %X\n", v << 6, v >> 6);
  return 0;
}
