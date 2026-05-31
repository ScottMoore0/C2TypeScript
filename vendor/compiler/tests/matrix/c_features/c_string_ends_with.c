/* Check string suffix. */
#include <stdio.h>
#include <string.h>
int ends_with(const char *s, const char *suffix) {
  size_t ls = strlen(s), lp = strlen(suffix);
  if (lp > ls) return 0;
  return strcmp(s + ls - lp, suffix) == 0;
}
int main(void) {
  printf("%d %d %d\n",
    ends_with("hello.txt", ".txt"),
    ends_with("hello.txt", ".png"),
    ends_with("a", "abc"));
  return 0;
}
