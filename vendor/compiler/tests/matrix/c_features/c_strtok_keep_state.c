/* strtok keeps internal state across calls. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[] = "a:b:c:d";
  int n = 0;
  for (char *t = strtok(buf, ":"); t; t = strtok(NULL, ":")) n++;
  printf("%d\n", n);
  return 0;
}
