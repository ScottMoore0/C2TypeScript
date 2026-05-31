/* Sum 1..10 in long long. */
#include <stdio.h>
int main(void) {
  long long s = 0;
  for (int i = 1; i <= 10; i++) s += i;
  printf("%lld\n", (long long)s);
  return 0;
}
