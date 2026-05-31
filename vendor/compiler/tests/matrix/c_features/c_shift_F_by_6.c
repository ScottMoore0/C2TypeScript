/* Left shift F by 6. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFu;
  printf("%X %X\n", v << 6, v >> 6);
  return 0;
}
