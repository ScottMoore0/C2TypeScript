/* 12345 << 5. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345u;
  printf("%X\n", v << 5);
  return 0;
}
