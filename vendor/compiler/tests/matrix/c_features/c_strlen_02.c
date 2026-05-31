/* strlen("ab"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "ab";
  printf("%zu\n", strlen(s));
  return 0;
}
