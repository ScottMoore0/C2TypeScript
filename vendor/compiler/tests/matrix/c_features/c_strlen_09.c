/* strlen("1234567890"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "1234567890";
  printf("%zu\n", strlen(s));
  return 0;
}
