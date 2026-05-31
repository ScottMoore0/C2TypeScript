/* Predicate: is_odd. */
#include <stdio.h>
int main(void) {
  int c = 0;
  for (int x = 0; x < 100; x++) if (x % 2 != 0) c++;
  printf("%d\n", c);
  return 0;
}
