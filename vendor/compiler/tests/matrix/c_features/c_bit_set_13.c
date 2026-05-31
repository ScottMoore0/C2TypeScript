/* Set bit 13. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0u;
  v |= (1u << 13);
  printf("0x%X\n", v);
  return 0;
}
