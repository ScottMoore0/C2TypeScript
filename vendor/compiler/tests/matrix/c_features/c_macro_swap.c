/* Macro swap with typeof. */
#include <stdio.h>
#define SWAP(a, b) do { __typeof__(a) _t = (a); (a) = (b); (b) = _t; } while (0)
int main(void) {
  int x = 1, y = 2;
  double p = 3.0, q = 4.0;
  SWAP(x, y);
  SWAP(p, q);
  printf("%d %d %.1f %.1f\n", x, y, p, q);
  return 0;
}
