/* Array of strings indexed by enum. */
#include <stdio.h>
enum Day { SUN, MON, TUE, WED, THU, FRI, SAT };
const char *names[] = { "sun", "mon", "tue", "wed", "thu", "fri", "sat" };
int main(void) {
  for (int i = SUN; i <= SAT; i++) printf("%s ", names[i]);
  printf("\n");
  return 0;
}
