/* For loop direction: up_step5. */
#include <stdio.h>
int main(void) {
  int s = 0;
  for (int i = 0; i < 100; i += 5) s += i;
  printf("%d\n", s);
  return 0;
}
