/* Init struct in loop. */
#include <stdio.h>
struct R { int n; double v; };
int main(void) {
  struct R rs[3];
  for (int i = 0; i < 3; i++) {
    rs[i].n = i;
    rs[i].v = (i + 1) * 0.5;
  }
  for (int i = 0; i < 3; i++) printf("%d:%.1f ", rs[i].n, rs[i].v);
  printf("\n");
  return 0;
}
