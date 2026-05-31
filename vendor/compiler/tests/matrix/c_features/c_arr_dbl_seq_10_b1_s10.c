/* Sum double seq starting at 0.1, step 0.1, len 10. */
#include <stdio.h>
int main(void) {
  double a[10] = { 0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00 };
  double s = 0;
  for (int i = 0; i < 10; i++) s += a[i];
  printf("%.2f\n", s);
  return 0;
}
