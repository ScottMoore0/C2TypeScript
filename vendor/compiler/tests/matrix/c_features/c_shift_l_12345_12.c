/* 12345 << 12. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345u;
  printf("%X\n", v << 12);
  return 0;
}
