/* strlen("abc"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "abc";
  printf("%zu\n", strlen(s));
  return 0;
}
