/* String op strip_digits on input 3. */
#include <stdio.h>
int main(void) {
  char buf[128] = "Sphinx of Black Quartz";
  char *out = buf; for (char *p = buf; *p; p++) if (!(*p >= '0' && *p <= '9')) *out++ = *p; *out = 0;
  printf("|%s|\n", buf);
  return 0;
}
