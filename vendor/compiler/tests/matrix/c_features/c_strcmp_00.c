/* strcmp("a", "b"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  int r = strcmp("a", "b");
  printf("%d\n", r > 0 ? 1 : (r < 0 ? -1 : 0));
  return 0;
}
