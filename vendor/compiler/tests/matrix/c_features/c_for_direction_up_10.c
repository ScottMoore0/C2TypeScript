/* For loop direction: up_10. */
#include <stdio.h>
int main(void) {
  int s = 0;
  for (int i = 0; i < 10; i += 1) s += i;
  printf("%d\n", s);
  return 0;
}
