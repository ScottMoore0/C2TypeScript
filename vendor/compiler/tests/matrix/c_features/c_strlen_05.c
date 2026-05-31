/* strlen("world"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "world";
  printf("%zu\n", strlen(s));
  return 0;
}
