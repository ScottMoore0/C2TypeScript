/* C17 §6.3.1.1 — integer promotion preserves signedness for char. */
#include <stdio.h>
int main(void) {
  signed char a = -50;
  signed char b = -50;
  int sum = a + b;
  printf("%d\n", sum);
  return 0;
}
