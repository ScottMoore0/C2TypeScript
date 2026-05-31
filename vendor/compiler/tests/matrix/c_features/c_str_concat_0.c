/* String concat case 0. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[128];
  strcpy(buf, "hello");
  strcat(buf, "world");
  printf("%s\n", buf);
  return 0;
}
