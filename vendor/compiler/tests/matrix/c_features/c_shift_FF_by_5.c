/* Left shift FF by 5. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFu;
  printf("%X %X\n", v << 5, v >> 5);
  return 0;
}
