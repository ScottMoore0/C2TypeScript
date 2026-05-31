/* End-to-end program: c_program_avg_arr. */

#include <stdio.h>
int main(void) {
  int a[] = { 5, 2, 8, 1, 9, 3, 7 };
  int n = 7, s = 0;
  for (int i = 0; i < n; i++) s += a[i];
  printf("%.2f\n", (double)s / n);
  return 0;
}
