/* Enum days pick MON. */
#include <stdio.h>
enum E_days { MON, TUE, WED, THU, FRI, SAT, SUN };
int main(void) {
  enum E_days x = MON;
  printf("%d\n", (int)x);
  return 0;
}
