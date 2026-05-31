/* End-to-end program: c_program_squared_sum. */

#include <stdio.h>
int main(void) {
  int s = 0;
  for (int i = 1; i <= 10; i++) s += i * i;
  printf("%d\n", s);
  return 0;
}
