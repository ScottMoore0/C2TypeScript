/* strlen("newline\nhere"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "newline\nhere";
  printf("%zu\n", strlen(s));
  return 0;
}
