/* POSIX strcasecmp / strncasecmp via toupper comparison. */
#include <stdio.h>
#include <ctype.h>
int casecmp(const char *a, const char *b) {
  while (*a && *b) {
    int da = tolower((unsigned char)*a) - tolower((unsigned char)*b);
    if (da) return da;
    a++; b++;
  }
  return *a - *b;
}
int main(void) {
  printf("%d %d %d\n",
    casecmp("Hello", "HELLO") == 0 ? 1 : 0,
    casecmp("abc", "ABC") == 0 ? 1 : 0,
    casecmp("abc", "abd") < 0 ? 1 : 0);
  return 0;
}
