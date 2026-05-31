/* Sum 1..10 in unsigned long long. */
#include <stdio.h>
int main(void) {
  unsigned long long s = 0;
  for (int i = 1; i <= 10; i++) s += i;
  printf("%llu\n", (unsigned long long)s);
  return 0;
}
