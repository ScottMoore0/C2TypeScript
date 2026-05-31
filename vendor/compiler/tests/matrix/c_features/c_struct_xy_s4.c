/* Struct s4 with x=0, y=0. */
#include <stdio.h>
struct P { int x, y; };
int main(void) {
  struct P p = { 0, 0 };
  printf("%d %d sum=%d prod=%d\n", p.x, p.y, p.x + p.y, p.x * p.y);
  return 0;
}
