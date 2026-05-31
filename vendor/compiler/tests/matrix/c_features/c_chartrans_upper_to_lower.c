/* Char transform: upper_to_lower. */
#include <stdio.h>
int main(void) {
  char buf[] = "Hello, World 123!";
  for (int i = 0; buf[i]; i++) {
    char c = buf[i];
    if (c >= 'A' && c <= 'Z') c = (char)(c + 32);
    buf[i] = c;
  }
  printf("%s\n", buf);
  return 0;
}
