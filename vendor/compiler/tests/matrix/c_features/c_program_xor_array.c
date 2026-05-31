/* End-to-end program: c_program_xor_array. */

#include <stdio.h>
int main(void) {
  unsigned int xor_all = 0;
  for (int i = 1; i <= 15; i++) xor_all ^= i;
  printf("%u\n", xor_all);
  return 0;
}
