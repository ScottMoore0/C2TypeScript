/* Enum days pick SUN. */
#include <stdio.h>
enum E_days { MON, TUE, WED, THU, FRI, SAT, SUN };
int main(void) {
  enum E_days x = SUN;
  printf("%d\n", (int)x);
  return 0;
}
