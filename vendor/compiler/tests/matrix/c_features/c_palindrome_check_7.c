/* Palindrome check on "kayak". */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "kayak";
  int n = (int)strlen(s);
  int is_pal = 1;
  for (int i = 0; i < n / 2; i++) if (s[i] != s[n - 1 - i]) { is_pal = 0; break; }
  printf("%d\n", is_pal);
  return 0;
}
