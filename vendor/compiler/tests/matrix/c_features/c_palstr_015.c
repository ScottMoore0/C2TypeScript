/* Is "racecar" a palindrome? */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "racecar";
  int n = (int)strlen(s);
  int pal = 1;
  for (int i = 0; i < n / 2; i++) if (s[i] != s[n - 1 - i]) { pal = 0; break; }
  printf("%d\n", pal);
  return 0;
}
