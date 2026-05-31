/* Count punct in input 5. */
#include <stdio.h>
int main(void) {
  const char *s = "ALL UPPERCASE LETTERS HERE";
  int count = 0;
  for (const char *p = s; *p; p++) {
    char c = *p;
    if (c == '!' || c == '?' || c == '.' || c == ',' || c == ';') count++;
  }
  printf("%d\n", count);
  return 0;
}
