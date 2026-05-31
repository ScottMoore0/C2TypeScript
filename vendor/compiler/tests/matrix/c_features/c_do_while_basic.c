/* C17 §6.8.5.2 — do-while loop runs body at least once. */
#include <stdio.h>
int main(void) {
  int i = 5;
  int count = 0;
  do { count++; i++; } while (i < 5);
  printf("%d\n", count);
  return 0;
}
