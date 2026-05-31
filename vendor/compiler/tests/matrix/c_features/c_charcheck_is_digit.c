/* Char class check: is_digit. */
#include <stdio.h>
int check(int c) { return (c >= '0' && c <= '9'); }
int main(void) {
  printf("%d\n", check('5'));
  return 0;
}
