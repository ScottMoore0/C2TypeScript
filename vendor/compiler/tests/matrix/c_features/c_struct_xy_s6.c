/* Struct s6 with x=1000, y=-1000. */
#include <stdio.h>
struct P { int x, y; };
int main(void) {
  struct P p = { 1000, -1000 };
  printf("%d %d sum=%d prod=%d\n", p.x, p.y, p.x + p.y, p.x * p.y);
  return 0;
}
