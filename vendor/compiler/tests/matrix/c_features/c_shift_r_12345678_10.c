/* 12345678 >> 10. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345678u;
  printf("%X\n", v >> 10);
  return 0;
}
