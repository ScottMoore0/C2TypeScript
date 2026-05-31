/* Palindrome check. */
#include <stdio.h>
#include <string.h>
int is_palindrome(const char *s) {
  int n = (int)strlen(s);
  for (int i = 0; i < n / 2; i++)
    if (s[i] != s[n - 1 - i]) return 0;
  return 1;
}
int main(void) {
  printf("%d %d %d %d\n",
    is_palindrome(""), is_palindrome("a"),
    is_palindrome("racecar"), is_palindrome("abcd"));
  return 0;
}
