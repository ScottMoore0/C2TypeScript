/* Count digit-runs in a string. */
#include <stdio.h>
#include <ctype.h>
int main(void) {
  const char *s = "abc12 de345 6 fff7890";
  int runs = 0, in_run = 0;
  for (const char *p = s; *p; p++) {
    if (isdigit((unsigned char)*p)) { if (!in_run) { in_run = 1; runs++; } }
    else in_run = 0;
  }
  printf("%d\n", runs);
  return 0;
}
