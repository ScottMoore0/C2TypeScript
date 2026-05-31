/* Count lowercase in input 4. */
#include <stdio.h>
int main(void) {
  const char *s = "abcABC123!@#";
  int count = 0;
  for (const char *p = s; *p; p++) {
    char c = *p;
    if (c >= 'a' && c <= 'z') count++;
  }
  printf("%d\n", count);
  return 0;
}
