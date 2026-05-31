/* FFFFFFFF >> 6. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 6);
  return 0;
}
