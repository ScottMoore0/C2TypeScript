/* Struct s3 with x=100, y=200. */
#include <stdio.h>
struct P { int x, y; };
int main(void) {
  struct P p = { 100, 200 };
  printf("%d %d sum=%d prod=%d\n", p.x, p.y, p.x + p.y, p.x * p.y);
  return 0;
}
