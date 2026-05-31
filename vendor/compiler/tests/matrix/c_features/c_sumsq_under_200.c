/* Sum of i*i while sum < 200. */
#include <stdio.h>
int main(void) {
  long s = 0; int i = 0;
  while (s < 200) { i++; s += (long)i * i; }
  printf("%d %ld\n", i, s);
  return 0;
}
