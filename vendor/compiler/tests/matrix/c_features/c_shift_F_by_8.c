/* Left shift F by 8. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFu;
  printf("%X %X\n", v << 8, v >> 8);
  return 0;
}
