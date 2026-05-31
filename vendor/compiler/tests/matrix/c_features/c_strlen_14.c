/* strlen("tab\there"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *s = "tab\there";
  printf("%zu\n", strlen(s));
  return 0;
}
