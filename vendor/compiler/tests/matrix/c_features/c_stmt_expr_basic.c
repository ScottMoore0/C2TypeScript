/* GCC statement expression `({ ... })` — last expression is the value. */
#include <stdio.h>
#define MAX(a, b) ({ __typeof__(a) _a = (a); __typeof__(b) _b = (b); _a > _b ? _a : _b; })
int main(void) {
  int x = MAX(3, 7);
  int y = MAX(MAX(1, 2), MAX(4, 5));
  printf("%d %d\n", x, y);
  return 0;
}
