/* String concat case 4. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[128];
  strcpy(buf, "!@#");
  strcat(buf, "$%^");
  printf("%s\n", buf);
  return 0;
}
