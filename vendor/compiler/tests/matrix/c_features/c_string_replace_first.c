/* Replace first substring occurrence in fixed buffer. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[64] = "hello world hello";
  char *p = strstr(buf, "hello");
  if (p) memcpy(p, "HELLO", 5);
  printf("%s\n", buf);
  return 0;
}
