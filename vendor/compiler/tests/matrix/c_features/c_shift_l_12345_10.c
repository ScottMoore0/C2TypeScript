/* 12345 << 10. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345u;
  printf("%X\n", v << 10);
  return 0;
}
