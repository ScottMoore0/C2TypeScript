/* Extract bit-field at shift 16, mask 0xFF. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xCAFEBABEu;
  unsigned int extracted = (v >> 16) & 0xFFu;
  printf("0x%X\n", extracted);
  return 0;
}
