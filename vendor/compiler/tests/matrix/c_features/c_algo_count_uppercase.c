/* Algorithm: count_uppercase. */
#include <stdio.h>
int main(void) {
  const char *s = "Hello World ABC xyz";
  int c = 0;
  for (const char *p = s; *p; p++) if (*p >= 'A' && *p <= 'Z') c++;
  printf("%d\n", c);
  return 0;
}
