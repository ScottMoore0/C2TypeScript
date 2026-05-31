/* Caesar cipher with rot. */
#include <stdio.h>
#include <ctype.h>
void rot(char *s, int n) {
  for (; *s; s++) {
    if (*s >= 'a' && *s <= 'z') *s = (char)('a' + ((*s - 'a' + n) % 26 + 26) % 26);
    else if (*s >= 'A' && *s <= 'Z') *s = (char)('A' + ((*s - 'A' + n) % 26 + 26) % 26);
  }
}
int main(void) {
  char buf[64] = "Hello, World!";
  rot(buf, 13);
  printf("%s\n", buf);
  return 0;
}
