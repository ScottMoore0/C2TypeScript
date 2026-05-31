/* const char *const lookup table. */
#include <stdio.h>
static const char *const days[] = { "sun", "mon", "tue", "wed", "thu", "fri", "sat" };
int main(void) {
  for (int i = 0; i < 7; i++) printf("%s ", days[i]);
  printf("\n");
  return 0;
}
