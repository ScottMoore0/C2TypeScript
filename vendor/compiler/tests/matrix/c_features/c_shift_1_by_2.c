/* Left shift 1 by 2. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1u;
  printf("%X %X\n", v << 2, v >> 2);
  return 0;
}
