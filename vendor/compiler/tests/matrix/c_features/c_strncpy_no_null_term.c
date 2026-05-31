/* strncpy doesn't null-terminate if source >= n. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[8];
  memset(buf, 'X', sizeof(buf));
  strncpy(buf, "hello world", 5);
  /* buf[5..7] still 'X' */
  printf("%c%c%c%c%c|%c%c%c\n", buf[0], buf[1], buf[2], buf[3], buf[4], buf[5], buf[6], buf[7]);
  return 0;
}
