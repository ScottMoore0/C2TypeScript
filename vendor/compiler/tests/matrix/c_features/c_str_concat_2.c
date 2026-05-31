/* String concat case 2. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[128];
  strcpy(buf, "alpha");
  strcat(buf, "beta");
  printf("%s\n", buf);
  return 0;
}
