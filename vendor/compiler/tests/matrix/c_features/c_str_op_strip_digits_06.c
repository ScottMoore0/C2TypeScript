/* String op strip_digits on input 6. */
#include <stdio.h>
int main(void) {
  char buf[128] = "MixedCASE123";
  char *out = buf; for (char *p = buf; *p; p++) if (!(*p >= '0' && *p <= '9')) *out++ = *p; *out = 0;
  printf("|%s|\n", buf);
  return 0;
}
