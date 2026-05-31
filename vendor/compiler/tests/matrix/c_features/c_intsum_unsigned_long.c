/* Sum 1..10 in unsigned long. */
#include <stdio.h>
int main(void) {
  unsigned long s = 0;
  for (int i = 1; i <= 10; i++) s += i;
  printf("%lu\n", (unsigned long)s);
  return 0;
}
