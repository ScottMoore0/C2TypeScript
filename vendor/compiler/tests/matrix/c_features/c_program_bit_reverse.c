/* End-to-end program: c_program_bit_reverse. */

#include <stdio.h>
int main(void) {
  unsigned int x = 0xCAFEBABEu;
  unsigned int r = 0;
  for (int i = 0; i < 32; i++) if (x & (1u << i)) r |= 1u << (31 - i);
  printf("%08X\n", r);
  return 0;
}
