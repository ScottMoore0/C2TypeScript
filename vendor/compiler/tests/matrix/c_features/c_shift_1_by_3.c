/* Left shift 1 by 3. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1u;
  printf("%X %X\n", v << 3, v >> 3);
  return 0;
}
