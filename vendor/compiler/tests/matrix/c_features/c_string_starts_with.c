/* Check string prefix. */
#include <stdio.h>
#include <string.h>
int starts_with(const char *s, const char *prefix) {
  while (*prefix) {
    if (*s != *prefix) return 0;
    s++; prefix++;
  }
  return 1;
}
int main(void) {
  printf("%d %d %d\n",
    starts_with("hello", "he"),
    starts_with("hello", "world"),
    starts_with("", ""));
  return 0;
}
