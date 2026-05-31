/* Trim trailing from "hello". */
#include <stdio.h>
#include <string.h>
#include <ctype.h>
int main(void) {
  char buf[] = "hello";
  char *s = buf;
  size_t len = strlen(s); while (len && isspace((unsigned char)s[len-1])) s[--len] = 0;
  printf("|%s|\n", s);
  return 0;
}
