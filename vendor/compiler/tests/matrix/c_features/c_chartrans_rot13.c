/* Char transform: rot13. */
#include <stdio.h>
int main(void) {
  char buf[] = "Hello, World 123!";
  for (int i = 0; buf[i]; i++) {
    char c = buf[i];
    if (c >= 'a' && c <= 'z') c = (char)('a' + (c - 'a' + 13) % 26); else if (c >= 'A' && c <= 'Z') c = (char)('A' + (c - 'A' + 13) % 26);
    buf[i] = c;
  }
  printf("%s\n", buf);
  return 0;
}
