/* Enum days pick TUE. */
#include <stdio.h>
enum E_days { MON, TUE, WED, THU, FRI, SAT, SUN };
int main(void) {
  enum E_days x = TUE;
  printf("%d\n", (int)x);
  return 0;
}
