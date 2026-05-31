/* Left shift 1 by 5. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1u;
  printf("%X %X\n", v << 5, v >> 5);
  return 0;
}
