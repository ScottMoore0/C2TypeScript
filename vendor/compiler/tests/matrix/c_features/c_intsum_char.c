/* Sum 1..10 in char. */
#include <stdio.h>
int main(void) {
  char s = 0;
  for (int i = 1; i <= 10; i++) s += i;
  printf("%d\n", s);
  return 0;
}
