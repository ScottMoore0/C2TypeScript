/* FFFFFFFF >> 8. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 8);
  return 0;
}
