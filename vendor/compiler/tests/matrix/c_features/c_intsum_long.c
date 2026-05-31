/* Sum 1..10 in long. */
#include <stdio.h>
int main(void) {
  long s = 0;
  for (int i = 1; i <= 10; i++) s += i;
  printf("%ld\n", (long)s);
  return 0;
}
