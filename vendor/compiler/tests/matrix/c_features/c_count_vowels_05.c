/* Count vowels in input 5. */
#include <stdio.h>
int main(void) {
  const char *s = "ALL UPPERCASE LETTERS HERE";
  int count = 0;
  for (const char *p = s; *p; p++) {
    char c = *p;
    if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u' || c == 'A' || c == 'E' || c == 'I' || c == 'O' || c == 'U') count++;
  }
  printf("%d\n", count);
  return 0;
}
