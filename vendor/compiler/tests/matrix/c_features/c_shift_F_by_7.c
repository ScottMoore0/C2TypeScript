/* Left shift F by 7. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFu;
  printf("%X %X\n", v << 7, v >> 7);
  return 0;
}
