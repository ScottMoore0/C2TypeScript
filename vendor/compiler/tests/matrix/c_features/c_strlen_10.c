/* strlen("abcdefghijklmnopqrstuvwxyz"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "abcdefghijklmnopqrstuvwxyz";
  printf("%zu\n", strlen(s));
  return 0;
}
