/* Left shift F by 3. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFu;
  printf("%X %X\n", v << 3, v >> 3);
  return 0;
}
