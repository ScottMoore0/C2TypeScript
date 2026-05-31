/* Split 100 integers into even/odd sums. */
#include <stdio.h>
int main(void) {
  long e = 0, o = 0;
  for (int i = 1; i <= 100; i++) (i %% 2 == 0) ? (e += i) : (o += i);
  printf("%ld %ld\n", e, o);
  return 0;
}
