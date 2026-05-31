/* In-place character replace. */
#include <stdio.h>
int main(void) {
  char buf[] = "a-b-c-d-e";
  for (char *p = buf; *p; p++) if (*p == '-') *p = '_';
  printf("%s\n", buf);
  return 0;
}
