/* For loop direction: up_step2. */
#include <stdio.h>
int main(void) {
  int s = 0;
  for (int i = 0; i < 10; i += 2) s += i;
  printf("%d\n", s);
  return 0;
}
