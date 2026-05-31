/* Algorithm: triangle_500. */
#include <stdio.h>
int main(void) {
  int s = 0; for (int i = 1; i <= 500; i++) s += i;
  printf("%d\n", s);
  return 0;
}
