/* Count digits in input 1. */
#include <stdio.h>
int main(void) {
  const char *s = "The quick brown fox jumps over the lazy dog.";
  int count = 0;
  for (const char *p = s; *p; p++) {
    char c = *p;
    if (c >= '0' && c <= '9') count++;
  }
  printf("%d\n", count);
  return 0;
}
