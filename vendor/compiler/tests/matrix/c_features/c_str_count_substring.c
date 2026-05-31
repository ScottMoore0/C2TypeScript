/* Count overlapping substring occurrences. */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "ababaabab";
  const char *needle = "aba";
  int count = 0;
  for (const char *p = s; (p = strstr(p, needle)); p++) count++;
  printf("%d\n", count);
  return 0;
}
