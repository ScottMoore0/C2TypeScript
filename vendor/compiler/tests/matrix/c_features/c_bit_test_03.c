/* Test bit 3 of 0xCAFE. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xCAFEu;
  printf("%d\n", (v >> 3) & 1u);
  return 0;
}
