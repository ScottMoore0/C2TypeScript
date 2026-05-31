/* String concat case 3. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[128];
  strcpy(buf, "123");
  strcat(buf, "456");
  printf("%s\n", buf);
  return 0;
}
