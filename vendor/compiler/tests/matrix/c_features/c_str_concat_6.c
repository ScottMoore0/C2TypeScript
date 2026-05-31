/* String concat case 6. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[128];
  strcpy(buf, "longer_first_string");
  strcat(buf, "x");
  printf("%s\n", buf);
  return 0;
}
