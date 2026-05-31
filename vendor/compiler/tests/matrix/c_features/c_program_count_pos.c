/* End-to-end program: c_program_count_pos. */

#include <stdio.h>
int main(void) {
  int a[] = { -1, 2, -3, 4, -5, 6, -7, 8 };
  int n = 8, c = 0;
  for (int i = 0; i < n; i++) if (a[i] > 0) c++;
  printf("%d\n", c);
  return 0;
}
