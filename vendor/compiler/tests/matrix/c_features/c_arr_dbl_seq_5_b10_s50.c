/* Sum double seq starting at 1.0, step 0.5, len 5. */
#include <stdio.h>
int main(void) {
  double a[5] = { 1.00, 1.50, 2.00, 2.50, 3.00 };
  double s = 0;
  for (int i = 0; i < 5; i++) s += a[i];
  printf("%.2f\n", s);
  return 0;
}
