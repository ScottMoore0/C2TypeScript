/* printf format: llu_pos. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  unsigned long long v = 100ULL;
  printf("%llu" "\n", v);
  return 0;
}
