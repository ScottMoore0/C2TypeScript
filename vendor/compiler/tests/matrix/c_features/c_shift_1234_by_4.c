/* Left shift 1234 by 4. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1234u;
  printf("%X %X\n", v << 4, v >> 4);
  return 0;
}
