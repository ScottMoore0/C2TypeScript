/* Set bit 12. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0u;
  v |= (1u << 12);
  printf("0x%X\n", v);
  return 0;
}
