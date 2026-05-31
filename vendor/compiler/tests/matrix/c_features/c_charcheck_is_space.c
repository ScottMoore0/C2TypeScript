/* Char class check: is_space. */
#include <stdio.h>
int check(int c) { return (c == ' ' || c == '\t' || c == '\n'); }
int main(void) {
  printf("%d\n", check(' '));
  return 0;
}
