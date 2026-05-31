/* String split via strtok. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[] = "one,two,three,four";
  char *tok = strtok(buf, ",");
  while (tok) { printf("%s ", tok); tok = strtok(NULL, ","); }
  printf("\n");
  return 0;
}
