/* Trim leading/trailing whitespace in place. */
#include <stdio.h>
#include <ctype.h>
#include <string.h>
char *trim(char *s) {
  while (isspace((unsigned char)*s)) s++;
  size_t n = strlen(s);
  while (n > 0 && isspace((unsigned char)s[n - 1])) s[--n] = 0;
  return s;
}
int main(void) {
  char buf[] = "  hello world  ";
  printf("|%s|\n", trim(buf));
  return 0;
}
