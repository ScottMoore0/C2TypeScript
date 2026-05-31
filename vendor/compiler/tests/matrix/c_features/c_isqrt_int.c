/* Integer square root. */
#include <stdio.h>
int isqrt(int n) {
  int lo = 0, hi = n / 2 + 1;
  while (lo <= hi) {
    int m = (lo + hi) / 2;
    if ((long long)m * m == n) return m;
    if ((long long)m * m < n) lo = m + 1;
    else hi = m - 1;
  }
  return hi;
}
int main(void) {
  printf("%d %d %d %d\n", isqrt(0), isqrt(16), isqrt(100), isqrt(99));
  return 0;
}
