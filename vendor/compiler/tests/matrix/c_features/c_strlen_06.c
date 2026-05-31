/* strlen("Hello, World!"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "Hello, World!";
  printf("%zu\n", strlen(s));
  return 0;
}
