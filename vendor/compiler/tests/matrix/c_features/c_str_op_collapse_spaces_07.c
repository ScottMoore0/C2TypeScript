/* String op collapse_spaces on input 7. */
#include <stdio.h>
int main(void) {
  char buf[128] = "no_spaces_here";
  char *out = buf; int prev = 0;
  for (char *p = buf; *p; p++) {
    if (*p == ' ') { if (!prev) *out++ = ' '; prev = 1; }
    else { *out++ = *p; prev = 0; }
  }
  *out = 0;
  printf("|%s|\n", buf);
  return 0;
}
