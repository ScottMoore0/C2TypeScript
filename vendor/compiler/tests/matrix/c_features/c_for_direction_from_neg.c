/* For loop direction: from_neg. */
#include <stdio.h>
int main(void) {
  int s = 0;
  for (int i = -5; i < 5; i += 1) s += i;
  printf("%d\n", s);
  return 0;
}
