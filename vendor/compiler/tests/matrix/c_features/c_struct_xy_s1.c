/* Struct s1 with x=1, y=2. */
#include <stdio.h>
struct P { int x, y; };
int main(void) {
  struct P p = { 1, 2 };
  printf("%d %d sum=%d prod=%d\n", p.x, p.y, p.x + p.y, p.x * p.y);
  return 0;
}
