/* Struct tag plus typedef alias side by side. */
#include <stdio.h>
typedef struct point { int x, y; } point_t;
int main(void) {
  struct point a = { 1, 2 };
  point_t b = { 3, 4 };
  printf("%d %d / %d %d\n", a.x, a.y, b.x, b.y);
  return 0;
}
