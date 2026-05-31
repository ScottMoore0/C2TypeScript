/* Extract bit-field at shift 16, mask 0xFFFF. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xCAFEBABEu;
  unsigned int extracted = (v >> 16) & 0xFFFFu;
  printf("0x%X\n", extracted);
  return 0;
}
