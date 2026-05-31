/* Count occurrences of a char in string. */
#include <stdio.h>
int count_char(const char *s, char c) {
  int n = 0;
  while (*s) { if (*s == c) n++; s++; }
  return n;
}
int main(void) {
  printf("%d %d %d\n",
    count_char("hello", 'l'),
    count_char("aaaaa", 'a'),
    count_char("abc", 'd'));
  return 0;
}
