/* Char class check: is_punct. */
#include <stdio.h>
int check(int c) { return (c == '!' || c == '?' || c == '.'); }
int main(void) {
  printf("%d\n", check('!'));
  return 0;
}
