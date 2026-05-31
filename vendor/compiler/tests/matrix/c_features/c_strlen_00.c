/* strlen(""). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "";
  printf("%zu\n", strlen(s));
  return 0;
}
