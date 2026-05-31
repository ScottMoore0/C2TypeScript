/* printf format: zd_zero. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  size_t v = 0;
  printf("%zu" "\n", v);
  return 0;
}
