/* End-to-end program: c_program_min_arr. */

#include <stdio.h>
int main(void) {
  int a[] = { 5, 2, 8, 1, 9, 3 };
  int n = 6;
  int m = a[0];
  for (int i = 1; i < n; i++) if (a[i] < m) m = a[i];
  printf("%d\n", m);
  return 0;
}
