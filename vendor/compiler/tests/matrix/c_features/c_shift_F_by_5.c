/* Left shift F by 5. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFu;
  printf("%X %X\n", v << 5, v >> 5);
  return 0;
}
