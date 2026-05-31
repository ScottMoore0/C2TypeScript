/* Hand-rolled atoi with sign and whitespace. */
#include <stdio.h>
#include <ctype.h>
int my_atoi(const char *s) {
  while (isspace((unsigned char)*s)) s++;
  int sign = 1;
  if (*s == '-') { sign = -1; s++; }
  else if (*s == '+') s++;
  int n = 0;
  while (isdigit((unsigned char)*s)) { n = n * 10 + (*s - '0'); s++; }
  return sign * n;
}
int main(void) {
  printf("%d %d %d %d\n", my_atoi("123"), my_atoi("-456"), my_atoi("  +7"), my_atoi("abc"));
  return 0;
}
