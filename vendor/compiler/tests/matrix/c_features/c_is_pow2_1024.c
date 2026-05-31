/* Is 1024 a power of 2? */
#include <stdio.h>
int main(void) {
  unsigned int n = 1024u;
  int is_pow2 = n != 0 && (n & (n - 1)) == 0;
  printf("%d\n", is_pow2);
  return 0;
}
