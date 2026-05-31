/* Count lowercase in input 1. */
#include <stdio.h>
int main(void) {
  const char *s = "The quick brown fox jumps over the lazy dog.";
  int count = 0;
  for (const char *p = s; *p; p++) {
    char c = *p;
    if (c >= 'a' && c <= 'z') count++;
  }
  printf("%d\n", count);
  return 0;
}
