/* Set bit 11. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0u;
  v |= (1u << 11);
  printf("0x%X\n", v);
  return 0;
}
