/* Sum double seq starting at 2.0, step 1.0, len 5. */
#include <stdio.h>
int main(void) {
  double a[5] = { 2.00, 3.00, 4.00, 5.00, 6.00 };
  double s = 0;
  for (int i = 0; i < 5; i++) s += a[i];
  printf("%.2f\n", s);
  return 0;
}
