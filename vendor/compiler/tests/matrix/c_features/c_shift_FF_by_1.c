/* Left shift FF by 1. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFu;
  printf("%X %X\n", v << 1, v >> 1);
  return 0;
}
