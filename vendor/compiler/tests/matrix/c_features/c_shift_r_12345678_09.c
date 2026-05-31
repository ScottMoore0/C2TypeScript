/* 12345678 >> 9. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345678u;
  printf("%X\n", v >> 9);
  return 0;
}
