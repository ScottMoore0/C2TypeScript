/* Hand-rolled abs for spec correctness. */
#include <stdio.h>
#include <stddef.h>

int my_abs(int x) { return x < 0 ? -x : x; }
int main(void) {
  printf("%d %d %d\n", my_abs(-5), my_abs(0), my_abs(7));
  return 0;
}
