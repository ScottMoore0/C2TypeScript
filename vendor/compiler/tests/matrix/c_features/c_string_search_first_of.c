/* Find first char from set in string. */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "hello, world!";
  size_t pos = strcspn(s, ",!");
  printf("%zu %c\n", pos, s[pos]);
  return 0;
}
