/* 12345 << 8. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345u;
  printf("%X\n", v << 8);
  return 0;
}
