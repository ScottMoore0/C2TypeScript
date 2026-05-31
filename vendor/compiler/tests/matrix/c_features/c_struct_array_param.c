/* Array of struct as parameter. */
#include <stdio.h>
struct P { int x; int y; };
int total_x(struct P *ps, int n) {
  int s = 0;
  for (int i = 0; i < n; i++) s += ps[i].x;
  return s;
}
int main(void) {
  struct P pts[] = { {1, 10}, {2, 20}, {3, 30} };
  printf("%d\n", total_x(pts, 3));
  return 0;
}
