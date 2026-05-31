/* Count vowels in input 7. */
#include <stdio.h>
int main(void) {
  const char *s = "Mixed CASE with 123 numbers";
  int count = 0;
  for (const char *p = s; *p; p++) {
    char c = *p;
    if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u' || c == 'A' || c == 'E' || c == 'I' || c == 'O' || c == 'U') count++;
  }
  printf("%d\n", count);
  return 0;
}
