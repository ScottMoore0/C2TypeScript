/* Function taking struct by value. */
#include <stdio.h>
struct Pt { int x, y; };
int dot(struct Pt a, struct Pt b) { return a.x * b.x + a.y * b.y; }
int main(void) {
  struct Pt p = { 3, 4 };
  struct Pt q = { 5, 6 };
  printf("%d\n", dot(p, q));
  return 0;
}
