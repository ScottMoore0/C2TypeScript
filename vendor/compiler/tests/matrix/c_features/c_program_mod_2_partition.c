/* End-to-end program: c_program_mod_2_partition. */

#include <stdio.h>
int main(void) {
  int evens = 0, odds = 0;
  for (int i = 1; i <= 100; i++) (i % 2 == 0) ? evens++ : odds++;
  printf("%d %d\n", evens, odds);
  return 0;
}
