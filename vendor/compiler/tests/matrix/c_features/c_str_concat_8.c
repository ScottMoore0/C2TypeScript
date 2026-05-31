/* String concat case 8. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[128];
  strcpy(buf, "UPPER");
  strcat(buf, "lower");
  printf("%s\n", buf);
  return 0;
}
