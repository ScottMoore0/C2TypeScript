/* Left shift 1234 by 7. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1234u;
  printf("%X %X\n", v << 7, v >> 7);
  return 0;
}
