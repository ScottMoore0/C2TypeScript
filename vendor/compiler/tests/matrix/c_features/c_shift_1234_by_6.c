/* Left shift 1234 by 6. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1234u;
  printf("%X %X\n", v << 6, v >> 6);
  return 0;
}
