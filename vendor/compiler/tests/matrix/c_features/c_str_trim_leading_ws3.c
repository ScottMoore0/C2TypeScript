/* Trim leading from "   hello   ". */
#include <stdio.h>
#include <string.h>
#include <ctype.h>
int main(void) {
  char buf[] = "   hello   ";
  char *s = buf;
  while (isspace((unsigned char)*s)) s++;
  printf("|%s|\n", s);
  return 0;
}
