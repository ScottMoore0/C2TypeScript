/* Array-as-parameter: size info comes from companion arg. */
#include <stdio.h>
double avg(const double *a, int n) {
  double s = 0;
  for (int i = 0; i < n; i++) s += a[i];
  return s / n;
}
int main(void) {
  double v[] = { 1.0, 2.0, 3.0, 4.0, 5.0 };
  printf("%.2f\n", avg(v, 5));
  return 0;
}
