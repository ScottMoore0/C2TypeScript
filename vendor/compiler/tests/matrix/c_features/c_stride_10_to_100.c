/* Sum stride 10 to 100. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 0; i < 100; i += 10) s += i;
  printf("%ld\n", s);
  return 0;
}
