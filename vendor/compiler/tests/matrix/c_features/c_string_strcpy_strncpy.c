/* strcpy + strncpy basic. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char a[16];
  char b[16];
  strcpy(a, "hello");
  strncpy(b, "abcdefghijklmnop", 5);
  b[5] = '\0';
  printf("%s|%s\n", a, b);
  return 0;
}
