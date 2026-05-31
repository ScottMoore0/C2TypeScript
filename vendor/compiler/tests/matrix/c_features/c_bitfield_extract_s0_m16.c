/* Extract bit-field at shift 0, mask 0xFFFF. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xCAFEBABEu;
  unsigned int extracted = (v >> 0) & 0xFFFFu;
  printf("0x%X\n", extracted);
  return 0;
}
