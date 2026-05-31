/* Iterate via pointer until sentinel NULL. */
#include <stdio.h>
const char *items[] = { "alpha", "beta", "gamma", NULL };
int main(void) {
  for (const char **p = items; *p; p++) printf("%s ", *p);
  printf("\n");
  return 0;
}
