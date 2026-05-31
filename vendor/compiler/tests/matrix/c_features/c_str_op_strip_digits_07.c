/* String op strip_digits on input 7. */
#include <stdio.h>
int main(void) {
  char buf[128] = "no_spaces_here";
  char *out = buf; for (char *p = buf; *p; p++) if (!(*p >= '0' && *p <= '9')) *out++ = *p; *out = 0;
  printf("|%s|\n", buf);
  return 0;
}
