/* Skip whitespace using isspace. */
#include <stdio.h>
#include <ctype.h>
int main(void) {
  const char *s = "   \t\n  hello world";
  while (*s && isspace((unsigned char)*s)) s++;
  printf("%s\n", s);
  return 0;
}
