/* 12345678 >> 5. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345678u;
  printf("%X\n", v >> 5);
  return 0;
}
