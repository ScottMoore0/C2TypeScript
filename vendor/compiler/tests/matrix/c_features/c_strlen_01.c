/* strlen("a"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "a";
  printf("%zu\n", strlen(s));
  return 0;
}
