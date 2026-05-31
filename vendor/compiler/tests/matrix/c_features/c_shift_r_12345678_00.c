/* 12345678 >> 0. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345678u;
  printf("%X\n", v >> 0);
  return 0;
}
