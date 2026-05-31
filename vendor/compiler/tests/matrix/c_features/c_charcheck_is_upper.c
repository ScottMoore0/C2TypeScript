/* Char class check: is_upper. */
#include <stdio.h>
int check(int c) { return (c >= 'A' && c <= 'Z'); }
int main(void) {
  printf("%d\n", check('A'));
  return 0;
}
