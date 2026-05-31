/* String concat case 5. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[128];
  strcpy(buf, "a");
  strcat(buf, "b");
  printf("%s\n", buf);
  return 0;
}
