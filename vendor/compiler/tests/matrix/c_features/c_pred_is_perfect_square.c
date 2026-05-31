/* Predicate: is_perfect_square. */
#include <stdio.h>
#include <math.h>
int main(void) {
  int c = 0;
  for (int x = 0; x < 100; x++) if ((int)sqrt((double)x) * (int)sqrt((double)x) == x) c++;
  printf("%d\n", c);
  return 0;
}
