/* Hand-rolled isdigit for spec correctness. */
#include <stdio.h>
#include <stddef.h>

int my_isdigit(int c) { return c >= '0' && c <= '9'; }
int main(void) {
  printf("%d %d %d\n", my_isdigit('5'), my_isdigit('a'), my_isdigit('0'));
  return 0;
}
