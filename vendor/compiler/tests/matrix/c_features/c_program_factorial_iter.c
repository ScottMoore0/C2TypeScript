/* End-to-end program: c_program_factorial_iter. */

#include <stdio.h>
int main(void) {
  long f = 1;
  for (int i = 1; i <= 10; i++) f *= i;
  printf("%ld\n", f);
  return 0;
}
