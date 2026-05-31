/* Sum double seq starting at 1.5, step 0.25, len 10. */
#include <stdio.h>
int main(void) {
  double a[10] = { 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50, 3.75 };
  double s = 0;
  for (int i = 0; i < 10; i++) s += a[i];
  printf("%.2f\n", s);
  return 0;
}
