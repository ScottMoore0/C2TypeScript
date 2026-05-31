/* Left shift FF by 6. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFu;
  printf("%X %X\n", v << 6, v >> 6);
  return 0;
}
