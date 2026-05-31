/* 12345 << 13. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345u;
  printf("%X\n", v << 13);
  return 0;
}
