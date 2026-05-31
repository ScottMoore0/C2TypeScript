/* Test bit 1 of 0xCAFE. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xCAFEu;
  printf("%d\n", (v >> 1) & 1u);
  return 0;
}
