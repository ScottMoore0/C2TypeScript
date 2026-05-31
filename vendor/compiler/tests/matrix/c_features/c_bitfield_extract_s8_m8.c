/* Extract bit-field at shift 8, mask 0xFF. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xCAFEBABEu;
  unsigned int extracted = (v >> 8) & 0xFFu;
  printf("0x%X\n", extracted);
  return 0;
}
