/* Sum double seq starting at 1.0, step 0.05, len 20. */
#include <stdio.h>
int main(void) {
  double a[20] = { 1.00, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30, 1.35, 1.40, 1.45, 1.50, 1.55, 1.60, 1.65, 1.70, 1.75, 1.80, 1.85, 1.90, 1.95 };
  double s = 0;
  for (int i = 0; i < 20; i++) s += a[i];
  printf("%.2f\n", s);
  return 0;
}
