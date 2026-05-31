/* Struct s5 with x=-1, y=1. */
#include <stdio.h>
struct P { int x, y; };
int main(void) {
  struct P p = { -1, 1 };
  printf("%d %d sum=%d prod=%d\n", p.x, p.y, p.x + p.y, p.x * p.y);
  return 0;
}
