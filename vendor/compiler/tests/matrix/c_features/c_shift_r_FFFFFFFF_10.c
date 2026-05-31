/* FFFFFFFF >> 10. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 10);
  return 0;
}
