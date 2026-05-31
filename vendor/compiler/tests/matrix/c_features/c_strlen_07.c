/* strlen("The quick brown fox"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "The quick brown fox";
  printf("%zu\n", strlen(s));
  return 0;
}
