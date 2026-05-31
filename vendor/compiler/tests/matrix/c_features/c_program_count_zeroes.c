/* End-to-end program: c_program_count_zeroes. */

#include <stdio.h>
int main(void) {
  unsigned int x = 0xFF00FF00u;
  int c = 0;
  for (int i = 0; i < 32; i++) if (!(x & (1u << i))) c++;
  printf("%d\n", c);
  return 0;
}
