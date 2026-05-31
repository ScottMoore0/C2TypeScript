/* Sum double seq starting at 0.5, step 0.5, len 15. */
#include <stdio.h>
int main(void) {
  double a[15] = { 0.50, 1.00, 1.50, 2.00, 2.50, 3.00, 3.50, 4.00, 4.50, 5.00, 5.50, 6.00, 6.50, 7.00, 7.50 };
  double s = 0;
  for (int i = 0; i < 15; i++) s += a[i];
  printf("%.2f\n", s);
  return 0;
}
