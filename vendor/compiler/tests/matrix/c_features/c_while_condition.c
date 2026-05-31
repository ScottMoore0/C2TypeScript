/* C17 §6.8.5.1 — while loop. */
#include <stdio.h>
int main(void) {
  int n = 0;
  int i = 1;
  while (i <= 10) { n += i; i++; }
  printf("%d\n", n);
  return 0;
}
