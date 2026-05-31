/* Left shift FF by 4. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFu;
  printf("%X %X\n", v << 4, v >> 4);
  return 0;
}
