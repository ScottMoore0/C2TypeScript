/* Count digits in input 0. */
#include <stdio.h>
int main(void) {
  const char *s = "Hello, World!";
  int count = 0;
  for (const char *p = s; *p; p++) {
    char c = *p;
    if (c >= '0' && c <= '9') count++;
  }
  printf("%d\n", count);
  return 0;
}
