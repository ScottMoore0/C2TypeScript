/* inline function. */
#include <stdio.h>
static inline int triple(int x) { return x * 3; }
int main(void) {
  printf("%d\n", triple(7));
  return 0;
}
