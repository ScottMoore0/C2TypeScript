/* Left shift 1 by 4. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1u;
  printf("%X %X\n", v << 4, v >> 4);
  return 0;
}
