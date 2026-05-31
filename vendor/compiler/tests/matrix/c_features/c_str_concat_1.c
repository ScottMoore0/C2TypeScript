/* String concat case 1. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[128];
  strcpy(buf, "foo");
  strcat(buf, "bar");
  printf("%s\n", buf);
  return 0;
}
