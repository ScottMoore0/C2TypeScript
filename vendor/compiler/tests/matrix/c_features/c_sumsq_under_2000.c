/* Sum of i*i while sum < 2000. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 0;
  while (s < 2000) { i++; s += (long)i * i; }
  printf("%d %ld\n", i, s);
  return 0;
}
