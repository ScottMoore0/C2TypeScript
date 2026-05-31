/* String concat case 7. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[128];
  strcpy(buf, "y");
  strcat(buf, "longer_second_string");
  printf("%s\n", buf);
  return 0;
}
