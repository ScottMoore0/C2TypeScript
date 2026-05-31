/* FFFFFFFF >> 4. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 4);
  return 0;
}
