/* Struct access: two_int_xy. */
#include <stdio.h>
struct S { int x, y; };
int main(void) {
  struct S s = { 3, 5 };
  printf("%d\n", s.x + s.y);
  return 0;
}
