/* Sequence of casts. */
#include <stdio.h>
int main(void) {
  double d = 7.7;
  int i = (int)d;
  long l = (long)i;
  unsigned u = (unsigned)l;
  printf("%.1f %d %ld %u\n", d, i, l, u);
  return 0;
}
