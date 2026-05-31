/* String concat case 9. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[128];
  strcpy(buf, "with spaces");
  strcat(buf, "no_spaces");
  printf("%s\n", buf);
  return 0;
}
