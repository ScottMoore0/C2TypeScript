/* Predicate: has_digit_7. */
#include <stdio.h>
int has_digit_7(int x) {
  if (x < 0) x = -x;
  while (x > 0) { if (x % 10 == 7) return 1; x /= 10; }
  return 0;
}
int main(void) {
  int c = 0;
  for (int i = 0; i < 100; i++) if (has_digit_7(i)) c++;
  printf("%d\n", c);
  return 0;
}
