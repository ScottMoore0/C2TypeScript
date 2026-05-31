/* Short hexdump. */
#include <stdio.h>
int main(void) {
  unsigned char buf[8] = { 0xDE, 0xAD, 0xBE, 0xEF, 0x12, 0x34, 0x56, 0x78 };
  for (int i = 0; i < 8; i++) printf("%02X ", buf[i]);
  printf("\n");
  return 0;
}
