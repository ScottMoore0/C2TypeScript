/* End-to-end program: c_program_popcount_table. */

#include <stdio.h>
int main(void) {
  for (int i = 0; i < 8; i++) {
    unsigned int c = 0, v = i;
    while (v) { c += v & 1; v >>= 1; }
    printf("%d ", c);
  }
  printf("\n");
  return 0;
}
