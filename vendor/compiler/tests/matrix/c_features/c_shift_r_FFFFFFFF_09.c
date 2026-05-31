/* FFFFFFFF >> 9. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 9);
  return 0;
}
