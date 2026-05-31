/* Sum stride 1 to 50. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 0; i < 50; i += 1) s += i;
  printf("%ld\n", s);
  return 0;
}
