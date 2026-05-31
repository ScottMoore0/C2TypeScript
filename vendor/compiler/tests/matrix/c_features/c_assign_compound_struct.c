/* Compound literal assignment to struct lvalue. */
#include <stdio.h>
struct P { int x, y; };
int main(void) {
  struct P p = { 0, 0 };
  p = (struct P){ 7, 11 };
  printf("%d %d\n", p.x, p.y);
  return 0;
}
