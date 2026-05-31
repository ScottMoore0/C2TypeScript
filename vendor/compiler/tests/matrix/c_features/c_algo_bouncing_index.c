/* Algorithm: bouncing_index. */
#include <stdio.h>
int main(void) {
  int idx = 0, dir = 1;
  int visited = 0;
  for (int t = 0; t < 20; t++) {
    visited++;
    idx += dir;
    if (idx == 4 || idx == 0) dir = -dir;
  }
  printf("%d\n", visited);
  return 0;
}
