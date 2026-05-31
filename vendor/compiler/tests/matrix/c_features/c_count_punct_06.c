/* Count punct in input 6. */
#include <stdio.h>
int main(void) {
  const char *s = "all lowercase letters here";
  int count = 0;
  for (const char *p = s; *p; p++) {
    char c = *p;
    if (c == '!' || c == '?' || c == '.' || c == ',' || c == ';') count++;
  }
  printf("%d\n", count);
  return 0;
}
