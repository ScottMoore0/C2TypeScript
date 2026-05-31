/* Left shift 1234 by 8. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1234u;
  printf("%X %X\n", v << 8, v >> 8);
  return 0;
}
