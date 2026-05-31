/* For loop direction: down_step3. */
#include <stdio.h>
int main(void) {
  int s = 0;
  for (int i = 30; i > 0; i += -3) s += i;
  printf("%d\n", s);
  return 0;
}
