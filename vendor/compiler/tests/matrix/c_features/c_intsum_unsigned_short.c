/* Sum 1..10 in unsigned short. */
#include <stdio.h>
int main(void) {
  unsigned short s = 0;
  for (int i = 1; i <= 10; i++) s += i;
  printf("%u\n", (unsigned)s);
  return 0;
}
