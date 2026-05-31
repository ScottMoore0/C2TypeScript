/* strlen("hello"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "hello";
  printf("%zu\n", strlen(s));
  return 0;
}
