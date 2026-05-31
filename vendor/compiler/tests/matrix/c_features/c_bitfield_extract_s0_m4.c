/* Extract bit-field at shift 0, mask 0xF. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xCAFEBABEu;
  unsigned int extracted = (v >> 0) & 0xFu;
  printf("0x%X\n", extracted);
  return 0;
}
