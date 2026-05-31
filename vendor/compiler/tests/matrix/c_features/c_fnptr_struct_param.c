/* C17 §6.7.6.3 — function pointer whose signature takes a struct
 * BY VALUE. The translator must marshal the struct value through
 * the indirect call without losing field identity (struct-by-value
 * is a copy in C; in our model it's a JS object reference, which
 * has the same observable behaviour for read-only callbacks).
 */
#include <stdio.h>

struct Point { int x; int y; };

int dot_with(struct Point p, int scale) {
  return (p.x + p.y) * scale;
}

int main(void) {
  int (*fp)(struct Point, int) = dot_with;
  struct Point pt = { 3, 4 };
  int r = fp(pt, 2);
  printf("r=%d\n", r);
  return 0;
}
