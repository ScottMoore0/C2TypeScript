/* Struct s2 with x=10, y=20. */
#include <stdio.h>
struct P { int x, y; };
int main(void) {
  struct P p = { 10, 20 };
  printf("%d %d sum=%d prod=%d\n", p.x, p.y, p.x + p.y, p.x * p.y);
  return 0;
}
