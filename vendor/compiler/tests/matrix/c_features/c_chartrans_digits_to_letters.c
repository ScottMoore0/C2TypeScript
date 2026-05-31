/* Char transform: digits_to_letters. */
#include <stdio.h>
int main(void) {
  char buf[] = "Hello, World 123!";
  for (int i = 0; buf[i]; i++) {
    char c = buf[i];
    if (c >= '0' && c <= '9') c = (char)('a' + (c - '0'));
    buf[i] = c;
  }
  printf("%s\n", buf);
  return 0;
}
