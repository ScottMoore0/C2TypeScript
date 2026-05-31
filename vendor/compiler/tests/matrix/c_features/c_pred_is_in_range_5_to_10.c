/* Predicate: is_in_range_5_to_10. */
#include <stdio.h>
int main(void) {
  int c = 0;
  for (int x = 0; x < 100; x++) if (x >= 5 && x <= 10) c++;
  printf("%d\n", c);
  return 0;
}
