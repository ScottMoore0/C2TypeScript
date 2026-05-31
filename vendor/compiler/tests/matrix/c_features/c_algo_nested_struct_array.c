/* Algorithm: nested_struct_array. */
#include <stdio.h>
int main(void) {
  struct P { int x, y; };
  struct P pts[5];
  for (int i = 0; i < 5; i++) { pts[i].x = i; pts[i].y = i * i; }
  int s = 0;
  for (int i = 0; i < 5; i++) s += pts[i].x + pts[i].y;
  printf("%d\n", s);
  return 0;
}
