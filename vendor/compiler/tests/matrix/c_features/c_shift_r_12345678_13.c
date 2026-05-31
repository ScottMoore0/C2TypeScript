/* 12345678 >> 13. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345678u;
  printf("%X\n", v >> 13);
  return 0;
}
