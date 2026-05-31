/* End-to-end program: c_program_power_2. */

#include <stdio.h>
int main(void) {
  long p = 1;
  for (int i = 0; i < 20; i++) p *= 2;
  printf("%ld\n", p);
  return 0;
}
