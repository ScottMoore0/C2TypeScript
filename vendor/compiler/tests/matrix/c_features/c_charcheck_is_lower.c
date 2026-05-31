/* Char class check: is_lower. */
#include <stdio.h>
int check(int c) { return (c >= 'a' && c <= 'z'); }
int main(void) {
  printf("%d\n", check('a'));
  return 0;
}
