/* Right-pad string with spaces. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[16];
  const char *src = "abc";
  int len = (int)strlen(src);
  int width = 8;
  strcpy(buf, src);
  for (int i = len; i < width; i++) buf[i] = ' ';
  buf[width] = 0;
  printf("|%s|\n", buf);
  return 0;
}
