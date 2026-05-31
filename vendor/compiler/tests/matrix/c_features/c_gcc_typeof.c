/* GCC typeof — pervasive in macros (container_of, MAX/MIN swap) and
 * generic-list patterns. Used as a TYPE specifier.
 */
#include <stdio.h>

#define SWAP(a, b) do { typeof(a) __t = (a); (a) = (b); (b) = __t; } while (0)

int main(void) {
  int x = 3, y = 7;
  SWAP(x, y);
  printf("after-swap x=%d y=%d\n", x, y);

  double dx = 1.5, dy = 2.5;
  SWAP(dx, dy);
  printf("after-swap-d dx=%g dy=%g\n", dx, dy);
  return 0;
}
